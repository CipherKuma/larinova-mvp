-- Fix foreign key constraint on larinova_documents.conversation_id
-- It should reference helena_conversations, not agent_conversations

-- Drop the existing foreign key constraint
ALTER TABLE larinova_documents
DROP CONSTRAINT IF EXISTS larinova_documents_conversation_id_fkey;

-- Add the correct foreign key constraint to helena_conversations
ALTER TABLE larinova_documents
ADD CONSTRAINT larinova_documents_conversation_id_fkey
FOREIGN KEY (conversation_id)
REFERENCES helena_conversations(id)
ON DELETE SET NULL;
