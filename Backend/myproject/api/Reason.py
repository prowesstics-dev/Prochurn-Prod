import os
import sys
import pandas as pd
from sqlalchemy import create_engine

# ✅ Setup Django before using anything from settings
sys.path.append("/root/Backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")

import django
django.setup()

from django.conf import settings
# 🔒 Load credentials
# load_dotenv()


# 📡 PostgreSQL Connection Config
db_config = settings.EXTERNAL_DATABASES["DB_REASON_DB"]

# 🛠️ Create SQLAlchemy engine
conn_str = f"postgresql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['database']}"
engine = create_engine(conn_str)

# 📥 Load existing prediction table
df = pd.read_sql_table(db_config['table'], con=engine, schema=db_config['schema'])

# 🧠 Reason logic
def reason_for_churn(row): 
    if row['Predicted Status'] == 'Not Renewed':
        reasons = []

        # Policy Type Related
        if row['renewal type'] == 'TY Onwards':
            reasons.append("Policy having TY Onwards Renewal Type")
        if row['biztype'] == 'Roll Over':
            reasons.append("Roll Over Business Type")
        if row['tie up'] in ['HYUNDAI', 'Non-OEM', 'MIBL OEM']:
            reasons.append(f"Tie Up with {row['tie up']}")

        # Premium Related
        if row['total od premium'] > 6460.00:
            reasons.append("High Own-Damage Premium")
        if row['total premium payable'] > 21759.50:
            reasons.append("High Total Premium Payable")
        if row['before gst add-on gwp'] > 7971.50:
            reasons.append("High Add-On Premium")
        if row['total tp premium'] > 8597.00:
            reasons.append("High Third-Party Premium")
        if row['applicable discount with ncb'] > 77.50:
            reasons.append("High Discount with NCB")
        if row['applicable discount with ncb'] <= 62.50:
            reasons.append("Low Discount with NCB")

        # Renewal Rate Related
        if row['Renewal Rate Status'] == 'Increase':
            reasons.append("Higher Renewal Premium Impact")
        if row['Renewal Rate Status'] == 'No Change' and row['total premium payable'] > 11101.00:
            reasons.append("Renewal Rate No Change & High Total Premium Payable")

        # Claim Related
        if row['Claim Happaned/Not'] == 'Yes':
            reasons.append("Claims Happened")

        # Vehicle Related
        if row['vehicle idv'] <= 436905.00:
            reasons.append("Low Vehicle IDV")
        if row['vehicle idv'] > 987300.00 and row['total premium payable'] > 16731.00:
            reasons.append("High Vehicle IDV & High Total Premium")

        # Age Related
        if row['age'] <= 3.98:
            reasons.append("Young Vehicle Age")
        if row['age'] > 8.57:
            reasons.append("Old Vehicle Age")

        # Customer Related
        if row['ncb % previous year'] < 10:
            reasons.append("Low No Claim Bonus Percentage")
        if row['Customer Tenure'] < 1.5:
            reasons.append("Minimal Customer Tenure")

        # Policy-Wise Purchase
        if row['policy_wise_purchase'] < 2.5:
            reasons.append("Minimal Policies Purchased")

        return ', '.join(reasons) if reasons else 'Organic Churn'
    
    return ''

# 🧠 Apply logic
df['Not Renewed Reasons'] = df.apply(reason_for_churn, axis=1)
# table_rename = 'RanCat_predictions_JFMAMJ(Final)_segment_reasons'
# 💾 Save updated data to same schema & table (replace or append as needed)
df.to_sql(db_config['table'], con=engine, schema=db_config['schema'], if_exists='replace', index=False)

# 🧪 Optional Preview
# print(df[['policy no', 'Predicted Status', 'Not Renewed Reasons']].head())

print("Reason identified and merged with the table: ",db_config['table'])
