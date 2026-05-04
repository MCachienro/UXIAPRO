import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../hooks/api';

const LoginForm = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const tokenResponse = await api.post('/auth/login/', creds);
      const accessToken = tokenResponse.data?.access;

      if (!accessToken) {
        throw new Error(t('login.errors.noToken'));
      }

      localStorage.setItem('token', accessToken);

      const meResponse = await api.get('/auth/me/');
      onLoginSuccess(meResponse.data);
    } catch (_) {
      localStorage.removeItem('token');
      setError(t('login.errors.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-50">{t('login.title')}</h3>
      <input 
        className="mb-3 w-full rounded border border-slate-300 bg-white p-2 text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        placeholder={t('login.username')} 
        value={creds.username}
        onChange={e => setCreds({...creds, username: e.target.value})}
      />
      <input 
        type="password"
        className="mb-4 w-full rounded border border-slate-300 bg-white p-2 text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        placeholder={t('login.password')}
        value={creds.password}
        onChange={e => setCreds({...creds, password: e.target.value})}
      />
      {error && <p className="mb-3 text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>}
      <button disabled={isLoading} className="w-full rounded-lg bg-indigo-600 py-2 font-bold text-white disabled:bg-slate-300 dark:disabled:bg-slate-700">
        {isLoading ? t('login.loading') : t('login.submit')}
      </button>
    </form>
  );
};

export default LoginForm;