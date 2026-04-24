import { useState } from 'react';

const LoginForm = ({ onLoginSuccess }) => {
  const [creds, setCreds] = useState({ username: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría tu llamada al endpoint de login de Django (JWT)
    // Cuando recibas el token y los datos de usuario:
    console.log("Logueando a...", creds);
    // Simulación de éxito:
    onLoginSuccess({ id: 1, username: 'admin', first_name: 'Admin' }); 
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-sm mx-auto">
      <h3 className="font-bold text-lg mb-4">Login Admin</h3>
      <input 
        className="w-full p-2 mb-3 border rounded" 
        placeholder="Usuari" 
        onChange={e => setCreds({...creds, username: e.target.value})}
      />
      <input 
        type="password"
        className="w-full p-2 mb-4 border rounded" 
        placeholder="Contrasenya"
        onChange={e => setCreds({...creds, password: e.target.value})}
      />
      <button className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold">Entrar</button>
    </form>
  );
};

export default LoginForm;