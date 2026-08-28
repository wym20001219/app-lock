const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const LOCK_FILE = path.join(__dirname, 'app_lock.json');

if (!fs.existsSync(LOCK_FILE)) {
  fs.writeFileSync(LOCK_FILE, JSON.stringify({ blocked_apps: [] }));
}

app.get('/check-lock', (req, res) => {
  try {
    const appName = decodeURIComponent(req.query.app);
    if (!appName) {
      return res.status(400).json({ error: '缺少 app 参数' });
    }
    const data = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
    const locked = data.blocked_apps && data.blocked_apps.includes(appName);
    res.json({ locked });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/lock', (req, res) => {
  try {
    const { app, locked } = req.body;
    if (!app) return res.status(400).json({ error: '缺少 app 参数' });
    const data = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
    if (locked) {
      if (!data.blocked_apps.includes(app)) {
        data.blocked_apps.push(app);
      }
    } else {
      data.blocked_apps = data.blocked_apps.filter(a => a !== app);
    }
    fs.writeFileSync(LOCK_FILE, JSON.stringify(data));
    res.json({ success: true, blocked_apps: data.blocked_apps });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`App Lock server running on port ${PORT}`);
});
