import { useTranslation } from 'react-i18next';

const LANGUAGE_OPTIONS = [
  { code: 'ca', label: 'CA' },
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
];

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-2">
      <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
        {t('language.label')}
      </span>
      <label className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm shadow-slate-900/5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-px hover:border-slate-300 hover:bg-white focus-within:border-indigo-500/40 focus-within:ring-2 focus-within:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:shadow-black/20 dark:hover:border-slate-600 dark:hover:bg-slate-800">
        <select
          className="h-full w-full cursor-pointer appearance-none bg-transparent text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 outline-none dark:text-slate-100 dark:[color-scheme:dark]"
          value={(i18n.resolvedLanguage || i18n.language || 'en').split('-')[0]}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          aria-label={t('language.label')}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] leading-none text-slate-400 transition-colors dark:text-slate-500"
        >
          ▾
        </span>
      </label>
    </div>
  );
}
