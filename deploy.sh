#!/bin/bash

ENV=$1

if [ -z "$ENV" ]; then
  echo "Usage: ./deploy.sh [test|prod]"
  exit 1
fi

echo "Building..."
npm run build || { echo "Build failed"; exit 1; }

if [ "$ENV" = "test" ]; then
  echo "Deploying to test (flynt-website.web.app)..."
  firebase deploy --only hosting:flynt-website --project flynt-test

elif [ "$ENV" = "prod" ]; then
  echo "Deploying to prod (tryflynt.ai)..."
  firebase deploy --only hosting:flynt-website --project flynt-ai

else
  echo "Unknown environment: $ENV. Use 'test' or 'prod'."
  exit 1
fi
