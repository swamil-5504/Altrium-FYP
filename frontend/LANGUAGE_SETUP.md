# Quick Start: Language Support Feature

## What Was Added

✨ **Devanagari (Hindi) Language Support** with a language switcher on the login and register pages!

## Key Features

🌍 **Language Switcher**
- Available on Login page (top-right corner)
- Available on Register page (top-right corner)
- Easy dropdown with English (🇬🇧) and Hindi (🇮🇳) options

💾 **Persistent Preferences**
- Your language choice is automatically saved
- Restores automatically on your next visit

🔤 **Full Interface Translation**
- All login page text in English/Hindi
- All register page text in English/Hindi
- Error messages fully translated
- Form labels, buttons, and placeholders translated

## Getting Started

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Start the App
```bash
npm run dev
```

### Step 3: Visit the Login Page
- Navigate to http://localhost:5173/login
- Look for the language selector in the top-right corner
- Click to switch between English and हिंदी

## File Structure

```
frontend/
├── src/
│   ├── locales/
│   │   ├── en.json          ← English translations
│   │   └── hi.json          ← Hindi translations
│   ├── i18n/
│   │   └── config.ts        ← i18n setup
│   ├── context/
│   │   └── LanguageContext.tsx  ← Language state management
│   ├── components/
│   │   └── LanguageSwitcher.tsx ← Language selector dropdown
│   └── pages/
│       ├── Login.tsx        ← Updated with translations
│       └── Register.tsx     ← Updated with translations
└── package.json             ← Added i18next dependencies
```

## Translation Structure

The translation files are organized by feature:

```
{
  "common": { ... }      // Shared UI elements
  "login": { ... }       // Login page
  "register": { ... }    // Register page
  "dashboard": { ... }   // Dashboard UI
  "admin": { ... }       // Admin features
  "errors": { ... }      // Error messages
}
```

## How to Add More Translations

### For an Existing Feature (e.g., enhance login translations):

1. Open `frontend/src/locales/en.json`
2. Add new key under the feature section:
```json
{
  "login": {
    "newField": "New English Text"
  }
}
```

3. Open `frontend/src/locales/hi.json`
4. Add Hindi translation:
```json
{
  "login": {
    "newField": "नया हिंदी टेक्स्ट"
  }
}
```

### For a New Component/Page:

1. **Import the hook**:
```typescript
import { useTranslation } from 'react-i18next';
```

2. **Use in component**:
```typescript
const { t } = useTranslation();

<button>{t('myFeature.submitButton')}</button>
```

3. **Add to translation files**:
```json
// en.json
"myFeature": {
  "submitButton": "Submit"
}

// hi.json
"myFeature": {
  "submitButton": "जमा करें"
}
```

## Language Switcher Component

Ready-to-use component for adding language switching anywhere:

```typescript
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function MyPage() {
  return (
    <div>
      <LanguageSwitcher />
      {/* Your content */}
    </div>
  );
}
```

## Alternative: Using Language Context

For more control over language management:

```typescript
import { useLanguage } from '@/context/LanguageContext';

export default function MyComponent() {
  const { language, setLanguage } = useLanguage();

  return (
    <div>
      <p>Current: {language}</p>
      <button onClick={() => setLanguage('en')}>English</button>
      <button onClick={() => setLanguage('hi')}>हिंदी</button>
    </div>
  );
}
```

## Next Steps

1. ✅ Test language switching on Login/Register pages
2. 📝 Extend translations to other pages (Dashboard, Admin pages, etc.)
3. 🌐 Consider adding more languages (Marathi, Tamil, etc.) following the same pattern
4. 🎨 Add language switcher to your app's navbar/header for authenticated pages

## Supported Browsers

- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers
- ✅ All modern browsers with localStorage support

## Troubleshooting

**Q: Language doesn't persist?**  
A: Ensure localStorage is enabled in browser settings

**Q: Translation keys showing instead of text?**  
A: Verify the key exists in both en.json and hi.json

**Q: New text not translating?**  
A: Import `useTranslation` hook and use `t('key')` instead of hardcoded text

## Technologies Used

- **i18next** - Internationalization framework
- **react-i18next** - React binding for i18next
- **i18next-browser-languagedetector** - Auto language detection
- **localStorage** - Persistent storage for language preference

## Need Help?

1. Check `LANGUAGE_SUPPORT.md` for detailed documentation
2. Review examples in `Login.tsx` or `Register.tsx`
3. Check translation files for structure reference

---

**🎉 You're all set! Enjoy multi-language support!**
