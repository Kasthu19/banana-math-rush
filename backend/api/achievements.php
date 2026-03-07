<?php
// backend/api/achievements.php

require_once '../db.php';
header('Content-Type: application/json');

session_start();
$user_id = $_SESSION['user_id'] ?? 1;

try {
    // Fetch all achievements and whether the user has earned them
    $stmt = $pdo->prepare("
        SELECT a.name, a.description, a.diamond_value, 
               (ua.id IS NOT NULL) as earned,
               IFNULL(ua.is_claimed, 0) as is_claimed
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
        GROUP BY a.id
    ");
    $stmt->execute([$user_id]);
    $achievements = $stmt->fetchAll();
    echo json_encode($achievements);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>