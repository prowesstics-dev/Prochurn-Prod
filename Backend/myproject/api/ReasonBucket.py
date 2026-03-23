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

# PostgreSQL connection details
db_config = settings.EXTERNAL_DATABASES["DB_REASON_BUCKET_DB"]

# Create DB engine
engine = create_engine(
    f"postgresql+psycopg2://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['database']}"
)

# Load data from the prediction schema
df = pd.read_sql_table("rancat_prediction_jfmamuj", engine, schema="prediction")

# Reason buckets
reason_buckets = {
    "Policy Type Related": [
        "Policy having TY Onwards Renewal Type",
        "Roll Over Business Type",
        "Tie Up with HYUNDAI",
        "Tie Up with Non-OEM",
        "Tie Up with MIBL OEM",
        "Minimal Policies Purchased"
    ],
    "Vehicle Age Related": [
        "Young Vehicle Age",
        "Old Vehicle Age"
    ],
    "Premium Related": [
        "High Own-Damage Premium",
        "High Total Premium Payable",
        "High Add-On Premium",
        "High Third-Party Premium",
        "High Discount with NCB",
        "Low Discount with NCB",
        "Higher Renewal Premium Impact",
        "Renewal Rate No Change & High Total Premium Payable",
        "Low Vehicle IDV",
        "Low No Claim Bonus Percentage",
        "High Vehicle IDV & High Total Premium",
        "Claims Happened"
    ],
    "Customer Related": [
        "Minimal Customer Tenure"
    ],
    "Organic Churn": [
        "Organic Churn"
    ]
}

# Classification function
def classify_reason(row):
    if pd.isnull(row) or row.strip() == "":
        return None
    
    categories = set()
    for reason in row.split(", "):
        for category, keywords in reason_buckets.items():
            if reason in keywords:
                categories.add(category)
    
    sorted_categories = sorted(categories)
    if len(sorted_categories) > 1:
        return ", ".join(sorted_categories[:-1]) + " and " + sorted_categories[-1] + " issues"
    elif sorted_categories:
        return sorted_categories[0] + " issues"
    else:
        return None

# Apply classification
df['Not Renewed Reasons'] = df['Not Renewed Reasons'].astype(str)
df['Reason Buckets'] = df['Not Renewed Reasons'].apply(classify_reason)

# Overwrite the table in the same schema
df.to_sql("rancat_prediction_jfmamuj", engine, schema="prediction", if_exists="replace", index=False)

print("Data updated with reason bucket and saved back to the database.")
