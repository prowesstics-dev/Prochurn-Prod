#################################### HUBSPOT ######################################################
import requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

HUBSPOT_API_BASE = "https://api.hubapi.com"

def hs_get(access_token: str, path: str, params=None):
    headers = {"Authorization": f"Bearer {access_token}"}
    return requests.get(
        f"{HUBSPOT_API_BASE}{path}",
        headers=headers,
        params=params or {},
        timeout=30,
    )

@api_view(["POST"])
def hubspot_object_types(request):
    """
    Body: { "access_token": "pat-xxxx" }

    Returns:
      - Standard object types (Contacts/Companies/Deals/Tickets) ALWAYS
      - Custom object schemas (if portal has any) from Schemas API
    """
    token = request.data.get("access_token")
    if not token:
        return Response({"error": "access_token is required"}, status=400)

    # ✅ Standard objects (these are not returned by Schemas API)
    standard = [
        {"value": "0-1", "label": "Contacts", "metaType": "STANDARD", "name": "contacts"},
        {"value": "0-2", "label": "Companies", "metaType": "STANDARD", "name": "companies"},
        {"value": "0-3", "label": "Deals", "metaType": "STANDARD", "name": "deals"},
        {"value": "0-5", "label": "Tickets", "metaType": "STANDARD", "name": "tickets"},
    ]

    # Try custom schemas (may be empty if portal doesn't support/has none)
    r = hs_get(token, "/crm-object-schemas/v3/schemas", params={"archived": "false"})

    custom = []
    warning = None

    if r.status_code == 200:
        data = r.json() or {}
        results = data.get("results", []) or []

        for s in results:
            labels = s.get("labels") or {}
            label = labels.get("plural") or labels.get("singular") or s.get("name") or "Unknown"

            # Prefer objectTypeId if present (some portals include it)
            object_type_id = s.get("objectTypeId")

            # Your existing safe derivation logic
            if not object_type_id:
                assocs = s.get("associations") or []
                if assocs and isinstance(assocs, list):
                    object_type_id = (assocs[0] or {}).get("fromObjectTypeId")

            if not object_type_id and s.get("id"):
                object_type_id = f"2-{s.get('id')}"

            if not object_type_id:
                object_type_id = s.get("name")

            custom.append({
                "value": object_type_id,
                "label": label,
                "metaType": s.get("metaType"),
                "name": s.get("name"),
            })
    else:
        # Don't fail the whole call — still return standard objects
        warning = "Unable to load custom objects from HubSpot Schemas API for this token/portal."
        # Keep detail for debugging
        return Response(
            {
                "object_types": standard,
                "warning": warning,
                "detail": r.text,
            },
            status=200,
        )

    # Merge standard + custom without duplicates (by value)
    seen = set()
    merged = []
    for item in (standard + custom):
        v = item.get("value")
        if not v or v in seen:
            continue
        seen.add(v)
        merged.append(item)

    merged.sort(key=lambda x: (x.get("label") or "").lower())

    resp = {"object_types": merged}
    if warning:
        resp["warning"] = warning
    return Response(resp)



@api_view(["POST"])
# @permission_classes([IsAuthenticated])
def hubspot_properties(request):
    """
    Body:
    {
      "access_token": "pat-xxxx",
      "object_type_id": "0-1" | "0-2" | "0-3" | "2-123456" | ...
    }

    Uses: GET /crm/v3/properties/{objectTypeId} :contentReference[oaicite:4]{index=4}
    """
    token = request.data.get("access_token")
    object_type_id = request.data.get("object_type_id")

    if not token:
        return Response({"error": "access_token is required"}, status=400)
    if not object_type_id:
        return Response({"error": "object_type_id is required"}, status=400)

    r = hs_get(token, f"/crm/v3/properties/{object_type_id}")
    if r.status_code != 200:
        return Response({"error": "HubSpot request failed", "detail": r.text}, status=r.status_code)

    props = (r.json() or {}).get("results", []) or []
    slim = [{
        "name": p.get("name"),
        "label": p.get("label"),
        "type": p.get("type"),
        "fieldType": p.get("fieldType"),
        "groupName": p.get("groupName"),
    } for p in props]

    return Response({"object_type_id": object_type_id, "properties": slim})


@api_view(["POST"])
# @permission_classes([IsAuthenticated])
def hubspot_preview(request):
    """
    Body:
    {
      "access_token": "pat-xxxx",
      "object_type_id": "0-1" | "2-123456" | ...,
      "limit": 20,
      "properties": ["email","firstname"]   # optional
    }

    Uses: GET /crm/v3/objects/{objectTypeId} :contentReference[oaicite:5]{index=5}
    """
    token = request.data.get("access_token")
    object_type_id = request.data.get("object_type_id")
    limit = int(request.data.get("limit", 20))
    props = request.data.get("properties")

    if not token:
        return Response({"error": "access_token is required"}, status=400)
    if not object_type_id:
        return Response({"error": "object_type_id is required"}, status=400)

    params = {"limit": limit}
    if isinstance(props, list) and props:
        params["properties"] = ",".join(props)

    r = hs_get(token, f"/crm/v3/objects/{object_type_id}", params=params)
    if r.status_code != 200:
        return Response({"error": "HubSpot request failed", "detail": r.text}, status=r.status_code)

    j = r.json() or {}
    results = j.get("results", []) or []

    items = [{
        "id": row.get("id"),
        "properties": row.get("properties", {}) or {},
        "createdAt": row.get("createdAt"),
        "updatedAt": row.get("updatedAt"),
    } for row in results]

    return Response({
        "object_type_id": object_type_id,
        "count": len(items),
        "items": items,
        "paging": j.get("paging"),
    })

######################################## ZOHO CRM ####################################################

import requests
from urllib.parse import urlencode

from rest_framework.decorators import api_view
from rest_framework.response import Response

ZOHO_CRM_VERSION = "v8"

def _norm_https(domain_or_url: str) -> str:
    s = (domain_or_url or "").strip()
    if not s:
        return ""
    if s.startswith("http://") or s.startswith("https://"):
        return s.rstrip("/")
    return f"https://{s}".rstrip("/")

def zoho_token_post(accounts_domain: str, data: dict):
    base = _norm_https(accounts_domain)
    url = f"{base}/oauth/v2/token"
    return requests.post(url, data=data, timeout=30)

def zoho_get(api_domain: str, access_token: str, path: str, params=None):
    base = _norm_https(api_domain)
    url = f"{base}{path}"
    headers = {"Authorization": f"Zoho-oauthtoken {access_token}"}
    return requests.get(url, headers=headers, params=params or {}, timeout=30)

@api_view(["POST"])
def zoho_auth_url(request):
    """
    Body:
    {
      "accounts_domain": "accounts.zoho.in" | "accounts.zoho.com" | ...,
      "client_id": "...",
      "redirect_uri": "https://yourapp/connectors",
      "scopes": "ZohoCRM.modules.ALL,ZohoCRM.settings.ALL",
      "state": "random_state"
    }
    """
    accounts_domain = request.data.get("accounts_domain")
    client_id = request.data.get("client_id")
    redirect_uri = request.data.get("redirect_uri")
    scopes = request.data.get("scopes")
    state = request.data.get("state")

    if not accounts_domain or not client_id or not redirect_uri or not scopes or not state:
        return Response({"error": "accounts_domain, client_id, redirect_uri, scopes, state are required"}, status=400)

    base = _norm_https(accounts_domain)
    params = {
        "scope": scopes,
        "client_id": client_id,
        "response_type": "code",
        "access_type": "offline",
        "prompt": "consent",
        "redirect_uri": redirect_uri,
        "state": state,
    }
    return Response({"auth_url": f"{base}/oauth/v2/auth?{urlencode(params)}"})

@api_view(["POST"])
def zoho_exchange_code(request):
    """
    Body:
    {
      "accounts_domain": "accounts.zoho.in",
      "client_id": "...",
      "client_secret": "...",
      "redirect_uri": "https://yourapp/connectors",
      "code": "1000.xxxxxx"
    }
    """
    accounts_domain = request.data.get("accounts_domain")
    client_id = request.data.get("client_id")
    client_secret = request.data.get("client_secret")
    redirect_uri = request.data.get("redirect_uri")
    code = request.data.get("code")

    if not accounts_domain or not client_id or not client_secret or not redirect_uri or not code:
        return Response({"error": "accounts_domain, client_id, client_secret, redirect_uri, code are required"}, status=400)

    r = zoho_token_post(accounts_domain, {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "code": code,
    })

    if r.status_code != 200:
        return Response({"error": "Zoho token exchange failed", "detail": r.text}, status=r.status_code)

    return Response(r.json())

@api_view(["POST"])
def zoho_refresh_token(request):
    """
    Body:
    {
      "accounts_domain": "accounts.zoho.in",
      "client_id": "...",
      "client_secret": "...",
      "refresh_token": "1000.xxxxxx"
    }
    """
    accounts_domain = request.data.get("accounts_domain")
    client_id = request.data.get("client_id")
    client_secret = request.data.get("client_secret")
    refresh_token = request.data.get("refresh_token")

    if not accounts_domain or not client_id or not client_secret or not refresh_token:
        return Response({"error": "accounts_domain, client_id, client_secret, refresh_token are required"}, status=400)

    r = zoho_token_post(accounts_domain, {
        "grant_type": "refresh_token",
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
    })

    if r.status_code != 200:
        return Response({"error": "Zoho refresh failed", "detail": r.text}, status=r.status_code)

    return Response(r.json())

@api_view(["POST"])
def zoho_modules(request):
    """
    Body:
    { "api_domain": "https://www.zohoapis.in", "access_token": "..." }
    """
    api_domain = request.data.get("api_domain")
    access_token = request.data.get("access_token")

    if not api_domain or not access_token:
        return Response({"error": "api_domain and access_token are required"}, status=400)

    path = f"/crm/{ZOHO_CRM_VERSION}/settings/modules"
    r = zoho_get(api_domain, access_token, path)

    if r.status_code != 200:
        return Response({"error": "Zoho modules request failed", "detail": r.text}, status=r.status_code)

    j = r.json() or {}
    modules = j.get("modules", []) or []

    slim = []
    for m in modules:
        slim.append({
            "api_name": m.get("api_name"),
            "module_name": m.get("module_name"),
            "plural_label": m.get("plural_label"),
            "singular_label": m.get("singular_label"),
            "modified_time": m.get("modified_time"),
            "generated_type": m.get("generated_type"),
            "visible": m.get("visible"),
        })

    # keep only modules having api_name
    slim = [x for x in slim if x.get("api_name")]
    slim.sort(key=lambda x: (x.get("plural_label") or x.get("module_name") or x["api_name"]).lower())

    return Response({"modules": slim})

@api_view(["POST"])
def zoho_fields(request):
    """
    Body:
    { "api_domain": "...", "access_token": "...", "module_api_name": "Contacts" }
    """
    api_domain = request.data.get("api_domain")
    access_token = request.data.get("access_token")
    module_api_name = request.data.get("module_api_name")

    if not api_domain or not access_token or not module_api_name:
        return Response({"error": "api_domain, access_token, module_api_name are required"}, status=400)

    path = f"/crm/{ZOHO_CRM_VERSION}/settings/fields"
    r = zoho_get(api_domain, access_token, path, params={"module": module_api_name})

    if r.status_code != 200:
        return Response({"error": "Zoho fields request failed", "detail": r.text}, status=r.status_code)

    j = r.json() or {}
    fields = j.get("fields", []) or []

    slim = []
    for f in fields:
        slim.append({
            "api_name": f.get("api_name"),
            "field_label": f.get("field_label"),
            "data_type": f.get("data_type"),
            "system_mandatory": f.get("system_mandatory"),
            "visible": f.get("visible"),
            "read_only": f.get("read_only"),
            "required": f.get("required"),
        })

    slim = [x for x in slim if x.get("api_name")]
    return Response({"module_api_name": module_api_name, "fields": slim})

@api_view(["POST"])
def zoho_preview(request):
    """
    Body:
    {
      "api_domain": "...",
      "access_token": "...",
      "module_api_name": "Contacts",
      "fields": ["Full_Name","Email"],
      "page": 1,
      "per_page": 20
    }
    """
    api_domain = request.data.get("api_domain")
    access_token = request.data.get("access_token")
    module_api_name = request.data.get("module_api_name")
    fields = request.data.get("fields") or []
    if not isinstance(fields, list):
        return Response({"error": "fields must be a list"}, status=400)

# ✅ clean + enforce Zoho field limit
    fields = [f for f in fields if isinstance(f, str) and f.strip()]
    fields = fields[:50]
    page = int(request.data.get("page", 1))
    per_page = int(request.data.get("per_page", 20))

    if not api_domain or not access_token or not module_api_name:
        return Response({"error": "api_domain, access_token, module_api_name are required"}, status=400)
    if not isinstance(fields, list) or not fields:
        return Response({"error": "fields must be a non-empty list (Zoho requires fields)"}, status=400)

    path = f"/crm/{ZOHO_CRM_VERSION}/{module_api_name}"
    params = {
        "fields": ",".join(fields),
        "page": page,
        "per_page": per_page,
    }

    r = zoho_get(api_domain, access_token, path, params=params)

    if r.status_code != 200:
        return Response({"error": "Zoho records request failed", "detail": r.text}, status=r.status_code)

    return Response(r.json())


############################################ SALESFORCE ##################################################


# ######################################## SALESFORCE CRM ####################################################
import requests
from urllib.parse import urlencode

from rest_framework.decorators import api_view
from rest_framework.response import Response

SF_API_VERSION = "v60.0"   # you can change anytime (ex: v61.0)

def _norm_https(domain_or_url: str) -> str:
    s = (domain_or_url or "").strip()
    if not s:
        return ""
    if s.startswith("http://") or s.startswith("https://"):
        return s.rstrip("/")
    return f"https://{s}".rstrip("/")

def sf_token_post(login_domain: str, data: dict):
    base = _norm_https(login_domain)
    url = f"{base}/services/oauth2/token"
    return requests.post(url, data=data, timeout=30)

def sf_get(instance_url: str, access_token: str, path: str, params=None):
    base = _norm_https(instance_url)
    url = f"{base}{path}"
    headers = {"Authorization": f"Bearer {access_token}"}
    return requests.get(url, headers=headers, params=params or {}, timeout=30)

@api_view(["POST"])
def salesforce_auth_url(request):
    """
    Body:
    {
      "login_domain": "login.salesforce.com" | "test.salesforce.com" | "mydomain.my.salesforce.com",
      "client_id": "...",
      "redirect_uri": "http://localhost:5173/connectors",
      "scopes": "api refresh_token offline_access",
      "state": "sf_xxxxxx"
    }
    """
    login_domain = request.data.get("login_domain")
    client_id = request.data.get("client_id")
    redirect_uri = request.data.get("redirect_uri")
    scopes = request.data.get("scopes")
    state = request.data.get("state")

    if not login_domain or not client_id or not redirect_uri or not scopes or not state:
        return Response(
            {"error": "login_domain, client_id, redirect_uri, scopes, state are required"},
            status=400
        )

    base = _norm_https(login_domain)
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": scopes,   # space-separated scopes
        "state": state,
    }
    return Response({"auth_url": f"{base}/services/oauth2/authorize?{urlencode(params)}"})


@api_view(["POST"])
def salesforce_exchange_code(request):
    """
    Body:
    {
      "login_domain": "login.salesforce.com",
      "client_id": "...",
      "client_secret": "...",
      "redirect_uri": "http://localhost:5173/connectors",
      "code": "..."
    }
    """
    login_domain = request.data.get("login_domain")
    client_id = request.data.get("client_id")
    client_secret = request.data.get("client_secret")
    redirect_uri = request.data.get("redirect_uri")
    code = request.data.get("code")

    if not login_domain or not client_id or not client_secret or not redirect_uri or not code:
        return Response(
            {"error": "login_domain, client_id, client_secret, redirect_uri, code are required"},
            status=400
        )

    r = sf_token_post(login_domain, {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "code": code,
    })

    if r.status_code != 200:
        return Response({"error": "Salesforce token exchange failed", "detail": r.text}, status=r.status_code)

    return Response(r.json())


@api_view(["POST"])
def salesforce_refresh_token(request):
    """
    Body:
    {
      "login_domain": "login.salesforce.com",
      "client_id": "...",
      "client_secret": "...",
      "refresh_token": "..."
    }
    """
    login_domain = request.data.get("login_domain")
    client_id = request.data.get("client_id")
    client_secret = request.data.get("client_secret")
    refresh_token = request.data.get("refresh_token")

    if not login_domain or not client_id or not client_secret or not refresh_token:
        return Response(
            {"error": "login_domain, client_id, client_secret, refresh_token are required"},
            status=400
        )

    r = sf_token_post(login_domain, {
        "grant_type": "refresh_token",
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
    })

    if r.status_code != 200:
        return Response({"error": "Salesforce refresh failed", "detail": r.text}, status=r.status_code)

    return Response(r.json())


@api_view(["POST"])
def salesforce_sobjects(request):
    """
    Body:
    { "instance_url": "...", "access_token": "..." }
    """
    instance_url = request.data.get("instance_url")
    access_token = request.data.get("access_token")

    if not instance_url or not access_token:
        return Response({"error": "instance_url and access_token are required"}, status=400)

    path = f"/services/data/{SF_API_VERSION}/sobjects"
    r = sf_get(instance_url, access_token, path)

    if r.status_code != 200:
        return Response({"error": "Salesforce sobjects request failed", "detail": r.text}, status=r.status_code)

    j = r.json() or {}
    sobjects = j.get("sobjects", []) or []

    slim = []
    for o in sobjects:
        slim.append({
            "name": o.get("name"),
            "label": o.get("label"),
            "custom": o.get("custom"),
            "queryable": o.get("queryable"),
            "retrieveable": o.get("retrieveable"),
        })

    slim = [x for x in slim if x.get("name")]
    slim.sort(key=lambda x: (x.get("label") or x["name"]).lower())

    return Response({"sobjects": slim})


@api_view(["POST"])
def salesforce_fields(request):
    """
    Body:
    { "instance_url": "...", "access_token": "...", "sobject": "Account" }
    """
    instance_url = request.data.get("instance_url")
    access_token = request.data.get("access_token")
    sobject = request.data.get("sobject")

    if not instance_url or not access_token or not sobject:
        return Response({"error": "instance_url, access_token, sobject are required"}, status=400)

    path = f"/services/data/{SF_API_VERSION}/sobjects/{sobject}/describe"
    r = sf_get(instance_url, access_token, path)

    if r.status_code != 200:
        return Response({"error": "Salesforce fields request failed", "detail": r.text}, status=r.status_code)

    j = r.json() or {}
    fields = j.get("fields", []) or []

    slim = []
    for f in fields:
        slim.append({
            "name": f.get("name"),
            "label": f.get("label"),
            "type": f.get("type"),
            "nillable": f.get("nillable"),
            "createable": f.get("createable"),
            "updateable": f.get("updateable"),
            "filterable": f.get("filterable"),
        })

    slim = [x for x in slim if x.get("name")]
    return Response({"sobject": sobject, "fields": slim})


@api_view(["POST"])
def salesforce_preview(request):
    """
    Body:
    {
      "instance_url": "...",
      "access_token": "...",
      "sobject": "Account",
      "fields": ["Id","Name","Phone"],
      "limit": 20
    }
    """
    instance_url = request.data.get("instance_url")
    access_token = request.data.get("access_token")
    sobject = request.data.get("sobject")
    fields = request.data.get("fields") or []
    limit = int(request.data.get("limit", 20))

    if not instance_url or not access_token or not sobject:
        return Response({"error": "instance_url, access_token, sobject are required"}, status=400)

    if not isinstance(fields, list):
        return Response({"error": "fields must be a list"}, status=400)

    # clean + cap
    fields = [f for f in fields if isinstance(f, str) and f.strip()]
    fields = fields[:50]

    if "Id" not in fields:
        fields = ["Id"] + fields
        fields = fields[:50]

    if not fields:
        return Response({"error": "fields must be a non-empty list"}, status=400)

    soql = f"SELECT {', '.join(fields)} FROM {sobject} LIMIT {limit}"

    path = f"/services/data/{SF_API_VERSION}/query"
    r = sf_get(instance_url, access_token, path, params={"q": soql})

    if r.status_code != 200:
        return Response({"error": "Salesforce query failed", "detail": r.text}, status=r.status_code)

    j = r.json() or {}
    records = j.get("records", []) or []

    # remove "attributes"
    out = []
    for rec in records:
        if isinstance(rec, dict):
            rec = {k: v for k, v in rec.items() if k != "attributes"}
        out.append(rec)

    return Response({
        "sobject": sobject,
        "count": len(out),
        "totalSize": j.get("totalSize"),
        "done": j.get("done"),
        "records": out
    })


