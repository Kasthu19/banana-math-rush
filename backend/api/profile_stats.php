<?php
// backend/api/profile_stats.php

require_once '../db.php';
header('Content-Type: application/json');

session_save_path(__DIR__ . '/../sessions');
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "User not authenticated"]);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // 1. Get User Summary Stats
    $stmt_summary = $pdo->prepare("
        SELECT 
            COUNT(*) as total_games,
            MAX(score) as high_score,
            SUM(score) as total_score,
            AVG(average_response_time) as avg_speed,
            MAX(level) as max_level
        FROM scores 
        WHERE user_id = ?
    ");
    $stmt_summary->execute([$user_id]);
    $summary = $stmt_summary->fetch();

    // 2. Get Recent Games
    $stmt_recent = $pdo->prepare("
        SELECT score, level, average_response_time, created_at 
        FROM scores 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $stmt_recent->execute([$user_id]);
    $recent_games = $stmt_recent->fetchAll();

    // 3. Get Achievements
    $stmt_achievements = $pdo->prepare("
        SELECT a.name, a.description, ua.earned_at
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = ?
        ORDER BY ua.earned_at DESC
    ");
    $stmt_achievements->execute([$user_id]);
    $achievements = $stmt_achievements->fetchAll();

    echo json_encode([
        "status" => "success",
        "data" => [
            "username" => $_SESSION['username'],
            "summary" => $summary,
            "recent_games" => $recent_games,
            "achievements" => $achievements
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>