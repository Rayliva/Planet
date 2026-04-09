import { Router } from 'express';
import bcrypt from 'bcrypt';
import { getPool } from '../config/db.js';
import { signToken, setTokenCookie, clearTokenCookie, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const db = getPool();
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
      [email, hash, displayName]
    );
    const userId = result.insertId;

    await db.execute('INSERT INTO user_stats (user_id) VALUES (?)', [userId]);

    const token = signToken(userId);
    setTokenCookie(res, token);

    res.status(201).json({
      user: { id: userId, email, display_name: displayName, stardust_balance: 50, current_streak: 0, longest_streak: 0 },
    });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getPool();
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user.id);
    setTokenCookie(res, token);

    res.json({
      user: {
        id: user.id, email: user.email, display_name: user.display_name,
        stardust_balance: user.stardust_balance, current_streak: user.current_streak, longest_streak: user.longest_streak,
      },
    });
  } catch (err) { next(err); }
});

router.post('/logout', (_req, res) => {
  clearTokenCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(
      'SELECT id, email, display_name, stardust_balance, current_streak, longest_streak FROM users WHERE id = ?',
      [req.userId]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

export default router;
