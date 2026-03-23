import os, json
from urllib.parse import urlparse, parse_qs
from google_auth_oauthlib.flow import Flow

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
CRED = os.getenv("GMAIL_CREDENTIALS_FILE", "/var/www/prowesstics/secure/gmail/credentials.json")
TOK  = os.getenv("GMAIL_TOKEN_FILE", "/var/www/prowesstics/secure/gmail/token.json")
REDIRECT_URI = "http://127.0.0.1:8081/"

flow = Flow.from_client_secrets_file(CRED, scopes=SCOPES, redirect_uri=REDIRECT_URI)
auth_url, _ = flow.authorization_url(
    access_type="offline", include_granted_scopes="true", prompt="consent"
)
print("\nOpen this URL, approve, then copy the FULL redirected URL here:\n", auth_url)
redirected = input("\nPaste redirected URL: ").strip()
code = parse_qs(urlparse(redirected).query).get("code", [None])[0]
assert code, "No code in pasted URL!"

flow.fetch_token(code=code)
creds = flow.credentials
os.makedirs(os.path.dirname(TOK) or ".", exist_ok=True)
open(TOK, "w").write(creds.to_json())
print("✅ Wrote", TOK)