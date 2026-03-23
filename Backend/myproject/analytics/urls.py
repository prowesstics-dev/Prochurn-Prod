# analytics/urls.py
from django.urls import path
from . import views



urlpatterns = [
    # path('', views.ingest),         # POST /analytics/ will hit ingest
    path('ingest/', views.ingest),  # POST /analytics/ingest/ will also hit ingest
    path('system-summary/', views.system_summary, name="system-summary"),
    path("available-dates/", views.available_dates, name="analytics-available-dates"),  
    path("sessions-over-time/", views.sessions_over_time),  
    path("module-hours/", views.module_hours, name="module-hours"), 
    path("peak-sessions-over-time/", views.peak_sessions_over_time, name="peak_sessions_over_time"), 
]
