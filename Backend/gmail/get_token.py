from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

# Use your "installed" credentials.json in this folder
flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)

# Start local server on 127.0.0.1:8081; don't try to open a browser
creds = flow.run_local_server(
    host="127.0.0.1",
    port=8081,
    access_type="offline",
    prompt="consent",
    open_browser=False,
    authorization_prompt_message="\nOpen this URL in your laptop browser:\n{url}\n\nAfter allowing access, you'll be redirected and this script will finish.\n",
)

open("token.json", "w").write(creds.to_json())
print("\nWrote token.json")
