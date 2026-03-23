from django.urls import path
from . import views

urlpatterns = [
    path("integrations/hubspot/object-types", views.hubspot_object_types),
    path("integrations/hubspot/properties", views.hubspot_properties),
    path("integrations/hubspot/preview", views.hubspot_preview),
    path("integrations/zoho/auth-url", views.zoho_auth_url),
    path("integrations/zoho/exchange-code", views.zoho_exchange_code),
    path("integrations/zoho/refresh-token", views.zoho_refresh_token),
    path("integrations/zoho/modules", views.zoho_modules),
    path("integrations/zoho/fields", views.zoho_fields),
    path("integrations/zoho/preview", views.zoho_preview),
    path("integrations/salesforce/auth-url", views.salesforce_auth_url),
    path("integrations/salesforce/exchange-code", views.salesforce_exchange_code),
    path("integrations/salesforce/refresh-token", views.salesforce_refresh_token),
    path("integrations/salesforce/sobjects", views.salesforce_sobjects),
    path("integrations/salesforce/fields", views.salesforce_fields),
    path("integrations/salesforce/preview", views.salesforce_preview),
]   
