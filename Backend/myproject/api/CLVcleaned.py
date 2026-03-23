import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
from django.conf import settings
import sys

sys.path.append("/root/Backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")

import django
django.setup()


# Database connection setup (source)
db_config = settings.EXTERNAL_DATABASES["DB_CLV_SRC"]
connection_string = f"postgresql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['database']}"
engine = create_engine(connection_string)

# Optimized query with only required columns
query = '''
SELECT "customerid", "total premium payable", "Overall Churned"
FROM public.overall_cleaned_base_and_pr_ef_policyef_with_reasons_bucket
'''

# Load data in memory-efficient chunks
chunk_size = 100000
chunks = pd.read_sql(text(query), con=engine, chunksize=chunk_size)
data = pd.concat(chunks, ignore_index=True)

# Fill NaNs in case of missing values
data['total premium payable'] = pd.to_numeric(data['total premium payable'], errors='coerce').fillna(0)
data['customerid'] = data['customerid'].fillna('unknown')

# Calculate total revenue per customer
data['total_revenue'] = data['total premium payable']
customer_total_revenue = data.groupby('customerid')['total_revenue'].sum()

# Total number of purchases per customer
customer_total_purchases = data.groupby('customerid').size()

# Average Purchase Value (APV)
customer_apv = customer_total_revenue / customer_total_purchases

# Reduce to one churned status per customer (for churn analysis)
data_customer_level = data.drop_duplicates(subset='customerid', keep='first').copy()

# Average Purchase Frequency (APF)
unique_customers = data_customer_level['customerid'].nunique()
customer_apf = customer_total_purchases / unique_customers

# Convert 'Overall Churned' column to binary for churn calculation
data_customer_level['Churned_Binary'] = data_customer_level['Overall Churned'].apply(lambda x: 1 if str(x).strip().lower() == 'yes' else 0)

# Calculate overall churn rate
churned_customers = data_customer_level[data_customer_level['Churned_Binary'] == 1]['customerid'].nunique()
churn_rate = churned_customers / unique_customers if unique_customers > 0 else 0

# Average Customer Lifespan (ACL)
average_customer_lifespan = 1 / churn_rate if churn_rate != 0 else float('inf')

# Customer Lifetime Value (CLV)
customer_clv = customer_apv * customer_apf * average_customer_lifespan

# Final CLV DataFrame
customer_clv_df = pd.DataFrame({
    'customerid': customer_total_revenue.index,
    'Customer_APV': customer_apv.values,
    'Customer_APF': customer_apf.values,
    'Churn_Rate': churn_rate,
    'Average_Customer_Lifespan': average_customer_lifespan,
    'CLV': customer_clv.values
})

# Target DB connection for CLV storage
db_config_clv = settings.EXTERNAL_DATABASES["DB_CLV_TGT"]
connection_string2 = f"postgresql://{db_config_clv['user']}:{db_config_clv['password']}@{db_config_clv['host']}:{db_config_clv['port']}/{db_config_clv['database']}"
engine2 = create_engine(connection_string2)

# Save to target table
output_table_name = "customer_clv_overallbaseprappended"

try:
    customer_clv_df.to_sql(output_table_name, schema=db_config_clv['schema'], con=engine2, if_exists='replace', index=False)
    print(f"CLV is calculated and inserted in the table : {db_config_clv['schema']}.{output_table_name}")
except Exception as e:
    print(f"❌ Error inserting CLV data to PostgreSQL: {e}")
