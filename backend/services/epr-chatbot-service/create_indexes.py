#!/usr/bin/env python3
"""
Create Qdrant indexes for law_collection to enable filtering by Dieu_Number
"""

import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import PayloadSchemaType

load_dotenv()

# Initialize Qdrant client
QDRANT_URL = os.getenv("QDRANT_CLOUD_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")

print(f"🔌 Connecting to Qdrant: {QDRANT_URL}")

if QDRANT_API_KEY:
    client = QdrantClient(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
    )
else:
    client = QdrantClient(QDRANT_URL)

# Collection names
collections = ["law_collection", "faq_collection"]

for collection_name in collections:
    print(f"\n{'='*70}")
    print(f"📍 Creating indexes for: {collection_name}")
    print(f"{'='*70}")

    try:
        # Check if collection exists
        collection_info = client.get_collection(collection_name)
        print(f"✅ Collection exists: {collection_name}")
        print(f"   Points: {collection_info.points_count}")

        # Create index for Dieu_Number field (for law_collection)
        if collection_name == "law_collection":
            try:
                print(f"\n🔧 Creating integer index for Dieu_Number field...")
                client.create_payload_index(
                    collection_name=collection_name,
                    field_name="Dieu_Number",
                    field_schema=PayloadSchemaType.INTEGER
                )
                print(f"✅ Created integer index for Dieu_Number")
            except Exception as e:
                if "already exists" in str(e):
                    print(f"ℹ️  Index already exists: {e}")
                else:
                    print(f"⚠️  Could not create Dieu_Number index: {e}")

        # Create index for source field
        try:
            print(f"🔧 Creating keyword index for source field...")
            client.create_payload_index(
                collection_name=collection_name,
                field_name="source",
                field_schema=PayloadSchemaType.KEYWORD
            )
            print(f"✅ Created keyword index for source")
        except Exception as e:
            if "already exists" in str(e):
                print(f"ℹ️  Index already exists: {e}")
            else:
                print(f"⚠️  Could not create source index: {e}")

        print(f"\n✅ Indexes setup complete for {collection_name}")

    except Exception as e:
        print(f"❌ Error with collection {collection_name}: {e}")

print(f"\n{'='*70}")
print(f"✅ Index creation completed!")
print(f"{'='*70}")
print(f"\nTest: Query should now work with Dieu_Number filter")
print(f"Example: Filtering by Dieu_Number = 77")
