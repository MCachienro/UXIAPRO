import { useState } from 'react';
import api from '../hooks/api';

const LoginForm = ({ onLoginSuccess }) => {
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
        throw new Error('No s\'ha rebut token d\'accés');
      }

      localStorage.setItem('token', accessToken);

      const meResponse = await api.get('/auth/me/');
      onLoginSuccess(meResponse.data);
    } catch (_) {
      localStorage.removeItem('token');
      setError('Credencials incorrectes o API no disponible.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-sm mx-auto">
      <h3 className="font-bold text-lg mb-4">Login Admin</h3>
      <input 
        className="w-full p-2 mb-3 border rounded" 
        placeholder="Usuari" 
        value={creds.username}
        onChange={e => setCreds({...creds, username: e.target.value})}
      />
      <input 
        type="password"
        className="w-full p-2 mb-4 border rounded" 
        placeholder="Contrasenya"
        value={creds.password}
        onChange={e => setCreds({...creds, password: e.target.value})}
      />
      {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
      <button disabled={isLoading} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold disabled:bg-slate-300">
        {isLoading ? 'Entrant...' : 'Entrar'}
      </button>
    </form>
  );
};

export default LoginForm;