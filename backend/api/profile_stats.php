<?php
require_once '../auth_utils.php';
setup_api_headers();
start_secure_session();
require_auth();

require_once '../db.php';

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

    // 4. Get User Info (Diamonds, Highest Level, Profile Pic)
    $stmt_user = $pdo->prepare("SELECT diamonds, highest_level, profile_pic FROM users WHERE id = ?");
    $stmt_user->execute([$user_id]);
    $user_data = $stmt_user->fetch();

    echo json_encode([
        "status" => "success",
        "data" => [
            "username" => $_SESSION['username'],
            "diamonds" => $user_data['diamonds'] ?? 0,
            "highest_level" => $user_data['highest_level'] ?? 1,
            "profile_pic" => $user_data['profile_pic'] ?? null,
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