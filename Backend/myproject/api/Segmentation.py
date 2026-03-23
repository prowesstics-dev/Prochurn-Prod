import pandas as pd
from sqlalchemy import create_engine
from django.conf import settings
import os
import sys


sys.path.append("/root/Backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")

import django
django.setup()

# load_dotenv()

# Database connection setup
db_config = settings.EXTERNAL_DATABASES["DB_SEGMENT_DB"]

connection_string = f"postgresql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['database']}"
engine = create_engine(connection_string)

# Load data from PostgreSQL table
query = 'SELECT * FROM prediction.rancat_prediction_jfmamuj;'
data = pd.read_sql(query, con=engine)

# Thresholds
high_discount_threshold = data['applicable discount with ncb'].quantile(0.75)
mid_discount_threshold = data['applicable discount with ncb'].quantile(0.5)
low_discount_threshold = data['applicable discount with ncb'].quantile(0.25)

high_clv_threshold = data['CLV'].quantile(0.75)
mid_clv_threshold = data['CLV'].quantile(0.5)
low_clv_threshold = data['CLV'].quantile(0.25)

high_churn_probability_threshold = 0.80
mid_churn_probability_threshold = 0.65
low_churn_probability_threshold = 0.50

# Categorization
data['clv_category'] = data['CLV'].apply(
    lambda x: 'High' if x > high_clv_threshold else ('Mid' if x > mid_clv_threshold else 'Low')
)
data['discount_category'] = data['applicable discount with ncb'].apply(
    lambda x: 'High' if x > high_discount_threshold else ('Mid' if x > mid_discount_threshold else 'Low')
)
data['churn_category'] = data['Churn Probability'].apply(
    lambda x: 'High' if x > high_churn_probability_threshold else ('Mid' if x > mid_churn_probability_threshold else 'Low')
)

# Segmentation logic
def segment_policy(row):
    if row['Predicted Status'] == 'Not Renewed':
        if row['churn_category'] == 'Mid' and row['discount_category'] in ['Mid', 'Low'] and row['clv_category'] in ['High', 'Mid']:
            return 'Elite Retainers'
        elif row['churn_category'] == 'Low' and row['discount_category'] in ['Mid', 'Low'] and row['clv_category'] in ['High', 'Mid']:
            return 'Low Value Customers'
        elif row['churn_category'] in ['Mid', 'Low'] and row['discount_category'] in ['High', 'Mid', 'Low']:
            return 'Potential Customers'
        elif row['churn_category'] == 'High':
            return 'Low Value Customers'
    return None

# Apply segmentation
data['Customer Segment'] = data.apply(segment_policy, axis=1)
data['Churn Probability'] = ((data['Churn Probability'] * 100).round(2)).astype(str) + '%'


# Save updated data back to PostgreSQL table
data.to_sql(
    "rancat_prediction_jfmamuj",
    con=engine,
    schema='prediction',
    if_exists='replace',
    index=False
)

# Print threshold values
print(" Threshold Values:")
print(f"Applicable Discount with NCB - High: {high_discount_threshold}, Mid: {mid_discount_threshold}, Low: {low_discount_threshold}")
print(f"CLV - High: {high_clv_threshold}, Mid: {mid_clv_threshold}, Low: {low_clv_threshold}")
print(f"Churn Probability - High: {high_churn_probability_threshold}, Mid: {mid_churn_probability_threshold}, Low: {low_churn_probability_threshold}")
print(" Segmented data saved to prediction.rancat_prediction_jfmamuj")
