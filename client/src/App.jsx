import { useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [loginInfo, setLoginInfo] = useState({ username: '', password: '' });
  const [sale, setSale] = useState({ item_sold: '', amount: '' });
  const [dashboard, setDashboard] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/me').then(res => setUser(res.data.user));
  }, []);

  const login = () => {
    axios.post('http://localhost:3001/api/login', loginInfo).then(res => setUser(res.data.user));
  };

  const submitSale = () => {
    axios.post('http://localhost:3001/api/sale', sale).then(() => alert('Sale logged'));
  };

  const loadDashboard = () => {
    axios.get('http://localhost:3001/api/dashboard').then(res => setDashboard(res.data));
  };

  if (!user) {
    return (
      <div className="p-4">
        <h1 className="text-xl mb-2">Login</h1>
        <input placeholder="Username" onChange={e => setLoginInfo({ ...loginInfo, username: e.target.value })} />
        <input type="password" placeholder="Password" onChange={e => setLoginInfo({ ...loginInfo, password: e.target.value })} />
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Welcome {user.username} ({user.role})</h1>

      {user.role === 'employee' && (
        <div>
          <input placeholder="Item Sold" onChange={e => setSale({ ...sale, item_sold: e.target.value })} />
          <input type="number" placeholder="Amount" onChange={e => setSale({ ...sale, amount: e.target.value })} />
          <button onClick={submitSale}>Log Sale</button>
        </div>
      )}

      {user.role === 'owner' && (
        <div>
          <button onClick={loadDashboard}>Load Dashboard</button>
          <ul>
            {dashboard.map(row => (
              <li key={row.username}>{row.username}: ${row.total_sales}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
