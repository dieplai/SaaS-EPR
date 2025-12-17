#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_CLOUD_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY) if QDRANT_API_KEY else QdrantClient(QDRANT_URL)

# List all collections
collections = client.get_collections()
print("📊 Collections in Qdrant:")
print("="*70)

for collection in collections.collections:
    info = client.get_collection(collection.name)
    print(f"\n🔹 {collection.name}")
    print(f"   Points: {info.points_count}")

    # Get first point to check structure
    try:
        points = client.scroll(collection_name=collection.name, limit=1, with_payload=True)[0]
        if points:
            print(f"   Payload keys: {list(points[0].payload.keys())}")
            print(f"   Sample: {str(points[0].payload)[:200]}...")
    except Exception as e:
        print(f"   Error getting sample: {e}")
