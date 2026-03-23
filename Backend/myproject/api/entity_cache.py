# # entity_cache.py
# import time
# from sqlalchemy import text
# from urllib.parse import quote_plus
# from sqlalchemy import create_engine
# # from .db import ENGINE  # adjust import to your project




# # You can define these at the top or inside the function
# POSTGRES_USER = "appadmin"
# POSTGRES_PASSWORD = "prowesstics"
# POSTGRES_HOST = "139.59.12.79"  # e.g. "localhost" or IP
# POSTGRES_PORT = 5432
# POSTGRES_DB = "liberty_updated"



# CONN_STR = (
#     f"postgresql+psycopg2://{POSTGRES_USER}:{quote_plus(POSTGRES_PASSWORD)}"
#     f"@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
# )
# ENGINE = create_engine(CONN_STR, pool_pre_ping=True)


# _entity_cache = {"state": [], "zone": [], "branch": []}
# _last_loaded = 0
# _REFRESH_INTERVAL = 24 * 60 * 60   # 24h in seconds


# def load_entities_from_db(force=False):
#     """Load distinct values for state, zone, branch_name from DB into cache."""
#     global _entity_cache, _last_loaded
#     now = time.time()

#     # Refresh only if expired or forced
#     if not force and now - _last_loaded < _REFRESH_INTERVAL:
#         return _entity_cache

#     with ENGINE.connect() as conn:
#         try:
#             states = conn.execute(text('SELECT DISTINCT state FROM "bi_dwh"."main_cai_lib" WHERE state IS NOT NULL')).fetchall()
#             zones = conn.execute(text('SELECT DISTINCT zone FROM "bi_dwh"."main_cai_lib" WHERE zone IS NOT NULL')).fetchall()
#             branches = conn.execute(text('SELECT DISTINCT branch_name FROM "bi_dwh"."main_cai_lib" WHERE branch_name IS NOT NULL')).fetchall()

#             _entity_cache["state"] = [s[0].lower() for s in states]
#             _entity_cache["zone"] = [z[0].lower() for z in zones]
#             _entity_cache["branch"] = [b[0].lower() for b in branches]
#             _last_loaded = now
#             print(f"✅ Entity cache refreshed with states/zones/branches at {time.strftime('%Y-%m-%d %H:%M:%S')}")
#         except Exception as e:
#             print(f"⚠️ Failed to load entities: {e}")

#     return _entity_cache


# def get_entities():
#     """Return cached entities (reload if expired)."""
#     return load_entities_from_db(force=False)



# corpus_matching.py
import re
import json
import time
import calendar
from typing import Dict, List, Tuple
import chromadb
from sqlalchemy import text
from urllib.parse import quote_plus
from sqlalchemy import create_engine

# Database configuration
POSTGRES_USER = "appadmin"
POSTGRES_PASSWORD = "prowesstics"
POSTGRES_HOST = "20.244.31.74"
POSTGRES_PORT = 5432
POSTGRES_DB = "liberty_updated"

CONN_STR = (
    f"postgresql+psycopg2://{POSTGRES_USER}:{quote_plus(POSTGRES_PASSWORD)}"
    f"@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)
ENGINE = create_engine(CONN_STR, pool_pre_ping=True)

# Entity cache
_entity_cache = {"state": [], "zone": [], "branch": []}
_last_loaded = 0
_REFRESH_INTERVAL = 24 * 60 * 60   # 24h in seconds

def load_entities_from_db(force=False):
    """Load distinct values for state, zone, branch_name from DB into cache."""
    global _entity_cache, _last_loaded
    now = time.time()

    # Refresh only if expired or forced
    if not force and now - _last_loaded < _REFRESH_INTERVAL:
        return _entity_cache

    with ENGINE.connect() as conn:
        try:
            states = conn.execute(text('SELECT DISTINCT state FROM "bi_dwh"."main_cai_lib" WHERE state IS NOT NULL')).fetchall()
            zones = conn.execute(text('SELECT DISTINCT zone FROM "bi_dwh"."main_cai_lib" WHERE zone IS NOT NULL')).fetchall()
            branches = conn.execute(text('SELECT DISTINCT branch_name FROM "bi_dwh"."main_cai_lib" WHERE branch_name IS NOT NULL')).fetchall()

            _entity_cache["state"] = [s[0].lower() for s in states]
            _entity_cache["zone"] = [z[0].lower() for z in zones]
            _entity_cache["branch"] = [b[0].lower() for b in branches]
            _last_loaded = now
            print(f"✅ Entity cache refreshed with states/zones/branches at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        except Exception as e:
            print(f"⚠️ Failed to load entities: {e}")

    return _entity_cache

def get_entities():
    """Return cached entities (reload if expired)."""
    return load_entities_from_db(force=False)