from django.urls import path
from . import views

urlpatterns = [
    path("currency/refresh/", views.refresh_currency_rates),
    path("currency/latest", views.latest_currency_rates),
     path("segmentation-config", views.get_segmentation_config, name="get_segmentation_config"),
    path("segmentation-config/save", views.save_segmentation_config, name="save_segmentation_config"),
    path("segmentation-config/metrics", views.get_segment_metrics_config),
    path("segmentation-config/metrics/apply", views.apply_segment_metrics_to_final),
    path("segmentation-config/metrics/reset-final-from-backup", views.reset_final_from_backup),
    path("segmentation-config/segment-parameters", views.get_segment_parameters),
    path("segmentation-config/apply-segment-parameters", views.apply_segment_parameters),
    path("segmentation-config/actual-thresholds", views.get_actual_thresholds),
    path("segmentation-config/apply-thresholds", views.apply_thresholds_to_final),
    path("segmentation-config/reset-thresholds", views.reset_thresholds_to_default),
    path("segmentation-config/recompute-thresholds", views.recompute_thresholds_from_percentiles),
    path("email/gmail/auth-url/", views.gmail_auth_url),
    path("email/gmail/exchange/", views.gmail_exchange_and_save_token),
]   
