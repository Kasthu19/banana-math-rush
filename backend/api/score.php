<?php
// backend/api/score.php

require_once '../db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit;
}

// Basic anti-cheat: rate limiting (simple session-based)
session_start();
$now = time();
if (isset($_SESSION['last_submission']) && ($now - $_SESSION['last_submission'] < 2)) {
    http_response_code(429);
    echo json_encode(["status" => "error", "message" => "Rate limit exceeded. Slow down!"]);
    exit;
}
$_SESSION['last_submission'] = $now;

// In a real app, user_id would come from session
$user_id = $_SESSION['user_id'] ?? 1;

$score = filter_input(INPUT_POST, 'score', FILTER_SANITIZE_NUMBER_INT);
$level = filter_input(INPUT_POST, 'level', FILTER_SANITIZE_NUMBER_INT) ?? 1;
$avg_response_time = filter_input(INPUT_POST, 'avg_response_time', FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
$analytics = $_POST['analytics'] ?? '[]'; // JSON string of analytics data

try {
    $pdo->beginTransaction();

    // Insert score
    $stmt = $pdo->prepare("INSERT INTO scores (user_id, score, level, average_response_time) VALUES (?, ?, ?, ?)");
    $stmt->execute([$user_id, $score, $level, $avg_response_time]);
    $score_id = $pdo->lastInsertId();

    // Insert analytics
    $analytics_data = json_decode($analytics, true);
    if (is_array($analytics_data)) {
        $stmt_analytics = $pdo->prepare("INSERT INTO analytics (user_id, score_id, question_id, response_time, is_correct) VALUES (?, ?, ?, ?, ?)");
        foreach ($analytics_data as $item) {
            $stmt_analytics->execute([
                $user_id,
                $score_id,
                $item['question_id'] ?? null,
                $item['response_time'],
                $item['is_correct'] ? 1 : 0
            ]);
        }
    }

    // Achievement Check (Simple example: reach level 5 for Elite)
    if ($level >= 5) {
        $stmt_check = $pdo->prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = (SELECT id FROM achievements WHERE name = 'Elite')");
        $stmt_check->execute([$user_id]);
        if (!$stmt_check->fetch()) {
            $stmt_award = $pdo->prepare("INSERT INTO user_achievements (user_id, achievement_id) SELECT ?, id FROM achievements WHERE name = 'Elite'");
            $stmt_award->execute([$user_id]);
        }
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Score and analytics saved"]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>