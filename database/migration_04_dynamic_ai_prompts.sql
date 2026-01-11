-- ================================================================
-- Migration 04: Dynamic AI Prompts & Configuration
-- ================================================================

BEGIN;

-- 1. Add configuration column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_prompts' AND column_name = 'configuration') THEN
        ALTER TABLE ai_prompts ADD COLUMN configuration JSONB DEFAULT '{"temperature": 0.7}'::JSONB;
        RAISE NOTICE '✅ Column "configuration" added to "ai_prompts"';
    END IF;
END $$;

-- 2. Insert/Update the 4 Core AI Processors
-- meeting, work_log, knowledge_item, translator

-- Meeting Summary (Previously 'PROCESS')
INSERT INTO ai_prompts (id, name, content, description, configuration) VALUES 
('meeting', 'Meeting Summary', 'תפקיד: אתה עוזר מקצועי לניתוח ופרמול סיכומי פגישות.

המשימה:
קרא את הטקסט הגולמי, זהה החלטות, משימות ונושאים מרכזיים.
ארגן את המידע למבנה פורמלי וברור.
שפר ניסוח ודקדוק תוך שמירה על נאמנות מוחלטת למקור.

חשוב: החזר HTML פשוט שתואם ל-Microsoft Outlook ו-Word.

כללי HTML עבור Outlook:
1. השתמש ב-<p align="right"> במקום CSS
2. בולטים: <p align="right">• פריט</p> (לא <ul>/<li>)
3. כותרות: <p align="right"><b><font color="#1a73e8" size="5">כותרת</font></b></p>
4. טבלה: <table width="100%" dir="rtl"> עם align="right" בכל <td>

תבנית HTML מומלצת:
<div dir="rtl">
<p align="right"><b><font color="#1a73e8" size="5">📋 פרטי הפגישה</font></b></p>
[תוכן מעובד...]
</div>', 'Focuses on extracting decisions, action items, and participants.', '{"temperature": 0.2}')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    configuration = EXCLUDED.configuration;

-- Work Log
INSERT INTO ai_prompts (id, name, content, description, configuration) VALUES 
('work_log', 'Work Log', 'תפקיד: אתה עוזר מקצועי להמרת דיווחי עבודה טכניים לסיכומי סטטוס עסקיים.

המשימה:
קרא את רשימת המשימות הטכניות והמר אותן לדו"ח התקדמות מקצועי.
התמקד בערך העסקי, בהישגים ובתפוקות.
השתמש בשפה עסקית גבוהה.

חשוב: החזר HTML פשוט שתואם ל-Microsoft Outlook ו-Word.
השתמש בכללי ה-HTML של Outlook (p align="right", font color="#1a73e8").', 'Focuses on converting technical tasks into professional status reports.', '{"temperature": 0.4}')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    configuration = EXCLUDED.configuration;

-- Knowledge Item
INSERT INTO ai_prompts (id, name, content, description, configuration) VALUES 
('knowledge_item', 'Knowledge Item', 'תפקיד: אתה מומחה לארגון והנגשת ידע טכני.

המשימה:
ארגן את המידע במבנה היררכי ברור.
השתמש בכותרות, תתי-כותרות ורשימות.
שמור על דיוק טכני גבוה ופורמט קטעי קוד בצורה קריאה.

חשוב: החזר HTML פשוט שתואם ל-Microsoft Outlook ו-Word.
השתמש בכללי ה-HTML של Outlook (p align="right", font color="#1a73e8").', 'Focuses on hierarchical organization, technical clarity, and code block formatting.', '{"temperature": 0.3}')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    configuration = EXCLUDED.configuration;

-- Translator
INSERT INTO ai_prompts (id, name, content, description, configuration) VALUES 
('translator', 'Translator', 'תפקיד: אתה מתרגם עסקי מומחה מעברית לאנגלית.

המשימה:
תרגם את התוכן לאנגלית עסקית ברמה גבוהה (High-level business English).
שמור על כל מבנה ה-HTML.
שנה כיווניות: align="right" ל-align="left", dir="rtl" ל-dir="ltr".
התאם מונחים מקצועיים להקשר העסקי הגלובלי.', 'A standalone layer to convert any processed text into high-level business English.', '{"temperature": 0.3}')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    configuration = EXCLUDED.configuration;

-- Cleanup old IDs if they are no longer needed (optional)
-- DELETE FROM ai_prompts WHERE id IN ('PROCESS', 'TRANSLATE', 'ENRICH');

COMMIT;
