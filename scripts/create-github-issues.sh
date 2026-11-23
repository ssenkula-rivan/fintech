#!/usr/bin/env bash
# ==============================================================================
# Script: create-github-issues.sh
# Description: Automated publisher for GMG Fintech P0/P1/P2 issues to GitHub
# Repository: ssenkula-rivan/fintech
# Usage: GITHUB_TOKEN="ghp_xxx" ./scripts/create-github-issues.sh
# ==============================================================================

set -euo pipefail

REPO="ssenkula-rivan/fintech"

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "Error: GITHUB_TOKEN environment variable is not set."
  echo "Please set it with: export GITHUB_TOKEN=\"ghp_your_personal_access_token\""
  echo "Or install and authenticate with the GitHub CLI: gh auth login"
  exit 1
fi

echo "=========================================================="
echo "Creating GMG Fintech Architectural Issues on $REPO..."
echo "=========================================================="

create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"

  echo "Creating issue: $title"
  
  if command -v gh >/dev/null 2>&1; then
    gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$labels"
  else
    curl -s -X POST \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      "https://api.github.com/repos/$REPO/issues" \
      -d "$(jq -n \
            --arg t "$title" \
            --arg b "$body" \
            --argjson l "$(echo "$labels" | jq -R 'split(",")')" \
            '{title: $t, body: $b, labels: $l}')" >/dev/null
  fi
  echo "✓ Created: $title"
}

# Issue 1
create_issue \
  "[ISSUE-001] Transaction Lifecycle Management & State Machine Enforcement" \
  "### Priority: P0 - Blocker\n### Description\nImplement a strict finite state machine for all financial transactions (PENDING, PROCESSING, COMPLETED, FAILED, REVERSED, EXPIRED) preventing illegal state transitions.\n\n### Acceptance Criteria\n- Support defined transaction states\n- Enforce transition rules (e.g. COMPLETED cannot transition to PENDING)\n- Auto-expire PENDING after 15 minutes\n- Full state history timestamps and reasons" \
  "fintech-core,p0,backend"

# Issue 2
create_issue \
  "[ISSUE-002] Database Transaction Integrity (ACID) & Row-Level Locking" \
  "### Priority: P0 - Blocker\n### Description\nGuarantee ACID transaction semantics across wallet balance debits and credits.\n\n### Acceptance Criteria\n- Atomic multi-step database transactions with BEGIN/COMMIT/ROLLBACK\n- Pessimistic row-level locking (SELECT FOR UPDATE) on balance reads\n- READ COMMITTED minimum transaction isolation level\n- Complete rollback on intermediate failures" \
  "fintech-core,p0,database"

# Issue 3
create_issue \
  "[ISSUE-003] Idempotency Service for Duplicate Transaction Prevention" \
  "### Priority: P0 - Blocker\n### Description\nPrevent duplicate charges resulting from network retries or client duplicate calls.\n\n### Acceptance Criteria\n- Enforce X-Idempotency-Key header on mutation endpoints\n- Store keys and responses for minimum 24 hours\n- Return HTTP 409 if transaction is currently in PROCESSING\n- Return cached original response on repeated completed keys" \
  "api,p0,security"

# Issue 4
create_issue \
  "[ISSUE-004] Append-Only Audit Trail Logging with Cryptographic Hash Chain" \
  "### Priority: P0 - Blocker\n### Description\nImmutable audit logging with SHA-256 hash chains for tamper-evident compliance.\n\n### Acceptance Criteria\n- Append-only audit table with no UPDATE or DELETE privileges\n- Record old_value, new_value, user_id, ip_address, user_agent, timestamp\n- Cryptographic hash chaining linking each record to the previous hash" \
  "security,compliance,p0"

# Issue 5
create_issue \
  "[ISSUE-005] Telecom Payment Processing Logging & PII Masking (MTN & Airtel)" \
  "### Priority: P1 - High\n### Description\nDetailed logging and error capture for MTN MoMo and Airtel Money while strictly masking PII.\n\n### Acceptance Criteria\n- Mask phone numbers and strip PINs from telemetry\n- Store carrier reference numbers mapped to internal transaction IDs\n- Capture structured webhook payload events and error codes" \
  "telecom,p1,integrations"

# Issue 6
create_issue \
  "[ISSUE-006] Automated Compensating Transactions & Rollback Engine" \
  "### Priority: P1 - High\n### Description\nAutomatic reversal mechanism to execute inverse compensating actions when distributed multi-step transactions fail.\n\n### Acceptance Criteria\n- Register compensating actions prior to executing each forward step\n- Auto-rollback on carrier or downstream timeout\n- Escalate to manual review if compensation fails after 3 retries" \
  "distributed-systems,p1,reliability"

# Issue 7
create_issue \
  "[ISSUE-007] Distributed Saga Pattern Orchestration" \
  "### Priority: P1 - High\n### Description\nManage cross-service workflows across internal wallets, exchange, and external telco networks.\n\n### Acceptance Criteria\n- Persistent saga state surviving service restarts\n- Reverse-order compensation execution on failure\n- Telemetry on saga step duration and success metrics" \
  "distributed-systems,p1,architecture"

# Issue 8
create_issue \
  "[ISSUE-008] Referential Integrity & Daily Automated Balance Reconciliation" \
  "### Priority: P0 - Blocker\n### Description\nMathematical proof of system integrity: balance must strictly equal algebraic sum of historical transactions.\n\n### Acceptance Criteria\n- Database constraint preventing negative balances\n- Daily automated reconciliation job\n- Freeze wallet and dispatch P0 alert if discrepancy > 0 is detected" \
  "accounting,p0,audit"

# Issue 9
create_issue \
  "[ISSUE-009] Revenue, Fee Calculation & FX Conversion Spread Tracking" \
  "### Priority: P2 - Medium\n### Description\nTrack fee revenues, FX spreads, and promotional discounts across all transactions.\n\n### Acceptance Criteria\n- Categorize fees by type: transaction_fee, withdrawal_fee, conversion_spread\n- Store market rate vs applied user rate for all FX conversions\n- Aggregate daily/monthly revenue metrics" \
  "analytics,p2,revenue"

# Issue 10
create_issue \
  "[ISSUE-010] Two-Phase Commit (2PC) Protocol for External Settlements" \
  "### Priority: P1 - High\n### Description\nTwo-phase commit protocol bridging internal ledgers with external banking/clearing systems.\n\n### Acceptance Criteria\n- Phase 1 (Prepare): validate and reserve resources without commit\n- Phase 2 (Commit): finalize on consensus\n- Automatic abort and release if participant fails or times out (30s)" \
  "fintech-core,p1,architecture"

echo "=========================================================="
echo "All 10 Fintech Issues processed successfully!"
echo "View them at: https://github.com/$REPO/issues"
echo "=========================================================="

