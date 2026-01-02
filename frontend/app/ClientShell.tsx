'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type Lang = 'en' | 'ru';

const translations = {
  en: {
    newPaste: "New",
    create: "Publish",
    creating: "Wait...",
    syntax: "Syntax",
    pastePlaceholder: "Type here...",
    footerRights: "CodeDrop",
    devBy: "by",
    pasteNotFound: "Not found",
    raw: "Raw",
    copy: "Copy",
    copied: "Copied",
    created: "Created",
    bytes: "bytes",
  },
  ru: {
    newPaste: "Создать",
    create: "Опубликовать",
    creating: "Ждите...",
    syntax: "Синтаксис",
    pastePlaceholder: "Пишите здесь...",
    footerRights: "CodeDrop",
    devBy: "от",
    pasteNotFound: "Не найдено",
    raw: "Исходник",
    copy: "Копировать",
    copied: "Ок",
    created: "Создано",
    bytes: "байт",
  }
};

type TranslationKey = keyof typeof translations.en;

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp missing');
  return context;
};

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [lang, setLang] = useState<Lang>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('cd_theme') as Theme;
    const savedLang = localStorage.getItem('cd_lang') as Lang;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
    if (savedLang) setLang(savedLang);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('cd_theme', newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'ru' : 'en';
    setLang(newLang);
    localStorage.setItem('cd_lang', newLang);
  };
  
  const t = (key: TranslationKey) => translations[lang][key] || key;

  if (!mounted) return null;

  return (
    <AppContext.Provider value={{ theme, toggleTheme, lang, toggleLang, t }}>
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-neutral-400' : 'bg-[#ffffff] text-neutral-600'}`}>
        <nav className={`w-full h-12 flex items-center justify-between px-6 sticky top-0 z-50 border-b ${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-900' : 'bg-white border-neutral-100'}`}>
          <a href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-70">
            <div className="text-[#F6821F]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 20H20L12 2ZM12 6.5L16.5 17H7.5L12 6.5Z" />
              </svg>
            </div>
            <span className="font-bold tracking-tight text-sm uppercase">CodeDrop</span>
          </a>
          <div className="flex items-center gap-6">
            <button onClick={toggleLang} className="text-[10px] font-medium tracking-tighter uppercase opacity-50 hover:opacity-100 transition-opacity">{lang}</button>
            <button onClick={toggleTheme} className="text-xs opacity-50 hover:opacity-100 transition-opacity">
              {theme === 'dark' ? 'LIGHT' : 'DARK'}
            </button>
          </div>
        </nav>
        <div className="flex-grow flex flex-col">{children}</div>
        <footer className={`w-full py-6 text-[10px] uppercase tracking-widest border-t ${theme === 'dark' ? 'border-neutral-900 text-neutral-500' : 'border-neutral-50 text-neutral-400'}`}>
          <div className="max-w-screen-2xl mx-auto px-6 flex justify-between items-center">
            <span className="font-medium opacity-80">{t('footerRights')} / {new Date().getFullYear()}</span>
            <div className="flex items-center gap-1 font-bold">
              <span className="opacity-50 tracking-tighter normal-case">{t('devBy')}</span>
              <a href="https://github.com/akyloffdev" className="text-[#F6821F] hover:underline underline-offset-4 decoration-2">akyloffdev</a>
            </div>
          </div>
        </footer>
      </div>
    </AppContext.Provider>
  );
}
