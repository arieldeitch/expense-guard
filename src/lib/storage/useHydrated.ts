/**
 * `useHydrated` — האם אנחנו כבר **אחרי** ה-hydration של React.
 *
 * למה זה נחוץ (ADR-0039): כל ה-hooks של המודולים משתמשים ב-`useSyncExternalStore`
 * **רק כמנגנון מנוי**, ואז קוראים את ה-repository ישירות. `getServerSnapshot`
 * מחזיר מצב ריק, אבל קריאת ה-repository בזמן ה-hydration קוראת את `localStorage`
 * ומחזירה נתונים אמיתיים — ולכן ה-DOM שהשרת ייצר אינו תואם, ו-React זורק
 * `Hydration failed because the server rendered text didn't match the client`
 * ומרנדר את כל תת-העץ מחדש.
 *
 * ההרחבה הזו מחזירה `false` ב-SSR **וב-render ה-hydration עצמו**, ו-`true` רק
 * אחרי ה-mount. כך ה-render הראשון בלקוח זהה לפלט השרת, ומיד אחריו React מבצע
 * עדכון רגיל עם הנתונים האמיתיים — **בלי שגיאה ובלי regeneration של העץ**.
 *
 * שכבת ה-render בלבד. **אינה נוגעת ב-persistence**: `readXState()`, `commit()`
 * וכל פונקציות ה-repository ממשיכות לקרוא ולכתוב נתונים אמיתיים תמיד, כך
 * שמטפלי אירועים ו-loaders אינם מושפעים.
 */
import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNoop, getSnapshot, getServerSnapshot);
}
