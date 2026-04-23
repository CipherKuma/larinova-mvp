#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEASYPRINT="${WEASYPRINT:-/opt/homebrew/bin/weasyprint}"

if ! command -v "$WEASYPRINT" &>/dev/null; then
  echo "Error: weasyprint not found at $WEASYPRINT" >&2
  echo "Install: pip install weasyprint" >&2
  exit 1
fi

echo "Building India pricing strategy PDF..."
"$WEASYPRINT" \
  "$SCRIPT_DIR/india/pricing-strategy.html" \
  "$SCRIPT_DIR/india/pricing-strategy.pdf"

echo "Building Indonesia pricing strategy PDF..."
"$WEASYPRINT" \
  "$SCRIPT_DIR/indonesia/pricing-strategy.html" \
  "$SCRIPT_DIR/indonesia/pricing-strategy.pdf"

echo "Done."
echo "  docs/india/pricing-strategy.pdf"
echo "  docs/indonesia/pricing-strategy.pdf"
