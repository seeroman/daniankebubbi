import os
import datetime
import subprocess
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# PostgreSQL connection (from Render environment)
DB_URL = os.getenv("postgresql://rders_production_user:vaqQuge2TLNM4mO9AVhs3qnaZQPb5K3Y@dpg-d1689jggjchc7397eu4g-a/rders_production")
BACKUP_DIR = "/tmp/backups"
os.makedirs(BACKUP_DIR, exist_ok=True)

# Google Drive setup
SCOPES = ["https://www.googleapis.com/auth/drive.file"]
CREDS_FILE = "credentials.json"  # Upload this to Render

def backup_postgres():
    # Create filename with timestamp
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_file = f"{BACKUP_DIR}/backup_{timestamp}.sql"
    
    # Dump PostgreSQL
    subprocess.run(f"pg_dump {DB_URL} > {backup_file}", shell=True, check=True)
    return backup_file

def upload_to_gdrive(file_path):
    # Authenticate with Google Drive
    flow = InstalledAppFlow.from_client_secrets_file(CREDS_FILE, SCOPES)
    creds = flow.run_local_server(port=0)
    service = build("drive", "v3", credentials=creds)
    
    # Upload file
    file_metadata = {"name": os.path.basename(file_path), "parents": ["FOLDER_ID"]}
    media = MediaFileUpload(file_path, mimetype="application/sql")
    file = service.files().create(body=file_metadata, media_body=media, fields="id").execute()
    print(f"Uploaded to Google Drive: {file.get('id')}")

if __name__ == "__main__":
    backup_path = backup_postgres()
    upload_to_gdrive(backup_path)
