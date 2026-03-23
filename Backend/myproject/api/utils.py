from cryptography.fernet import Fernet
from django.conf import settings

fernet = Fernet(settings.ENCRYPTION_KEY)

def encrypt_value(value):
    if value:
        return fernet.encrypt(value.encode()).decode()
    return value

def store_dataframe_in_postgres(df, table_name):
    print(f"📌 Storing {len(df)} rows into table: {table_name}")
    # Add your database saving logic here