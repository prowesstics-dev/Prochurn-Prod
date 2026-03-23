# myproject/celery.py
import os
from celery import Celery

# Set default Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")

app = Celery("myproject")

# Load config from Django settings
app.config_from_object("django.conf:settings", namespace="CELERY")

# Autodiscover tasks in installed apps
app.autodiscover_tasks()
