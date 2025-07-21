const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');

const app = express();
const db = new sqlite3.Database('./pos.db');
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(session({ secret: 'gta-rp-secret', resave: false, saveUninitialized: true }));

// === Initialize Tables ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    role TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    item_sold TEXT,
    amount REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// === Auth Routes ===
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, hash, role], err => {
    if (err) return res.status(400).json({ error: 'User exists' });
    res.json({ success: true });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid login' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid login' });
    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ success: true, user: req.session.user });
  });
});

app.get('/api/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

// === Sales ===
app.post('/api/sale', (req, res) => {
  const { item_sold, amount } = req.body;
  const user = req.session.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  db.run('INSERT INTO sales (employee_id, item_sold, amount) VALUES (?, ?, ?)', [user.id, item_sold, amount], err => {
    if (err) return res.status(500).json({ error: 'Could not log sale' });
    res.json({ success: true });
  });
});

app.get('/api/dashboard', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'owner') return res.status(403).json({ error: 'Forbidden' });
  db.all(`
    SELECT u.username, SUM(s.amount) AS total_sales
    FROM sales s
    JOIN users u ON s.employee_id = u.id
    GROUP BY u.username
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
