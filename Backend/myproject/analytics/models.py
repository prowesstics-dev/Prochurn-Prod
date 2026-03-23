# analytics/models.py
from django.db import models

class AnalyticsEvent(models.Model):
    id = models.BigAutoField(primary_key=True)
    ts_ms = models.BigIntegerField(db_index=True)
    type = models.CharField(max_length=64, db_index=True)
    session_id = models.CharField(max_length=64, db_index=True)

    # NEW: normalized identity columns
    user_id = models.CharField(max_length=128, null=True, blank=True, db_index=True)
    user_email = models.CharField(max_length=256, null=True, blank=True, db_index=True)  # NEW
    user_name = models.CharField(max_length=256, null=True, blank=True)                  # NEW

    route = models.TextField(null=True, blank=True)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["type", "ts_ms"]),
            models.Index(fields=["session_id", "ts_ms"]),
            models.Index(fields=["user_email", "ts_ms"]),  # helpful for user views
        ]
    
class RequestMetric(models.Model):
    ts = models.DateTimeField(auto_now_add=True, db_index=True)
    route = models.CharField(max_length=256, db_index=True)
    method = models.CharField(max_length=8)
    status_code = models.SmallIntegerField()
    duration_ms = models.FloatField()
    is_error = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["ts"]),
            models.Index(fields=["route", "ts"]),
            models.Index(fields=["status_code", "ts"]),
        ]