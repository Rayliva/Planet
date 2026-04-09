import mysql from 'mysql2/promise';

let pool;

export function getPool() {
  if (!pool) {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'planet',
      waitForConnections: true,
      connectionLimit: 10,
      charset: 'utf8mb4',
    };

    if (process.env.DB_SSL === 'true') {
      config.ssl = { rejectUnauthorized: true };
    }

    pool = mysql.createPool(config);
  }
  return pool;
}

export async function initDB() {
  const db = getPool();

  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(100) NOT NULL,
      stardust_balance INT DEFAULT 50,
      current_streak INT DEFAULT 0,
      longest_streak INT DEFAULT 0,
      last_active_date DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title_enc TEXT NOT NULL,
      description_enc TEXT,
      priority ENUM('low','medium','high') DEFAULT 'medium',
      due_date DATE NULL,
      is_recurring BOOLEAN DEFAULT FALSE,
      recurrence_rule VARCHAR(100),
      status ENUM('pending','in_progress','completed') DEFAULT 'pending',
      category VARCHAR(100) DEFAULT 'general',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      key_name VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(150) NOT NULL,
      description VARCHAR(255) NOT NULL,
      icon VARCHAR(10) NOT NULL,
      threshold INT NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      user_id INT NOT NULL,
      achievement_id INT NOT NULL,
      progress INT DEFAULT 0,
      unlocked_at TIMESTAMP NULL,
      PRIMARY KEY (user_id, achievement_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_quests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quest_type VARCHAR(100) NOT NULL,
      description VARCHAR(255) NOT NULL,
      target_count INT NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS user_daily_quests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      quest_id INT NOT NULL,
      quest_date DATE NOT NULL,
      progress INT DEFAULT 0,
      completed BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (quest_id) REFERENCES daily_quests(id) ON DELETE CASCADE,
      UNIQUE KEY uq_user_quest_date (user_id, quest_id, quest_date)
    );

    CREATE TABLE IF NOT EXISTS bets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      task_id INT NOT NULL,
      amount_wagered INT NOT NULL,
      deadline TIMESTAMP NOT NULL,
      outcome ENUM('pending','won','lost') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS currency_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount INT NOT NULL,
      reason VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tool_state (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      tool_name VARCHAR(50) NOT NULL,
      state_json_enc TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uq_user_tool (user_id, tool_name)
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      user_id INT PRIMARY KEY,
      bingo_wins INT DEFAULT 0,
      bosses_defeated INT DEFAULT 0,
      pomodoros_completed INT DEFAULT 0,
      total_tasks_completed INT DEFAULT 0,
      total_bets_won INT DEFAULT 0,
      total_bets_lost INT DEFAULT 0,
      relaxation_uses INT DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const statements = schema.split(';').map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await db.execute(stmt);
  }

  await seedAchievements(db);
  await seedDailyQuests(db);
  console.log('Database initialized');
}

async function seedAchievements(db) {
  const achievements = [
    ['bingo_master', 'Bingo Master', 'Win bingo 30 times', '🎯', 30],
    ['high_roller', 'High Roller', 'Win 10 bets in Bet on Yourself', '🎰', 10],
    ['green_thumb', 'Green Thumb', 'Grow 50 plants in Task Garden', '🌿', 50],
    ['architect', 'Architect', 'Build a full fortress (100 bricks)', '🏗️', 100],
    ['marble_collector', 'Marble Collector', 'Fill the jar 20 times', '🫙', 20],
    ['boss_slayer', 'Boss Slayer', 'Defeat 25 bosses', '⚔️', 25],
    ['zen_master', 'Zen Master', 'Use relaxation tools 100 times', '🧘', 100],
    ['streak_legend', 'Streak Legend', 'Maintain a 30-day streak', '🔥', 30],
    ['all_in', 'All In', 'Wager 500+ Stardust in a single bet and win', '💎', 1],
    ['century', 'Century', 'Complete 100 tasks', '💯', 100],
    ['getting_started', 'Getting Started', 'Complete your first task', '⭐', 1],
    ['pomodoro_pro', 'Pomodoro Pro', 'Complete 50 Pomodoro sessions', '🍅', 50],
    ['quest_champion', 'Quest Champion', 'Complete all 3 daily quests in one day 10 times', '⚡', 10],
    ['dice_master', 'Dice Master', 'Complete 20 dice roll challenges', '🎲', 20],
    ['spinner', 'Spinner', 'Spin the wheel 50 times', '🎡', 50],
  ];

  for (const [key, name, desc, icon, threshold] of achievements) {
    await db.execute(
      `INSERT IGNORE INTO achievements (key_name, name, description, icon, threshold) VALUES (?, ?, ?, ?, ?)`,
      [key, name, desc, icon, threshold]
    );
  }
}

async function seedDailyQuests(db) {
  const quests = [
    ['complete_tasks', 'Complete 5 tasks from your Master List', 5],
    ['win_bingo', 'Win a round of Bingo', 1],
    ['pomodoro_sessions', 'Complete 4 Pomodoro sessions', 4],
    ['spin_wheel', 'Spin the wheel 3 times', 3],
    ['defeat_boss', 'Defeat a boss', 1],
    ['fill_marbles', 'Drop 10 marbles in your jar', 10],
    ['use_relaxation', 'Use a relaxation tool', 1],
    ['maintain_streak', 'Keep your streak alive', 1],
    ['dice_challenge', 'Complete a dice roll challenge', 1],
    ['place_bet', 'Place a bet on yourself', 1],
  ];

  for (const [type, desc, target] of quests) {
    await db.execute(
      `INSERT IGNORE INTO daily_quests (quest_type, description, target_count) VALUES (?, ?, ?)`,
      [type, desc, target]
    );
  }
}
