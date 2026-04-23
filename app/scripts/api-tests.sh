#!/usr/bin/env bash
# API route smoke tests for local dev.
#
# Each section runs happy-path + at least one error case per endpoint.
# Run `pnpm dev` in another terminal, then: bash scripts/api-tests.sh
#
# Env:
#   BASE_URL         default http://localhost:3000
#   SIMULATE_RAZORPAY=1  recommended so /api/razorpay/* answers without
#                        real keys. The dev server must have the same var
#                        exported in its environment for the route to honour it.

set -u

BASE_URL="${BASE_URL:-http://localhost:3000}"

pass=0
fail=0
fails=()

expect_status() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  ok  $label (HTTP $actual)"
    pass=$((pass + 1))
  else
    echo "  !!  $label (expected $expected, got $actual)"
    fail=$((fail + 1))
    fails+=("$label")
  fi
}

curl_status() {
  curl -s -o /dev/null -w "%{http_code}" "$@"
}

###############################################################################
# RAZORPAY
###############################################################################

echo "=== Razorpay ==="

# healthz — always public, should return 200
status=$(curl_status "$BASE_URL/api/razorpay/healthz")
expect_status "GET /api/razorpay/healthz" "200" "$status"

# create-subscription — without auth should be 401
status=$(curl_status -X POST "$BASE_URL/api/razorpay/create-subscription" \
  -H "content-type: application/json" \
  -d '{"interval":"month"}')
# 401 if unauthed, 503 if not configured — either is acceptable depending on env.
if [[ "$status" == "401" || "$status" == "503" ]]; then
  echo "  ok  POST /api/razorpay/create-subscription (unauthed → $status)"
  pass=$((pass + 1))
else
  echo "  !!  POST /api/razorpay/create-subscription (expected 401 or 503, got $status)"
  fail=$((fail + 1))
  fails+=("POST create-subscription unauthed")
fi

# create-subscription — invalid body should be 400 (if auth is bypassed) or 401 (if not)
status=$(curl_status -X POST "$BASE_URL/api/razorpay/create-subscription" \
  -H "content-type: application/json" \
  -d '{"interval":"decade"}')
if [[ "$status" == "400" || "$status" == "401" || "$status" == "503" ]]; then
  echo "  ok  POST /api/razorpay/create-subscription (bad interval → $status)"
  pass=$((pass + 1))
else
  echo "  !!  POST /api/razorpay/create-subscription (expected 400/401/503, got $status)"
  fail=$((fail + 1))
  fails+=("POST create-subscription bad body")
fi

# verify — without signature should be 400 (when configured) or 503 (unconfigured)
status=$(curl_status -X POST "$BASE_URL/api/razorpay/verify" \
  -H "content-type: application/json" \
  -d '{}')
if [[ "$status" == "400" || "$status" == "401" || "$status" == "503" ]]; then
  echo "  ok  POST /api/razorpay/verify (empty body → $status)"
  pass=$((pass + 1))
else
  echo "  !!  POST /api/razorpay/verify (expected 400/401/503, got $status)"
  fail=$((fail + 1))
  fails+=("POST verify empty")
fi

# webhook — missing signature should be 400 (or 503 if unconfigured)
status=$(curl_status -X POST "$BASE_URL/api/razorpay/webhook" \
  -H "content-type: application/json" \
  -d '{"event":"subscription.activated"}')
if [[ "$status" == "400" || "$status" == "503" ]]; then
  echo "  ok  POST /api/razorpay/webhook (missing signature → $status)"
  pass=$((pass + 1))
else
  echo "  !!  POST /api/razorpay/webhook (expected 400/503, got $status)"
  fail=$((fail + 1))
  fails+=("POST webhook unsigned")
fi

# webhook — happy path with a valid HMAC (only runs when RAZORPAY_WEBHOOK_SECRET is set).
if [[ -n "${RAZORPAY_WEBHOOK_SECRET:-}" ]]; then
  body='{"event":"subscription.activated","id":"evt_test_'$(date +%s)'","payload":{"subscription":{"entity":{"id":"sub_test_1","status":"active","current_end":1800000000,"notes":{"interval":"month"}}}}}'
  sig=$(printf '%s' "$body" | openssl dgst -sha256 -hmac "$RAZORPAY_WEBHOOK_SECRET" -hex | awk '{print $2}')
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/razorpay/webhook" \
    -H "content-type: application/json" \
    -H "x-razorpay-signature: $sig" \
    -H "x-razorpay-event-id: evt_test_$(date +%s)" \
    -d "$body")
  expect_status "POST /api/razorpay/webhook (signed subscription.activated)" "200" "$status"
else
  echo "  -- skipping signed webhook test (RAZORPAY_WEBHOOK_SECRET unset)"
fi

###############################################################################
# SUMMARY
###############################################################################

echo
echo "=== Summary ==="
echo "passed: $pass"
echo "failed: $fail"
if [[ "$fail" -gt 0 ]]; then
  for f in "${fails[@]}"; do
    echo "  - $f"
  done
  exit 1
fi
exit 0
