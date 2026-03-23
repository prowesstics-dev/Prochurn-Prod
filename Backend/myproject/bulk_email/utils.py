# bulk_email/utils.py
import os, re, base64
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine, text as _sqltext

import joblib

from .constants import (
    PRED_DB_CONFIG, BULK_SOURCE_FQN, BULK_CHANGES_FQN, BULK_DRAFTS_FQN, FULL_SAVE_FQN,
    LOCAL_TZ, MODEL_FILE, LE_FILE, FEATS_FILE,
    SENDER_EMAIL, GMAIL_CREDENTIALS_FILE, GMAIL_TOKEN_FILE, DEFAULT_TO_EMAIL,
    EPS, IDV_MAX_INCREASE_FACTOR, IDV_PERCENT_PER_K, AUTO_RELATIVE_BAND, PARAM_TO_COL, SPECIAL_REASONS
)

# --- Azure LLM for drafting (matches Streamlit app) ---
from langchain_azure_ai.chat_models.inference import AzureAIChatCompletionsModel

AZURE_INFERENCE_API_KEY   = os.getenv("AZURE_INFERENCE_API_KEY")
AZURE_INFERENCE_MODEL     = os.getenv("AZURE_INFERENCE_MODEL")
AZURE_INFERENCE_ENDPOINT  = os.getenv("AZURE_INFERENCE_ENDPOINT")

_llm_mail = None
def _get_llm_mail():
    """Lazy-init Azure LLM (same as Streamlit). Returns None if not configured."""
    global _llm_mail
    if _llm_mail is None:
        if AZURE_INFERENCE_API_KEY and AZURE_INFERENCE_MODEL and AZURE_INFERENCE_ENDPOINT:
            _llm_mail = AzureAIChatCompletionsModel(
                endpoint=AZURE_INFERENCE_ENDPOINT,
                model=AZURE_INFERENCE_MODEL,
                credential=AZURE_INFERENCE_API_KEY,
                temperature=0.2,
            )
    return _llm_mail


# --------------------------
# Engine / helpers
# --------------------------
from sqlalchemy.pool import QueuePool

_ENGINE = None
def cloud_engine    ():
    """
    Pooled singleton engine; avoids per-call connects and hstore OID probe.
    """
    global _ENGINE
    if _ENGINE is not None:
        return _ENGINE

    url = (
        f"postgresql+psycopg2://{PRED_DB_CONFIG['user']}:{PRED_DB_CONFIG['password']}"
        f"@{PRED_DB_CONFIG['host']}:{PRED_DB_CONFIG['port']}/{PRED_DB_CONFIG['database']}"
    )

    # Statement timeouts help prevent long DB waits from blocking the stream.
    pg_options = "-c statement_timeout=30000 -c idle_in_transaction_session_timeout=30000"

    _ENGINE = create_engine(
        url,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=1800,
        # prevent psycopg2 dialect from running the hstore OID query on every connect
        use_native_hstore=False,
        connect_args={"options": pg_options},
    )
    return _ENGINE

def to_local_tz_formatted(series, tz_name: str, fmt: str = "%Y-%m-%d %H:%M:%S %Z"):
    s = pd.to_datetime(series, errors="coerce", utc=True)
    s = s.dt.tz_convert(tz_name)
    out = s.dt.strftime(fmt)
    # ensure JSON-safe: replace NaT with None
    return out.astype(object).where(~s.isna(), None)

def _norm_policy(s):
    s = str(s or "").strip()
    if s.startswith(("'", '"')):
        s = s[1:]
    return s.replace(" ", "").upper()

def _policy_vehicle_str(row_like: dict) -> str:
    return f"{row_like.get('make_clean','')} {row_like.get('model_clean','')} ({row_like.get('variant','')})".strip()

def recompute_totals_from_od_tp(row, gst_rate=0.18):
    od = float(row.get("total od premium", 0.0))
    tp = float(row.get("total tp premium", 0.0))
    gst = (od + tp) * float(gst_rate)
    total = od + tp + gst
    row["gst"] = gst
    row["total premium payable"] = total

# --------------------------
# Model encode / ranges
# --------------------------
def get_parameter_ranges():
    return {
        "discount":       {"min": 0.0, "max": 90.0},
        "ncb":            {"min": 0.0, "max": 90.0},
        "od_premium":     {"min": 0.0, "max": float("inf")},
        "tp_premium":     {"min": 0.0, "max": float("inf")},
        "add_on_premium": {"min": 0.0, "max": float("inf")},
        "idv":            {"min": 0.0, "max": float("inf")},
    }

def encode_row_for_model(row_series, features, label_encoders):
    """
    Robust encoder for heterogeneous label_encoders and messy row values.
    - If label_encoders[col] has .classes_, use it (sklearn-style).
    - If it's a dict mapping, use it (unseen -> next index).
    - Otherwise fall back to numeric coercion or a stable hash.
    - Missing features -> 0.
    """
    import math
    import pandas as pd

    def _num_or_hash(v):
        try:
            if v is None: 
                return 0.0
            if isinstance(v, float) and math.isnan(v):
                return 0.0
            # try clean numeric
            return float(v)
        except Exception:
            # stable small hash bucket for strings/objects
            return abs(hash(str(v))) % (10**6)

    def _encode_with(enc_obj, v):
        # sklearn-like encoder
        if hasattr(enc_obj, "classes_"):
            try:
                mapping = {lab: i for i, lab in enumerate(enc_obj.classes_)}
                return mapping.get(v, len(mapping))  # unseen -> next index
            except Exception:
                return _num_or_hash(v)
        # plain dict mapping
        if isinstance(enc_obj, dict):
            try:
                if v in enc_obj:
                    return enc_obj[v]
                return (max(enc_obj.values()) if enc_obj else -1) + 1
            except Exception:
                return _num_or_hash(v)
        # unknown encoder type
        return _num_or_hash(v)

    out = {}
    le_is_dict = isinstance(label_encoders, dict)

    for col in features:
        v = row_series.get(col, None)  # safe get, may be missing
        if le_is_dict and col in label_encoders:
            out[col] = _encode_with(label_encoders[col], v)
        else:
            out[col] = _num_or_hash(v)

    return pd.DataFrame([out], columns=list(features))

# --------------------------
# Reasons → parameters
# --------------------------
def get_adjustable_parameters(reasons):
    adjustable_map = {
        "Low Vehicle IDV": "idv",
        "High Own-Damage Premium": "od_premium",
        "High Third-Party Premium": "tp_premium",
        "High Add-On Premium": "add_on_premium",
        "Low Discount with NCB": "discount",
        "Low No Claim Bonus Percentage": "ncb"
    }
    fallback_params = {"idv", "od_premium", "tp_premium", "discount"}
    non_adjustable = {
        "Young Vehicle Age", "Old Vehicle Age", "Claims Happened",
        "Multiple Claims on Record", "Minimal Policies Purchased", "Tie Up with Non-OEM"
    }
    adjustable, saw_non_adj = set(), False
    for reason in reasons:
        if reason in adjustable_map:
            adjustable.add(adjustable_map[reason])
        elif reason in non_adjustable:
            saw_non_adj = True
    if saw_non_adj:
        adjustable.update(fallback_params)
    return list(adjustable)

def get_param_direction(reasons):
    direction = {}
    for r in reasons:
        if "High Own-Damage Premium" in r: direction["od_premium"] = "decrease"
        if "High Third-Party Premium" in r: direction["tp_premium"] = "decrease"
        if "High Add-On Premium" in r: direction["add_on_premium"] = "decrease"
        if "Low Vehicle IDV" in r: direction["idv"] = "increase"
        if "Low Discount" in r or "Low Discount with NCB" in r: direction["discount"] = "increase"
        if "Low No Claim Bonus" in r or "Low No Claim Bonus Percentage" in r: direction["ncb"] = "increase"
    return direction

# --------------------------
# Coupling & caps
# --------------------------
# bulk_email/utils.py

def auto_suggest_for_row(base_row, model, label_encoders, features, param_ranges):
    """
    Return the best suggested row (dict-like) after running directional moves.
    Compatible with the streamlit logic you had.
    """
    import re
    raw = str(base_row.get("Top 3 Reasons",""))
    reasons = [r.strip() for r in re.split(r",|\band\b", raw) if r.strip()]
    selected_params = get_adjustable_parameters(reasons) or None

    trials, best_idx, _ = run_directional_moves_until_target(
        base_row, features, label_encoders, model,
        param_ranges, reasons, selected_params, target=50.0, max_k=50
    )
    if not trials:
        return None
    if best_idx is None:
        best_idx = len(trials) - 1
    return trials[best_idx]["row"]


def apply_discount_coupling_on_od_tp(original_row, test_row, param_ranges, gst_rate=0.18, stack_on_top=True):
    old_d = float(original_row["applicable discount with ncb"]) / 100.0
    new_d = float(test_row["applicable discount with ncb"]) / 100.0
    extra = max(0.0, new_d - old_d)

    od0 = float(original_row["total od premium"])
    tp0 = float(original_row["total tp premium"])

    if extra <= 0.0:
        recompute_totals_from_od_tp(test_row, gst_rate); return False

    base_od = float(test_row["total od premium"]) if stack_on_top else float(original_row["total od premium"])
    base_tp = float(test_row["total tp premium"]) if stack_on_top else float(original_row["total tp premium"])

    new_od = base_od * (1.0 - extra)
    new_tp = base_tp * (1.0 - extra)

    if od0 <= EPS: new_od = 0.0
    elif new_od <= EPS: return True
    if tp0 <= EPS: new_tp = 0.0
    elif new_tp <= EPS: return True

    mn_od, mx_od = float(param_ranges["od_premium"]["min"]), float(param_ranges["od_premium"]["max"])
    mn_tp, mx_tp = float(param_ranges["tp_premium"]["min"]), float(param_ranges["tp_premium"]["max"])
    test_row["total od premium"] = 0.0 if od0 <= EPS else min(max(new_od, mn_od), mx_od)
    test_row["total tp premium"] = 0.0 if tp0 <= EPS else min(max(new_tp, mn_tp), mx_tp)
    recompute_totals_from_od_tp(test_row, gst_rate); return False

def infer_discount_from_odtp(original_row, stepped_row, param_ranges):
    od0 = float(original_row["total od premium"])
    tp0 = float(original_row["total tp premium"])
    ods = float(stepped_row["total od premium"])
    tps = float(stepped_row["total tp premium"])
    base = od0 + tp0
    if base <= EPS:
        return float(original_row["applicable discount with ncb"])
    extra = max(0.0, 1.0 - (ods + tps) / base)
    disc0 = float(original_row["applicable discount with ncb"])
    mn_d = float(param_ranges["discount"]["min"])
    mx_d = float(param_ranges["discount"]["max"])
    return min(max(disc0 + 100.0 * extra, mn_d), mx_d)

def _enforce_auto_caps(original_row: dict, test_row: dict, param_ranges: dict, band: float = AUTO_RELATIVE_BAND) -> None:
    for p_key, col in PARAM_TO_COL.items():
        if col not in original_row or col not in test_row: continue
        try:
            base = float(original_row[col]); val = float(test_row[col])
        except Exception:
            continue
        if p_key in ("discount", "ncb"):
            mn = float(param_ranges[p_key]["min"]); mx = float(param_ranges[p_key]["max"])
            test_row[col] = min(max(val, mn), mx); continue
        lo = base * (1.0 - band); hi = base * (1.0 + band)
        if p_key in ("od_premium", "tp_premium", "add_on_premium"): lo = max(0.0, lo)
        if p_key == "idv": hi = min(hi, base * IDV_MAX_INCREASE_FACTOR)
        test_row[col] = min(max(val, lo), hi)
    recompute_totals_from_od_tp(test_row, 0.18)

# --------------------------
# Auto-suggest core
# --------------------------
def build_combo_for_k(original_row, direction, param_ranges, k_moves, reasons, selected_params=None):
    test_row = original_row.copy()
    moved = set()
    in_play = set(selected_params) if selected_params else set(direction.keys())

    disc_col = PARAM_TO_COL["discount"]; ncb_col = PARAM_TO_COL["ncb"]
    od_col = PARAM_TO_COL["od_premium"]; tp_col = PARAM_TO_COL["tp_premium"]
    idv_col = PARAM_TO_COL["idv"]; add_col = PARAM_TO_COL["add_on_premium"]

    orig_disc = float(original_row.get(disc_col, 0.0))
    orig_ncb  = float(original_row.get(ncb_col, 0.0))
    orig_od   = float(original_row.get(od_col, 0.0))
    orig_tp   = float(original_row.get(tp_col, 0.0))
    orig_add  = float(original_row.get(add_col, 0.0))
    orig_idv  = float(original_row.get(idv_col, 0.0))

    def _clamp_val(p_key, val):
        mn = float(param_ranges[p_key]["min"])
        mx = float(param_ranges[p_key]["max"])
        if p_key in ("od_premium", "tp_premium", "add_on_premium"):
            mn = max(0.0, mn)
        return min(max(val, mn), mx)

    if "idv" in direction:
        pct  = min(k_moves * IDV_PERCENT_PER_K, IDV_MAX_INCREASE_FACTOR - 1.0)
        cand = orig_idv * (1.0 + pct)
        test_row[idv_col] = _clamp_val("idv", cand); moved.add("idv")

    has_discount_play = "discount" in in_play
    if has_discount_play:
        if orig_disc >= 70.0:
            new_disc = min(90.0, orig_disc + 5.0 * k_moves)
        else:
            steps = min(k_moves, 3)
            new_disc = min(orig_disc + 5.0 * steps, orig_disc + 30.0)
        if abs(new_disc - orig_disc) > 1e-9:
            test_row[disc_col] = _clamp_val("discount", new_disc); moved.add("discount")

        hit_zero = apply_discount_coupling_on_od_tp(original_row, test_row, param_ranges, 0.18, True)
        try:
            if abs(float(test_row[od_col]) - orig_od) > 1e-9: moved.add("od_premium")
            if abs(float(test_row[tp_col]) - orig_tp) > 1e-9: moved.add("tp_premium")
        except Exception:
            pass
        if hit_zero:
            recompute_totals_from_od_tp(test_row, 0.18)
            _enforce_auto_caps(original_row, test_row, param_ranges, AUTO_RELATIVE_BAND)
            return test_row, moved, True

        if "ncb" in in_play:
            new_ncb = min(90.0, orig_ncb + 5.0 * k_moves)
            if abs(new_ncb - orig_ncb) > 1e-9:
                test_row[ncb_col] = _clamp_val("ncb", new_ncb); moved.add("ncb")

        _enforce_auto_caps(original_row, test_row, param_ranges, AUTO_RELATIVE_BAND)
        return test_row, moved, False

    cut_factor = 1.0 - 0.5 * min(max(k_moves, 1), 3)
    if "od_premium" in in_play:
        test_row[od_col] = _clamp_val("od_premium", orig_od * cut_factor); moved.add("od_premium")
    if "tp_premium" in in_play:
        test_row[tp_col] = _clamp_val("tp_premium", orig_tp * cut_factor); moved.add("tp_premium")
    if "add_on_premium" in in_play:
        test_row[add_col] = _clamp_val("add_on_premium", orig_add * cut_factor); moved.add("add_on_premium")

    if ("od_premium" in in_play) or ("tp_premium" in in_play):
        new_disc = infer_discount_from_odtp(original_row, test_row, param_ranges)
        if abs(new_disc - float(test_row.get(disc_col, orig_disc))) > 1e-9:
            test_row[disc_col] = _clamp_val("discount", new_disc); moved.add("discount")

    recompute_totals_from_od_tp(test_row, 0.18)
    _enforce_auto_caps(original_row, test_row, param_ranges, AUTO_RELATIVE_BAND)
    return test_row, moved, False

def run_directional_moves_until_target(row, features, label_encoders, model,
                                       param_ranges, reasons, selected_params=None,
                                       target=50.0, max_k=50):
    direction = get_param_direction(reasons)
    default_dir = {"discount":"increase","ncb":"increase","idv":"increase",
                   "add_on_premium":"decrease","od_premium":"decrease","tp_premium":"decrease"}
    if selected_params:
        for p in selected_params:
            if p not in direction and p in default_dir:
                direction[p] = default_dir[p]

    X_base = encode_row_for_model(row.copy(), features, label_encoders)
    baseline_pct = float(model.predict_proba(X_base)[0][1] * 100.0)

    trials, best_idx, best_churn, prev_sig = [], None, baseline_pct, None
    for k in range(1, max_k+1):
        test_row, moved, stop_zero = build_combo_for_k(
            row, direction, param_ranges, k, [], selected_params
        )
        if stop_zero: break
        sig = (float(test_row["applicable discount with ncb"]),
               float(test_row["vehicle idv"]),
               float(test_row["before gst add-on gwp"]),
               float(test_row["total od premium"]),
               float(test_row["total tp premium"]))
        if prev_sig == sig: break
        prev_sig = sig
        X_t = encode_row_for_model(test_row, features, label_encoders)
        churn_pct = float(model.predict_proba(X_t)[0][1] * 100.0)
        trials.append({"k_moves": k, "moved": sorted(list(moved)) if moved else [],
                       "row": test_row, "churn_pct": churn_pct})
        if churn_pct < best_churn: best_churn, best_idx = churn_pct, len(trials)-1
        if churn_pct < target: break
    return trials, best_idx, baseline_pct

# --------------------------
# Model / source loaders
# --------------------------
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
        model = joblib.load(model_path,mmap_mode="r")
        label_encoders = joblib.load(le_path,mmap_mode="r")
        features = joblib.load(feats_path,mmap_mode="r")
        _model_cache = (model, label_encoders, features)
    return _model_cache


_source_cache = None
def load_bulk_source():
    global _source_cache
    if _source_cache is None:
        eng = cloud_engine()
        _source_cache = pd.read_sql(f"SELECT * FROM {BULK_SOURCE_FQN};", eng)
    return _source_cache

def list_segments():
    src = load_bulk_source()
    return sorted(set(src["Customer Segment"].astype(str).str.strip()))

# --------------------------
# DB ensure + helpers
# --------------------------
def _dedupe_latest_per_policy(eng):
    with eng.begin() as c:
        c.execute(_sqltext(f'''
            UPDATE {BULK_CHANGES_FQN} SET created_at = NOW() WHERE created_at IS NULL;
        '''))
        c.execute(_sqltext(f'''
            UPDATE {BULK_DRAFTS_FQN} SET created_at = NOW() WHERE created_at IS NULL;
        '''))

        c.execute(_sqltext(f'''
            DELETE FROM {BULK_CHANGES_FQN} t
            USING (
              SELECT ctid,
                     row_number() OVER (
                       PARTITION BY policy_no_norm
                       ORDER BY created_at DESC, ctid DESC
                     ) AS rn
              FROM {BULK_CHANGES_FQN}
            ) d
            WHERE t.ctid = d.ctid
              AND d.rn > 1;
        '''))

        c.execute(_sqltext(f'''
            DELETE FROM {BULK_DRAFTS_FQN} t
            USING (
              SELECT ctid,
                     row_number() OVER (
                       PARTITION BY policy_no_norm
                       ORDER BY created_at DESC, ctid DESC
                     ) AS rn
              FROM {BULK_DRAFTS_FQN}
            ) d
            WHERE t.ctid = d.ctid
              AND d.rn > 1;
        '''))

def ensure_bulk_tables():
    eng = cloud_engine()
    ddl_changes = f"""
    CREATE TABLE IF NOT EXISTS {BULK_CHANGES_FQN} (
        policy_no              TEXT,
        policy_no_norm         TEXT,
        customerid             TEXT,
        segment                TEXT,
        batch_id               TEXT,
        vehicle                TEXT,
        old_discount           DOUBLE PRECISION,
        old_ncb                DOUBLE PRECISION,
        old_idv                DOUBLE PRECISION,
        old_add_on_premium     DOUBLE PRECISION,
        old_od                 DOUBLE PRECISION,
        old_tp                 DOUBLE PRECISION,
        old_gst                DOUBLE PRECISION,
        old_total_premium      DOUBLE PRECISION,
        new_discount           DOUBLE PRECISION,
        new_ncb                DOUBLE PRECISION,
        new_idv                DOUBLE PRECISION,
        new_add_on_premium     DOUBLE PRECISION,
        new_od                 DOUBLE PRECISION,
        new_tp                 DOUBLE PRECISION,
        new_gst                DOUBLE PRECISION,
        new_total_premium      DOUBLE PRECISION,
        churn_risk_pct         DOUBLE PRECISION,
        top_3_reasons          TEXT,
        created_at             TIMESTAMPTZ DEFAULT NOW()
    );
    """
    ddl_drafts = f"""
    CREATE TABLE IF NOT EXISTS {BULK_DRAFTS_FQN} (
        policy_no          TEXT,
        policy_no_norm     TEXT,
        to_email           TEXT,
        subject            TEXT,
        body_text          TEXT,
        body_html          TEXT,
        segment            TEXT,
        batch_id           TEXT,
        status             TEXT DEFAULT 'drafted',
        gmail_message_id   TEXT,
        error_text         TEXT,
        created_at         TIMESTAMPTZ DEFAULT NOW(),
        sent_at            TIMESTAMPTZ
    );
    """
    with eng.begin() as c:
        c.execute(_sqltext(ddl_changes))
        c.execute(_sqltext(ddl_drafts))
    _dedupe_latest_per_policy(eng)
    with eng.begin() as c:
        c.execute(_sqltext(f'CREATE INDEX IF NOT EXISTS idx_bulk_changes_pol_norm ON {BULK_CHANGES_FQN}(policy_no_norm);'))
        c.execute(_sqltext(f'CREATE INDEX IF NOT EXISTS idx_bulk_drafts_pol_norm  ON {BULK_DRAFTS_FQN}(policy_no_norm);'))
        c.execute(_sqltext(f'CREATE INDEX IF NOT EXISTS idx_bulk_drafts_status    ON {BULK_DRAFTS_FQN}(status);'))
        c.execute(_sqltext(f'CREATE INDEX IF NOT EXISTS idx_bulk_changes_created  ON {BULK_CHANGES_FQN}(created_at);'))
        c.execute(_sqltext(f'CREATE INDEX IF NOT EXISTS idx_bulk_drafts_created   ON {BULK_DRAFTS_FQN}(created_at);'))
        c.execute(_sqltext('DROP INDEX IF EXISTS uq_bulk_changes_pol_batch;'))
        c.execute(_sqltext('DROP INDEX IF EXISTS uq_bulk_drafts_pol_batch;'))
    with eng.begin() as c:
        c.execute(_sqltext(f'CREATE UNIQUE INDEX IF NOT EXISTS uq_bulk_changes_pol ON {BULK_CHANGES_FQN}(policy_no_norm);'))
        c.execute(_sqltext(f'CREATE UNIQUE INDEX IF NOT EXISTS uq_bulk_drafts_pol  ON {BULK_DRAFTS_FQN}(policy_no_norm);'))

def save_bulk_selected_change(base_row: dict, final_row: dict, segment: str, batch_id: str):
    if ("gst" not in base_row) or ("total premium payable" not in base_row):
        recompute_totals_from_od_tp(base_row, 0.18)
    if ("gst" not in final_row) or ("total premium payable" not in final_row):
        recompute_totals_from_od_tp(final_row, 0.18)

    rec = {
        "policy_no": str(base_row.get("policy no","")),
        "policy_no_norm": _norm_policy(base_row.get("policy no","")),
        "customerid": str(base_row.get("customerid","")),
        "segment": segment,
        "batch_id": batch_id,
        "vehicle": _policy_vehicle_str(base_row),
        "old_discount": float(base_row.get("applicable discount with ncb", 0.0)),
        "old_ncb":      float(base_row.get("ncb % previous year", 0.0)),
        "old_idv":      float(base_row.get("vehicle idv", 0.0)),
        "old_add_on_premium": float(base_row.get("before gst add-on gwp", 0.0)),
        "old_od":       float(base_row.get("total od premium", 0.0)),
        "old_tp":       float(base_row.get("total tp premium", 0.0)),
        "old_gst":      float(base_row.get("gst", 0.0)),
        "old_total_premium": float(base_row.get("total premium payable", 0.0)),
        "new_discount": float(final_row.get("applicable discount with ncb", final_row.get("discount", 0.0))),
        "new_ncb":      float(final_row.get("ncb % previous year", final_row.get("ncb", 0.0))),
        "new_idv":      float(final_row.get("vehicle idv", final_row.get("idv", 0.0))),
        "new_add_on_premium": float(final_row.get("before gst add-on gwp", final_row.get("add_on_premium", 0.0))),
        "new_od":       float(final_row.get("total od premium", final_row.get("od", 0.0))),
        "new_tp":       float(final_row.get("total tp premium", final_row.get("tp", 0.0))),
        "new_gst":      float(final_row.get("gst", (float(final_row.get("od",0))+float(final_row.get("tp",0)))*0.18)),
        "new_total_premium": float(final_row.get("total premium payable", final_row.get("total_premium", 0.0))),
        "churn_risk_pct": float(base_row.get("Churn Probability", 0.0)) * 100.0,
        "top_3_reasons": str(base_row.get("Top 3 Reasons","") or base_row.get("top 3 reasons","")),
    }
    eng = cloud_engine()
    with eng.begin() as c:
        c.execute(_sqltext(f"""
            INSERT INTO {BULK_CHANGES_FQN} (
                policy_no, policy_no_norm, customerid, segment, batch_id, vehicle,
                old_discount, old_ncb, old_idv, old_add_on_premium, old_od, old_tp, old_gst, old_total_premium,
                new_discount, new_ncb, new_idv, new_add_on_premium, new_od, new_tp, new_gst, new_total_premium,
                churn_risk_pct, top_3_reasons, created_at
            )
            VALUES (
                :policy_no, :policy_no_norm, :customerid, :segment, :batch_id, :vehicle,
                :old_discount, :old_ncb, :old_idv, :old_add_on_premium, :old_od, :old_tp, :old_gst, :old_total_premium,
                :new_discount, :new_ncb, :new_idv, :new_add_on_premium, :new_od, :new_tp, :new_gst, :new_total_premium,
                :churn_risk_pct, :top_3_reasons, NOW()
            )
            ON CONFLICT (policy_no_norm) DO UPDATE
            SET
                customerid          = EXCLUDED.customerid,
                segment             = EXCLUDED.segment,
                batch_id            = EXCLUDED.batch_id,
                vehicle             = EXCLUDED.vehicle,
                old_discount        = EXCLUDED.old_discount,
                old_ncb             = EXCLUDED.old_ncb,
                old_idv             = EXCLUDED.old_idv,
                old_add_on_premium  = EXCLUDED.old_add_on_premium,
                old_od              = EXCLUDED.old_od,
                old_tp              = EXCLUDED.old_tp,
                old_gst             = EXCLUDED.old_gst,
                old_total_premium   = EXCLUDED.old_total_premium,
                new_discount        = EXCLUDED.new_discount,
                new_ncb             = EXCLUDED.new_ncb,
                new_idv             = EXCLUDED.new_idv,
                new_add_on_premium  = EXCLUDED.new_add_on_premium,
                new_od              = EXCLUDED.new_od,
                new_tp              = EXCLUDED.new_tp,
                new_gst             = EXCLUDED.new_gst,
                new_total_premium   = EXCLUDED.new_total_premium,
                churn_risk_pct      = EXCLUDED.churn_risk_pct,
                top_3_reasons       = EXCLUDED.top_3_reasons,
                created_at          = EXCLUDED.created_at
            WHERE EXCLUDED.created_at >= {BULK_CHANGES_FQN}.created_at;
        """), rec)
    return rec

def upsert_bulk_draft(rec: dict):
    eng = cloud_engine()
    with eng.begin() as c:
        c.execute(_sqltext(f"""
            INSERT INTO {BULK_DRAFTS_FQN} (
                policy_no, policy_no_norm, to_email, subject, body_text, body_html,
                segment, batch_id, status, created_at
            )
            VALUES (
                :policy_no, :policy_no_norm, :to_email, :subject, :body_text, :body_html,
                :segment, :batch_id, 'drafted', NOW()
            )
            ON CONFLICT (policy_no_norm) DO UPDATE
            SET
                to_email         = EXCLUDED.to_email,
                subject          = EXCLUDED.subject,
                body_text        = EXCLUDED.body_text,
                body_html        = EXCLUDED.body_html,
                segment          = EXCLUDED.segment,
                batch_id         = EXCLUDED.batch_id,
                status           = 'drafted',
                error_text       = NULL,
                gmail_message_id = NULL,
                created_at       = EXCLUDED.created_at
            WHERE EXCLUDED.created_at >= {BULK_DRAFTS_FQN}.created_at;
        """), rec)

def mark_sent(policy_no_norm: str, msg_id: str):
    eng = cloud_engine()
    with eng.begin() as c:
        c.execute(_sqltext(f"""
            UPDATE {BULK_DRAFTS_FQN}
               SET status='sent', gmail_message_id=:m, sent_at=NOW()
             WHERE policy_no_norm=:p;
        """), {"m": msg_id, "p": policy_no_norm})

def mark_failed(policy_no_norm: str, err: str):
    eng = cloud_engine()
    with eng.begin() as c:
        c.execute(_sqltext(f"""
            UPDATE {BULK_DRAFTS_FQN}
               SET status='failed', error_text=:e
             WHERE policy_no_norm=:p;
        """), {"e": err[:500], "p": policy_no_norm})

# --------------------------
# Review join
# --------------------------
def fetch_review_df(segment: str, status_filter: list[str] | None, policy_search: str | None):
    eng = cloud_engine()
    where = ["d.segment = :s"]
    params = {"s": segment}
    if status_filter and len(status_filter) < 3:
        where.append("d.status = ANY(:st)"); params["st"] = status_filter
    if policy_search and policy_search.strip():
        where.append("(d.policy_no ILIKE :q OR d.policy_no_norm ILIKE :q)")
        params["q"] = f"%{policy_search.strip()}%"
    where_sql = " AND ".join(where)

    sql = f"""
        SELECT
            d.policy_no, d.policy_no_norm, d.to_email, d.status, d.subject, d.body_text,
            d.created_at, d.sent_at, d.gmail_message_id, d.error_text,
            c.customerid, c.batch_id, c.vehicle,
            c.old_discount, c.new_discount,
            c.old_ncb, c.new_ncb,
            c.old_idv, c.new_idv,
            c.old_add_on_premium, c.new_add_on_premium,
            c.old_od, c.new_od,
            c.old_tp, c.new_tp,
            c.old_gst, c.new_gst,
            c.old_total_premium, c.new_total_premium,
            c.churn_risk_pct, c.top_3_reasons
        FROM {BULK_DRAFTS_FQN} d
        RIGHT JOIN {BULK_CHANGES_FQN} c
          ON c.policy_no_norm = d.policy_no_norm
        WHERE {where_sql}
        ORDER BY d.created_at DESC;
    """

    df = pd.read_sql(_sqltext(sql), eng, params=params)
    if df.empty:
        return df

    try:
        fmt = "%Y-%m-%d %H:%M:%S %Z"
        if "created_at" in df.columns:
            df["created_at"] = to_local_tz_formatted(df["created_at"], LOCAL_TZ, fmt)
        if "sent_at" in df.columns:
            df["sent_at"] = to_local_tz_formatted(df["sent_at"], LOCAL_TZ, fmt)
    except Exception:
        pass

    # Δ columns (rounding similar to existing)
    # Discount is in percentage points (pp)
    if "new_discount" in df.columns and "old_discount" in df.columns:
        df["Δ Discount (pp)"] = (df["new_discount"] - df["old_discount"]).round(2)
    else:
        df["Δ Discount (pp)"] = None

    # monetary deltas
    if {"new_od","old_od"}.issubset(df.columns):
        df["Δ OD (₹)"] = (df["new_od"] - df["old_od"]).round(0)
    else:
        df["Δ OD (₹)"] = None

    if {"new_tp","old_tp"}.issubset(df.columns):
        df["Δ TP (₹)"] = (df["new_tp"] - df["old_tp"]).round(0)
    else:
        df["Δ TP (₹)"] = None

    if {"new_total_premium","old_total_premium"}.issubset(df.columns):
        df["Δ Total (₹)"] = (df["new_total_premium"] - df["old_total_premium"]).round(0)
    else:
        df["Δ Total (₹)"] = None

    # Optionally add Δ for IDV and Add-on if desired
    if {"new_idv","old_idv"}.issubset(df.columns):
        df["Δ IDV (₹)"] = (df["new_idv"] - df["old_idv"]).round(0)
    else:
        df["Δ IDV (₹)"] = None

    if {"new_add_on_premium","old_add_on_premium"}.issubset(df.columns):
        df["Δ Add-on (₹)"] = (df["new_add_on_premium"] - df["old_add_on_premium"]).round(0)
    else:
        df["Δ Add-on (₹)"] = None

    # Final column ordering returned to views.review
    cols = [
        "policy_no","policy_no_norm","to_email","status","subject","body_text","created_at","sent_at",
        "Δ Discount (pp)","Δ OD (₹)","Δ TP (₹)","Δ Total (₹)",
        "old_discount","new_discount",
        "old_ncb","new_ncb",
        "old_idv","new_idv",
        "old_add_on_premium","new_add_on_premium",
        "old_od","new_od",
        "old_tp","new_tp",
        "old_gst","new_gst",
        "old_total_premium","new_total_premium",
        "chgurn_risk_pct","churn_risk_pct",  # typo-safe; keep churn column if present
        "gmail_message_id","error_text","customerid","batch_id","vehicle","top_3_reasons"
    ]

    # Keep only columns actually present (avoid KeyError)
    cols = [c for c in cols if c in df.columns or c.startswith("Δ ")]

    return df[cols]


# --------------------------
# Drafting (simple template fallback)
# --------------------------
SUBJ_RE = re.compile(r"^\s*subject\s*:\s*(.+)$", re.I)

def split_subj_body(text: str) -> tuple[str, str]:  
    lines = text.splitlines(); subj=None; body=[]
    for l in lines:
        m = SUBJ_RE.match(l)
        if m and subj is None:
            subj = m.group(1).strip(); continue
        body.append(l)
    if subj is None:
        subj = next((l.strip() for l in body if l.strip()), "Policy Renewal Options")
        body = body[1:]
    return subj[:78], "\n".join(body).strip()


def to_html(body_text: str) -> str:
    """
    Convert plain text body to safe HTML and bold important values/words.

    - Keeps your paragraph / bullet rendering behaviour.
    - Bolds currency amounts (₹...), percentages, long numeric tokens, and keywords.
    """
    import html
    import re
    text = (body_text or "").strip()

    # Early return minimal wrapper for empty text
    if not text:
        return """<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body><div class="wrapper"></div></body></html>"""

    # Split into blocks on two or more newlines (preserve original logic)
    blocks = re.split(r'\n{2,}', text)

    def render_block(block: str) -> str:
        lines = [l.rstrip() for l in block.split('\n') if l.strip()]
        bullet_pat = re.compile(r'^\s*[-•–]\s+(.*)$')
        bullet_items = []
        non_bullet = False
        for l in lines:
            m = bullet_pat.match(l)
            if m:
                bullet_items.append(m.group(1))
            else:
                non_bullet = True
                break
        if bullet_items and not non_bullet:
            lis = "\n".join(f"<li>{html.escape(item)}</li>" for item in bullet_items)
            return f"<ul>{lis}</ul>"

        safe_lines = [html.escape(l) for l in lines]
        return f"<p>{'<br>'.join(safe_lines)}</p>"

    content = "\n".join(render_block(b) for b in blocks if b.strip())

    # ---------- Boldify important tokens ----------
    # Build keywords: core keywords + SPECIAL_REASONS (if available)
    try:
        from .constants import SPECIAL_REASONS
        extra_reasons = list(SPECIAL_REASONS or [])
    except Exception:
        extra_reasons = []

    keywords = [
        "Discount", "OD", "TP", "Total", "Policy", "Vehicle", "Reply", "Proceed",
        "savings", "savings.", "savings:", "Renewal", "renewal"
    ]
    # include special reasons too (words may contain spaces - handle separately)
    keywords += extra_reasons

    # We will perform replacements on the HTML-escaped content (safe).
    out = content

    # Helper: replace keyword occurrences (case-insensitive) with <strong>...</strong>
    def bold_keyword(html_text, kw):
        if not kw:
            return html_text
        # escape kw for regex; we will match word-boundary-ish occurrences (but allow spaces inside)
        pattern = re.compile(re.escape(str(kw)), re.IGNORECASE)
        return pattern.sub(lambda m: f"<strong>{m.group(0)}</strong>", html_text)

    # 1) Bold currency amounts like ₹1,234.00 or ₹ 1,234
    out = re.sub(r'₹\s?[\d,]+(?:\.\d+)?', lambda m: f"<strong>{m.group(0)}</strong>", out)

    # 2) Bold percentages like 12% or 12.5 %
    out = re.sub(r'\b\d+(?:\.\d+)?\s*%', lambda m: f"<strong>{m.group(0)}</strong>", out)

    # 3) Bold long numeric tokens (3+ continuous digits) — helps policy numbers / totals.
    #     Avoid over-bolding 1-2 digit counts; we only bold 3+ digit sequences.
    out = re.sub(r'\b(\d{3,}(?:[A-Za-z0-9\-\/]*)?)\b', lambda m: f"<strong>{m.group(0)}</strong>", out)

    # 4) Bold distinct keywords and special reasons — loop after numeric bolding to avoid nesting issues
    for kw in sorted(set(keywords), key=lambda x: -len(x) if x else 0):
        if not kw: 
            continue
        out = bold_keyword(out, kw)

    # NOTE: because we've been operating on escaped HTML blocks (<p> and <ul> with escaped text),
    # our replacements won't interfere with tags. We intentionally do simple substitutions
    # — if you need smarter HTML-aware replacement, we can use an HTML parser (but this suffices for most cases).

    # Wrap with the same wrapper/styling as before
    final = f"""<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
.wrapper {{ width:100%; margin:0; padding:16px; font-family:Arial,sans-serif; font-size:14px; line-height:1.5; }}
p {{ margin:0 0 12px; }} ul {{ margin:0 0 12px 20px; padding:0; }} li {{ margin:4px 0; }}
strong {{ font-weight:700; }}
</style></head><body><div class="wrapper">{out}</div></body></html>"""
    return final



def _fallback_draft_email(row: dict) -> str:
    # SAME as your current short template (kept as fallback)
    vehicle = row.get("vehicle") or _policy_vehicle_str(row)
    old_disc = row.get("old_discount", "")
    new_disc = row.get("new_discount", "")
    old_tot  = row.get("old_total_premium","")
    new_tot  = row.get("new_total_premium","")
    delta_pp = ""
    try:
        delta_pp = f"{float(new_disc) - float(old_disc):+.1f}"
    except Exception:
        pass
    body = f"""Subject: Renewal options for your vehicle

Hi,

We reviewed your policy for {vehicle} and prepared an updated renewal option.

Highlights:
- Discount change: {old_disc}% → {new_disc}% ({delta_pp} pp)
- Total premium change: ₹{old_tot} → ₹{new_tot}

These updates reflect adjustments across OD/TP and add-on premiums while keeping coverage intact.
Reply to proceed and we'll finalize your renewal.

Best regards,
Support Team
"""
    return body

def draft_email(row: dict) -> str:
    """
    Streamlit-parity drafting:
    - Use the Azure LLM (same prompt/rules) if configured.
    - Otherwise fall back to the short, robust template above.
    """
    llm = _get_llm_mail()
    if not llm:
        return _fallback_draft_email(row)

    # Build context exactly like the Streamlit app
    ctx_keys = [
        "vehicle","old_discount","new_discount","old_total_premium","new_total_premium",
        "old_od","new_od","old_tp","new_tp","old_add_on_premium","new_add_on_premium",
        "old_idv","new_idv","top_3_reasons"
    ]
    ctx = "; ".join(f"{k}={row.get(k)}" for k in ctx_keys if k in row)

    # Same rules/prompt as Streamlit
    from .constants import SPECIAL_REASONS  # already imported at top; harmless to re-import
    prompt = f"""
Subject: (placeholder)

You are an expert retention-email writer for car insurance.

Rules (do NOT reveal):
- First line must start with "Subject: ".
- Mention their policy details like vehicle names
- Use figures in ctx to show discount Δ (pp) and savings.
- Mention OD/TP impact.
- Address each reason in top_3_reasons; if any of {', '.join(SPECIAL_REASONS)} appear,
  add a reassurance line.
- Don't mention the top_3_reason in the draft.
- Do not use the phrase "we noticed".
- Do not use phrases like "renewal approaches".
- Friendly, persuasive, action-oriented. Finish with clear renewal CTA.

ctx: {ctx}
""".strip()

    try:
        out = llm.invoke(prompt).content.strip()
        # Safety: ensure we always return *something* sensible
        return out or _fallback_draft_email(row)
    except Exception:
        # If LLM call fails for any reason, degrade gracefully
        return _fallback_draft_email(row)


# --------------------------
# Latest selected row (simple SQL, no LLM dependency)
# --------------------------
def fetch_latest_selected(policy_no: str) -> dict | None:
    try:
        eng = cloud_engine()
        norm = _norm_policy(policy_no)
        norm_expr = "UPPER(REPLACE(REGEXP_REPLACE(policy_no::text,'^''',''),' ',''))"
        sql = f"SELECT * FROM {FULL_SAVE_FQN} WHERE {norm_expr} = :p ORDER BY created_at DESC LIMIT 1;"
        df = pd.read_sql(_sqltext(sql), eng, params={"p": norm})
        return None if df.empty else df.iloc[0].to_dict()
    except Exception:
        return None

# --------------------------
# Gmail send
# --------------------------
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText as _MIMEText
from google.auth.transport.requests import Request as _GRequest
from google.oauth2.credentials import Credentials as _GCreds
from google_auth_oauthlib.flow import InstalledAppFlow as _GFlow
from googleapiclient.discovery import build as _gbuild

from google.auth.exceptions import RefreshError as _GRefreshError

def _load_gmail_creds(scopes):
    creds = None
    # 1) Try token.json
    if os.path.exists(GMAIL_TOKEN_FILE):
        try:
            creds = _GCreds.from_authorized_user_file(GMAIL_TOKEN_FILE, scopes)
        except Exception:
            creds = None

    # 2) Refresh if needed
    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(_GRequest())
        except _GRefreshError as e:
            # Common case: invalid_grant → delete token and force re-auth
            try:
                os.remove(GMAIL_TOKEN_FILE)
            except Exception:
                pass
            raise RuntimeError(
                "Gmail token is invalid (invalid_grant). "
                "Please re-authorize to regenerate token.json on a machine with a browser, "
                "then copy it to the server."
            ) from e

    # 3) If still no valid creds, run the installed-app flow (only works on a machine with a browser)
    if not creds or not creds.valid:
        flow = _GFlow.from_client_secrets_file(GMAIL_CREDENTIALS_FILE, scopes)
        # Request an offline refresh token explicitly
        creds = flow.run_local_server(port=0, access_type='offline', prompt='consent')
        with open(GMAIL_TOKEN_FILE, "w") as f:
            f.write(creds.to_json())

    return creds

from googleapiclient.errors import HttpError

def send_gmail(to_addr: str, subj: str, body: str) -> dict:
    if not to_addr or "@" not in to_addr:
        return {"ok": False, "reason": "invalid_to"}

    if not SENDER_EMAIL:
        return {"ok": False, "reason": "missing_sender_env"}

    scopes = ["https://www.googleapis.com/auth/gmail.send"]
    creds = _load_gmail_creds(scopes)

    srv = _gbuild("gmail","v1",credentials=creds)
    # (optional) discover actual sender vs alias as suggested earlier

    msg = MIMEMultipart("alternative")
    msg["to"] = to_addr
    msg["from"] = SENDER_EMAIL
    msg["subject"] = subj or "(no subject)"
    msg.attach(_MIMEText(body or "", "plain", "utf-8"))
    msg.attach(_MIMEText(to_html(body or ""), "html", "utf-8"))
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

    try:
        sent = srv.users().messages().send(userId="me", body={"raw": raw}).execute()
        return {"ok": True, "id": sent.get("id","")}
    except HttpError as e:
        # Parse common Gmail quota/rate errors
        reason = "http_error"
        try:
            err = e.error_details or e._get_reason()  # depends on lib version
            reason_text = str(err).lower()
            if any(k in reason_text for k in ("rate limit", "ratelimit", "user rate limit", "too many requests","quota")):
                reason = "rate_limited"
        except Exception:
            pass
        return {"ok": False, "reason": reason, "detail": str(e)}
    except Exception as e:
        return {"ok": False, "reason": "exception", "detail": str(e)}
    

import re

def normalize_subject_body(subject: str, body: str, vehicle_no: str | None = None):
    """
    Normalizes subject/body before saving drafts:
      - Replace 'Your Name' / '[Your Name]' with 'Prowesstics Admin'
      - Force a single signature block:
            Best regards,
            Prowesstics Admin
      - Remove extra lines like 'Car Insurance Expert', 'Customer Retention Team', etc.
      - Uppercase vehicle number wherever it appears (subject + body).
    """
    subject = subject or ""
    body = body or ""
    vehicle_no = (vehicle_no or "").strip()

    # ---------- 1) Replace placeholders with "Prowesstics Admin" ----------
    placeholders = ["[Your Name]", "Your Name", "{Your Name}", "{your_name}"]
    for ph in placeholders:
        subject = subject.replace(ph, "Prowesstics Admin")
        body = body.replace(ph, "Prowesstics Admin")

    # ---------- 2) Uppercase known vehicle number (from DB) ----------
    if vehicle_no:
        upper_v = vehicle_no.upper()
        if vehicle_no != upper_v:
            subject = subject.replace(vehicle_no, upper_v)
            body = body.replace(vehicle_no, upper_v)

    # 2b) Also handle generic "Vehicle: xyz123" patterns in subj + body
    def _upper_vehicle(match):
        prefix = match.group(1)
        number = match.group(2)
        return prefix + number.upper()

    subject = re.sub(r"(Vehicle:\s*)([A-Za-z0-9\-]+)", _upper_vehicle, subject, flags=re.IGNORECASE)
    body = re.sub(r"(Vehicle:\s*)([A-Za-z0-9\-]+)", _upper_vehicle, body, flags=re.IGNORECASE)

    # ---------- 3) Enforce single signature block ----------
    # We keep everything up to "Best regards" (or "Regards"), then enforce:
    #   Best regards,
    #   Prowesstics Admin
    # and drop all other role/position lines that the LLM added.
    lines = body.splitlines()
    idx = None

    for i, line in enumerate(lines):
        stripped = line.strip().lower()
        if stripped.startswith("best regards") or stripped == "regards," or stripped == "regards":
            idx = i
            break

    if idx is not None:
        # Keep everything before the signature line
        before = lines[:idx]

        # Collect any PS block that appears *after* the signature
        ps_block = []
        for l in lines[idx+1:]:
            if l.strip().lower().startswith(("p.s", "ps ")):
                ps_block = ["", l]  # blank line then PS...
                # plus any following lines (more PS text)
                # (we keep them as-is)
                # grab remaining lines after this line
                # but we already are iterating, so:
                # append all remaining original lines starting from this one
                ps_block = [""] + lines[lines.index(l):]
                break

        # New body: everything before, then normalized signature, then optional PS
        new_lines = before + [
            "Best regards,",
            "Prowesstics Admin",
        ]
        if ps_block:
            new_lines.extend(ps_block)

        body = "\n".join(new_lines)

    return subject, body


