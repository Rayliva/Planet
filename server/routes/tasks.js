import { Router } from 'express';
import { getPool } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { encrypt, decrypt } from '../middleware/encryption.js';

const router = Router();
router.use(requireAuth);

function decryptTask(row) {
  return {
    ...row,
    title: decrypt(row.title_enc),
    description: decrypt(row.description_enc),
    title_enc: undefined,
    description_enc: undefined,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ tasks: rows.map(decryptTask) });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, isRecurring, recurrenceRule, category } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const db = getPool();
    const [result] = await db.execute(
      `INSERT INTO tasks (user_id, title_enc, description_enc, priority, due_date, is_recurring, recurrence_rule, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.userId, encrypt(title), encrypt(description || ''), priority || 'medium', dueDate || null, isRecurring || false, recurrenceRule || null, category || 'general']
    );

    const [rows] = await db.execute('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json({ task: decryptTask(rows[0]) });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, priority, dueDate, status, category } = req.body;

    const db = getPool();
    const sets = [];
    const vals = [];

    if (title !== undefined) { sets.push('title_enc = ?'); vals.push(encrypt(title)); }
    if (description !== undefined) { sets.push('description_enc = ?'); vals.push(encrypt(description)); }
    if (priority !== undefined) { sets.push('priority = ?'); vals.push(priority); }
    if (dueDate !== undefined) { sets.push('due_date = ?'); vals.push(dueDate); }
    if (status !== undefined) { sets.push('status = ?'); vals.push(status); }
    if (category !== undefined) { sets.push('category = ?'); vals.push(category); }

    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });

    vals.push(id, req.userId);
    await db.execute(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, vals);

    const [rows] = await db.execute('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: decryptTask(rows[0]) });
  } catch (err) { next(err); }
});

router.put('/:id/complete', async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getPool();

    await db.execute(
      `UPDATE tasks SET status = 'completed', completed_at = NOW() WHERE id = ? AND user_id = ?`,
      [id, req.userId]
    );

    await db.execute(
      'UPDATE user_stats SET total_tasks_completed = total_tasks_completed + 1 WHERE user_id = ?',
      [req.userId]
    );

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    const [userRows] = await db.execute('SELECT last_active_date, current_streak, longest_streak FROM users WHERE id = ?', [req.userId]);
    if (userRows.length > 0) {
      const user = userRows[0];
      const lastActive = user.last_active_date ? new Date(user.last_active_date).toISOString().split('T')[0] : null;

      let newStreak = user.current_streak;
      if (lastActive !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        newStreak = lastActive === yesterday ? user.current_streak + 1 : 1;
        const newLongest = Math.max(newStreak, user.longest_streak);
        await db.execute(
          'UPDATE users SET last_active_date = ?, current_streak = ?, longest_streak = ? WHERE id = ?',
          [today, newStreak, newLongest, req.userId]
        );
      }
    }

    // Award stardust
    await db.execute('UPDATE users SET stardust_balance = stardust_balance + 5 WHERE id = ?', [req.userId]);
    await db.execute('INSERT INTO currency_log (user_id, amount, reason) VALUES (?, 5, ?)', [req.userId, 'Completed task']);

    const [rows] = await db.execute('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: decryptTask(rows[0]) });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const db = getPool();
    await db.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
