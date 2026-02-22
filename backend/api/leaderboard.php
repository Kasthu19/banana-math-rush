<?php
// backend/api/leaderboard.php

require_once '../db.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->query("
        SELECT u.username, MAX(s.score) as high_score, MAX(s.level) as max_level
        FROM scores s
        JOIN users u ON s.user_id = u.id
        GROUP BY s.user_id
        ORDER BY high_score DESC
        LIMIT 10
    ");
    $leaderboard = $stmt->fetchAll();
    echo json_encode($leaderboard);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>