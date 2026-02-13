#!/bin/bash

# Get the short commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR"
TEMP_DIR="$SCRIPT_DIR/anime-list-manager"
ZIP_NAME="anime-list-manager-${COMMIT_HASH}.zip"
LATEST_ZIP="anime-list-manager-latest.zip"

# Clean up any existing temp directory and zips
rm -rf "$TEMP_DIR"
rm -f "$SCRIPT_DIR/$ZIP_NAME"
rm -f "$SCRIPT_DIR/$LATEST_ZIP"

# Create temp directory and copy files
mkdir -p "$TEMP_DIR"
cp -r \
  "$SOURCE_DIR/docker-compose.yml" \
  "$SOURCE_DIR/Dockerfile" \
  "$SOURCE_DIR/docker-entrypoint.sh" \
  "$SOURCE_DIR/package.json" \
  "$SOURCE_DIR/package-lock.json" \
  "$SOURCE_DIR/next.config.ts" \
  "$SOURCE_DIR/tsconfig.json" \
  "$SOURCE_DIR/postcss.config.mjs" \
  "$SOURCE_DIR/next-env.d.ts" \
  "$SOURCE_DIR/prisma" \
  "$SOURCE_DIR/src" \
  "$SOURCE_DIR/public" \
  "$TEMP_DIR/"

# Create the zip
cd "$SCRIPT_DIR"
zip -r "$ZIP_NAME" anime-list-manager -x "*.db" -x "*.db-journal"

# Create/overwrite the latest symlink
ln -sf "$ZIP_NAME" "$LATEST_ZIP"

# Clean up temp directory
rm -rf "$TEMP_DIR"

echo ""
echo "Created: $ZIP_NAME"
echo "Latest:  $LATEST_ZIP -> $ZIP_NAME"
echo ""
ls -lh "$SCRIPT_DIR/$ZIP_NAME" "$SCRIPT_DIR/$LATEST_ZIP"
