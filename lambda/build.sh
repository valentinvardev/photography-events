#!/bin/bash
set -e
cd "$(dirname "$0")/watermark"
echo "Installing dependencies for Linux x64..."
npm install --platform=linux --arch=x64 --libc=glibc
echo "Zipping..."
zip -r ../watermark.zip . --exclude "*.sh"
echo ""
echo "Done → lambda/watermark.zip"
echo "Upload this file to your Lambda function."
