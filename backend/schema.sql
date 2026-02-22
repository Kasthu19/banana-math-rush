-- Banana Game Database Schema

CREATE DATABASE IF NOT EXISTS banana_game;
USE banana_game;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    score INT DEFAULT 0,
    level INT DEFAULT 1,
    average_response_time FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Analytics table for per-question response time
CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    score_id INT NOT NULL,
    question_id VARCHAR(50),
    response_time FLOAT NOT NULL, -- in seconds
    is_correct BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (score_id) REFERENCES scores(id) ON DELETE CASCADE
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    requirement_type VARCHAR(50), -- e.g., 'score', 'level', 'combo'
    requirement_value INT
);

-- User achievements mapping
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

-- Insert some initial achievements
INSERT INTO achievements (name, description, icon_url, requirement_type, requirement_value) VALUES
('Beginner', 'Reach level 2', 'beginner.png', 'level', 2),
('Intermediate', 'Reach level 3', 'intermediate.png', 'level', 3),
('Elite', 'Reach level 5', 'elite.png', 'level', 5),
('Speedster', 'Average response time under 3 seconds', 'speedster.png', 'response_time', 3),
('Banana Master', 'Score over 50 points', 'master.png', 'score', 50);
