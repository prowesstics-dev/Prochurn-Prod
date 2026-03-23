# analytics/views.py
import json
import logging
from datetime import datetime, time, timedelta



from django.db.models import Avg, Count, Min, Max, Q, Sum, FloatField
from django.db.models.functions import TruncMinute , TruncDate, TruncHour, Cast
from django.http import JsonResponse, HttpResponseBadRequest
from django.utils import timezone
from api.models import Page
from django.db.models import Sum
from django.views.decorators.csrf import csrf_exempt

from .models import AnalyticsEvent, RequestMetric

log = logging.getLogger(__name__)


# ----------------- ingest endpoint -----------------




def available_dates(request):
    # Use created_at for AnalyticsEvent (or ts_ms if you prefer)
    ae_dates = (
        AnalyticsEvent.objects
        .annotate(d=TruncDate("created_at"))
        .values_list("d", flat=True)
        .distinct()
    )
    rm_dates = (
        RequestMetric.objects
        .annotate(d=TruncDate("ts"))
        .values_list("d", flat=True)
        .distinct()
    )

    all_dates = sorted({d for d in ae_dates if d} | {d for d in rm_dates if d})
    return JsonResponse({"dates": [d.isoformat() for d in all_dates]})


@csrf_exempt
def ingest(request):
    if request.method != "POST":
        return HttpResponseBadRequest("POST only")

    raw = request.body.decode("utf-8") if request.body else ""
    try:
        payload = json.loads(raw) if raw else {}
    except Exception as ex:
        log.warning("analytics.ingest: JSON parse failed: %s", ex)
        return JsonResponse({"ok": True, "n": 0, "server_ts": _now_ms()})

    # Accept {events:[...]} OR single event object
    events = payload.get("events")
    if events is None:
        events = [payload] if isinstance(payload, dict) and payload.get("type") else []

    header_session = request.headers.get("X-Session-Id") or ""

    rows = []
    # For a small debug echo in the response:
    debug_first_user_id = None
    debug_first_route = None

    for idx, e in enumerate(events):
        if not isinstance(e, dict):
            continue

        ts = _coerce_ts_ms(e.get("ts") or e.get("ts_ms"))
        ev_type = (e.get("type") or "unknown")[:64]

        # ---- session id ----
        session_id = (e.get("session_id") or header_session or "")[:64]

        # ---- route normalization ----
        route = _normalize_route(e.get("route"))

        # ---- identity normalization ----
        uid_raw = e.get("user_id")
        # treat "", "null", "None" as missing
        uid = None if uid_raw in (None, "", "null", "None") else str(uid_raw)

        data = e.get("data") or {}
        email = e.get("user_email") or data.get("_user_email")
        name = e.get("user_name") or data.get("_user_name")

        # If user_id looks like email and email not provided, use it as email
        if not email and uid and "@" in uid:
            email = uid

        # Persist
        rows.append(
            AnalyticsEvent(
                ts_ms=ts,
                type=ev_type,
                session_id=session_id,
                user_id=(uid[:128] if uid else None),  # NULL in DB when missing
                user_email=(str(email)[:256] if email else None),
                user_name=(str(name)[:256] if name else None),
                route=route,  # will be "/login" if missing/variant
                data=data,
            )
        )

        if debug_first_user_id is None:
            debug_first_user_id = uid  # None if absent
        if debug_first_route is None:
            debug_first_route = route

    if rows:
        try:
            AnalyticsEvent.objects.bulk_create(rows, ignore_conflicts=True)
        except Exception as ex:
            log.exception("analytics.ingest: DB error")
            return HttpResponseBadRequest(str(ex))

    return JsonResponse(
        {
            "ok": True,
            "n": len(rows),
            "server_ts": _now_ms(),
            # Small echo so you can immediately verify behavior:
            "normalized_preview": {
                "user_id": debug_first_user_id,  # null in JSON when missing
                "route": debug_first_route,  # "/login" for login variants/missing
            },
        }
    )


# ----------------- helpers -----------------


def _now_ms() -> int:
    return int(timezone.now().timestamp() * 1000)


def _coerce_ts_ms(val) -> int:
    """Accept ms, seconds, or None. Convert seconds (<1e12) to ms. Default to now()."""
    try:
        v = int(val)
        if v < 10**12:
            v *= 1000
        return v
    except Exception:
        return _now_ms()


def _normalize_route(route):
    """
    Normalize the page/route:
    - If missing/blank → '/login'
    - If equals 'login' or variants like '/', '/login', 'Login' → '/login'
    - Otherwise return as-is
    """
    if not route:
        return "/login"
    s = str(route).strip().lower()
    # common login-y values
    login_aliases = {"login", "/login", "signin", "/signin", "/", "sign-in"}
    return "/login" if s in login_aliases else route


def _get_date_range_from_request(request):
    """
    Read ?date=YYYY-MM-DD from query params.
    If provided and valid → return that day's [start, end] in current timezone.
    Otherwise → return [now-24h, now].
    """
    date_str = request.GET.get("date")
    tz = timezone.get_current_timezone()

    if date_str:
        try:
            day = datetime.strptime(date_str, "%Y-%m-%d").date()
            start = timezone.make_aware(datetime.combine(day, time.min), tz)
            end = timezone.make_aware(datetime.combine(day, time.max), tz)
            return start, end
        except ValueError:
            # fall through to default if parsing fails
            pass

    # default: last 24 hours
    end = timezone.now()
    start = end - timedelta(hours=24)
    return start, end


# ----------------- metrics API -----------------

def system_summary(request):
    """
    Combined usage + system + download metrics.

    - If ?date=YYYY-MM-DD is passed, filters that full calendar day.
    - Otherwise, uses last 24 hours.

    Response:

    {
      "usage": {...},
      "system": {...},
      "downloads": {
        "total_csv_downloads": int,
        "failed_downloads": int,
        "downloads_per_user": float
      },
      "by_route": [...]
    }
    """
    start, end = _get_date_range_from_request(request)

    # ========== USAGE METRICS (AnalyticsEvent) ==========
    start_ms = int(start.timestamp() * 1000)
    end_ms = int(end.timestamp() * 1000)

    ae_qs = AnalyticsEvent.objects.filter(ts_ms__gte=start_ms, ts_ms__lt=end_ms)

    # ----- Active users -----
    active_users_by_id = (
        ae_qs.exclude(user_id__isnull=True)
        .exclude(user_id__exact="")
        .values("user_id")
        .distinct()
        .count()
    )
    active_users_by_email = (
        ae_qs.filter(user_id__isnull=True)
        .exclude(user_email__isnull=True)
        .exclude(user_email__exact="")
        .values("user_email")
        .distinct()
        .count()
    )
    active_users = active_users_by_id + active_users_by_email

    # ----- Total sessions -----
    total_sessions = (
        ae_qs.exclude(session_id__exact="")
        .values("session_id")
        .distinct()
        .count()
    )

    # ----- Avg session duration -----
    avg_session_duration_sec = 0.0
    if total_sessions > 0:
        per_session = (
            ae_qs.exclude(session_id__exact="")
            .values("session_id")
            .annotate(
                first_ts=Min("ts_ms"),
                last_ts=Max("ts_ms"),
            )
        )
        total_duration_ms = 0
        count_sessions_with_duration = 0
        for s in per_session:
            if s["first_ts"] is not None and s["last_ts"] is not None:
                dur = s["last_ts"] - s["first_ts"]
                if dur >= 0:
                    total_duration_ms += dur
                    count_sessions_with_duration += 1

        if count_sessions_with_duration > 0:
            avg_session_duration_sec = (
                total_duration_ms / count_sessions_with_duration
            ) / 1000.0

    # ========== SYSTEM METRICS (RequestMetric) ==========
    rm_qs = RequestMetric.objects.filter(ts__gte=start, ts__lt=end)

    total_requests = rm_qs.count()
    avg_api_ms = rm_qs.aggregate(avg=Avg("duration_ms"))["avg"] or 0.0

    server_errors_5xx = rm_qs.filter(status_code__gte=500).count()
    error_rate_5xx = (
        (server_errors_5xx / total_requests) * 100.0 if total_requests else 0.0
    )

    # Approximate downtime: minute is "down" if all requests that minute are 5xx
    per_minute = (
        rm_qs.annotate(minute=TruncMinute("ts"))
        .values("minute")
        .annotate(
            total=Count("id"),
            errors=Count("id", filter=Q(status_code__gte=500)),
        )
    )
    downtime_minutes = sum(
        1 for m in per_minute if m["total"] > 0 and m["errors"] == m["total"]
    )

    # Failures by route (for chart)
    by_route = list(
        rm_qs.values("route")
        .annotate(
            total=Count("id"),
            errors_5xx=Count("id", filter=Q(status_code__gte=500)),
        )
        .order_by("-total")[:10]
    )

    # ========== DOWNLOAD METRICS (AnalyticsEvent type='download_csv') ==========
    download_qs = ae_qs.filter(type="download_csv")

    total_csv_downloads = download_qs.count()

    # Mark failures by putting {"status": "failed"} or "error" into data
    failed_downloads = download_qs.filter(
        Q(data__status="failed") | Q(data__status="error")
    ).count()

    # Distinct users who downloaded at least once (similar logic as active users)
    dl_users_by_id = (
        download_qs.exclude(user_id__isnull=True)
        .exclude(user_id__exact="")
        .values("user_id")
        .distinct()
        .count()
    )
    dl_users_by_email = (
        download_qs.filter(user_id__isnull=True)
        .exclude(user_email__isnull=True)
        .exclude(user_email__exact="")
        .values("user_email")
        .distinct()
        .count()
    )
    download_users = dl_users_by_id + dl_users_by_email

    downloads_per_user = (
        float(total_csv_downloads) / download_users if download_users else 0.0
    )

    return JsonResponse(
        {
            "usage": {
                "active_users": active_users,
                "total_sessions": total_sessions,
                "avg_session_duration_sec": avg_session_duration_sec,
            },
            "system": {
                "requests_last_24h": total_requests,
                "avg_api_ms": avg_api_ms,
                "error_rate_5xx": error_rate_5xx,
                "server_errors_5xx": server_errors_5xx,
                "downtime_minutes": downtime_minutes,
            },
            "downloads": {
                "total_csv_downloads": total_csv_downloads,
                "failed_downloads": failed_downloads,
                "downloads_per_user": downloads_per_user,
            },
            "by_route": by_route,
        }
    )


from django.db.models import Count, Q
from django.db.models.functions import TruncHour, TruncDate

from .models import AnalyticsEvent
# (you already have most imports at the top)

def sessions_over_time(request):
    """
    Returns timeseries for the 'Sessions Over Time / Total Clicks' chart.

    Query params:
      ?date=YYYY-MM-DD  -> same semantics as system_summary (full day)
      ?view=day|overall -> day: bucket by hour; overall: bucket by day

    Response:
    {
      "points": [
        {"label": "10:00", "sessions": 5, "clicks": 32},
        {"label": "11:00", "sessions": 8, "clicks": 47},
        ...
      ]
    }
    """
    start, end = _get_date_range_from_request(request)
    view = request.GET.get("view", "day").lower()
    if view not in ("day", "overall"):
        view = "day"

    # Use created_at for bucketing; ts_ms for “exact” time if you prefer
    qs = AnalyticsEvent.objects.filter(created_at__gte=start,
                                       created_at__lt=end)

    # Choose bucket: hour within the day, or date across days
    if view == "overall":
        bucket_expr = TruncDate("created_at")
    else:
        bucket_expr = TruncHour("created_at")

    buckets = (
        qs.annotate(bucket=bucket_expr)
          .values("bucket")
          .annotate(
              sessions=Count("session_id", distinct=True),
              clicks=Count("id", filter=Q(type="click")),
          )
          .order_by("bucket")
    )

    points = []
    for row in buckets:
        dt = row["bucket"]
        if dt is None:
            continue

        if view == "overall":
            label = dt.strftime("%Y-%m-%d")
        else:
            # e.g. "10:00", "11:00"
            label = dt.strftime("%H:%M")

        points.append(
            {
                "label": label,
                "sessions": row["sessions"],
                "clicks": row["clicks"],
            }
        )

    return JsonResponse({"points": points})


# analytics/views.py

from django.db.models import Sum, FloatField
from django.db.models.functions import TruncHour, TruncDate, Cast
from django.http import JsonResponse

from .models import AnalyticsEvent, RequestMetric
from api.models import Page


def module_hours(request):
    """
    Returns 'Hours Spent' per page/module using AnalyticsEvent + Page table.

    - Reads AnalyticsEvent.data['ms_visible'] (JSON) and casts to float.
    - Groups by route, joins to Page.path, and sums visible time.
    """
    start, end = _get_date_range_from_request(request)

    # Analytics events in range that have ms_visible
    qs = AnalyticsEvent.objects.filter(
        created_at__gte=start,
        created_at__lt=end,
        data__has_key="ms_visible",
    )

    # Cast JSONB data->'ms_visible' to float so Postgres can SUM it
    per_route = (
        qs.annotate(
            ms_visible_val=Cast("data__ms_visible", FloatField())
        )
        .values("route")
        .annotate(total_visible_ms=Sum("ms_visible_val"))
        .order_by("route")
    )

    # Map path -> Page
    pages_by_path = {p.path: p for p in Page.objects.all()}

    modules = []
    for row in per_route:
        route = row["route"]
        page = pages_by_path.get(route)
        if not page:
            # Skip routes that aren't in api_page
            continue

        total_ms = row["total_visible_ms"] or 0.0
        hours = float(total_ms) / 1000.0 / 3600.0  # ms -> hours

        modules.append(
            {
                "name": page.name,
                "path": page.path,
                "hours": round(hours, 2),
            }
        )

    modules.sort(key=lambda m: m["hours"], reverse=True)

    return JsonResponse({"modules": modules})


def peak_sessions_over_time(request):
    """
    Per-hour engagement for a single calendar day.
    Always returns 24 points (00:00–23:00).
    """

    # --- decide which day we are looking at ---
    date_str = request.GET.get("date")
    tz = timezone.get_current_timezone()

    if date_str:
        try:
            day = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            # fallback: today
            day = timezone.localdate()
    else:
        # no date passed -> today
        day = timezone.localdate()

    start = timezone.make_aware(datetime.combine(day, time.min), tz)
    end = start + timedelta(days=1)  # exactly 24 hours

    # --- aggregate real data by hour ---
    qs = AnalyticsEvent.objects.filter(
        created_at__gte=start,
        created_at__lt=end,
    )

    # OPTIONAL: ignore login-only events if you don't consider
    # them "engagement"
    # qs = qs.exclude(route="/login")

    buckets = (
        qs.annotate(bucket=TruncHour("created_at"))
          .values("bucket")
          .annotate(
              sessions=Count("session_id", distinct=True),
              clicks=Count("id", filter=Q(type="click")),
          )
    )

    # map hour -> data (0..23)
    bucket_map = {}
    for row in buckets:
        dt = row["bucket"]
        if dt is None:
            continue
        hour = dt.astimezone(tz).hour
        bucket_map[hour] = {
            "sessions": row["sessions"] or 0,
            "clicks": row["clicks"] or 0,
        }

    # --- build 24 points, including hours with 0 sessions ---
    points = []
    for h in range(24):
        slot_dt = (start + timedelta(hours=h)).astimezone(tz)
        data = bucket_map.get(h, {"sessions": 0, "clicks": 0})
        points.append(
            {
                "label": slot_dt.strftime("%H:%M"),  # 00:00, 01:00, ...
                "sessions": data["sessions"],
                "clicks": data["clicks"],
            }
        )

    return JsonResponse({"points": points})



