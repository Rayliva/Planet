import { Router } from 'express';
import { getPool } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { encrypt, decrypt } from '../middleware/encryption.js';

const router = Router();
router.use(requireAuth);

router.get('/state/:toolName', async (req, res, next) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(
      'SELECT state_json_enc FROM tool_state WHERE user_id = ? AND tool_name = ?',
      [req.userId, req.params.toolName]
    );
    if (rows.length === 0) return res.json({ state: null });

    const decrypted = decrypt(rows[0].state_json_enc);
    res.json({ state: JSON.parse(decrypted) });
  } catch (err) { next(err); }
});

router.put('/state/:toolName', async (req, res, next) => {
  try {
    const { state } = req.body;
    const db = getPool();
    const encrypted = encrypt(JSON.stringify(state));

    await db.execute(
      `INSERT INTO tool_state (user_id, tool_name, state_json_enc) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE state_json_enc = ?`,
      [req.userId, req.params.toolName, encrypted, encrypted]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/stats/increment', async (req, res, next) => {
  try {
    const { field } = req.body;
    const allowed = ['bingo_wins', 'bosses_defeated', 'pomodoros_completed', 'total_tasks_completed', 'total_bets_won', 'total_bets_lost', 'relaxation_uses'];
    if (!allowed.includes(field)) return res.status(400).json({ error: 'Invalid stat field' });

    const db = getPool();
    await db.execute(
      `UPDATE user_stats SET ${field} = ${field} + 1 WHERE user_id = ?`,
      [req.userId]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Bets endpoints
router.get('/bets', async (req, res, next) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(
      'SELECT * FROM bets WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ bets: rows });
  } catch (err) { next(err); }
});

router.post('/bets', async (req, res, next) => {
  try {
    const { taskId, amount, deadline } = req.body;
    if (!taskId || !amount || !deadline) return res.status(400).json({ error: 'taskId, amount, and deadline required' });

    const wager = Math.floor(Number(amount));
    if (!Number.isFinite(wager) || wager < 5) return res.status(400).json({ error: 'Wager must be at least 5 Stardust' });

    const db = getPool();

    const [userRows] = await db.execute('SELECT stardust_balance FROM users WHERE id = ?', [req.userId]);
    if (userRows[0].stardust_balance < wager) {
      return res.status(400).json({ error: 'Not enough Stardust' });
    }

    await db.execute('UPDATE users SET stardust_balance = stardust_balance - ? WHERE id = ?', [wager, req.userId]);
    await db.execute('INSERT INTO currency_log (user_id, amount, reason) VALUES (?, ?, ?)',
      [req.userId, -wager, 'Bet placed']);

    const [result] = await db.execute(
      'INSERT INTO bets (user_id, task_id, amount_wagered, deadline) VALUES (?, ?, ?, ?)',
      [req.userId, taskId, wager, deadline]
    );

    const [rows] = await db.execute('SELECT * FROM bets WHERE id = ?', [result.insertId]);
    res.status(201).json({ bet: rows[0] });
  } catch (err) { next(err); }
});

router.put('/bets/:id/resolve', async (req, res, next) => {
  try {
    const { outcome } = req.body; // 'won' or 'lost'
    if (!['won', 'lost'].includes(outcome)) return res.status(400).json({ error: 'outcome must be won or lost' });

    const db = getPool();
    const [betRows] = await db.execute('SELECT * FROM bets WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (betRows.length === 0) return res.status(404).json({ error: 'Bet not found' });

    const bet = betRows[0];
    if (bet.outcome !== 'pending') return res.status(400).json({ error: 'Bet already resolved' });

    await db.execute('UPDATE bets SET outcome = ? WHERE id = ?', [outcome, bet.id]);

    if (outcome === 'won') {
      const winnings = bet.amount_wagered * 2;
      await db.execute('UPDATE users SET stardust_balance = stardust_balance + ? WHERE id = ?', [winnings, req.userId]);
      await db.execute('INSERT INTO currency_log (user_id, amount, reason) VALUES (?, ?, ?)',
        [req.userId, winnings, 'Bet won']);
      await db.execute('UPDATE user_stats SET total_bets_won = total_bets_won + 1 WHERE user_id = ?', [req.userId]);
    } else {
      await db.execute('UPDATE user_stats SET total_bets_lost = total_bets_lost + 1 WHERE user_id = ?', [req.userId]);
    }

    res.json({ ok: true, outcome });
  } catch (err) { next(err); }
});

export default router;
