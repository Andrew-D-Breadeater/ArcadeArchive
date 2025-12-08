-- Clean slate: Delete old structures if they exist
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS score_history;
DROP VIEW IF EXISTS leaderboard;

-- 1. Users Table
-- Stores login credentials.
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Score History Table
-- The log of every game ever played.
CREATE TABLE score_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 3. Optimization Indexes
-- These make the View and the "Personal Bests" queries fast.
CREATE INDEX idx_user_history ON score_history(user_id, game_name, score DESC);
CREATE INDEX idx_game_scores ON score_history(game_name, score DESC);

-- 4. Leaderboard View
-- A virtual table that calculates the best score for each user per game.
CREATE VIEW leaderboard AS
SELECT 
    user_id, 
    game_name, 
    MAX(score) as best_score, 
    played_at as achieved_at
FROM score_history
GROUP BY user_id, game_name;