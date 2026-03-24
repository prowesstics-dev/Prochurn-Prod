# views.py
import os
import requests
from decimal import Decimal, InvalidOperation
from django.http import JsonResponse
from django.utils import timezone
from django.db import transaction
from .models import CurrencyRate
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

def _to_decimal(x):
    try:
        return Decimal(str(x))
    except (InvalidOperation, TypeError):
        return None

def _normalize_provider_response(data):
    """
    Returns: (base, rates_dict)
    rates_dict is: { "USD": <rate>, ... } where rate meaning depends on base
    """
    if not isinstance(data, dict):
        return None, None

    # Fixer style
    if "rates" in data:
        return data.get("base", "EUR"), data.get("rates", {})

    # ExchangeRate-API style
    if "conversion_rates" in data:
        return data.get("base_code", "USD"), data.get("conversion_rates", {})

    return None, None

@csrf_exempt
@require_POST
def refresh_currency_rates(request):
    """
    Refreshes currency rates and stores as:
      1 <CODE> -> INR (rate = INR per 1 CODE)
    """
    api_key = os.getenv("EXCHANGE_API_KEY")
    if not api_key:
        return JsonResponse({"ok": False, "message": "EXCHANGE_API_KEY not found in environment"}, status=400)

    # Which currencies you want to store (you can extend)
    wanted_codes = ["USD", "SGD", "JPY", "AED", "EUR", "GBP", "CHF", "RUB", "KZT", "INR"]

    try:
        # ---------------------------
        # Provider URL (example Fixer)
        # NOTE: Fixer free base often fixed to EUR
        # ---------------------------
        url = f"https://v6.exchangerate-api.com/v6/{api_key}/latest/INR"
        res = requests.get(url, timeout=15)
        data = res.json()

        base, rates = _normalize_provider_response(data)
        if not base or not isinstance(rates, dict):
            return JsonResponse(
                {"ok": False, "message": "Unexpected API structure", "response": data},
                status=400
            )

        # We need INR to compute INR per 1 CODE when base is not INR
        if "INR" not in rates and base != "INR":
            return JsonResponse(
                {"ok": False, "message": "INR rate missing from provider response", "response": data},
                status=400
            )

        now = timezone.now()
        saved = []

        # Helper: compute INR per 1 code
        def inr_per_one(code: str):
            if code == "INR":
                return Decimal("1")

            # Case A: provider base is INR => rates[code] = 1 INR -> code
            if base == "INR":
                code_per_inr = _to_decimal(rates.get(code))
                if not code_per_inr or code_per_inr == 0:
                    return None
                return (Decimal("1") / code_per_inr)  # INR per 1 CODE (invert)

            # Case B: provider base is something else (e.g., EUR) => rates[x] = 1 EUR -> x
            # INR per 1 CODE = (INR per 1 EUR) / (CODE per 1 EUR)
            inr_per_base = _to_decimal(rates.get("INR"))
            code_per_base = _to_decimal(rates.get(code))
            if not inr_per_base or not code_per_base or code_per_base == 0:
                return None
            return (inr_per_base / code_per_base)

        with transaction.atomic():
            for code in wanted_codes:
                val = inr_per_one(code)
                if val is None:
                    continue

                obj, _created = CurrencyRate.objects.update_or_create(
                    base_currency=code,
                    currency_code="INR",
                    defaults={"rate": val, "fetched_at": now},
                )

                saved.append({
                    "base_currency": obj.base_currency,
                    "currency_code": obj.currency_code,
                    "rate": str(obj.rate),
                    "fetched_at": obj.fetched_at.isoformat(),
                })

        return JsonResponse({
            "ok": True,
            "message": "Currency rates refreshed and saved",
            "provider_base": base,
            "count": len(saved),
            "data": saved,
        })

    except Exception as e:
        return JsonResponse({"ok": False, "message": "Failed to refresh currency rates", "error": str(e)}, status=500)
    



# views.py
from django.http import JsonResponse
from .models import CurrencyRate

def latest_currency_rates(request):
    """
    GET /currency/latest?codes=USD,SGD,JPY
    Returns INR per 1 CODE for each code
    """
    codes_raw = (request.GET.get("codes") or "").strip()
    codes = [c.strip().upper() for c in codes_raw.split(",") if c.strip()] if codes_raw else []

    qs = CurrencyRate.objects.filter(currency_code="INR")
    if codes:
        qs = qs.filter(base_currency__in=codes)

    rows = list(qs.values("base_currency", "currency_code", "rate", "fetched_at").order_by("base_currency"))

    return JsonResponse({"ok": True, "data": rows})




#######################################SEGMENTATION##########################


import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from .models import SegmentationConfig

def _get_global_cfg():
    cfg = SegmentationConfig.objects.order_by("id").first()
    if not cfg:
        cfg = SegmentationConfig.objects.create(segment_names={}, thresholds={})
    return cfg

@require_http_methods(["GET"])
def get_segmentation_config(request):
    cfg = _get_global_cfg()
    return JsonResponse({
        "segment_names": cfg.segment_names or {},
        "thresholds": cfg.thresholds or {},
    })

@csrf_exempt  # if you want CSRF protection later, remove this and send CSRF token from frontend
@require_http_methods(["POST"])
def save_segmentation_config(request):
    cfg = _get_global_cfg()

    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # partial updates allowed
    if isinstance(body.get("segment_names"), dict):
        cfg.segment_names = body["segment_names"]

    if isinstance(body.get("thresholds"), dict):
        cfg.thresholds = body["thresholds"]

    cfg.save()
    return JsonResponse({"ok": True})


import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import connection, transaction

from .models import SegmentMetricConfig


def _is_plain_object(x):
    return isinstance(x, dict)

def _normalize_level(x):
    return str(x or "").strip().title()

def _validate_metrics_payload(metrics_map: dict):
    required = ("platinum", "gold", "silver")
    allowed = {"High", "Mid", "Low"}

    for seg_id in required:
        if seg_id not in metrics_map or not _is_plain_object(metrics_map[seg_id]):
            raise ValueError(f"Missing metrics for '{seg_id}'")

    normalized = {}
    used_combos = {}

    for seg_id in required:
        m = metrics_map[seg_id]
        churn = _normalize_level(m.get("churn"))
        discount = _normalize_level(m.get("discount"))
        clv = _normalize_level(m.get("clv"))

        if churn not in allowed or discount not in allowed or clv not in allowed:
            raise ValueError(f"Invalid metrics for '{seg_id}'. Use High/Mid/Low only.")

        combo = (churn, discount, clv)
        if combo in used_combos:
            raise ValueError(
                f"Duplicate metrics not allowed: '{used_combos[combo]}' and '{seg_id}' are both "
                f"(Churn={churn}, Discount={discount}, CLV={clv})."
            )
        used_combos[combo] = seg_id

        normalized[seg_id] = {"churn": churn, "discount": discount, "clv": clv}

    return normalized


@csrf_exempt
@require_http_methods(["GET"])
def get_segment_metrics_config(request):
    cfg, _ = SegmentMetricConfig.objects.get_or_create(user=request.user)
    return JsonResponse({"segment_metrics": cfg.segment_metrics or {}})


@csrf_exempt
@require_http_methods(["POST"])
def apply_segment_metrics_to_final(request):
    """
    Updates ONLY: "Prediction"."2025_prediction_final_data"
    Uses churn_category / discount_category / clv_category + Predicted Status
    Writes result into "Customer Segment"
    """
    cfg, _ = SegmentMetricConfig.objects.get_or_create(user=request.user)

    try:
        body = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    segment_metrics = body.get("segment_metrics")
    if not _is_plain_object(segment_metrics):
        return JsonResponse({"error": "segment_metrics must be an object"}, status=400)

    try:
        normalized = _validate_metrics_payload(segment_metrics)
    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=400)

    # Save config so UI reloads can show the last applied selection
    cfg.segment_metrics = normalized
    cfg.save()

    # IMPORTANT: adjust column names if your DB differs
    sql = r"""
    UPDATE "Prediction"."2025_prediction_final_data" t
    SET "customer_segment" = CASE
        WHEN t."predicted_status" = 'Not Renewed'
         AND t.churn_category = %(p_churn)s
         AND t.discount_category = %(p_disc)s
         AND t.clv_category = %(p_clv)s
        THEN 'Elite Retainers'

        WHEN t."predicted_status" = 'Not Renewed'
         AND t.churn_category = %(g_churn)s
         AND t.discount_category = %(g_disc)s
         AND t.clv_category = %(g_clv)s
        THEN 'Potential Customers'

        WHEN t."predicted_status" = 'Not Renewed'
         AND t.churn_category = %(s_churn)s
         AND t.discount_category = %(s_disc)s
         AND t.clv_category = %(s_clv)s
        THEN 'Low Value Customers'

        ELSE NULL
    END;
    """

    params = {
        "p_churn": normalized["platinum"]["churn"],
        "p_disc": normalized["platinum"]["discount"],
        "p_clv": normalized["platinum"]["clv"],
        "g_churn": normalized["gold"]["churn"],
        "g_disc": normalized["gold"]["discount"],
        "g_clv": normalized["gold"]["clv"],
        "s_churn": normalized["silver"]["churn"],
        "s_disc": normalized["silver"]["discount"],
        "s_clv": normalized["silver"]["clv"],
    }

    try:
        with transaction.atomic():
            with connection.cursor() as cur:
                cur.execute(sql, params)
        return JsonResponse({"ok": True})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def reset_final_from_backup(request):
    sql = """
    TRUNCATE TABLE "Prediction"."2025_prediction_final_data";
    INSERT INTO "Prediction"."2025_prediction_final_data"
    SELECT * FROM "Prediction"."2025_prediction_data_backup";
    """
    conn = None
    try:
        conn = psycopg2.connect(
            dbname=DB_New_Pred["dbname"],
            user=DB_New_Pred["user"],
            password=DB_New_Pred["password"],
            host=DB_New_Pred["host"],
            port=DB_New_Pred["port"],
        )
        with conn:
            with conn.cursor() as cur:
                cur.execute(sql)
        return JsonResponse({"ok": True})
    except Exception as e:
        return JsonResponse({"ok": False, "message": str(e)}, status=500)
    finally:
        if conn:
            conn.close()




from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db import connection

@require_http_methods(["GET"])
def get_segment_parameters(request):
    sql = """
        SELECT customer_segment, churn_values, discount_values, clv_values
        FROM "Prediction"."segment_parameter_summary";
    """

    conn = None
    try:
        conn = psycopg2.connect(
            dbname=DB_New_Pred["dbname"],
            user=DB_New_Pred["user"],
            password=DB_New_Pred["password"],
            host=DB_New_Pred["host"],
            port=DB_New_Pred["port"],
        )

        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()

        out = {}
        for seg, churn_vals, disc_vals, clv_vals in rows:
            out[str(seg)] = {
                "churn": list(churn_vals or []),
                "discount": list(disc_vals or []),
                "clv": list(clv_vals or []),
            }

        return JsonResponse({"ok": True, "data": out})

    except Exception as e:
        return JsonResponse({"ok": False, "message": str(e)}, status=500)

    finally:
        if conn:
            conn.close()


@csrf_exempt
@require_http_methods(["POST"])
def apply_segment_parameters(request):
    """
    Apply mapping to:
      "Prediction"."2025_prediction_final_data"
    Based on selected churn/discount/clv for each segment.
    Supports multi-select arrays like ["High","Mid"].
    Enforces: no duplicate combinations (same sets).
    """
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"ok": False, "message": "Invalid JSON"}, status=400)

    required = ["platinum", "gold", "silver"]
    for k in required:
        if k not in body or not isinstance(body[k], dict):
            return JsonResponse({"ok": False, "message": f"Missing payload for {k}"}, status=400)

    allowed = {"High", "Mid", "Low"}

    def norm_list(x):
        # allow: "High" OR ["High","Mid"]
        if x is None:
            vals = []
        elif isinstance(x, list):
            vals = x
        else:
            vals = [x]

        cleaned = []
        for v in vals:
            s = str(v or "").strip().title()
            if s:
                cleaned.append(s)

        # dedupe + sort for stable combo comparison
        cleaned = sorted(set(cleaned))

        # validate
        for v in cleaned:
            if v not in allowed:
                raise ValueError(f"Invalid value '{v}'. Use High/Mid/Low only.")

        # require at least one selected
        if not cleaned:
            raise ValueError("Each metric must have at least one value selected.")

        return cleaned

    # normalize + validate unique combos (by SETS)
    combos = set()
    normalized = {}
    try:
        for k in required:
            churn = norm_list(body[k].get("churn"))
            discount = norm_list(body[k].get("discount"))
            clv = norm_list(body[k].get("clv"))

            combo = (tuple(churn), tuple(discount), tuple(clv))
            if combo in combos:
                return JsonResponse(
                    {"ok": False, "message": "Duplicate metrics combination is not allowed."},
                    status=400,
                )
            combos.add(combo)
            normalized[k] = {"churn": churn, "discount": discount, "clv": clv}
    except ValueError as e:
        return JsonResponse({"ok": False, "message": str(e)}, status=400)

    seg_name_map = {
        "platinum": "Platinum",
        "gold": "Gold",
        "silver": "Silver",
    }

    # IMPORTANT: use ANY(array) since we now pass lists
    sql = r"""
    UPDATE "Prediction"."2025_prediction_final_data" t
    SET "customer_segment" = CASE
        WHEN t."predicted_status" = 'Not Renewed'
         AND t.churn_category = ANY(%(p_churn)s)
         AND t.discount_category = ANY(%(p_disc)s)
         AND t.clv_category = ANY(%(p_clv)s)
        THEN %(p_name)s

        WHEN t."predicted_status" = 'Not Renewed'
         AND t.churn_category = ANY(%(g_churn)s)
         AND t.discount_category = ANY(%(g_disc)s)
         AND t.clv_category = ANY(%(g_clv)s)
        THEN %(g_name)s

        WHEN t."predicted_status" = 'Not Renewed'
         AND t.churn_category = ANY(%(s_churn)s)
         AND t.discount_category = ANY(%(s_disc)s)
         AND t.clv_category = ANY(%(s_clv)s)
        THEN %(s_name)s

        ELSE NULL
    END;
    """

    params = {
        "p_churn": normalized["platinum"]["churn"],
        "p_disc": normalized["platinum"]["discount"],
        "p_clv": normalized["platinum"]["clv"],
        "p_name": seg_name_map["platinum"],

        "g_churn": normalized["gold"]["churn"],
        "g_disc": normalized["gold"]["discount"],
        "g_clv": normalized["gold"]["clv"],
        "g_name": seg_name_map["gold"],

        "s_churn": normalized["silver"]["churn"],
        "s_disc": normalized["silver"]["discount"],
        "s_clv": normalized["silver"]["clv"],
        "s_name": seg_name_map["silver"],
    }

    conn = None
    try:
        conn = psycopg2.connect(
            dbname=DB_New_Pred["dbname"],
            user=DB_New_Pred["user"],
            password=DB_New_Pred["password"],
            host=DB_New_Pred["host"],
            port=DB_New_Pred["port"],
        )
        with conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
        return JsonResponse({"ok": True})
    except Exception as e:
        return JsonResponse({"ok": False, "message": str(e)}, status=500)
    finally:
        if conn:
            conn.close()


import json
import psycopg2

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from .models import SegmentationConfig


DB_New_Pred = settings.EXTERNAL_DATABASES["DB_New_Pred"]

# =========================
# Global Config Helpers
# =========================

def _get_global_cfg():
    cfg = SegmentationConfig.objects.order_by("id").first()
    if not cfg:
        cfg = SegmentationConfig.objects.create(segment_names={}, thresholds={})
    return cfg


def _num(x):
    """Convert to float or return None."""
    try:
        if x is None or x == "":
            return None
        return float(x)
    except Exception:
        return None


def _is_num(x):
    try:
        float(x)
        return True
    except Exception:
        return False


def _is_obj_with_value(x):
    return isinstance(x, dict) and ("value" in x) and _is_num(x.get("value"))


def _normalize_quartile_group(group: dict):
    """
    Normalize discount/clv group so each level is:
      {"value": number|None, "q": "Q25/Q50/Q75"}
    Accepts old/bad shapes too (plain numbers).
    """
    if not isinstance(group, dict):
        return None

    mapping = {"low": "Q25", "mid": "Q50", "high": "Q75"}
    out = {}

    for lvl, q in mapping.items():
        raw = group.get(lvl)

        # already good
        if isinstance(raw, dict) and "value" in raw:
            out[lvl] = {
                "value": _num(raw.get("value")),
                "q": raw.get("q") or q,
            }
        else:
            # old numeric or string numeric
            out[lvl] = {"value": _num(raw), "q": q}

    return out


def _normalize_thresholds_payload(payload):
    """
    Returns normalized payload (or None if payload isn't usable).
    Also upgrades old payloads into the correct structure.
    """
    if not isinstance(payload, dict):
        return None

    churn = payload.get("churn")
    disc = payload.get("discount")
    clv = payload.get("clv")

    if not isinstance(churn, dict) or not isinstance(disc, dict) or not isinstance(clv, dict):
        return None

    churn_norm = {
        "low": _num(churn.get("low")),
        "mid": _num(churn.get("mid")),
        "high": _num(churn.get("high")),
    }

    # require mid/high for churn buckets
    if churn_norm["mid"] is None or churn_norm["high"] is None:
        return None

    disc_norm = _normalize_quartile_group(disc)
    clv_norm = _normalize_quartile_group(clv)

    if disc_norm is None or clv_norm is None:
        return None

    # require mid/high for disc/clv
    if disc_norm["mid"]["value"] is None or disc_norm["high"]["value"] is None:
        return None
    if clv_norm["mid"]["value"] is None or clv_norm["high"]["value"] is None:
        return None

    return {"churn": churn_norm, "discount": disc_norm, "clv": clv_norm}


def _is_threshold_payload(x):
    """
    Strict validity check (after normalization rules).
    """
    normalized = _normalize_thresholds_payload(x)
    if not normalized:
        return False

    churn = normalized["churn"]
    disc = normalized["discount"]
    clv = normalized["clv"]

    # churn numeric required
    for k in ("low", "mid", "high"):
        if churn.get(k) is None:
            return False

    # discount/clv need {value,q}
    for grp in (disc, clv):
        for k in ("low", "mid", "high"):
            if not _is_obj_with_value(grp.get(k)):
                return False

    return True


def _connect_pred():
    return psycopg2.connect(
        dbname=DB_New_Pred["dbname"],
        user=DB_New_Pred["user"],
        password=DB_New_Pred["password"],
        host=DB_New_Pred["host"],
        port=DB_New_Pred["port"],
    )


# =========================
# Thresholds API
# =========================

CHURN_PROB_COL = "churn_probability"  # change if needed
DISCOUNT_COL = "applicable_discount_with_ncb"
CLV_COL = "clv"


@require_http_methods(["GET"])
def get_actual_thresholds(request):
    """
    Returns:
      - source=custom if cfg.thresholds is valid OR can be normalized to valid
      - else source=computed quartiles from DB
    """
    cfg = _get_global_cfg()

    # ✅ If user already applied custom thresholds, return them
    # BUT: first normalize old payloads if needed.
    if isinstance(cfg.thresholds, dict) and cfg.thresholds:
        normalized = _normalize_thresholds_payload(cfg.thresholds)
        if normalized and _is_threshold_payload(normalized):
            # If normalization changed structure, persist it (upgrades old payload)
            if normalized != cfg.thresholds:
                cfg.thresholds = normalized
                cfg.save(update_fields=["thresholds"])
            return JsonResponse({"ok": True, "source": "custom", "data": normalized})

    # Otherwise compute quartiles from DB
    churn_low = 0.50
    churn_mid = 0.65
    churn_high = 0.80

    discount_col = DISCOUNT_COL
    clv_col = CLV_COL

    sql = f"""
    WITH discount AS (
      SELECT
        percentile_cont(0.25) WITHIN GROUP (ORDER BY "{discount_col}") AS q1,
        percentile_cont(0.50) WITHIN GROUP (ORDER BY "{discount_col}") AS q2,
        percentile_cont(0.75) WITHIN GROUP (ORDER BY "{discount_col}") AS q3
      FROM "Prediction"."2025_prediction_final_data"
      WHERE "{discount_col}" IS NOT NULL
    ),
    clv AS (
      SELECT
        percentile_cont(0.25) WITHIN GROUP (ORDER BY "{clv_col}") AS q1,
        percentile_cont(0.50) WITHIN GROUP (ORDER BY "{clv_col}") AS q2,
        percentile_cont(0.75) WITHIN GROUP (ORDER BY "{clv_col}") AS q3
      FROM "Prediction"."2025_prediction_final_data"
      WHERE "{clv_col}" IS NOT NULL
    )
    SELECT
      discount.q1, discount.q2, discount.q3,
      clv.q1, clv.q2, clv.q3
    FROM discount, clv;
    """

    conn = None
    try:
        conn = _connect_pred()
        with conn.cursor() as cur:
            cur.execute(sql)
            row = cur.fetchone()

        if not row:
            return JsonResponse({"ok": False, "message": "No data found"}, status=404)

        discount_q1, discount_q2, discount_q3, clv_q1, clv_q2, clv_q3 = row

        computed = {
            "discount": {
                "low":  {"value": float(discount_q1) if discount_q1 is not None else None, "q": "Q25"},
                "mid":  {"value": float(discount_q2) if discount_q2 is not None else None, "q": "Q50"},
                "high": {"value": float(discount_q3) if discount_q3 is not None else None, "q": "Q75"},
            },
            "clv": {
                "low":  {"value": float(clv_q1) if clv_q1 is not None else None, "q": "Q25"},
                "mid":  {"value": float(clv_q2) if clv_q2 is not None else None, "q": "Q50"},
                "high": {"value": float(clv_q3) if clv_q3 is not None else None, "q": "Q75"},
            },
            "churn": {
                "low": churn_low,
                "mid": churn_mid,
                "high": churn_high,
            }
        }

        return JsonResponse({"ok": True, "source": "computed", "data": computed})

    except Exception as e:
        return JsonResponse({"ok": False, "message": str(e)}, status=500)
    finally:
        if conn:
            conn.close()


def _extract_cutoff(obj):
    # accepts: number OR {"value": number, "q": "..."}, returns float|None
    if isinstance(obj, dict):
        return _num(obj.get("value"))
    return _num(obj)

def _extract_q(obj, default_q):
    # accepts: {"value": x, "q": "Q84"} OR "Q84" OR None
    if isinstance(obj, dict):
        q = obj.get("q")
    else:
        q = obj

    q = str(q or "").strip().upper()
    if q.startswith("Q"):
        try:
            n = int(q[1:])
            if 1 <= n <= 99:
                return f"Q{n}"
        except Exception:
            pass

    return default_q


def _validate_monotonic(name, low, mid, high):
    if mid is None or high is None:
        raise ValueError(f"{name}: mid/high are required")
    if not (mid < high):
        raise ValueError(f"{name}: require mid < high")


@csrf_exempt
@require_http_methods(["POST"])
def apply_thresholds_to_final(request):
    """
    Saves thresholds in cfg.thresholds (normalized quartile structure)
    and updates churn_category / discount_category / clv_category in final table.
    """
    cfg = _get_global_cfg()

    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"ok": False, "message": "Invalid JSON"}, status=400)

    churn = body.get("churn") or {}
    discount = body.get("discount") or {}
    clv = body.get("clv") or {}

    churn_low = _num(churn.get("low"))
    churn_mid = _num(churn.get("mid"))
    churn_high = _num(churn.get("high"))

    disc_low = _extract_cutoff(discount.get("low"))
    disc_mid = _extract_cutoff(discount.get("mid"))
    disc_high = _extract_cutoff(discount.get("high"))

    clv_low = _extract_cutoff(clv.get("low"))
    clv_mid = _extract_cutoff(clv.get("mid"))
    clv_high = _extract_cutoff(clv.get("high"))

    disc_low_q  = _extract_q(discount.get("low"),  "Q25")
    disc_mid_q  = _extract_q(discount.get("mid"),  "Q50")
    disc_high_q = _extract_q(discount.get("high"), "Q75")

    clv_low_q  = _extract_q(clv.get("low"),  "Q25")
    clv_mid_q  = _extract_q(clv.get("mid"),  "Q50")
    clv_high_q = _extract_q(clv.get("high"), "Q75")

    try:
        _validate_monotonic("churn", churn_low, churn_mid, churn_high)
        _validate_monotonic("discount", disc_low, disc_mid, disc_high)
        _validate_monotonic("clv", clv_low, clv_mid, clv_high)
    except ValueError as e:
        return JsonResponse({"ok": False, "message": str(e)}, status=400)

    # ✅ Save thresholds as the new "actual" config (ALWAYS correct structure)
    cfg.thresholds = {
        "churn": {"low": churn_low, "mid": churn_mid, "high": churn_high},
        "discount": {
            "low":  {"value": disc_low,  "q": disc_low_q},
            "mid":  {"value": disc_mid,  "q": disc_mid_q},
            "high": {"value": disc_high, "q": disc_high_q},
        },
        "clv": {
            "low":  {"value": clv_low,  "q": clv_low_q},
            "mid":  {"value": clv_mid,  "q": clv_mid_q},
            "high": {"value": clv_high, "q": clv_high_q},
        },
    }
    cfg.save(update_fields=["thresholds"])

    sql_update = f"""
    UPDATE "Prediction"."2025_prediction_final_data"
    SET
      churn_category = CASE
        WHEN "{CHURN_PROB_COL}" > %(churn_high)s THEN 'High'
        WHEN "{CHURN_PROB_COL}" > %(churn_mid)s THEN 'Mid'
        ELSE 'Low'
      END,
      discount_category = CASE
        WHEN "{DISCOUNT_COL}" > %(disc_high)s THEN 'High'
        WHEN "{DISCOUNT_COL}" > %(disc_mid)s THEN 'Mid'
        ELSE 'Low'
      END,
      clv_category = CASE
        WHEN "{CLV_COL}" > %(clv_high)s THEN 'High'
        WHEN "{CLV_COL}" > %(clv_mid)s THEN 'Mid'
        ELSE 'Low'
      END;
    """

    params = {
        "churn_mid": churn_mid,
        "churn_high": churn_high,
        "disc_mid": disc_mid,
        "disc_high": disc_high,
        "clv_mid": clv_mid,
        "clv_high": clv_high,
    }

    conn = None
    try:
        conn = _connect_pred()
        with conn:
            with conn.cursor() as cur:
                cur.execute(sql_update, params)

        return JsonResponse({"ok": True, "message": "Thresholds applied and categories updated"})

    except Exception as e:
        return JsonResponse({"ok": False, "message": str(e)}, status=500)
    finally:
        if conn:
            conn.close()


@csrf_exempt
@require_http_methods(["POST"])
def reset_thresholds_to_default(request):
    """
    Clears saved thresholds, computes quartiles from DB, saves them,
    and updates category columns.
    """
    cfg = _get_global_cfg()
    cfg.thresholds = {}
    cfg.save(update_fields=["thresholds"])

    churn_low = 0.50
    churn_mid = 0.65
    churn_high = 0.80

    sql_q = f"""
    WITH discount AS (
      SELECT
        percentile_cont(0.25) WITHIN GROUP (ORDER BY "{DISCOUNT_COL}") AS q1,
        percentile_cont(0.50) WITHIN GROUP (ORDER BY "{DISCOUNT_COL}") AS q2,
        percentile_cont(0.75) WITHIN GROUP (ORDER BY "{DISCOUNT_COL}") AS q3
      FROM "Prediction"."2025_prediction_final_data"
      WHERE "{DISCOUNT_COL}" IS NOT NULL
    ),
    clv AS (
      SELECT
        percentile_cont(0.25) WITHIN GROUP (ORDER BY "{CLV_COL}") AS q1,
        percentile_cont(0.50) WITHIN GROUP (ORDER BY "{CLV_COL}") AS q2,
        percentile_cont(0.75) WITHIN GROUP (ORDER BY "{CLV_COL}") AS q3
      FROM "Prediction"."2025_prediction_final_data"
      WHERE "{CLV_COL}" IS NOT NULL
    )
    SELECT discount.q1, discount.q2, discount.q3, clv.q1, clv.q2, clv.q3
    FROM discount, clv;
    """

    conn = None
    try:
        conn = _connect_pred()
        with conn.cursor() as cur:
            cur.execute(sql_q)
            row = cur.fetchone()

        if not row:
            return JsonResponse({"ok": False, "message": "No data found"}, status=404)

        d_q1, d_q2, d_q3, c_q1, c_q2, c_q3 = row

        payload = {
            "churn": {"low": churn_low, "mid": churn_mid, "high": churn_high},
            "discount": {
                "low": {"value": float(d_q1) if d_q1 is not None else None, "q": "Q25"},
                "mid": {"value": float(d_q2) if d_q2 is not None else None, "q": "Q50"},
                "high": {"value": float(d_q3) if d_q3 is not None else None, "q": "Q75"},
            },
            "clv": {
                "low": {"value": float(c_q1) if c_q1 is not None else None, "q": "Q25"},
                "mid": {"value": float(c_q2) if c_q2 is not None else None, "q": "Q50"},
                "high": {"value": float(c_q3) if c_q3 is not None else None, "q": "Q75"},
            },
        }

        # save payload
        cfg.thresholds = payload
        cfg.save(update_fields=["thresholds"])

        # update categories
        sql_update = f"""
        UPDATE "Prediction"."2025_prediction_final_data"
        SET
          churn_category = CASE
            WHEN "{CHURN_PROB_COL}" > %(churn_high)s THEN 'High'
            WHEN "{CHURN_PROB_COL}" > %(churn_mid)s THEN 'Mid'
            ELSE 'Low'
          END,
          discount_category = CASE
            WHEN "{DISCOUNT_COL}" > %(disc_high)s THEN 'High'
            WHEN "{DISCOUNT_COL}" > %(disc_mid)s THEN 'Mid'
            ELSE 'Low'
          END,
          clv_category = CASE
            WHEN "{CLV_COL}" > %(clv_high)s THEN 'High'
            WHEN "{CLV_COL}" > %(clv_mid)s THEN 'Mid'
            ELSE 'Low'
          END;
        """

        params = {
            "churn_mid": churn_mid,
            "churn_high": churn_high,
            "disc_mid": float(d_q2) if d_q2 is not None else None,
            "disc_high": float(d_q3) if d_q3 is not None else None,
            "clv_mid": float(c_q2) if c_q2 is not None else None,
            "clv_high": float(c_q3) if c_q3 is not None else None,
        }

        with conn:
            with conn.cursor() as cur:
                cur.execute(sql_update, params)

        return JsonResponse({"ok": True, "data": payload})

    except Exception as e:
        return JsonResponse({"ok": False, "message": str(e)}, status=500)
    finally:
        if conn:
            conn.close()

import json
import psycopg2
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

# reuse your existing constants
DISCOUNT_COL = "applicable_discount_with_ncb"
CLV_COL = "clv"

def _pct(x):
    try:
        v = float(x)
        if v < 1 or v > 99:
            return None
        return v / 100.0
    except Exception:
        return None

@csrf_exempt
@require_http_methods(["POST"])
def recompute_thresholds_from_percentiles(request):
    """
    Given percentiles for clv/discount (1..99), returns recomputed numeric cutoffs.
    Does NOT write to cfg, just returns computed values.
    """
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"ok": False, "message": "Invalid JSON"}, status=400)

    d = body.get("discount") or {}
    c = body.get("clv") or {}

    d_low = _pct(d.get("low"))
    d_mid = _pct(d.get("mid"))
    d_high = _pct(d.get("high"))

    c_low = _pct(c.get("low"))
    c_mid = _pct(c.get("mid"))
    c_high = _pct(c.get("high"))

    if None in (d_low, d_mid, d_high, c_low, c_mid, c_high):
        return JsonResponse({"ok": False, "message": "Percentiles must be 1..99"}, status=400)

    # optional monotonic check (strictly increasing)
    if not (d_low < d_mid < d_high):
        return JsonResponse({"ok": False, "message": "Discount must satisfy low < mid < high"}, status=400)
    if not (c_low < c_mid < c_high):
        return JsonResponse({"ok": False, "message": "CLV must satisfy low < mid < high"}, status=400)

    sql = f"""
    WITH discount AS (
      SELECT
        percentile_cont(%(d_low)s)  WITHIN GROUP (ORDER BY "{DISCOUNT_COL}") AS low,
        percentile_cont(%(d_mid)s)  WITHIN GROUP (ORDER BY "{DISCOUNT_COL}") AS mid,
        percentile_cont(%(d_high)s) WITHIN GROUP (ORDER BY "{DISCOUNT_COL}") AS high
      FROM "Prediction"."2025_prediction_final_data"
      WHERE "{DISCOUNT_COL}" IS NOT NULL
    ),
    clv AS (
      SELECT
        percentile_cont(%(c_low)s)  WITHIN GROUP (ORDER BY "{CLV_COL}") AS low,
        percentile_cont(%(c_mid)s)  WITHIN GROUP (ORDER BY "{CLV_COL}") AS mid,
        percentile_cont(%(c_high)s) WITHIN GROUP (ORDER BY "{CLV_COL}") AS high
      FROM "Prediction"."2025_prediction_final_data"
      WHERE "{CLV_COL}" IS NOT NULL
    )
    SELECT
      discount.low, discount.mid, discount.high,
      clv.low, clv.mid, clv.high
    FROM discount, clv;
    """

    params = {
        "d_low": d_low, "d_mid": d_mid, "d_high": d_high,
        "c_low": c_low, "c_mid": c_mid, "c_high": c_high,
    }

    conn = None
    try:
        conn = _connect_pred()  # use your existing helper
        with conn.cursor() as cur:
            cur.execute(sql, params)
            row = cur.fetchone()

        if not row:
            return JsonResponse({"ok": False, "message": "No data found"}, status=404)

        d1, d2, d3, c1, c2, c3 = row

        out = {
            "discount": {
                "low":  float(d1) if d1 is not None else None,
                "mid":  float(d2) if d2 is not None else None,
                "high": float(d3) if d3 is not None else None,
            },
            "clv": {
                "low":  float(c1) if c1 is not None else None,
                "mid":  float(c2) if c2 is not None else None,
                "high": float(c3) if c3 is not None else None,
            }
        }

        return JsonResponse({"ok": True, "data": out})

    except Exception as e:
        return JsonResponse({"ok": False, "message": str(e)}, status=500)
    finally:
        if conn:
            conn.close()



#############################################EMAIL CREDENTIALS##########################################


import os, json
from urllib.parse import urlparse, parse_qs

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from google_auth_oauthlib.flow import Flow

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

# Same as your python script
CRED = os.getenv("GMAIL_CREDENTIALS_FILE", "/var/www/prowesstics/secure/gmail/credentials.json")
TOKEN_DIR = os.getenv("GMAIL_TOKEN_DIR", "/var/www/prowesstics/secure/gmail/token.json")

# IMPORTANT: must match your google oauth client redirect uri
REDIRECT_URI = os.getenv("GMAIL_REDIRECT_URI", "http://127.0.0.1:8081/")

# def _normalize_dir(p: str) -> str:
#     p = (p or "").strip()
#     # convert any Windows-style backslashes to linux slashes
#     p = p.replace("\\", "/")
#     # collapse duplicate slashes (optional)
#     while "//" in p:
#         p = p.replace("//", "/")
#     return p.rstrip("/")  # remove trailing slash

def _token_path(config_id: str) -> str:
    # sanitize config id
    safe = "".join(ch for ch in (config_id or "default") if ch.isalnum() or ch in ("-", "_")).strip() or "default"

    # Use TOK as a "base file path", take its folder
    base_dir = os.path.dirname(TOKEN_DIR) or "."
    os.makedirs(base_dir, exist_ok=True)

    # store per config
    return os.path.join(base_dir, f"token_{safe}.json")


@csrf_exempt
@require_POST
def gmail_auth_url(request):
    """
    Returns the auth_url (same as your python print(auth_url)).
    Body: { "config_id": "bulk" }
    """
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
        config_id = body.get("config_id") or "default"

        if not os.path.exists(CRED):
            return JsonResponse({"ok": False, "message": f"credentials.json not found at {CRED}"}, status=400)

        flow = Flow.from_client_secrets_file(CRED, scopes=SCOPES, redirect_uri=REDIRECT_URI)
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
        )

        return JsonResponse({"ok": True, "auth_url": auth_url, "config_id": config_id})
    except Exception as e:
        return JsonResponse({"ok": False, "message": str(e)}, status=500)


@csrf_exempt
@require_POST
def gmail_exchange_and_save_token(request):
    """
    This is your python `redirected = input(...)` part.
    User pastes redirected URL here. We extract `code` and save token json.
    Body: { "config_id": "bulk", "redirected_url": "https://..." }
    """
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
        config_id = body.get("config_id") or "default"
        redirected_url = (body.get("redirected_url") or "").strip()

        if not redirected_url:
            return JsonResponse({"ok": False, "message": "redirected_url is required"}, status=400)

        code = parse_qs(urlparse(redirected_url).query).get("code", [None])[0]
        if not code:
            return JsonResponse({"ok": False, "message": "No code found in redirected_url"}, status=400)

        if not os.path.exists(CRED):
            return JsonResponse({"ok": False, "message": f"credentials.json not found at {CRED}"}, status=400)

        flow = Flow.from_client_secrets_file(CRED, scopes=SCOPES, redirect_uri=REDIRECT_URI)
        flow.fetch_token(code=code)
        creds = flow.credentials

        tok_path = _token_path(config_id)
        with open(tok_path, "w") as f:
            f.write(creds.to_json())

        return JsonResponse({"ok": True, "message": "Token saved ✅", "token_path": tok_path})
    except Exception as e:
        return JsonResponse({"ok": False, "message": str(e)}, status=500)


