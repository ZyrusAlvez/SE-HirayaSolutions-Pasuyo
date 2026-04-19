import base64
import os
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]
CREDENTIALS_FILE = os.path.join(os.path.dirname(__file__), os.getenv("GMAIL_CREDENTIALS_FILE", "credentials.json"))
TOKEN_FILE = os.path.join(os.path.dirname(__file__), os.getenv("GMAIL_TOKEN_FILE", "token.json"))


def get_service():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
    return build("gmail", "v1", credentials=creds)


def main():
    service = get_service()

    results = service.users().messages().list(
        userId="me",
        maxResults=5,
    ).execute()

    messages = results.get("messages", [])
    if not messages:
        print("No messages found.")
        return

    print("5 most recent messages:\n")
    for i, msg_ref in enumerate(messages, 1):
        msg = service.users().messages().get(
            userId="me",
            id=msg_ref["id"],
            format="metadata",
            metadataHeaders=["From", "Subject", "Date"],
        ).execute()

        headers = {h["name"]: h["value"] for h in msg["payload"]["headers"]}
        print(f"[{i}]")
        print(f"  From   : {headers.get('From', 'N/A')}")
        print(f"  Subject: {headers.get('Subject', 'N/A')}")
        print(f"  Date   : {headers.get('Date', 'N/A')}")
        print()

    # Show full content of the most recent message
    print("=" * 60)
    print("CONTENT OF MOST RECENT MESSAGE")
    print("=" * 60)
    full_msg = service.users().messages().get(
        userId="me",
        id=messages[0]["id"],
        format="full",
    ).execute()

    payload = full_msg.get("payload", {})
    parts = payload.get("parts", [])
    html_body = None
    text_body = None

    if parts:
        for part in parts:
            if part.get("mimeType") == "text/html" and not html_body:
                data = part["body"].get("data", "")
                html_body = base64.urlsafe_b64decode(data).decode("utf-8")
            elif part.get("mimeType") == "text/plain" and not text_body:
                data = part["body"].get("data", "")
                text_body = base64.urlsafe_b64decode(data).decode("utf-8")
    else:
        data = payload.get("body", {}).get("data", "")
        if data:
            text_body = base64.urlsafe_b64decode(data).decode("utf-8")

    if html_body:
        soup = BeautifulSoup(html_body, "html.parser")
        print(soup.get_text(separator="\n", strip=True))
    elif text_body:
        print(text_body)
    else:
        print("No readable content found.")


if __name__ == "__main__":
    main()
