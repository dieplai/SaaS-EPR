#!/usr/bin/env python3
import os
from qdrant_client import QdrantClient
from qdrant_client.models import PayloadSchemaType
from dotenv import load_dotenv

load_dotenv(override=True)

QDRANT_URL = os.getenv("QDRANT_CLOUD_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

print(f"Connecting to: {QDRANT_URL}")
print(f"API Key: {'***' + QDRANT_API_KEY[-10:] if QDRANT_API_KEY else 'None'}")

if QDRANT_API_KEY:
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
else:
    client = QdrantClient(QDRANT_URL)

print("\n🔧 Creating index for metadata.Dieu_Number...")

try:
    client.create_payload_index(
        collection_name="law_collection",
        field_name="metadata.Dieu_Number",
        field_schema=PayloadSchemaType.INTEGER
    )
    print("✅ Created index for metadata.Dieu_Number")
except Exception as e:
    if "already exists" in str(e).lower():
        print(f"ℹ️  Index already exists")
    else:
        print(f"⚠️  Error: {e}")

print("\n✅ Done!")
