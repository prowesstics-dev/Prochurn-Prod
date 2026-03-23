from django.urls import path
from . import views
from .views import PipelineStatusView, BaseRemovedLogView, PRRemovedLogView, PipelineStageSummaryView ,ClaimRemovedLogView, SilverRemovedView,RemovedDuplicatePoliciesCountView


urlpatterns = [
    path("model-health/", views.model_health_dashboard, name="model_health_dashboard"),
    path("model-health-dates/", views.model_health_dates, name="model_health_dates"),
    path("pipeline-status", PipelineStatusView.as_view(), name="pipeline-status"),
    path("health/de/stages", views.de_stage_status),
    path("health/ml/stages", views.ml_stage_status),
    path("health/logs", views.pipeline_logs),
    path("health/debug/logs", views.pipeline_logs),
    path("logs/base/", BaseRemovedLogView.as_view()),
    path("logs/pr/", PRRemovedLogView.as_view()),
    path("logs/claim/", ClaimRemovedLogView.as_view()),
    path("pipeline-available-dates", views.pipeline_available_dates),
    path("SilverRemovedView", SilverRemovedView.as_view()),
    path("RemovedDuplicatePoliciesCountView", RemovedDuplicatePoliciesCountView.as_view()),
    path("PipelineStageSummaryView", PipelineStageSummaryView.as_view()),

]