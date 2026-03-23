from django.shortcuts import render

# Create your views here.
# at top
import logging, traceback
logger = logging.getLogger(__name__)

import json
import pandas as pd
from django.http import JsonResponse, StreamingHttpResponse, HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from sqlalchemy import text as _sqltext

from .utils import (
    ensure_bulk_tables, load_bulk_source, load_model_assets, get_parameter_ranges,
    auto_suggest_for_row, save_bulk_selected_change, upsert_bulk_draft,
    fetch_latest_selected, draft_email, split_subj_body, to_html,
    fetch_review_df, list_segments, send_gmail, mark_sent, mark_failed,cloud_engine, save_bulk_selected_change, upsert_bulk_draft, fetch_latest_selected,
)
from .constants import DEFAULT_TO_EMAIL, BULK_DRAFTS_FQN, BULK_CHANGES_FQN

# from .utils import cloud_engine, save_bulk_selected_change, upsert_bulk_draft, fetch_latest_selected


def segments(_request):
    try:
        return JsonResponse({"segments": list_segments()})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def _sse(event, data=None):
    return f"event: {event}\ndata: {json.dumps(data or {})}\n\n".encode()

@csrf_exempt
def process_segment(request):
    if request.method != "POST":
        return HttpResponseBadRequest("POST only")

    try:
        body = json.loads(request.body.decode())
        segment = body.get("segment", "").strip()
        batch_id = body.get("batch_id", "").strip()
        if not segment:
            return HttpResponseBadRequest("Missing segment")

        # create tables up front so preflight can use them if needed
        ensure_bulk_tables()

        def stream():
            try:
                # ---------- PRE-FLIGHT ----------
                # 1) segment must exist
                segs = list_segments()
                if segment not in segs:
                    msg = f"Unknown segment '{segment}'. Available: {segs}"
                    logger.error(msg)
                    yield _sse("error", {"message": msg})
                    return

                # 2) model artifacts must exist
                try:
                    model, label_encoders, features = load_model_assets()
                except Exception as e:
                    logger.exception("Model load failed")
                    yield _sse("error", {"message": f"Model load failed: {e}"})
                    return

                # 3) source must be readable and have required columns
                try:
                    src = load_bulk_source()
                except Exception as e:
                    logger.exception("Loading source table failed")
                    yield _sse("error", {"message": f"Loading source table failed: {e}"})
                    return

                required_cols = {"Customer Segment", "policy no", "Mail ID"}
                missing = [c for c in required_cols if c not in src.columns]
                if missing:
                    msg = f"Missing columns in source: {missing}"
                    logger.error(msg)
                    yield _sse("error", {"message": msg})
                    return

                subset = src[src["Customer Segment"].astype(str).str.strip() == segment].copy()
                n = len(subset)
                if n == 0:
                    msg = f"No rows for segment '{segment}'"
                    logger.warning(msg)
                    yield _sse("error", {"message": msg})
                    return

                param_ranges = get_parameter_ranges()

                # ---------- PHASE 1 ----------
                yield _sse("phase", {"phase": 1})
                auto_rows = []
                from .utils import recompute_totals_from_od_tp

                for i, (_, row) in enumerate(subset.iterrows(), start=1):
                    try:
                        fr = auto_suggest_for_row(row, model, label_encoders, features, param_ranges)
                        auto_rows.append((row, fr))
                    except Exception:
                        logger.exception("Auto-suggest failed on row policy=%s", row.get("policy no"))
                        auto_rows.append((row, None))
                    yield _sse("progress", {"phase": 1, "i": i, "n": n})

                # ---------- PHASE 2 ----------
                yield _sse("phase", {"phase": 2})
                saved_ctx = []
                for i, (base_row, final_row) in enumerate(auto_rows, start=1):
                    try:
                        if final_row is None:
                            final_row = base_row.to_dict()
                            recompute_totals_from_od_tp(final_row, 0.18)
                        ctx = save_bulk_selected_change(base_row.to_dict(), dict(final_row), segment, batch_id)
                        saved_ctx.append(ctx)
                    except Exception:
                        logger.exception("Save selected change failed for policy=%s", base_row.get("policy no"))
                    yield _sse("progress", {"phase": 2, "i": i, "n": len(auto_rows)})

                # ---------- PHASE 3 ----------
                yield _sse("phase", {"phase": 3})
                for i, ctx in enumerate(saved_ctx, start=1):
                    try:
                        policy = ctx["policy_no"]
                        to_email_series = subset.loc[
                            subset["policy no"].astype(str) == str(policy), "Mail ID"
                        ]
                        to_email = (to_email_series.iloc[0] if not to_email_series.empty else DEFAULT_TO_EMAIL) or DEFAULT_TO_EMAIL

                        latest_row = fetch_latest_selected(policy)
                        row_for_draft = latest_row if latest_row is not None else dict(ctx)

                        draft = draft_email(row_for_draft)
                        subj, body_text = split_subj_body(draft)
                        body_html = to_html(body_text)
                        upsert_bulk_draft({
                            "policy_no": policy,
                            "policy_no_norm": ctx["policy_no_norm"],
                            "to_email": to_email,
                            "subject": subj,
                            "body_text": body_text,
                            "body_html": body_html,
                            "segment": segment,
                            "batch_id": batch_id,
                        })
                    except Exception:
                        logger.exception("Draft creation failed for policy=%s", ctx.get("policy_no"))
                        upsert_bulk_draft({
                            "policy_no": ctx.get("policy_no",""),
                            "policy_no_norm": ctx.get("policy_no_norm",""),
                            "to_email": DEFAULT_TO_EMAIL,
                            "subject": f"[DRAFT ERROR] {ctx.get('policy_no','')}",
                            "body_text": traceback.format_exc(),
                            "body_html": to_html(traceback.format_exc()),
                            "segment": segment,
                            "batch_id": batch_id,
                        })
                    yield _sse("progress", {"phase": 3, "i": i, "n": len(saved_ctx)})

                yield _sse("done", {})

            except Exception as e:
                logger.exception("Pipeline crashed before/while streaming")
                yield _sse("error", {"message": f"Pipeline crashed: {e}"})

        # IMPORTANT: return the streaming response
        resp = StreamingHttpResponse(stream(), content_type="text/event-stream")
# Essential SSE headers
        resp["Cache-Control"] = "no-cache, no-transform"
        resp["X-Accel-Buffering"] = "no"        # instruct nginx to not buffer (important)
        # resp["Connection"] = "keep-alive"
# some proxies require explicit Transfer-Encoding chunked, but typically left to WSGI/gunicorn
# resp["Transfer-Encoding"] = "chunked"

# If you have Django GZipMiddleware enabled, ensure the path is excluded or remove encoding:
# resp["Content-Encoding"] = "identity"   # optional; some setups ignore this

        return resp


    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)




def _parse_status_list(request):
    raw = request.GET.getlist("status")  # may be ["drafted,sent,failed"] or ["drafted","sent","failed"]
    out = []
    for item in raw:
        if not item:
            continue
        if "," in item:
            out.extend([x.strip() for x in item.split(",") if x.strip()])
        else:
            out.append(item.strip())
    # de-dup and validate to the three allowed values
    allowed = {"drafted", "sent", "failed"}
    out = [s for s in dict.fromkeys(out) if s in allowed]
    return out

def review(request):
    try:
        segment = request.GET.get("segment", "").strip()
        if not segment:
            return HttpResponseBadRequest("segment is required")
        status = _parse_status_list(request)  # keep your parser if you added it
        q = request.GET.get("q", None)

        df = fetch_review_df(segment, status or None, q)
        if df.empty:
            rows = []
        else:
            # <<< important: replace NaN/NaT with None to make valid JSON
            df = df.astype(object).where(pd.notnull(df), None)
            rows = df.to_dict(orient="records")

        return JsonResponse({"rows": rows})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# Replace existing review_export with this implementation
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET", "POST"])
def review_export(request):
    """
    Export review rows as CSV.

    GET params:
      - segment (required)
      - status (optional, same parsing rules as review)
      - q (optional)
      - policy_no_norms (optional) : comma-separated or repeated (e.g. ?policy_no_norms=A&policy_no_norms=B)
    POST JSON:
      {
        "segment": "...",
        "status": ["drafted","sent"],
        "q": "...",
        "policy_no_norms": ["PN1", "PN2", ...]
      }
    """
    try:
        # parse input (support GET and POST)
        if request.method == "POST":
            try:
                body = json.loads(request.body.decode() or "{}")
            except Exception:
                return HttpResponseBadRequest("Invalid JSON body")
            segment = str(body.get("segment", "")).strip()
            status_raw = body.get("status", None)
            q = body.get("q", None)
            raw_policies = body.get("policy_no_norms") or body.get("policies") or []
        else:
            # GET
            segment = request.GET.get("segment", "").strip()
            status_raw = request.GET.getlist("status") or None
            q = request.GET.get("q", None)
            # collect policy_no_norms param(s). allow comma separated single param or repeated params
            raw_policies = []
            if "policy_no_norms" in request.GET:
                raw_policies += [p for p in request.GET.get("policy_no_norms", "").split(",") if p.strip()]
            # also accept repeated param: ?policy=...&policy=...
            raw_policies += request.GET.getlist("policy_no_norms") or []
            raw_policies += request.GET.getlist("policies") or []

        if not segment:
            return HttpResponseBadRequest("segment is required")

        # normalize the status filter using your helper (reuse existing parser)
        # We accept status_raw either as list or comma-separated string
        # Build a small helper identical to _parse_status_list but for this local usage
        def _normalize_status_input(raw):
            if raw is None:
                return None
            if isinstance(raw, str):
                arr = [x.strip() for x in raw.split(",") if x.strip()]
            elif isinstance(raw, (list, tuple)):
                arr = []
                for it in raw:
                    if not it: continue
                    if isinstance(it, str) and "," in it:
                        arr.extend([x.strip() for x in it.split(",") if x.strip()])
                    else:
                        arr.append(str(it).strip())
            else:
                return None
            allowed = {"drafted", "sent", "failed"}
            # dedupe preserving order
            return [s for s in dict.fromkeys(arr) if s in allowed]

        status = _normalize_status_input(status_raw)

        # Normalize policy list using your _norm_policy helper if possible
        policy_norms = []
        if raw_policies:
            for p in raw_policies:
                if not p:
                    continue
                pn = _normalize_field(p).upper()  # quick normalization (compatible w/_norm_policy)
                # try to use your exact _norm_policy if available
                try:
                    pn = _norm_policy(p)
                except Exception:
                    pn = pn
                if pn:
                    policy_norms.append(pn)
            # dedupe while preserving order
            policy_norms = list(dict.fromkeys(policy_norms))

        # Fetch full review df (this applies segment/status/q logic and formatting)
        df = fetch_review_df(segment, status or None, q)

        # If policy_norms provided, filter server-side
        if policy_norms and not df.empty:
            # fetch_review_df returns 'policy_no_norm' column
            df = df[df["policy_no_norm"].astype(str).apply(lambda x: x.strip().upper()).isin(policy_norms)]

        # If df empty, return an empty CSV with correct headers (same as earlier)
        if df.empty:
            df = pd.DataFrame(columns=[
                "policy_no","policy_no_norm","to_email","status","subject","body_text","created_at","sent_at",
                "Δ Discount (pp)","Δ OD (₹)","Δ TP (₹)","Δ Total (₹)",
                "old_total_premium","new_total_premium","gmail_message_id"
            ])

        csv = df.to_csv(index=False).encode("utf-8-sig")

        # Build filename: include selected count when applicable
        if policy_norms and len(policy_norms) > 0:
            name = f'bulk_selected_{segment}_{len(policy_norms)}.csv'
        else:
            name = f'bulk_drafts_{segment}.csv'

        resp = HttpResponse(csv, content_type="text/csv; charset=utf-8")
        resp["Content-Disposition"] = f'attachment; filename="{name}"'
        return resp

    except Exception as e:
        logger.exception("review_export failed")
        return JsonResponse({"error": str(e)}, status=500)



# views.py
import json
import logging
import time

import pandas as pd
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)


def _normalize_field(v, strip=True):
    """None/NaN-safe string coercion."""
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return ""
    s = str(v)
    return s.strip() if strip else s


def _is_send_success(res):
    """
    Normalize different possible return shapes from send_gmail().
    Accepted as success if:
      - string starting with 'Sent', 'OK', or contains 'message'/'id'
      - dict with status in {sent, ok, success} OR has id/message_id
      - any other truthy value (last resort, can tighten if needed)
    Returns: (ok: bool, message_id: str)
    """
    msg_id = ""

    # String result
    if isinstance(res, str):
        s = res.strip()
        s_low = s.lower()
        ok = s_low.startswith("sent") or s_low.startswith("ok") \
             or ("message" in s_low and "id" in s_low)
        # Try to parse "something: <id>" shape
        if ":" in s:
            msg_id = s.split(":", 1)[1].strip()
        return ok, msg_id

    # Dict result
    if isinstance(res, dict):
        status = str(res.get("status", "")).lower()
        ok = status in {"sent", "ok", "success"} or bool(res.get("id") or res.get("message_id"))
        msg_id = res.get("id") or res.get("message_id") or ""
        return ok, _normalize_field(msg_id)

    # Tuple or object — if it has 'id' attribute or looks truthy, consider success
    if hasattr(res, "get"):
        try:
            # For objects behaving like dicts
            status = str(res.get("status", "")).lower()
            msg_id = res.get("id") or res.get("message_id") or ""
            ok = status in {"sent", "ok", "success"} or bool(msg_id)
            return ok, _normalize_field(msg_id)
        except Exception:
            pass

    # Fallback: treat any truthy value as success
    return bool(res), ""


@csrf_exempt
def send_all(request):
    if request.method != "POST":
        return HttpResponseBadRequest("POST only")

    try:
        body = json.loads(request.body.decode() or "{}")
    except Exception as e:
        return HttpResponseBadRequest(f"Invalid JSON: {e}")

    segment = _normalize_field(body.get("segment"))
    if not segment:
        return HttpResponseBadRequest("segment is required")

    # Optional controls
    limit = int(body.get("limit") or 0)         # 0 = no limit
    sleep_ms = int(body.get("sleep_ms") or 0)   # polite pacing
    dry_run = bool(body.get("dry_run") or False)

    try:
        from sqlalchemy import text as _sqltext
        from .utils import cloud_engine, send_gmail, mark_sent, mark_failed
        from .constants import BULK_DRAFTS_FQN

        eng = cloud_engine()

        # Pull drafted rows for this segment
        query = f"""
            SELECT policy_no, policy_no_norm, to_email, subject, body_text
            FROM {BULK_DRAFTS_FQN}
            WHERE segment = :s AND status = 'drafted'
        """
        if limit and limit > 0:
            query += " LIMIT :lim"

        params = {"s": segment}
        if limit and limit > 0:
            params["lim"] = limit

        df = pd.read_sql(_sqltext(query), eng, params=params)

        attempted = int(len(df))
        sent = 0
        failed = 0
        failures = []   # list[(policy_no_norm, reason)]

        if attempted == 0:
            return JsonResponse({
                "segment": segment,
                "attempted": attempted,
                "sent": sent,
                "failed": failed,
                "failures": failures
            })

        for _, r in df.iterrows():
            pn = _normalize_field(r.get("policy_no_norm")) or _normalize_field(r.get("policy_no"))
            to_email = _normalize_field(r.get("to_email"))
            subject  = _normalize_field(r.get("subject"), strip=False)
            body     = _normalize_field(r.get("body_text"), strip=False)

            # Basic validations
            if not pn:
                reason = "Missing policy_no_norm"
                try:
                    mark_failed("", reason)
                except Exception as e:
                    logger.warning("mark_failed error (pn empty): %s", e)
                failures.append((pn, reason)); failed += 1
                continue

            if not to_email or "@" not in to_email:
                reason = f"Invalid to_email '{to_email}'"
                try:
                    mark_failed(pn, reason)
                except Exception as e:
                    logger.warning("mark_failed error: %s", e)
                failures.append((pn, reason)); failed += 1
                continue

            if not subject:
                reason = "Empty subject"
                try:
                    mark_failed(pn, reason)
                except Exception as e:
                    logger.warning("mark_failed error: %s", e)
                failures.append((pn, reason)); failed += 1
                continue

            if not body:
                reason = "Empty body_text"
                try:
                    mark_failed(pn, reason)
                except Exception as e:
                    logger.warning("mark_failed error: %s", e)
                failures.append((pn, reason)); failed += 1
                continue

            # Attempt to send
            try:
                if dry_run:
                    ok, msg_id = True, "dry-run"
                else:
                    res = send_gmail(to_email, subject, body)
                    ok, msg_id = _is_send_success(res)
                    if not ok:
                        logger.warning("Unexpected send_gmail response for %s: %r", pn, res)

                if ok:
                    try:
                        mark_sent(pn, msg_id)
                    except Exception as e:
                        logger.error("mark_sent error for %s: %s", pn, e)
                    sent += 1
                else:
                    reason = "Unexpected send_gmail response"
                    try:
                        mark_failed(pn, reason)
                    except Exception as e:
                        logger.error("mark_failed error for %s: %s", pn, e)
                    failures.append((pn, reason)); failed += 1

            except Exception as e:
                reason = f"{type(e).__name__}: {e}"
                try:
                    mark_failed(pn, reason)
                except Exception as e2:
                    logger.error("mark_failed error for %s: %s (original err: %s)", pn, e2, reason)
                failures.append((pn, reason)); failed += 1

            if sleep_ms > 0:
                time.sleep(sleep_ms / 1000.0)

        return JsonResponse({
            "segment": segment,
            "attempted": int(attempted),
            "sent": int(sent),
            "failed": int(failed),
            "failures": failures[:200],  # cap payload
        })

    except Exception as e:
        logger.exception("send_all fatal error")
        return JsonResponse({"error": str(e)}, status=500)


    

# bulk_email/views_oauth.py (or append to your existing views.py)
import os, json, secrets, base64, requests
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
from urllib.parse import urlencode
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials as _GCreds
from google.auth.transport.requests import Request as _GRequest

# Pull paths from env
GMAIL_CREDENTIALS_FILE = os.getenv("GMAIL_CREDENTIALS_FILE", "gmail/credentials.json")
GMAIL_TOKEN_FILE       = os.getenv("GMAIL_TOKEN_FILE", "gmail/token.json")
GMAIL_REDIRECT_URI     = os.getenv("GMAIL_REDIRECT_URI")   # MUST match Google console
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
REDIRECT = os.environ["GMAIL_REDIRECT_URI"]

CACHE_PREFIX = "gmail_oauth_state:"
CACHE_TTL = 10 * 60  # 10 minutes

def _flow_for_redirect(_req):
    return Flow.from_client_secrets_file(
        GMAIL_CREDENTIALS_FILE,
        scopes=["https://www.googleapis.com/auth/gmail.send"],
        redirect_uri=REDIRECT,
    )

def _token_status():
    """Return (status, detail) for current token.json."""
    if not os.path.exists(GMAIL_TOKEN_FILE):
        return "absent", "token file not found"
    try:
        creds = _GCreds.from_authorized_user_file(GMAIL_TOKEN_FILE, SCOPES)
        if creds.expired and creds.refresh_token:
            # Try refresh in-memory (no write)
            try:
                creds.refresh(_GRequest())
                return "valid", "refreshed in-memory"
            except Exception as e:
                return "invalid", f"refresh failed: {e}"
        return "valid", "token present"
    except Exception as e:
        return "invalid", f"load failed: {e}"

# bulk_email/views_oauth.py
from django.views.decorators.csrf import csrf_exempt

import json
from urllib.parse import urlencode
from django.urls import reverse

def _load_client_info():
    with open(GMAIL_CREDENTIALS_FILE, "r", encoding="utf-8") as f:
        c = json.load(f)
    # support both "web" and "installed" secrets
    data = c.get("web") or c.get("installed") or {}
    return data.get("client_id"), data.get("client_secret")

@csrf_exempt
def gmail_auth_url(request):
    state = secrets.token_urlsafe(24)
    cache.set(CACHE_PREFIX + state, {"ok": True}, CACHE_TTL)
    params = {
        "response_type": "code",
        "client_id": json.load(open(GMAIL_CREDENTIALS_FILE))["web"]["client_id"],
        "redirect_uri": REDIRECT,
        "scope": "https://www.googleapis.com/auth/gmail.send",
        "state": state,
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "consent",
    }
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return JsonResponse({"auth_url": auth_url, "state": state, "redirect_uri": REDIRECT})




def gmail_oauth_callback(request):
    """
    GET /bulk-email/gmail/callback?state=...&code=...
    Google redirects here. We exchange code -> tokens and write token.json.
    """
    try:
        state = request.GET.get("state")
        code  = request.GET.get("code")
        if not state or not code:
            return HttpResponseBadRequest("Missing state or code")

        # Validate state (helps prevent CSRF)
        if not cache.get(CACHE_PREFIX + state):
            return HttpResponseBadRequest("Unknown/expired state")

        flow = _flow_for_redirect(request)
        flow.fetch_token(code=code)
        creds = flow.credentials

        os.makedirs(os.path.dirname(GMAIL_TOKEN_FILE) or ".", exist_ok=True)
        with open(GMAIL_TOKEN_FILE, "w", encoding="utf-8") as f:
            f.write(creds.to_json())

        # Invalidate one-time state
        cache.delete(CACHE_PREFIX + state)

        return HttpResponse("✅ Gmail authorization successful. token.json saved.")
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def gmail_status(request):
    status, detail = _token_status()
    return JsonResponse({"status": status, "detail": detail, "token_path": GMAIL_TOKEN_FILE})

@csrf_exempt
def gmail_revoke(_request):
    """
    POST /bulk-email/gmail/revoke
    Revokes the current refresh token (if any) and deletes token.json.
    """
    try:
        if not os.path.exists(GMAIL_TOKEN_FILE):
            return JsonResponse({"ok": True, "message": "No token file present"})
        creds = _GCreds.from_authorized_user_file(GMAIL_TOKEN_FILE, SCOPES)
        token = getattr(creds, "token", None) or getattr(creds, "refresh_token", None)
        if token:
            requests.post(
                "https://oauth2.googleapis.com/revoke",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data=urlencode({"token": token}),
                timeout=10,
            )
        try:
            os.remove(GMAIL_TOKEN_FILE)
        except Exception:
            pass
        return JsonResponse({"ok": True, "message": "Token revoked and file removed"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    

@csrf_exempt
def send_selected(request):
    if request.method != "POST":
        return HttpResponseBadRequest("POST only")

    try:
        body = json.loads(request.body.decode() or "{}")
    except Exception as e:
        return HttpResponseBadRequest(f"Invalid JSON: {e}")

    segment = _normalize_field(body.get("segment"))
    if not segment:
        return HttpResponseBadRequest("segment is required")

    raw_policies = body.get("policies") or body.get("policy_no_norms") or body.get("policy_nos") or []
    if not isinstance(raw_policies, list) or not raw_policies:
        return HttpResponseBadRequest("policies (list) is required")

    # normalize → prefer policy_no_norm semantics
    # If users passed raw policy numbers, normalize them the same way server does
    from .utils import cloud_engine, send_gmail, mark_sent, mark_failed, _norm_policy
    from sqlalchemy import text as _sqltext

    policy_norms = []
    for p in raw_policies:
        s = _normalize_field(p)
        if not s:
            continue
        policy_norms.append(_norm_policy(s))

    # de-dup
    policy_norms = list(dict.fromkeys(policy_norms))
    if not policy_norms:
        return HttpResponseBadRequest("No valid policies after normalization")

    try:
        eng = cloud_engine()

        # Only drafted in this segment, and only for selected policies
        query = f"""
            SELECT policy_no, policy_no_norm, to_email, subject, body_text
            FROM {BULK_DRAFTS_FQN}
            WHERE segment = :s
              AND status = 'drafted'
              AND policy_no_norm = ANY(:arr)
        """
        params = {"s": segment, "arr": policy_norms}
        df = pd.read_sql(_sqltext(query), eng, params=params)

        attempted = int(len(df))
        sent = 0
        failed = 0
        failures = []

        if attempted == 0:
            return JsonResponse({
                "segment": segment,
                "attempted": attempted,
                "sent": sent,
                "failed": failed,
                "failures": failures
            })

        for _, r in df.iterrows():
            pn = _normalize_field(r.get("policy_no_norm")) or _normalize_field(r.get("policy_no"))
            to_email = _normalize_field(r.get("to_email"))
            subject  = _normalize_field(r.get("subject"), strip=False)
            body     = _normalize_field(r.get("body_text"), strip=False)

            if not pn:
                reason = "Missing policy_no_norm"
                try: mark_failed("", reason)
                except Exception: pass
                failures.append((pn, reason)); failed += 1
                continue
            if not to_email or "@" not in to_email:
                reason = f"Invalid to_email '{to_email}'"
                try: mark_failed(pn, reason)
                except Exception: pass
                failures.append((pn, reason)); failed += 1
                continue
            if not subject:
                reason = "Empty subject"
                try: mark_failed(pn, reason)
                except Exception: pass
                failures.append((pn, reason)); failed += 1
                continue
            if not body:
                reason = "Empty body_text"
                try: mark_failed(pn, reason)
                except Exception: pass
                failures.append((pn, reason)); failed += 1
                continue

            try:
                res = send_gmail(to_email, subject, body)
                ok, msg_id = _is_send_success(res)
                if ok:
                    try: mark_sent(pn, msg_id)
                    except Exception as e: logger.error("mark_sent error for %s: %s", pn, e)
                    sent += 1
                else:
                    reason = "Unexpected send_gmail response"
                    try: mark_failed(pn, reason)
                    except Exception as e: logger.error("mark_failed error for %s: %s", pn, e)
                    failures.append((pn, reason)); failed += 1
            except Exception as e:
                reason = f"{type(e).__name__}: {e}"
                try: mark_failed(pn, reason)
                except Exception as e2: logger.error("mark_failed error for %s: %s (orig: %s)", pn, e2, reason)
                failures.append((pn, reason)); failed += 1

        return JsonResponse({
            "segment": segment,
            "attempted": attempted,
            "sent": sent,
            "failed": failed,
            "failures": failures[:200],
        })
    except Exception as e:
        logger.exception("send_selected fatal error")
        return JsonResponse({"error": str(e)}, status=500)
    

@csrf_exempt
def update_draft(request):
    """
    PATCH /bulk-email/draft/update
    JSON: { "policy_no_norm": "...", "subject": "...", "body_text": "..." }
    Returns: {ok: True}
    """
    if request.method not in ("PATCH", "POST"):  # allow POST if easier from client
        return HttpResponseBadRequest("PATCH or POST only")

    try:
        data = json.loads(request.body.decode() or "{}")
    except Exception as e:
        return HttpResponseBadRequest(f"Invalid JSON: {e}")

    pn = str(data.get("policy_no_norm") or "").strip().upper()
    subject = str(data.get("subject") or "").strip()
    
    body_text = str(data.get("body_text") or "")
    subject, body_text = normalize_subject_body(subject, body_text)
    if not pn:
        return HttpResponseBadRequest("policy_no_norm is required")
    if not subject:
        return HttpResponseBadRequest("subject is required")
    if not body_text:
        return HttpResponseBadRequest("body_text is required")

    try:
        from sqlalchemy import text as _sqltext
        from .utils import cloud_engine, to_html
        from .constants import BULK_DRAFTS_FQN

        eng = cloud_engine()
        body_html = to_html(body_text)

        with eng.begin() as c:
            c.execute(_sqltext(f"""
                UPDATE {BULK_DRAFTS_FQN}
                   SET subject=:s, body_text=:b, body_html=:h, status='drafted'
                 WHERE policy_no_norm=:p
            """), {"s": subject[:500], "b": body_text, "h": body_html, "p": pn})

        return JsonResponse({"ok": True})
    except Exception as e:
        logger.exception("update_draft error")
        return JsonResponse({"error": str(e)}, status=500)
    

@csrf_exempt
def update_changes(request):
    """
    POST /bulk-email/change/update
    Body: { "changes": [ { policy_no_norm:, new_discount:, new_od:, new_tp:, new_total_premium: }, ... ] }

    Applies numeric changes, regenerates draft email for each changed policy and upserts draft.
    Returns: { ok: True, updated: [...] }
    """
    if request.method != "POST":
        return HttpResponseBadRequest("POST only")

    try:
        body = json.loads(request.body.decode() or "{}")
        changes = body.get("changes") or []
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    if not isinstance(changes, list):
        return HttpResponseBadRequest("changes must be a list")

    try:
        eng = cloud_engine()
        updated = []

        with eng.begin() as conn:
            for ch in changes:

                # ----------------------------------
                # Normalize policy no.
                # ----------------------------------
                p_raw = ch.get("policy_no_norm") or ch.get("policy_no") or ""
                p = str(p_raw).strip().upper()
                if not p:
                    continue

                # ----------------------------------
                # Read numeric updates safely
                # ----------------------------------
                def num(x):
                    try:
                        return float(x or 0)
                    except:
                        return 0.0

                nd   = num(ch.get("new_discount"))
                no   = num(ch.get("new_od"))
                nt   = num(ch.get("new_tp"))
                ntot = num(ch.get("new_total_premium"))

                # ----------------------------------
                # 1. WRITE BULK_CHANGES TABLE
                # ----------------------------------
                conn.execute(_sqltext(f"""
                    INSERT INTO {BULK_CHANGES_FQN} (
                        policy_no, policy_no_norm, new_discount, new_od, new_tp, new_total_premium, created_at
                    )
                    VALUES (:policy_no, :policy_no_norm, :nd, :no, :nt, :ntot, NOW())
                    ON CONFLICT (policy_no_norm) DO UPDATE
                    SET new_discount = EXCLUDED.new_discount,
                        new_od = EXCLUDED.new_od,
                        new_tp = EXCLUDED.new_tp,
                        new_total_premium = EXCLUDED.new_total_premium,
                        created_at = EXCLUDED.created_at
                """), {
                    "policy_no": p_raw,
                    "policy_no_norm": p,
                    "nd": nd,
                    "no": no,
                    "nt": nt,
                    "ntot": ntot
                })

                # ----------------------------------
                # 2. FETCH CANONICAL POLICY CONTEXT
                # ----------------------------------
                try:
                    latest = fetch_latest_selected(p) or {}
                except Exception:
                    latest = {}

                # get to_email from BULK_DRAFTS if exists
                try:
                    row = conn.execute(_sqltext(
                        f"SELECT to_email FROM {BULK_DRAFTS_FQN} WHERE policy_no_norm = :p LIMIT 1"
                    ), {"p": p}).fetchone()

                    to_email = row[0] if row and row[0] else DEFAULT_TO_EMAIL
                except:
                    to_email = DEFAULT_TO_EMAIL

                # ----------------------------------
                # 3. BUILD INPUT FOR DRAFT GENERATOR
                # ----------------------------------
                # IMPORTANT: include old_* values and IDV → needed for accurate regenerated text
                draft_src = {
                    "policy_no":     latest.get("policy_no", p_raw),
                    "policy_no_norm": p,
                    "segment":        latest.get("segment"),
                    "batch_id":       latest.get("batch_id"),
                    "idv":            latest.get("idv"),

                    # OLD VALUES
                    "old_discount":       latest.get("old_discount"),
                    "old_od":             latest.get("old_od"),
                    "old_tp":             latest.get("old_tp"),
                    "old_total_premium":  latest.get("old_total_premium"),

                    # UPDATED VALUES
                    "new_discount":       nd,
                    "new_od":             no,
                    "new_tp":             nt,
                    "new_total_premium":  ntot,

                    "to_email": to_email
                }

                # ----------------------------------
                # 4. GENERATE DRAFT EMAIL (LLM + fallback)
                # ----------------------------------
                try:
                    generated = draft_email(draft_src)
                    subj, body_text = split_subj_body(generated)
                    subj, body_text = normalize_subject_body(subj, body_text)
                    body_html = to_html(body_text)
                except Exception as e:
                    logger.exception("Draft generation failed for %s", p)
                    subj = f"Policy: {p}"
                    body_text = f"Unable to generate draft. Error: {e}"
                    body_html = to_html(body_text)

                # ----------------------------------
                # 5. UPSERT INTO BULK_DRAFTS TABLE
                # ----------------------------------
                try:
                    upsert_bulk_draft({
                        "policy_no":        draft_src["policy_no"],
                        "policy_no_norm":   p,
                        "to_email":         to_email,
                        "subject":          subj[:500],
                        "body_text":        body_text,
                        "body_html":        body_html,
                        "segment":          draft_src.get("segment"),
                        "batch_id":         draft_src.get("batch_id"),
                    })
                except Exception:
                    logger.exception("Draft upsert failed for %s", p)

                # ----------------------------------
                # 6. APPEND RESPONSE FOR FRONTEND
                # ----------------------------------
                updated.append({
                    "policy_no_norm": p,
                    "policy_no": draft_src["policy_no"],
                    "subject": subj,
                    "body_text": body_text,
                    "new_discount": nd,
                    "new_od": no,
                    "new_tp": nt,
                    "new_total_premium": ntot
                })

        return JsonResponse({"ok": True, "updated": updated})

    except Exception as e:
        logger.exception("update_changes failed")
        return JsonResponse({"error": str(e)}, status=500)




