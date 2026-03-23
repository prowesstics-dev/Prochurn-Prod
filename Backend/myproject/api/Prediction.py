import os
import sys
import pandas as pd
import numpy as np
import joblib
import functools
import requests
import io
from sqlalchemy import create_engine, text
from tenacity import retry, stop_after_attempt, wait_fixed
from pathlib import PurePosixPath
import pysftp

# ✅ Correct Django setup
sys.path.append("D:/CHURN/Liberty_DRF/Backend/myproject")  # Path to project root
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")

import django
django.setup()
from django.conf import settings
print = functools.partial(print, flush=True)


# Optional retry logic for SFTP connection
MODEL_DIR = "D:/CHURN/Liberty_DRF/Backend/myproject/api"
model_1 = joblib.load(os.path.join(MODEL_DIR, "RanCat_model_1.pkl"))
model_2 = joblib.load(os.path.join(MODEL_DIR, "RanCat_model_2.pkl"))
label_encoders = joblib.load(os.path.join(MODEL_DIR, "labelRanCat_encoders.pkl"))
features = joblib.load(os.path.join(MODEL_DIR, "modelRanCat_features.pkl"))



# Database connection setup with optimized settings
db_config = settings.EXTERNAL_DATABASES["DB_PRED_SRC"]

# Optimized connection string with chunking
connection_string = f"postgresql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['database']}"

# Create engine with pool recycling to prevent timeouts
engine = create_engine(connection_string, pool_recycle=3600)

# Define your query with only needed columns
query = '''
SELECT "policy no", "renewal type", "product name", "product name 2","biztype", 
       "policy end date", "policy start date", "age", "manufacturer/make", "model", 
       "variant", "vehicle segment", "fuel type", "rto location", "vehicle idv", 
       "ncb amount", "Cleaned Reg no", "before gst add-on gwp", "total od premium", 
       "total tp premium", "gst", "total premium payable", "ncb % previous year", 
       "applicable discount with ncb", "Cleaned Branch Name 2", "Cleaned State2", 
       "Cleaned Zone 2", "tie up", "Number of claims", "approved", "denied", 
       "corrected_name", "customerid", "Policy Status", "Policy Tenure", 
       "Customer Tenure", "New Customers", "Claim Happaned/Not",     
       "Renewal Rate Status", "withdrawn", "chassis_engine_key", "policy_wise_purchase"
FROM public.overall_cleaned_base_and_pr_ef_policyef_with_reasons_bucket
'''

# Load data in chunks to reduce memory usage
chunk_size = 100000  # Adjust based on your system's memory
chunks = pd.read_sql(text(query), con=engine, chunksize=chunk_size)

# Process chunks and filter open customers
open_customers_list = []

for chunk in chunks:
    # Filter open customers (Jan - June 2025)
    chunk['policy end date'] = pd.to_datetime(chunk['policy end date'], errors='coerce')
    mask = (
        (chunk['Policy Status'] == 'Open') & 
        (chunk['policy end date'].dt.year == 2025) & 
        (chunk['policy end date'].dt.month.isin([1, 2, 3, 4, 5, 6]))
    )
    filtered_chunk = chunk.loc[mask].copy()
    
    if not filtered_chunk.empty:
        open_customers_list.append(filtered_chunk)

if open_customers_list:
    open_customers = pd.concat(open_customers_list)
else:
    raise ValueError("No open customers found for the specified period")

# Process the filtered data
print(f"Processing {len(open_customers)} open customer records")

# Extract date features
for col in ['policy start date', 'policy end date']:
    open_customers[col] = pd.to_datetime(open_customers[col], errors='coerce')

date_features = {
    'policy start date_YEAR': open_customers['policy start date'].dt.year,
    'policy start date_MONTH': open_customers['policy start date'].dt.month,
    'policy start date_DAY': open_customers['policy start date'].dt.day,
    'policy end date_YEAR': open_customers['policy end date'].dt.year,
    'policy end date_MONTH': open_customers['policy end date'].dt.month,
    'policy end date_DAY': open_customers['policy end date'].dt.day
}

# date_features_df = pd.DataFrame(date_features)

open_customers = pd.concat([open_customers, pd.DataFrame(date_features)], axis=1)
open_customers = open_customers.drop(columns=['policy start date', 'policy end date'])

# Handle missing values more efficiently
for column in open_customers.columns:
    if open_customers[column].dtype == 'object':
        open_customers[column] = open_customers[column].fillna('missing')
    else:
        open_customers[column] = open_customers[column].fillna(0)

# Optimized label encoding
open_customers_encoded = open_customers.copy()

for column in open_customers_encoded.columns:
    if column in label_encoders:
        encoder = label_encoders[column]
        mapping = {label: idx for idx, label in enumerate(encoder.classes_)}
        default_value = len(mapping)  # For unseen labels
        
        open_customers_encoded[column] = (
            open_customers_encoded[column]
            .map(mapping)
            .fillna(default_value)
            .astype(int)
        )

# Get predictions
X_open_customers = open_customers_encoded[features]

# Get probability predictions in batches if needed
batch_size = 50000
predictions = []
probabilities = []

for i in range(0, len(X_open_customers), batch_size):
    batch = X_open_customers.iloc[i:i+batch_size]
    
    probs_1 = model_1.predict_proba(batch)
    probs_2 = model_2.predict_proba(batch)
    
    # Weighted average
    weighted_probs = (0.45 * probs_1) + (0.55 * probs_2)
    
    batch_pred = np.argmax(weighted_probs, axis=1)
    batch_proba = weighted_probs[:, 1]
    
    predictions.extend(batch_pred)
    probabilities.extend(batch_proba)

# Store predictions
open_customers['Predicted Status'] = np.where(np.array(predictions) == 1, 'Not Renewed', 'Renewed')
open_customers['Churn Probability'] = probabilities

print("\n📊 Prediction Results:")
print(open_customers['Predicted Status'].value_counts())
print()

# Save results
table_name = "rancat_prediction_jfmamuj"
schema_name = "prediction"

db_con_auto = settings.EXTERNAL_DATABASES["DB_PRED_TGT"]


connection_string2 = f"postgresql://{db_con_auto['user']}:{db_con_auto['password']}@{db_con_auto['host']}:{db_con_auto['port']}/{db_con_auto['database']}"
engine_2 = create_engine(connection_string2)

try:
    # Save in chunks if needed
    chunks_to_save = np.array_split(open_customers, max(1, len(open_customers)//100000))
    
    for i, chunk in enumerate(chunks_to_save):
        if_exists = 'replace' if i == 0 else 'append'
        chunk.to_sql(
            table_name, 
            con=engine_2, 
            schema=schema_name,
            if_exists=if_exists, 
            index=False
        )
        print(f"Saved chunk {i+1}/{len(chunks_to_save)}")
    
    print(f"Predictions successfully saved to PostgreSQL table: {schema_name}.{table_name}")
    # print(f"Predicted Renewed: {(open_customers['Predicted Status'] == 'Renewed').sum()}")
    # print(f"Predicted Not Renewed: {(open_customers['Predicted Status'] == 'Not Renewed').sum()}")
    
except Exception as e:
    print(f"Error saving predictions to PostgreSQL: {e}")