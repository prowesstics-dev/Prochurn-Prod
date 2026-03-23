import os
# utils.py
from pathlib import Path
import logging
logger = logging.getLogger(__name__)

_model_cache = None
def load_model_assets():
    global _model_cache
    if _model_cache is None:
        model_path = Path(MODEL_FILE)
        le_path    = Path(LE_FILE)
        feats_path = Path(FEATS_FILE)
        for p in [model_path, le_path, feats_path]:
            if not p.exists():
                raise FileNotFoundError(f"Model artifact not found: {p.resolve()}")

        logger.info("Loading model: %s", model_path.resolve())
        model = joblib.load(model_path)
        label_encoders = joblib.load(le_path)
        features = joblib.load(feats_path)
        _model_cache = (model, label_encoders, features)
    return _model_cache

PRED_DB_CONFIG = {
    "host": os.getenv("DB_HOST", "20.244.31.74"),
    "database": os.getenv("DB_NAME", "updated_ui_db"),
    "user": os.getenv("DB_USER", "appadmin"),
    "password": os.getenv("DB_PASS", "prowesstics"),
    "port": os.getenv("DB_PORT", "5432"),
}

# BULK_SOURCE_FQN  = os.getenv('BULK_SOURCE_FQN', '"Prediction"."ui_sample_bulk_email_data"')
BULK_SOURCE_FQN  = os.getenv('BULK_SOURCE_FQN', '"Prediction"."ui_sample_bulk_email_data_5_per_segment"')
# BULK_CHANGES_FQN = os.getenv('BULK_CHANGES_FQN', '"Prediction"."ui_bulk_selected_changes"')
BULK_CHANGES_FQN = os.getenv('BULK_CHANGES_FQN', '"Prediction"."ui_bulk_selected_changes_5_per_segment"')
BULK_DRAFTS_FQN  = os.getenv('BULK_DRAFTS_FQN', '"Prediction"."bulk_email_drafts"')
FULL_SAVE_FQN    = BULK_CHANGES_FQN

LOCAL_TZ = os.getenv("LOCAL_TZ", "Asia/Kolkata")

BASE_DIR = Path(__file__).resolve().parents[2]
MODELS_DIR = BASE_DIR / "models"  # <-- your screenshot location

MODEL_FILE = os.getenv("MODEL_FILE", str(MODELS_DIR / "gbm_model.pkl"))
LE_FILE    = os.getenv("LABEL_ENCODERS_FILE", str(MODELS_DIR / "label_encoders_gbm.pkl"))
FEATS_FILE = os.getenv("FEATURES_FILE", str(MODELS_DIR / "model_features_gbm.pkl"))

SENDER_EMAIL           = os.getenv("SENDER_EMAIL", "")
GMAIL_CREDENTIALS_FILE = os.getenv("GMAIL_CREDENTIALS_FILE", "gmail/credentials.json")
GMAIL_TOKEN_FILE       = os.getenv("GMAIL_TOKEN_FILE", "gmail/token.json")
DEFAULT_TO_EMAIL       = os.getenv("DEFAULT_TO_EMAIL", "")

AZURE_INFERENCE_API_KEY = os.getenv("AZURE_INFERENCE_API_KEY", "")
AZURE_INFERENCE_MODEL   = os.getenv("AZURE_INFERENCE_MODEL", "")
AZURE_INFERENCE_ENDPOINT= os.getenv("AZURE_INFERENCE_ENDPOINT", "")

EPS = 1e-9
IDV_MAX_INCREASE_FACTOR = 1.30
IDV_PERCENT_PER_K = 0.5
AUTO_RELATIVE_BAND = 0.30
PARAM_TO_COL = {
    "discount":       "applicable discount with ncb",
    "od_premium":     "total od premium",
    "tp_premium":     "total tp premium",
    "idv":            "vehicle idv",
    "add_on_premium": "before gst add-on gwp",
    "ncb":            "ncb % previous year"
}
SPECIAL_REASONS = {
    "Young Vehicle Age","Old Vehicle Age","Claims Happened",
    "Multiple Claims on Record","Minimal Policies Purchased","Tie Up with Non-OEM"
}
