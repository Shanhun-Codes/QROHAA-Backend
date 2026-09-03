#!/bin/bash

set -e

echo ""
echo "Looking for latest QA workflow run..."
echo ""

RUN_ID=$(gh run list \
  --branch qa \
  --limit 1 \
  --json databaseId \
  --jq '.[0].databaseId')

if [ -z "$RUN_ID" ]; then
  echo "No QA workflow run found."
  exit 1
fi

echo "Watching QA run: $RUN_ID"
echo ""

gh run watch "$RUN_ID"

echo ""
echo "Final workflow summary:"
echo ""

gh run view "$RUN_ID"