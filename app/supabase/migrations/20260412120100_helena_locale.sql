-- Migration: Add locale column to helena_conversations
-- Conversations are locale-tagged so a conversation started in /in stays English
-- even if the doctor later switches to /id.

BEGIN;

ALTER TABLE helena_conversations
  ADD COLUMN IF NOT EXISTS locale TEXT
  CHECK (locale IS NULL OR locale IN ('in', 'id'));

-- Backfill all existing conversations to India locale (current user base)
UPDATE helena_conversations
  SET locale = 'in'
  WHERE locale IS NULL;

COMMIT;
