#!/bin/bash

BASE_URL="http://localhost:3001"

echo "👉 Signing up as shipper..."
curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shipper@example.com",
    "password": "password123",
    "role": "SHIPPER"
  }' > signup_response.json

TOKEN=$(jq -r '.token' signup_response.json)

if [ "$TOKEN" == "null" ]; then
  echo "⚠️ Sign-up failed. Trying login instead..."
  curl -s -X POST $BASE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "shipper@example.com",
      "password": "password123"
    }' > login_response.json

  TOKEN=$(jq -r '.token' login_response.json)
  echo "✅ Logged in."
else
  echo "✅ Signed up and logged in."
fi

echo "🔐 JWT Token: $TOKEN"

echo "📦 Creating a load..."
curl -s -X POST $BASE_URL/loads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Los Angeles",
    "destination": "San Francisco",
    "weight": 1200,
    "budget": 1500,
    "deadline": "2025-08-01T00:00:00.000Z",
    "description": "Fragile items"
  }' | jq

echo "✅ Load created."

