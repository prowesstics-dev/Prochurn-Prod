from django.db import models
from django.conf import settings
from django.utils import timezone

class CurrencyRate(models.Model):
    base_currency = models.CharField(max_length=10)     # e.g., "USD"
    currency_code = models.CharField(max_length=10)     # e.g., "INR"
    rate = models.DecimalField(max_digits=18, decimal_places=6)  # INR per 1 USD
    fetched_at = models.DateTimeField(default=timezone.now)      # ✅ updates on save

    class Meta:
        unique_together = ("base_currency", "currency_code")

    def __str__(self):
        return f"1 {self.base_currency} -> {self.currency_code} : {self.rate} @ {self.fetched_at}"
    
class SegmentationConfig(models.Model):
    # user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="segmentation_config")
    segment_names = models.JSONField(default=dict, blank=True)   # {"platinum": "Elite Retainers", ...}
    thresholds = models.JSONField(default=dict, blank=True)      # optional if you want to persist thresholds too
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "SegmentationConfig (global)"


class SegmentMetricConfig(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="segment_metric_config",
        null=True,
        blank=True,
    )
    # stores {"platinum": {"churn":"Low","discount":"Mid","clv":"High"}, ...}
    segment_metrics = models.JSONField(default=dict, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"SegmentMetricConfig(user={self.user_id})"


class EmailConfig(models.Model):
    config_id = models.CharField(max_length=64, unique=True)  # "churn", "bulk"
    name = models.CharField(max_length=128)
    from_email = models.EmailField()

    created_at = models.DateTimeField(auto_now_add=True)

class GmailOAuthClient(models.Model):
    email_config = models.OneToOneField(
        EmailConfig, on_delete=models.CASCADE, related_name="oauth_client"
    )

    client_type = models.CharField(max_length=32, default="desktop")  # desktop/web
    client_id = models.CharField(max_length=512)
    client_secret = models.CharField(max_length=512)
    redirect_uris = models.JSONField(default=list, blank=True)

    raw_json = models.JSONField()  # store full JSON for audit/debug
    updated_at = models.DateTimeField(auto_now=True)

class GmailCredential(models.Model):
    email_config = models.OneToOneField(
        EmailConfig, on_delete=models.CASCADE, related_name="gmail_cred"
    )

    google_email = models.EmailField()  # the authorized gmail account
    access_token = models.TextField(blank=True, null=True)
    refresh_token = models.TextField(blank=True, null=True)
    token_expiry = models.DateTimeField(blank=True, null=True)
    scopes = models.TextField(blank=True, default="")

    updated_at = models.DateTimeField(auto_now=True)

    def is_expired(self):
        return (not self.token_expiry) or self.token_expiry <= timezone.now()