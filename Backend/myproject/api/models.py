from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.contrib.postgres.fields import JSONField
import os
from datetime import datetime


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=50, blank=True, null=True)
    name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female')], null=True, blank=True)
    organization = models.CharField(max_length=100, null=True, blank=True)
    # sector = models.CharField(max_length=100, null=True, blank=True)
    # designation = models.CharField(max_length=100, null=True, blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    groups = models.ManyToManyField(Group, related_name="customuser_set")
    user_permissions = models.ManyToManyField(Permission, related_name="customuser_permissions_set")

class UploadedFile(models.Model):
    category = models.CharField(max_length=255)
    file_path = models.CharField(max_length=1024)  # ✅ Store file path, NOT file content
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = "uploaded_files"
        app_label = "api"  # ✅ Ensure Django recognizes it for PostgreSQL

class UserRole(models.Model):
    role = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.role

class Page(models.Model):
    name = models.CharField(max_length=100)  # e.g., "Overview"
    path = models.CharField(max_length=100, blank=True, null=True)  # e.g., "/overview"

    def __str__(self):
        return self.name

class UserPageAccess(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    page = models.ForeignKey(Page, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'page')