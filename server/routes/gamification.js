import { Router } from 'express';
import { getPool } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const STARDUST_REWARDS = {
  task_completed_jar:  { amount: 5,   reason: 'Task completed (Jar)' },
  jar_filled:          { amount: 30,  reason: 'Jar filled!' },
  dice_challenge_low:  { amount: 10,  reason: 'Dice challenge completed' },
  dice_challenge_mid:  { amount: 15,  reason: 'Dice challenge completed' },
  dice_challenge_high: { amount: 30,  reason: 'Dice challenge completed' },
  plant_harvested:     { amount: 10,  reason: 'Plant harvested' },
  boss_defeated:       { amount: 75,  reason: 'Boss defeated' },
  pomodoro_completed:  { amount: 15,  reason: 'Pomodoro session completed' },
  wheel_respin:        { amount: -10, reason: 'Wheel re-spin' },
  bingo_win:           { amount: 50,  reason: 'Bingo win!' },
};

router.get('/stats', async (req, res, next) => {
  try {
    const db = getPool();
    const [userRows] = await db.execute(
      'SELECT stardust_balance, current_streak, longest_streak FROM users WHERE id = ?',
      [req.userId]
    );
    const [statRows] = await db.execute('SELECT * FROM user_stats WHERE user_id = ?', [req.userId]);

    const stats = { ...(userRows[0] || {}), ...(statRows[0] || {}) };
    res.json({ stats });
  } catch (err) { next(err); }
});

router.get('/achievements', async (req, res, next) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(`
      SELECT a.*, ua.progress, ua.unlocked_at
      FROM achievements a
      LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ?
      ORDER BY a.id
    `, [req.userId]);
    res.json({ achievements: rows });
  } catch (err) { next(err); }
});

router.get('/daily-quests', async (req, res, next) => {
  try {
    const db = getPool();
    const today = new Date().toISOString().split('T')[0];

    // Pick 3 random quests for today (seeded by date + user for consistency)
    const [allQuests] = await db.execute('SELECT * FROM daily_quests');
    const seed = hashCode(`${today}-${req.userId}`);
    const shuffled = [...allQuests].sort((a, b) => {
      const ha = hashCode(`${seed}-${a.id}`);
      const hb = hashCode(`${seed}-${b.id}`);
      return ha - hb;
    });
    const todayQuests = shuffled.slice(0, 3);

    // Ensure user_daily_quests rows exist
    for (const q of todayQuests) {
      await db.execute(
        `INSERT IGNORE INTO user_daily_quests (user_id, quest_id, quest_date) VALUES (?, ?, ?)`,
        [req.userId, q.id, today]
      );
    }

    const questIds = todayQuests.map((q) => q.id);
    if (questIds.length === 0) return res.json({ quests: [] });

    const placeholders = questIds.map(() => '?').join(',');
    const [rows] = await db.execute(`
      SELECT dq.*, udq.progress, udq.completed
      FROM daily_quests dq
      JOIN user_daily_quests udq ON udq.quest_id = dq.id
      WHERE udq.user_id = ? AND udq.quest_date = ? AND dq.id IN (${placeholders})
    `, [req.userId, today, ...questIds]);

    res.json({ quests: rows });
  } catch (err) { next(err); }
});

router.post('/stardust', async (req, res, next) => {
  try {
    const { action } = req.body;
    const reward = STARDUST_REWARDS[action];
    if (!reward) return res.status(400).json({ error: 'Invalid action' });

    const db = getPool();

    if (reward.amount < 0) {
      const [userRows] = await db.execute('SELECT stardust_balance FROM users WHERE id = ?', [req.userId]);
      if (userRows[0].stardust_balance < Math.abs(reward.amount)) {
        return res.status(400).json({ error: 'Not enough Stardust' });
      }
    }

    await db.execute('UPDATE users SET stardust_balance = stardust_balance + ? WHERE id = ?', [reward.amount, req.userId]);
    await db.execute('INSERT INTO currency_log (user_id, amount, reason) VALUES (?, ?, ?)', [req.userId, reward.amount, reward.reason]);

    const [rows] = await db.execute('SELECT stardust_balance FROM users WHERE id = ?', [req.userId]);
    res.json({ balance: rows[0].stardust_balance });
  } catch (err) { next(err); }
});

router.post('/quest-progress', async (req, res, next) => {
  try {
    const { questType } = req.body;
    const amount = 1;
    const db = getPool();
    const today = new Date().toISOString().split('T')[0];

    const [questRows] = await db.execute('SELECT id, target_count FROM daily_quests WHERE quest_type = ?', [questType]);
    if (questRows.length === 0) return res.json({ quests: [] });

    const quest = questRows[0];

    await db.execute(
      `UPDATE user_daily_quests SET progress = LEAST(progress + ?, ?)
       WHERE user_id = ? AND quest_id = ? AND quest_date = ? AND completed = FALSE`,
      [amount, quest.target_count, req.userId, quest.id, today]
    );

    // Check if completed
    const [check] = await db.execute(
      `SELECT progress FROM user_daily_quests WHERE user_id = ? AND quest_id = ? AND quest_date = ?`,
      [req.userId, quest.id, today]
    );
    if (check.length > 0 && check[0].progress >= quest.target_count) {
      await db.execute(
        `UPDATE user_daily_quests SET completed = TRUE WHERE user_id = ? AND quest_id = ? AND quest_date = ?`,
        [req.userId, quest.id, today]
      );
      // Bonus stardust for quest completion
      await db.execute('UPDATE users SET stardust_balance = stardust_balance + 20 WHERE id = ?', [req.userId]);
      await db.execute('INSERT INTO currency_log (user_id, amount, reason) VALUES (?, 20, ?)', [req.userId, 'Daily quest completed']);
    }

    // Check if all 3 done for bonus
    const [allDone] = await db.execute(
      `SELECT COUNT(*) as cnt FROM user_daily_quests WHERE user_id = ? AND quest_date = ? AND completed = TRUE`,
      [req.userId, today]
    );
    if (allDone[0].cnt >= 3) {
      const [bonusCheck] = await db.execute(
        `SELECT id FROM currency_log WHERE user_id = ? AND reason = 'All daily quests bonus' AND DATE(created_at) = ?`,
        [req.userId, today]
      );
      if (bonusCheck.length === 0) {
        await db.execute('UPDATE users SET stardust_balance = stardust_balance + 50 WHERE id = ?', [req.userId]);
        await db.execute('INSERT INTO currency_log (user_id, amount, reason) VALUES (?, 50, ?)', [req.userId, 'All daily quests bonus']);
      }
    }

    // Return updated quests
    const [quests] = await db.execute(
      `SELECT dq.*, udq.progress, udq.completed FROM daily_quests dq
       JOIN user_daily_quests udq ON udq.quest_id = dq.id
       WHERE udq.user_id = ? AND udq.quest_date = ?`,
      [req.userId, today]
    );
    const [statsRows] = await db.execute('SELECT stardust_balance, current_streak, longest_streak FROM users WHERE id = ?', [req.userId]);
    const [userStats] = await db.execute('SELECT * FROM user_stats WHERE user_id = ?', [req.userId]);

    res.json({ quests, stats: { ...statsRows[0], ...userStats[0] } });
  } catch (err) { next(err); }
});

router.post('/achievement-progress', async (req, res, next) => {
  try {
    const { achievementKey } = req.body;
    const amount = 1;
    const db = getPool();

    const [achRows] = await db.execute('SELECT * FROM achievements WHERE key_name = ?', [achievementKey]);
    if (achRows.length === 0) return res.json({});

    const ach = achRows[0];

    await db.execute(
      `INSERT INTO user_achievements (user_id, achievement_id, progress)
       VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE progress = progress + ?`,
      [req.userId, ach.id, amount, amount]
    );

    const [uaRows] = await db.execute(
      'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [req.userId, ach.id]
    );
    const ua = uaRows[0];

    let newUnlock = null;
    if (ua && ua.progress >= ach.threshold && !ua.unlocked_at) {
      await db.execute(
        'UPDATE user_achievements SET unlocked_at = NOW() WHERE user_id = ? AND achievement_id = ?',
        [req.userId, ach.id]
      );
      await db.execute('UPDATE users SET stardust_balance = stardust_balance + 100 WHERE id = ?', [req.userId]);
      await db.execute('INSERT INTO currency_log (user_id, amount, reason) VALUES (?, 100, ?)',
        [req.userId, `Achievement unlocked: ${ach.name}`]);
      newUnlock = { name: ach.name, icon: ach.icon, description: ach.description };
    }

    const [achievements] = await db.execute(`
      SELECT a.*, ua2.progress, ua2.unlocked_at FROM achievements a
      LEFT JOIN user_achievements ua2 ON ua2.achievement_id = a.id AND ua2.user_id = ?
      ORDER BY a.id
    `, [req.userId]);

    res.json({ achievements, newUnlock });
  } catch (err) { next(err); }
});

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

export default router;
