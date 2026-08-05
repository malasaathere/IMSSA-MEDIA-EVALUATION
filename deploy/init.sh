#!/bin/sh

echo "Waiting for Appwrite to be healthy..."
while ! curl -s http://traefik/v1/health > /dev/null; do
  sleep 5
done
echo "Appwrite is up!"

echo "Running schema setup..."
cd infra/appwrite

if [ -z "$APPWRITE_PROJECT_ID" ]; then
  echo "Error: APPWRITE_PROJECT_ID is not set. Please create a project in the Appwrite console and set the environment variables in deploy/.env!"
  exit 1
fi

node setup-schema.js
node setup-buckets.js
node setup-functions.js
node fix_permissions.js
node fix_tasks.js

echo "Backend Initialization Complete!"
