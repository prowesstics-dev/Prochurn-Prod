# views.py
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# Max number of ROC points to send to frontend
MAX_ROC_POINTS = 2000


@require_GET
def model_health_dates(request):
    """
    GET /health_monitor/model-health-dates/

    Returns all distinct dates available in
    "Prediction"."model_performance".run_timestamp_utc::date
    as a list of YYYY-MM-DD strings.
    """
    DB_New_Past = settings.EXTERNAL_DATABASES["DB_New_Past"]

    conn = psycopg2.connect(
        dbname=DB_New_Past["dbname"],
        user=DB_New_Past["user"],
        password=DB_New_Past["password"],
        host=DB_New_Past["host"],
        port=DB_New_Past["port"],
    )

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT DISTINCT run_timestamp_utc::date AS dt
                FROM "Prediction"."model_performance"
                ORDER BY dt;
                """
            )
            rows = cur.fetchall()

        dates = [row["dt"].strftime("%Y-%m-%d") for row in rows]
        return JsonResponse({"dates": dates})
    finally:
        conn.close()


def _pct(value):
    """
    Convert float like 0.8554 -> 85.54.
    If your DB already stores percents, just remove the *100.
    """
    if value is None:
        return None
    return round(float(value) * 100, 2)


@require_GET
def model_health_dashboard(request):
    """
    GET /health_monitor/model-health/?date=YYYY-MM-DD   (date optional)

    - Metric cards come from latest row (up to given date, if provided)
      in "Prediction".model_performance.
    - Accuracy Quarter Wise is built from run_timestamp_utc (grouped by quarter).
    - Renewed / Not Renewed donuts + Classification report are taken from
      class_0_accuracy / class_1_accuracy and precision_* / recall_* / f1_*.
    - ROC curve is read from "Prediction".model_roc_curve_data
      using false_positive_rate / true_positive_rate for the same run date.
    """

    date_str = request.GET.get("date")  # from React DatePicker
    date_filter = None
    if date_str:
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
            date_filter = date_str
        except ValueError:
            return JsonResponse(
                {"detail": "Invalid date format, use YYYY-MM-DD"},
                status=400,
            )

    DB_New_Past = settings.EXTERNAL_DATABASES["DB_New_Past"]

    conn = psycopg2.connect(
        dbname=DB_New_Past["dbname"],
        user=DB_New_Past["user"],
        password=DB_New_Past["password"],
        host=DB_New_Past["host"],
        port=DB_New_Past["port"],
    )

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # ---------- 1) Get the latest TWO runs for cards + delta ----------
            base_where = ""
            params = {}
            if date_filter:
                base_where = "WHERE run_timestamp_utc::date <= %(date)s"
                params["date"] = date_filter

            latest_sql = f"""
                SELECT
                    accuracy,
                    log_loss,
                    roc_auc,
                    run_timestamp_utc,
                    class_0_accuracy,
                    class_1_accuracy,
                    precision_0,
                    recall_0,
                    f1_0,
                    precision_1,
                    recall_1,
                    f1_1,
                    true_negative,
                    false_positive,
                    false_negative,
                    true_positive
                FROM "Prediction"."model_performance"
                {base_where}
                ORDER BY run_timestamp_utc DESC
                LIMIT 2;
            """
            cur.execute(latest_sql, params)
            rows = cur.fetchall()

            if not rows:
                return JsonResponse({"detail": "No data found"}, status=404)

            latest = rows[0]
            prev = rows[1] if len(rows) > 1 else None

            acc_pct = _pct(latest["accuracy"])
            roc_pct = _pct(latest["roc_auc"])
            log_loss_val = round(float(latest["log_loss"]), 4)

            def fmt_change(current, previous, invert=False, is_percent=True):
                """
                Format change like +2.5 / -1.2.
                invert=True means "down is good" (for loss).
                """
                if previous is None:
                    return "+0"
                if is_percent:
                    cur_v = current
                    prev_v = _pct(previous)
                else:
                    cur_v = current
                    prev_v = float(previous)

                diff = cur_v - prev_v

                if invert:  # for loss: lower is better
                    if diff < 0:
                        sign = "+"
                        val = abs(diff)
                    elif diff > 0:
                        sign = "-"
                        val = diff
                    else:
                        sign = ""
                        val = 0
                else:
                    sign = "+" if diff > 0 else ""
                    val = diff

                return f"{sign}{round(val, 2)}"

            metrics = {
                "trainAccuracy": acc_pct,
                "rocAUC": roc_pct,
                "logLoss": log_loss_val,
                "accuracyChange": fmt_change(
                    acc_pct, prev["accuracy"] if prev else None
                ),
                "rocChange": fmt_change(
                    roc_pct, prev["roc_auc"] if prev else None
                ),
                "lossChange": fmt_change(
                    log_loss_val,
                    prev["log_loss"] if prev else None,
                    invert=True,
                    is_percent=False,
                ),
            }

            # ---------- 2) Quarter-wise accuracy ----------
            quarter_sql = f"""
                SELECT
                    date_trunc('quarter', run_timestamp_utc) AS quarter_start,
                    AVG(accuracy) AS avg_accuracy
                FROM "Prediction"."model_performance"
                {base_where}
                GROUP BY quarter_start
                ORDER BY quarter_start;
            """
            cur.execute(quarter_sql, params)
            q_rows = cur.fetchall()

            accuracy_quarter_data = []
            for r in q_rows:
                q_start = r["quarter_start"]  # datetime
                quarter_num = ((q_start.month - 1) // 3) + 1
                label = f"Q{quarter_num}-{q_start.year}"
                accuracy_quarter_data.append(
                    {"quarter": label, "accuracy": _pct(r["avg_accuracy"])}
                )

            # ---------- 3) ROC Curve from model_roc_curve_data ----------
            # Use the DATE of the same latest run as in model_performance
            run_date = latest["run_timestamp_utc"].date()

            roc_params = {
                "run_date": run_date,
                "dataset": "training_oversampled",
            }

            # Filter by date only, using existing run_timestamp_utc column
            roc_sql = """
                SELECT false_positive_rate, true_positive_rate
                FROM "Prediction"."model_roc_curve_data"
                WHERE dataset = %(dataset)s
                  AND run_timestamp_utc::date = %(run_date)s
                ORDER BY point_index;
            """
            cur.execute(roc_sql, roc_params)
            roc_rows = cur.fetchall()

            # Optional fallback: if no ROC rows for that exact date, use latest
            if not roc_rows:
                fallback_sql = """
                    SELECT false_positive_rate, true_positive_rate
                    FROM "Prediction"."model_roc_curve_data"
                    WHERE dataset = %(dataset)s
                      AND run_timestamp_utc = (
                        SELECT MAX(run_timestamp_utc)
                        FROM "Prediction"."model_roc_curve_data"
                        WHERE dataset = %(dataset)s
                      )
                    ORDER BY point_index;
                """
                cur.execute(fallback_sql, {"dataset": "training_oversampled"})
                roc_rows = cur.fetchall()

            # ✅ Downsample to at most MAX_ROC_POINTS to keep payload small
            n = len(roc_rows)
            if n > MAX_ROC_POINTS:
                # ceil(n / MAX_ROC_POINTS)
                step = (n + MAX_ROC_POINTS - 1) // MAX_ROC_POINTS
                roc_rows = roc_rows[::step]

            roc_curve_data = [
                {
                    "fpr": float(r["false_positive_rate"]),
                    "tpr": float(r["true_positive_rate"]),
                }
                for r in roc_rows
            ]

        # ---------- 4) Donuts + classification + confusion matrix ----------

        # Donut chart values – from class_0_accuracy / class_1_accuracy
        renewed_acc_pct = _pct(latest["class_0_accuracy"])
        not_renewed_acc_pct = _pct(latest["class_1_accuracy"])

        renewal_data = [
            {"name": "Renewed", "value": renewed_acc_pct},
            {"name": "Not Renewed", "value": not_renewed_acc_pct},
        ]

        # Classification report values from precision_*, recall_*, f1_*
        classification_data = {
            "renewed": [
                {"name": "Precision", "value": _pct(latest["precision_0"])},
                {"name": "Recall", "value": _pct(latest["recall_0"])},
                {"name": "F1 Score", "value": _pct(latest["f1_0"])},
            ],
            "notRenewed": [
                {"name": "Precision", "value": _pct(latest["precision_1"])},
                {"name": "Recall", "value": _pct(latest["recall_1"])},
                {"name": "F1 Score", "value": _pct(latest["f1_1"])},
            ],
        }

        # Confusion matrix values from latest row
        confusion_matrix = {
            "truePositive": int(latest["true_positive"]),
            "falsePositive": int(latest["false_positive"]),
            "trueNegative": int(latest["true_negative"]),
            "falseNegative": int(latest["false_negative"]),
        }

        if accuracy_quarter_data:
            highs = [x["accuracy"] for x in accuracy_quarter_data]
            stats = {
                "highestAccuracy": max(highs),
                "lowestAccuracy": min(highs),
                "overallAccuracy": acc_pct,
            }
        else:
            stats = {
                "highestAccuracy": acc_pct,
                "lowestAccuracy": acc_pct,
                "overallAccuracy": acc_pct,
            }

        payload = {
            "metrics": metrics,
            "accuracyQuarterData": accuracy_quarter_data,
            "rocCurveData": roc_curve_data,
            "actualVsPredictedData": [],
            "renewalData": renewal_data,
            "classificationData": classification_data,
            "confusionMatrix": confusion_matrix,
            "stats": stats,
        }

        return JsonResponse(payload)

    finally:
        conn.close()


class PipelineStatusView(APIView):
    """
    GET /api/pipeline-status

    RAW Layer  → stage_count (Base, PR, Claim)
    SILVER     → base_cnt, pr_cnt, merged_count
    GOLD       → renewal_policy_count
    """

    def get(self, request):
        DB = settings.EXTERNAL_DATABASES["DB_Azure_Prochurn_Airflow"]

        try:
            conn = psycopg2.connect(**DB)

            with conn.cursor(cursor_factory=RealDictCursor) as cur:

                # ================= RAW LAYER =================

                # RAW BASE
                cur.execute("""
                    SELECT COALESCE(SUM(stage_count),0) AS cnt
                    FROM pip_log.base_pr_metalog
                    WHERE table_rnk = 1;
                """)
                raw_base_total = cur.fetchone()["cnt"]

                # RAW PR
                cur.execute("""
                    SELECT COALESCE(SUM(stage_count),0) AS cnt
                    FROM pip_log.base_pr_metalog
                    WHERE table_rnk = 2;
                """)
                raw_pr_total = cur.fetchone()["cnt"]

                # RAW CLAIM
                cur.execute("""
                    SELECT COALESCE(SUM(stage_count),0) AS cnt
                    FROM pip_log.claim_elt_log
                    WHERE is_appended = 'YES';
                """)
                raw_claim_total = cur.fetchone()["cnt"]


                # ================= SILVER LAYER =================

                # SILVER BASE
                cur.execute("""
                    SELECT COALESCE(SUM(base_cnt),0) AS cnt
                    FROM pip_log.base_pr_metalog
                    WHERE table_rnk = 1;
                """)
                silver_base_total = cur.fetchone()["cnt"]

                # SILVER PR
                cur.execute("""
                    SELECT COALESCE(SUM(pr_cnt),0) AS cnt
                    FROM pip_log.base_pr_metalog
                    WHERE table_rnk = 2;
                """)
                silver_pr_total = cur.fetchone()["cnt"]

                # SILVER CLAIM MERGE
                cur.execute("""
                    SELECT COALESCE(SUM(merged_count),0) AS cnt
                    FROM pip_log.claim_elt_log
                    WHERE table_name = 'claim_merge';
                """)
                silver_claim_total = cur.fetchone()["cnt"]


                # ================= GOLD LAYER =================
                cur.execute("""
                    SELECT COALESCE(SUM(renewal_policy_count),0) AS cnt
                    FROM pip_log.base_pr_metalog;
                """)
                gold_total = cur.fetchone()["cnt"]

        except Exception as e:
            print("Unexpected error in PipelineStatusView:", e)
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        finally:
            try:
                conn.close()
            except:
                pass

        # -------- RESPONSE BUILD --------
        raw_stage = {
            "base": raw_base_total,
            "pr": raw_pr_total,
            "log": raw_claim_total,
        }

        silver_stage = {
            "base": silver_base_total,
            "pr": silver_pr_total,
            "log": silver_claim_total,
        }

        gold_stage = {
            "base": gold_total,
            "pr": 0,
            "log": 0
        }

        payload = {
            "overallStatus": "Online",
            "lastUpdated": datetime.utcnow().isoformat() + "Z",
            "filterDate": "ALL",
            "rawRecordCount": sum(raw_stage.values()),
            "silverRecordCount": sum(silver_stage.values()),
            "goldenRecordCount": gold_total,
            "rawStage": raw_stage,
            "silverStage": silver_stage,
            "goldStage": gold_stage,
        }

        return Response({"status": "success", "data": payload}, status=200)



import requests
from django.http import JsonResponse
from urllib.parse import quote
from datetime import datetime, timezone


AIRFLOW_BASE = "http://20.193.138.60:8080"
DAG_ID = "initial_pipeline_etl"
AUTH = ("airflow", "airflow")


# ------------------------------------------
# SAFE WRAPPER
# ------------------------------------------
def airflow_get(url):
    try:
        r = requests.get(url, auth=AUTH, timeout=10)
        return r.json()
    except Exception as e:
        return {
            "error": "request_failed",
            "message": str(e),
            "url": url
        }


# ------------------------------------------
# ISO PARSER (Airflow -> Python datetime)
# ------------------------------------------
def parse_ts(ts):
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except:
        return None


# ------------------------------------------
# PICK BEST DAG RUN
# + add timing fields
# ------------------------------------------
def get_latest_run():
    url = (
        f"{AIRFLOW_BASE}/api/v1/dags/{DAG_ID}/dagRuns"
        "?order_by=-start_date&limit=5"
    )

    data = airflow_get(url)

    if "dag_runs" not in data or not data["dag_runs"]:
        return None

    def build_payload(r):
        start = parse_ts(r.get("start_date"))
        end = parse_ts(r.get("end_date"))
        now = datetime.now(timezone.utc)

        if r["state"] in ("running", "queued"):
            elapsed = (now - start).total_seconds() if start else None
        else:
            elapsed = (end - start).total_seconds() if start and end else None

        return {
            "dag_run_id": r["dag_run_id"],
            "state": r["state"],
            "start_time": r.get("start_date"),
            "end_time": r.get("end_date"),
            "elapsed_seconds": elapsed
        }

    runs = data["dag_runs"]

    # Prefer running
    for r in runs:
        if r["state"] in ("running", "queued"):
            return build_payload(r)

    # Else latest completed
    return build_payload(runs[0])


# ------------------------------------------
# COMMON TASK INSTANCE FETCH
# ------------------------------------------
def fetch_task_instances(run_id):
    run_id = str(run_id)
    encoded = quote(run_id, safe="")

    url = (
        f"{AIRFLOW_BASE}/api/v1/dags/{DAG_ID}/dagRuns/"
        f"{encoded}/taskInstances?limit=500"
    )

    data = airflow_get(url)
    return data.get("task_instances", [])


# ============================================================
# 1️⃣ DATA ENGINEERING STATUS
# ============================================================
def de_stage_status(request):
    run = get_latest_run()

    if not run:
        return JsonResponse(
            {"stages": [], "message": "No DAG runs found"},
            status=200
        )

    run_id = run["dag_run_id"]

    task_instances = fetch_task_instances(run_id)

    DE_TASKS = {
        "Create_all_schemas",
        "create_log_schema",
        "initial_data_load",
        "clean_and_load_base_data",
        "clean_pr_file_data",
        "base_pr_data_appending",
        "append_claim",
        "mergeclaim",
        "adding_fuzzy_matching_for_basepr_append",
        "mergebaseprwithclaim",
        "add_on",
        "renewal_rate_update",
        "new_column_features",
    }

    stages = [
        {
            "task_id": t["task_id"],
            "status": t["state"],
            "start": t.get("start_date"),
            "end": t.get("end_date"),
        }
        for t in task_instances
        if t["task_id"] in DE_TASKS
    ]

    return JsonResponse({
        "dag_run_id": run["dag_run_id"],
        "dag_state": run["state"],
        "start_time": run["start_time"],
        "end_time": run["end_time"],
        "elapsed_seconds": run["elapsed_seconds"],
        "stages": stages
    })


# ============================================================
# 2️⃣ MACHINE LEARNING STATUS
# ============================================================
def ml_stage_status(request):
    run = get_latest_run()

    if not run:
        return JsonResponse(
            {"stages": [], "message": "No DAG runs found"},
            status=200
        )

    run_id = run["dag_run_id"]

    task_instances = fetch_task_instances(run_id)

    ML_TASKS = {
        "renewed_notrenewed_pred",
        "reason_for_prediction_table",
        "reason_for_policy_status_table",
        "generate_top_3_reasons",
        "customer_segmenatation",
        "model_health_monitoring",
    }

    stages = [
        {
            "task_id": t["task_id"],
            "status": t["state"],
            "start": t.get("start_date"),
            "end": t.get("end_date"),
        }
        for t in task_instances
        if t["task_id"] in ML_TASKS
    ]

    return JsonResponse({
        "dag_run_id": run["dag_run_id"],
        "dag_state": run["state"],
        "start_time": run["start_time"],
        "end_time": run["end_time"],
        "elapsed_seconds": run["elapsed_seconds"],
        "stages": stages
    })


# ============================================================
# 3️⃣ LIVE LOG TERMINAL FEED (unchanged)
# ============================================================
# views.py (replace pipeline_logs)

from urllib.parse import quote
import requests
from django.http import JsonResponse

def pipeline_logs(request):
    run = get_latest_run()

    if not run:
        return JsonResponse({"logs": [], "message": "No DAG run found"}, status=200)

    run_id = str(run["dag_run_id"])
    encoded_run = quote(run_id, safe="")

    task_instances = fetch_task_instances(run_id)

    logs = []

    for ti in task_instances:
        task_id = ti.get("task_id")
        if not task_id:
            continue

        # OPTIONAL: only include relevant tasks
        # if ti.get("state") not in ("running", "failed"):
        #     continue

        try_num = ti.get("try_number") or 1
        encoded_task = quote(str(task_id), safe="")

        log_url = (
            f"{AIRFLOW_BASE}/api/v1/dags/{DAG_ID}"
            f"/dagRuns/{encoded_run}"
            f"/taskInstances/{encoded_task}"
            f"/logs/{try_num}?full_content=true"
        )

        try:
            r = requests.get(
                log_url,
                auth=AUTH,
                timeout=20,
                headers={"Accept": "application/json"},
            )

            # If airflow returns error HTML or non-JSON, do not call r.json() blindly
            content_type = (r.headers.get("Content-Type") or "").lower()

            if r.status_code != 200:
                logs.append({
                    "task": task_id,
                    "state": ti.get("state"),
                    "try_number": try_num,
                    "log": f"Error fetching logs: HTTP {r.status_code} ({content_type})"
                })
                continue

            text = "(no log yet)"

            if "application/json" in content_type:
                try:
                    log_res = r.json()
                    if isinstance(log_res, dict):
                        if isinstance(log_res.get("content"), str):
                            text = log_res["content"]
                        elif isinstance(log_res.get("message"), str):
                            text = log_res["message"]
                        else:
                            text = str(log_res)
                    else:
                        text = str(log_res)
                except Exception:
                    # JSON parse failed even though content-type said json
                    text = r.text or "(empty response)"
            else:
                # Airflow may return plain text (or HTML)
                text = r.text or "(empty response)"

            logs.append({
                "task": task_id,
                "state": ti.get("state"),
                "try_number": try_num,
                "log": text.strip()
            })

        except Exception as e:
            logs.append({
                "task": task_id,
                "state": ti.get("state"),
                "try_number": try_num,
                "log": f"Unexpected error: {str(e)}"
            })

    return JsonResponse({
        "dag_run_id": run_id,
        "dag_state": run.get("state"),
        "logs": logs
    }, status=200)



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import math
import psycopg2
from psycopg2.extras import RealDictCursor
from django.conf import settings


class BaseRemovedLogView(APIView):
    PAGE_SIZE = 10

    def get(self, request):
        DB = settings.EXTERNAL_DATABASES["DB_Azure_Prochurn_Airflow"]

        page = int(request.GET.get("page", 1))
        page_size = self.PAGE_SIZE
        offset = (page - 1) * page_size

        sql_cte = """
WITH combined AS (
    SELECT policy_no, business_type, veh_reg_no,
           total_premium_payable AS total_premium_payable,
           removal_reason
    FROM pip_log.removed_base_2022

    UNION ALL
    SELECT policy_no, business_type, veh_reg_no,
           total_premium_payable AS total_premium_payable,
           removal_reason
    FROM pip_log.removed_base_2023

    UNION ALL
    SELECT policy_no, business_type, veh_reg_no,
           total_premium_payable AS total_premium_payable,
           removal_reason
    FROM pip_log.removed_base_2024
)
"""


        data_sql = sql_cte + """
        SELECT policy_no, business_type, veh_reg_no, total_premium_payable, removal_reason
        FROM combined
        ORDER BY policy_no
        LIMIT %(limit)s OFFSET %(offset)s;
        """

        count_sql = sql_cte + " SELECT COUNT(*) FROM combined;"

        try:
            conn = psycopg2.connect(**DB)

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(count_sql)
                total = cur.fetchone()["count"]

                cur.execute(data_sql, {
                    "limit": page_size,
                    "offset": offset
                })
                rows = cur.fetchall()

        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=500)
        finally:
            try:
                conn.close()
            except:
                pass

        return Response({
            "status": "success",
            "page": page,
            "page_size": page_size,
            "total_rows": total,
            "total_pages": math.ceil(total / page_size),
            "rows": rows
        })


class PRRemovedLogView(APIView):
    PAGE_SIZE = 10

    def get(self, request):
        DB = settings.EXTERNAL_DATABASES["DB_Azure_Prochurn_Airflow"]

        page = int(request.GET.get("page", 1))
        page_size = self.PAGE_SIZE
        offset = (page - 1) * page_size

        sql_cte = """
        WITH combined AS (
            SELECT policy_no, business_type, veh_reg_no, net_premium, removal_reason
            FROM pip_log.removed_pr_2022
            UNION ALL
            SELECT policy_no, business_type, veh_reg_no, net_premium, removal_reason
            FROM pip_log.removed_pr_2023
            UNION ALL
            SELECT policy_no, business_type, veh_reg_no, net_premium, removal_reason
            FROM pip_log.removed_pr_2024
        )
        """

        data_sql = sql_cte + """
        SELECT policy_no, business_type, veh_reg_no, net_premium, removal_reason
        FROM combined
        ORDER BY policy_no
        LIMIT %(limit)s OFFSET %(offset)s;
        """

        count_sql = sql_cte + " SELECT COUNT(*) FROM combined;"

        try:
            conn = psycopg2.connect(**DB)

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(count_sql)
                total = cur.fetchone()["count"]

                cur.execute(data_sql, {
                    "limit": page_size,
                    "offset": offset
                })
                rows = cur.fetchall()

        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=500)
        finally:
            try:
                conn.close()
            except:
                pass

        return Response({
            "status": "success",
            "page": page,
            "page_size": page_size,
            "total_rows": total,
            "total_pages": math.ceil(total / page_size),
            "rows": rows
        })


class ClaimRemovedLogView(APIView):
    PAGE_SIZE = 10

    def get(self, request):
        DB = settings.EXTERNAL_DATABASES["DB_Azure_Prochurn_Airflow"]

        page = int(request.GET.get("page", 1))
        page_size = self.PAGE_SIZE
        offset = (page - 1) * page_size

        data_sql = """
        SELECT 
            claim_no,
            policy_no,
            nature_of_loss,
            status_of_claim,
            "vehicle_registration_no.",
            "Number_of_claims",
            removal_reason,
            logged_at
        FROM pip_log.claim_removed_reason
        ORDER BY logged_at DESC, claim_no
        LIMIT %(limit)s OFFSET %(offset)s;
        """

        count_sql = """
        SELECT COUNT(*)
        FROM pip_log.claim_removed_reason;
        """

        try:
            conn = psycopg2.connect(**DB)

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(count_sql)
                total = cur.fetchone()["count"]

                cur.execute(data_sql, {
                    "limit": page_size,
                    "offset": offset
                })
                rows = cur.fetchall()

        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=500)
        finally:
            try:
                conn.close()
            except:
                pass

        return Response({
            "status": "success",
            "page": page,
            "page_size": page_size,
            "total_rows": total,
            "total_pages": math.ceil(total / page_size),
            "rows": rows
        })



@require_GET
def pipeline_available_dates(request):
    """
    GET /health_monitor/pipeline-available-dates

    Returns list of all distinct dates where
    ANY pipeline table has data
    """
    DB = settings.EXTERNAL_DATABASES["DB_Azure_Prochurn_Airflow"]

    try:
        conn = psycopg2.connect(
            dbname=DB["dbname"],
            user=DB["user"],
            password=DB["password"],
            host=DB["host"],
            port=DB["port"],
        )

        with conn.cursor() as cur:
            cur.execute("""
                WITH dates AS (
                    -- Base & PR pipeline meta logs
                    SELECT DISTINCT last_updated_ts::date AS d
                    FROM pip_log.base_pr_metalog

                    UNION
                    SELECT DISTINCT last_updated_ts::date
                    FROM pip_log.claim_elt_log

                    -- Removed BASE
                    UNION
                    SELECT DISTINCT pipeline_run_time::date
                    FROM pip_log.removed_base_2022
                    UNION
                    SELECT DISTINCT pipeline_run_time::date
                    FROM pip_log.removed_base_2023
                    UNION
                    SELECT DISTINCT pipeline_run_time::date
                    FROM pip_log.removed_base_2024

                    -- Removed PR
                    UNION
                    SELECT DISTINCT pipeline_run_time::date
                    FROM pip_log.removed_pr_2022
                    UNION
                    SELECT DISTINCT pipeline_run_time::date
                    FROM pip_log.removed_pr_2023
                    UNION
                    SELECT DISTINCT pipeline_run_time::date
                    FROM pip_log.removed_pr_2024

                    -- Removed Claims
                    UNION
                    SELECT DISTINCT logged_at::date
                    FROM pip_log.claim_removed_reason
                )
                SELECT d FROM dates
                WHERE d IS NOT NULL
                ORDER BY d;
            """)

            rows = cur.fetchall()
            dates = [r[0].strftime("%Y-%m-%d") for r in rows]

        return JsonResponse({"status": "success", "dates": dates})

    except Exception as e:
        return JsonResponse(
            {"status": "error", "message": str(e)},
            status=500
        )

    finally:
        try:
            conn.close()
        except:
            pass


import math
import psycopg2
from psycopg2.extras import RealDictCursor
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings


class SilverRemovedView(APIView):
    PAGE_SIZE = 10

    def get(self, request):
        DB = settings.EXTERNAL_DATABASES["DB_Azure_Prochurn_Airflow"]

        page = int(request.GET.get("page", 1))
        page_size = self.PAGE_SIZE
        offset = (page - 1) * page_size

        sql = """
        WITH combined AS (
    -- BASE REMOVED
    SELECT policy_no, removal_reason, 'BASE' AS source
    FROM pip_log.removed_base_2022
    UNION ALL
    SELECT policy_no, removal_reason, 'BASE'
    FROM pip_log.removed_base_2023
    UNION ALL
    SELECT policy_no, removal_reason, 'BASE'
    FROM pip_log.removed_base_2024

    UNION ALL

    -- PR REMOVED
    SELECT policy_no, removal_reason, 'PR'
    FROM pip_log.removed_pr_2022
    UNION ALL
    SELECT policy_no, removal_reason, 'PR'
    FROM pip_log.removed_pr_2023
    UNION ALL
    SELECT policy_no, removal_reason, 'PR'
    FROM pip_log.removed_pr_2024

    UNION ALL

    -- CLAIM REMOVED
    SELECT policy_no, removal_reason, 'CLAIM'
    FROM pip_log.claim_removed_reason
),

unique_policies AS (
    SELECT
        policy_no,
        MIN(removal_reason) AS removal_reason,
        MIN(source) AS source
    FROM combined
    WHERE policy_no IS NOT NULL
    GROUP BY policy_no
)

SELECT policy_no, removal_reason, source
FROM unique_policies
ORDER BY policy_no
LIMIT %(limit)s OFFSET %(offset)s;

        """

        count_sql = """
        WITH combined AS (
    SELECT policy_no FROM pip_log.removed_base_2022
    UNION ALL SELECT policy_no FROM pip_log.removed_base_2023
    UNION ALL SELECT policy_no FROM pip_log.removed_base_2024

    UNION ALL SELECT policy_no FROM pip_log.removed_pr_2022
    UNION ALL SELECT policy_no FROM pip_log.removed_pr_2023
    UNION ALL SELECT policy_no FROM pip_log.removed_pr_2024

    UNION ALL SELECT policy_no FROM pip_log.claim_removed_reason
)
SELECT COUNT(DISTINCT policy_no) AS cnt
FROM combined
WHERE policy_no IS NOT NULL;

        """

        try:
            conn = psycopg2.connect(**DB)

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(count_sql)
                total = cur.fetchone()["cnt"]

                cur.execute(sql, {"limit": page_size, "offset": offset})
                rows = cur.fetchall()

        except Exception as e:
            print("SilverRemovedPoliciesView Error:", e)
            return Response(
                {"status": "error", "message": str(e)},
                status=500
            )
        finally:
            try:
                conn.close()
            except:
                pass

        return Response({
            "status": "success",
            "page": page,
            "page_size": page_size,
            "total_rows": total,
            "total_pages": math.ceil(total / page_size),
            "rows": rows
        })
    
class RemovedDuplicatePoliciesCountView(APIView):

    def get(self, request):
        DB = settings.EXTERNAL_DATABASES["DB_Azure_Prochurn_Airflow"]

        try:
            conn = psycopg2.connect(**DB)

            with conn.cursor() as cur:
                cur.execute("""
                    SELECT COUNT(DISTINCT policy_no)
                    FROM pip_log.removed_duplicate_policies
                    WHERE policy_no IS NOT NULL;
                """)
                count = cur.fetchone()[0]

        except Exception as e:
            print("RemovedDuplicatePoliciesCountView Error:", e)
            return Response(
                {"status": "error", "message": str(e)},
                status=500
            )
        finally:
            try:
                conn.close()
            except:
                pass

        return Response({
            "status": "success",
            "duplicate_policy_count": count
        })


class PipelineStageSummaryView(APIView):
    def get(self, request):
        DB = settings.EXTERNAL_DATABASES["DB_Azure_Prochurn_Airflow"]

        try:
            conn = psycopg2.connect(**DB)

            with conn.cursor(cursor_factory=RealDictCursor) as cur:

                # ================= RAW STAGE =================
                cur.execute("""
                    SELECT 
                        initial_available_columns,
                        total_policies,
                        total_rows
                    FROM public.raw_stage_summary
                    LIMIT 1;
                """)
                raw = cur.fetchone() or {}

                # ================= SILVER STAGE =================
                cur.execute("""
                    SELECT 
                        dropped_columns
                    FROM public.silver_stage_summary_4
                    LIMIT 1;
                """)
                silver = cur.fetchone() or {}

                # ================= GOLD STAGE =================
                cur.execute("""
                    SELECT 
                        total_policies,
                        number_of_columns,
                        total_rows
                    FROM public.gold_stage_summary
                    LIMIT 1;
                """)
                gold = cur.fetchone() or {}

        except Exception as e:
            print("PipelineStageSummaryView Error:", e)
            return Response(
                {"status": "error", "message": str(e)},
                status=500
            )
        finally:
            try:
                conn.close()
            except:
                pass

        # ================= MAP TO REACT =================
        payload = {
            "status": "success",

            "rawStageDetails": {
                "columnsCleared": raw.get("initial_available_columns", 0),
                "duplicatesRemoved": raw.get("total_policies", 0),
                "unnecessaryColumnsDropped": raw.get("total_rows", 0),
            },

            "silverStageDetails": {
                
                "duplicatesFound": silver.get("dropped_columns", 0),
            },

            "goldStageDetails": {
                "baseDataAppended": gold.get("total_policies", 0),
                "customerIdGenerated": gold.get("number_of_columns", 0),
                "renColumnAdded": gold.get("total_rows", 0),
            }
        }

        return Response(payload, status=200)
    #git check
