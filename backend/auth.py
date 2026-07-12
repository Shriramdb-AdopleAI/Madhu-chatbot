import os
from typing import Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "chat-app-32ee5")

async def verify_firebase_token(id_token: str) -> Optional[dict]:
    """Verify a Firebase ID token using Google's public endpoint."""
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={os.getenv('FIREBASE_WEB_API_KEY', 'AIzaSyBGhubJl1DFuOzYcjYUPBGBQ4r15dQLyIA')}"
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json={"idToken": id_token})
        if response.status_code == 200:
            data = response.json()
            users = data.get("users", [])
            if users:
                user = users[0]
                return {
                    "uid": user.get("localId"),
                    "email": user.get("email"),
                    "username": user.get("displayName", user.get("email", "").split("@")[0]),
                }
        return None
