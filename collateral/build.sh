#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Building Larinova collateral PDFs..."

weasyprint \
  "$SCRIPT_DIR/indonesia/one-pager.html" \
  "$SCRIPT_DIR/indonesia/one-pager.pdf"
echo "  indonesia/one-pager.pdf"

weasyprint \
  "$SCRIPT_DIR/india/one-pager.html" \
  "$SCRIPT_DIR/india/one-pager.pdf"
echo "  india/one-pager.pdf"

echo "Done."
