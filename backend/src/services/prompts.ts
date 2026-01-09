// prompts.ts - קובץ ניהול Prompts למודל Gemini

export const PROMPTS = {
  
  // 🤖 Prompt לעיבוד AI של סיכום פגישה
  PROCESS: `תפקיד: אתה עוזר מקצועי לניתוח ופרמול סיכומי פגישות.

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

<p align="right" style="margin-right: 20px;"><b>נושא:</b> [נושא הפגישה]</p>
<p align="right" style="margin-right: 20px;"><b>תאריך:</b> [תאריך]</p>
<p align="right" style="margin-right: 20px;"><b>משתתפים:</b> [רשימת משתתפים]</p>
<p align="right" style="margin-right: 20px;"><b>מטרה:</b> [מטרת הפגישה]</p>

<p align="right"><b><font color="#1a73e8" size="4">📝 נקודות מרכזיות</font></b></p>

<p align="right" style="margin-right: 40px;">• נקודה ראשונה</p>
<p align="right" style="margin-right: 40px;">• נקודה שנייה</p>
<p align="right" style="margin-right: 40px;">• נקודה שלישית</p>

<p align="right"><b><font color="#1a73e8" size="4">✅ משימות להמשך</font></b></p>

<table width="100%" border="1" cellpadding="8" cellspacing="0" dir="rtl" style="border-collapse: collapse;">
  <tr bgcolor="#f5f5f5">
    <td align="right"><b>משימה</b></td>
    <td align="right"><b>אחראי</b></td>
    <td align="right"><b>דד-ליין</b></td>
  </tr>
  <tr>
    <td align="right">משימה 1</td>
    <td align="right">שם אחראי</td>
    <td align="right">תאריך</td>
  </tr>
</table>

<p align="right"><b><font color="#1a73e8" size="4">📅 פגישת המשך</font></b></p>

<p align="right" style="margin-right: 20px;">[פרטי פגישת המשך]</p>

</div>

הערות חשובות:
- אל תשתמש ב-<ul> או <li> - רק <p align="right">• פריט</p>
- כל <td> בטבלה חייב להיות align="right"
- כותרות: <font color="#1a73e8"> במקום CSS
- הזחה: margin-right או רווחים
- אם אין משימות/פגישת המשך - אל תכלול את הסעיף
- אם בטקסט המקורי לא הוגדרו משימות להמשך, אין להמציא משימות כאלה

הטקסט לעיבוד: {content}`,

  // 🌍 Prompt לתרגום
  TRANSLATE: `אתה מתרגם מקצועי מעברית לאנגלית.

המשימה שלך:
1. לתרגם את התוכן מעברית לאנגלית מקצועית
2. לשמור על כל המבנה וה-HTML
3. לשנות align="right" ל-align="left"
4. לשנות dir="rtl" ל-dir="ltr"
5. לשנות margin-right ל-margin-left

הנחיות:
- תרגם במדויק - אל תוסיף או תמחק תוכן
- שמור על כל התגים וה-HTML (כולל <p>, <font>, <table>, <td>)
- החזר רק HTML מתורגם
- שמור על צבעים ועיצוב

כעת תרגם את התוכן הבא: {content}`,

  // ✨ Prompt להעשרת תוכן
  ENRICH: `אתה עוזר AI שמעשיר תוכן.

המשימה שלך:
1. לקרוא את הסיכום
2. להוסיף הערות קצרות ורלוונטיות
3. להוסיף קישורים אם רלוונטי (אופציונלי)
4. להחזיר HTML מועשר

הנחיות:
- אל תשנה את המבנה הקיים (<p>, <font>, <table>, <td>)
- הוסף רק תוכן שמוסיף ערך
- שמור על RTL והעיצוב הקיים
- שמור על align="right" ו-dir="rtl"
- החזר רק HTML

כעת העשר את התוכן הבא: {content}`,

};

export default PROMPTS;
