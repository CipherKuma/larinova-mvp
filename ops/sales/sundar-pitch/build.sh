#!/usr/bin/env bash
# Regenerate all 4 Sundar pitch PDFs from their HTML sources.
# Usage: ./build.sh   (run from this directory or any other)

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WP="${WEASYPRINT:-/opt/homebrew/bin/weasyprint}"

if ! command -v "$WP" &>/dev/null; then
  echo "Error: weasyprint not found at $WP" >&2
  echo "Install: pip install weasyprint" >&2
  exit 1
fi

for f in deck memo cap-table-appendix use-of-funds-appendix; do
  echo "Building $f.pdf..."
  "$WP" "$SCRIPT_DIR/$f.html" "$SCRIPT_DIR/$f.pdf"
done

echo "Done. PDFs in: $SCRIPT_DIR"
ls -la "$SCRIPT_DIR"/*.pdf
