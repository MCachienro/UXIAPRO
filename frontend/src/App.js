import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

function App() {
  const [status, setStatus] = useState('loading');
  const [expos, setExpos] = useState([]);

  useEffect(() => {
    const fetchExpos = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/expos`);
        setExpos(response.data);
        setStatus('ok');
      } catch (error) {
        setStatus('error');
      }
    };

    fetchExpos();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>UXIA Frontend</h1>
        <p>Backend API: {API_BASE_URL}</p>
        {status === 'loading' && <p>Connecting to backend...</p>}
        {status === 'error' && <p>Could not connect to API.</p>}
        {status === 'ok' && (
          <>
            <p>Connection OK. Expos loaded: {expos.length}</p>
            <ul>
              {expos.map((expo) => (
                <li key={expo.id}>{expo.nom}</li>
              ))}
            </ul>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
