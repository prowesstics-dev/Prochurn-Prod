from django.urls import path
from . import views


urlpatterns = [
    path("segments/", views.segments),
    path("process/", views.process_segment),
    path("review/", views.review),
    path("review/export/", views.review_export),
    path("change/update", views.update_changes),
    path("send_all/", views.send_all),
    path("send_selected/", views.send_selected),
    path("draft/update", views.update_draft, name="update_draft"),
    path("gmail/auth_url", views.gmail_auth_url, name="gmail_auth_url"),
    path("gmail/callback", views.gmail_oauth_callback, name="gmail_callback"),  # <-- name exists
    path("gmail/status", views.gmail_status, name="gmail_status"),
    path("gmail/revoke", views.gmail_revoke, name="gmail_revoke"),
]
