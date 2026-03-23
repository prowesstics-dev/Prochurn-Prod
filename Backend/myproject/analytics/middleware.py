import time
from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone
from .models import RequestMetric, AnalyticsEvent




class RequestMetricsAndDownloadMiddleware(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        # store start time on request
        request._rm_start_ts = timezone.now()

    def process_response(self, request, response):
        try:
            start = getattr(request, "_rm_start_ts", None)
            if start is None:
                return response

            duration_ms = (timezone.now() - start).total_seconds() * 1000.0

            # --------------- RequestMetric ---------------
            RequestMetric.objects.create(
                ts=start,
                route=request.path,
                method=request.method,
                status_code=getattr(response, "status_code", 200),
                duration_ms=duration_ms,
                is_error=(500 <= getattr(response, "status_code", 200) < 600),
            )

            # --------------- CSV download tracking ---------------
            content_type = response.get("Content-Type", "")

            if "text/csv" in content_type:  # or any CSV types you use
                # derive identity however you already do it
                user_id = getattr(request.user, "id", None) if hasattr(request, "user") and request.user.is_authenticated else None
                user_email = getattr(request.user, "email", None) if hasattr(request, "user") and request.user.is_authenticated else None

                AnalyticsEvent.objects.create(
                    ts_ms=int(start.timestamp() * 1000),
                    type="download_csv",
                    session_id=request.headers.get("X-Session-Id", "")[:64],
                    user_id=str(user_id) if user_id else None,
                    user_email=user_email,
                    user_name=getattr(request.user, "get_full_name", lambda: None)(),
                    route=request.path,
                    data={"status": "success", "source": "api"},
                )

        except Exception:
            # don't break the user response if metrics fail
            pass

        return response

# class RequestMetricsMiddleware(MiddlewareMixin):
#     def __call__(self, request):
#         start = time.perf_counter()
#         try:
#             response = self.get_response(request)
#         except Exception:
#             duration = (time.perf_counter() - start) * 1000
#             # Record a 500 for unhandled exceptions
#             RequestMetric.objects.create(
#                 route=request.path[:256],
#                 method=request.method,
#                 status_code=500,
#                 duration_ms=duration,
#                 is_error=True,
#             )
#             raise
#         else:
#             duration = (time.perf_counter() - start) * 1000
#             status = getattr(response, "status_code", 500)
#             is_error = status >= 500
#             RequestMetric.objects.create(
#                 route=request.path[:256],
#                 method=request.method,
#                 status_code=status,
#                 duration_ms=duration,
#                 is_error=is_error,
#             )
#             return response