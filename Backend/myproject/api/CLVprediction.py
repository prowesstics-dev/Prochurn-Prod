import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv
import sys
from django.conf import settings

sys.path.append("/root/Backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")

import django
django.setup()

# load_dotenv()


# PostgreSQL connection setup
db_config = settings.EXTERNAL_DATABASES["DB_CLV_PRED"]

connection_string = f"postgresql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['database']}"
engine = create_engine(connection_string)

# Load the prediction table from schema "prediction"
prediction_query = 'SELECT * FROM prediction.rancat_prediction_jfmamuj;'
prediction_data = pd.read_sql(prediction_query, con=engine)
prediction_data['customerid'] = prediction_data['customerid'].astype(str)

# Load the CLV table from default schema (or specify schema if needed)
clv_query = 'SELECT "customerid", "CLV" FROM clv.customer_clv_overallbaseprappended;'
clv_data = pd.read_sql(clv_query, con=engine)
clv_data['customerid'] = clv_data['customerid'].astype(str)

# Merge CLV into prediction data
merged_data = prediction_data.merge(clv_data, on='customerid', how='left')

# Save merged data back into the same PostgreSQL table (replace mode)
merged_data.to_sql(
    "rancat_prediction_jfmamuj",
    con=engine,
    schema='prediction',
    if_exists='replace',
    index=False
)

saved_table = "rancat_prediction_jfmamuj"

print("CLV for predicted data is identified and inserted into :",saved_table)
