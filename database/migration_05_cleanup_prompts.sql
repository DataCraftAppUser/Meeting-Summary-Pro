-- ================================================================
-- Migration 05: Cleanup Legacy Prompts
-- ================================================================

BEGIN;

-- Remove old prompt IDs that are no longer used
DELETE FROM ai_prompts WHERE id IN ('PROCESS', 'TRANSLATE', 'ENRICH');

-- Ensure the 4 core processors are correctly named and described if they were overwritten
-- Meeting Summary
UPDATE ai_prompts 
SET name = 'Meeting Summary', 
    description = 'Focuses on extracting decisions, action items, and participants.' 
WHERE id = 'meeting';

-- Work Log
UPDATE ai_prompts 
SET name = 'Work Log', 
    description = 'Focuses on converting technical tasks into professional status reports.' 
WHERE id = 'work_log';

-- Knowledge Item
UPDATE ai_prompts 
SET name = 'Knowledge Item', 
    description = 'Focuses on hierarchical organization, technical clarity, and code block formatting.' 
WHERE id = 'knowledge_item';

-- Translator
UPDATE ai_prompts 
SET name = 'Translator', 
    description = 'A standalone layer to convert any processed text into high-level business English.' 
WHERE id = 'translator';

COMMIT;
