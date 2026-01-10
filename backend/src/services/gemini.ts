/**
 * Google Gemini AI Service
 * עיבוד סיכומים ותרגומים באמצעות Gemini 2.5 Flash
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../middleware/errorHandler';
import PROMPTS from './prompts';

// Validate API key
if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get the best available model
 */
async function getModel() {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const modelName of models) {
    try {
      const m = genAI.getGenerativeModel({ model: modelName });
      // Test the model with a tiny prompt
      await m.generateContent('t');
      console.log(`✅ Using Gemini model: ${modelName}`);
      return m;
    } catch (e) {
      console.warn(`⚠️ Model ${modelName} not available, trying next...`);
    }
  }
  throw new Error('No compatible Gemini models found. Check your API key and quota.');
}

// ================================================================
// HTML FIXING FOR OUTLOOK
// ================================================================

/**
 * תיקון HTML להתאמה מלאה ל-Outlook
 */
function fixHTMLForOutlook(html: string): string {
  let fixed = html;
  
  // 1. המרת UL/LI לפסקאות עם בולטים + dir="rtl"
  fixed = fixed.replace(/<ul[^>]*>/gi, '');
  fixed = fixed.replace(/<\/ul>/gi, '');
  fixed = fixed.replace(/<ol[^>]*>/gi, '');
  fixed = fixed.replace(/<\/ol>/gi, '');
  fixed = fixed.replace(/<li[^>]*>(.*?)<\/li>/gi, '<p dir="rtl" align="right" style="margin-right: 40px;">• $1</p>');
  
  // 2. המרת H2/H3 לפסקאות עם צבע + dir="rtl"
  fixed = fixed.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '<p dir="rtl" align="right" style="margin: 15px 0 10px 0;"><b><font color="#1a73e8" size="5">$1</font></b></p>');
  fixed = fixed.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '<p dir="rtl" align="right" style="margin: 15px 0 10px 0;"><b><font color="#1a73e8" size="4">$1</font></b></p>');
  fixed = fixed.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '<p dir="rtl" align="right" style="margin: 15px 0 10px 0;"><b><font color="#1a73e8" size="6">$1</font></b></p>');
  
  // 3. תיקון DIV ל-P עם align + dir="rtl"
  fixed = fixed.replace(/<div[^>]*style="[^"]*margin-right[^"]*"[^>]*>(.*?)<\/div>/gi, '<p dir="rtl" align="right" style="margin-right: 20px;">$1</p>');
  
  // 4. הוספת dir="rtl" ו-align="right" לכל P שאין לו
  fixed = fixed.replace(/<p(?![^>]*dir=)(?![^>]*align=)/gi, '<p dir="rtl" align="right"');
  fixed = fixed.replace(/<p(?![^>]*dir=)(?=[^>]*align=)/gi, '<p dir="rtl"');
  fixed = fixed.replace(/<p(?=[^>]*dir=)(?![^>]*align=)/gi, '<p align="right"');
  
  // 5. הוספת dir="rtl" ל-TABLE
  fixed = fixed.replace(/<table(?![^>]*dir=)/gi, '<table dir="rtl"');
  
  // 6. הוספת dir="rtl" ו-align="right" לכל TD/TH
  fixed = fixed.replace(/<td(?![^>]*dir=)(?![^>]*align=)/gi, '<td dir="rtl" align="right"');
  fixed = fixed.replace(/<td(?![^>]*dir=)(?=[^>]*align=)/gi, '<td dir="rtl"');
  fixed = fixed.replace(/<td(?=[^>]*dir=)(?![^>]*align=)/gi, '<td align="right"');
  
  fixed = fixed.replace(/<th(?![^>]*dir=)(?![^>]*align=)/gi, '<th dir="rtl" align="right"');
  fixed = fixed.replace(/<th(?![^>]*dir=)(?=[^>]*align=)/gi, '<th dir="rtl"');
  fixed = fixed.replace(/<th(?=[^>]*dir=)(?![^>]*align=)/gi, '<th align="right"');
  
  // 7. עטיפה כללית
  if (!fixed.includes('<div dir="rtl">')) {
    fixed = `<div dir="rtl">\n${fixed}\n</div>`;
  }
  
  console.log('🔧 HTML fixed for Outlook compatibility with dir="rtl"');
  
  return fixed;
}

// ================================================================
// SERVICE FUNCTIONS
// ================================================================

/**
 * עיבוד סיכום פגישה - פרמול והעצבה
 */
export const processMeetingSummary = async (content: string): Promise<string> => {
  try {
    if (!content || content.trim().length < 10) {
      throw new AppError('Content is too short to process', 400);
    }

    console.log('🤖 Starting Gemini processing...');
    console.log('📝 Content length:', content.length, 'characters');
    
    const model = await getModel();
    const prompt = PROMPTS.PROCESS.replace('{content}', content);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let processedContent = response.text();

    if (!processedContent) {
      console.error('❌ Gemini returned empty response');
      throw new AppError('Gemini returned empty response', 500);
    }

    console.log('✅ Gemini response received. Length:', processedContent.length);
    
    try {
      // 🔥 תיקון HTML להתאמה מלאה ל-Outlook
      processedContent = fixHTMLForOutlook(processedContent);
      
      // ✅ נקה escaping מיותר (אבל אל תמחק \n אמיתיים)
      processedContent = processedContent
        .replace(/\\"/g, '"')      // החלף \" ב-"
        .replace(/\\\\/g, '\\');   // החלף \\ ב-\
    } catch (fixError: any) {
      console.error('⚠️ Error fixing HTML for Outlook:', fixError);
    }
    
    console.log('🧹 HTML cleaned from escaping');

    return processedContent.trim();
  } catch (error: any) {
    console.error('❌ Gemini processing error:', error);
    
    if (error.message?.includes('quota')) {
      throw new AppError('AI service quota exceeded. Please try again later.', 429);
    }
    
    if (error.message?.includes('API key')) {
      throw new AppError('AI service configuration error', 500);
    }
    
    throw new AppError('Failed to process content with AI', 500);
  }
};

/**
 * תרגום סיכום לאנגלית
 */
export const translateMeeting = async (
  content: string,
  targetLanguage: string = 'en'
): Promise<string> => {
  try {
    if (!content || content.trim().length < 10) {
      throw new AppError('Content is too short to translate', 400);
    }

    const prompt = PROMPTS.TRANSLATE.replace('{content}', content);

    const model = await getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedContent = response.text();

    if (!translatedContent) {
      throw new AppError('Gemini returned empty translation', 500);
    }

    return translatedContent.trim();
  } catch (error: any) {
    console.error('❌ Gemini translation error:', error);
    
    if (error.message?.includes('quota')) {
      throw new AppError('AI service quota exceeded. Please try again later.', 429);
    }
    
    throw new AppError('Failed to translate content', 500);
  }
};

/**
 * העשרת תוכן עם מידע נוסף
 */
export const enrichMeetingContent = async (content: string): Promise<string> => {
  try {
    if (!content || content.trim().length < 10) {
      throw new AppError('Content is too short to enrich', 400);
    }

    const prompt = PROMPTS.ENRICH.replace('{content}', content);

    const model = await getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const enrichedContent = response.text();

    if (!enrichedContent) {
      throw new AppError('Gemini returned empty enrichment', 500);
    }

    return enrichedContent.trim();
  } catch (error: any) {
    console.error('❌ Gemini enrichment error:', error);
    throw new AppError('Failed to enrich content', 500);
  }
};

/**
 * בדיקת חיבור ל-Gemini API
 */
export const testGeminiConnection = async (): Promise<boolean> => {
  try {
    const model = await getModel();
    const result = await model.generateContent('Hello, respond with OK if you work.');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API connection successful');
    return true;
  } catch (error) {
    console.error('❌ Gemini API connection failed:', error);
    return false;
  }
};

export default {
  processMeetingSummary,
  translateMeeting,
  enrichMeetingContent,
  testGeminiConnection,
};
