<?php
require_once '../auth_utils.php';
setup_api_headers();
start_secure_session();
require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit;
}

// Basic anti-cheat: rate limiting (simple session-based)
$now = time();
if (isset($_SESSION['last_submission']) && ($now - $_SESSION['last_submission'] < 2)) {
    http_response_code(429);
    echo json_encode(["status" => "error", "message" => "Rate limit exceeded. Slow down!"]);
    exit;
}
$_SESSION['last_submission'] = $now;

require_once '../db.php';
$user_id = $_SESSION['user_id'];

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

    // Achievement Check
    $achievements_to_check = [];
    if ($level >= 5)
        $achievements_to_check[] = 'Elite';
    if ($score >= 50)
        $achievements_to_check[] = 'Banana Master';
    if ($avg_response_time > 0 && $avg_response_time < 2)
        $achievements_to_check[] = 'Speed Demon';

    $newly_unlocked = [];

    foreach ($achievements_to_check as $ach_name) {
        $stmt_check = $pdo->prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = (SELECT id FROM achievements WHERE name = ?)");
        $stmt_check->execute([$user_id, $ach_name]);
        if (!$stmt_check->fetch()) {
            $stmt_award = $pdo->prepare("INSERT INTO user_achievements (user_id, achievement_id) SELECT ?, id FROM achievements WHERE name = ?");
            $stmt_award->execute([$user_id, $ach_name]);
            $newly_unlocked[] = $ach_name;
        }
    }

    // Consistency King (Total games check)
    $stmt_count = $pdo->prepare("SELECT COUNT(*) FROM scores WHERE user_id = ?");
    $stmt_count->execute([$user_id]);
    if ($stmt_count->fetchColumn() >= 5) {
        $stmt_check_ck = $pdo->prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = (SELECT id FROM achievements WHERE name = 'Consistency King')");
        $stmt_check_ck->execute([$user_id]);
        if (!$stmt_check_ck->fetch()) {
            $stmt_award_ck = $pdo->prepare("INSERT INTO user_achievements (user_id, achievement_id) SELECT ?, id FROM achievements WHERE name = 'Consistency King'");
            $stmt_award_ck->execute([$user_id]);
            $newly_unlocked[] = 'Consistency King';
        }
    }

    // Update Highest Level in User Profile
    $stmt_update_level = $pdo->prepare("UPDATE users SET highest_level = CASE WHEN highest_level < ? THEN ? ELSE highest_level END WHERE id = ?");
    $stmt_update_level->execute([$level, $level, $user_id]);

    $pdo->commit();
    echo json_encode([
        "status" => "success",
        "message" => "Score and analytics saved",
        "newly_unlocked" => $newly_unlocked
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>