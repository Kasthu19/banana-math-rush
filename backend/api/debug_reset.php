<?php
require_once '../auth_utils.php';
setup_api_headers();
start_secure_session();
require_auth();

require_once '../db.php';

$userId = $_SESSION['user_id'];

header('Content-Type: application/json');

try {
    $pdo->beginTransaction();

    // 1. Clear Scores (cascades to analytics)
    $stmt1 = $pdo->prepare("DELETE FROM scores WHERE user_id = ?");
    $stmt1->execute([$userId]);

    // 2. Clear Achievements
    $stmt2 = $pdo->prepare("DELETE FROM user_achievements WHERE user_id = ?");
    $stmt2->execute([$userId]);

    // 3. Reset Highest Level
    $stmt3 = $pdo->prepare("UPDATE users SET highest_level = 1 WHERE id = ?");
    $stmt3->execute([$userId]);

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Progress reset to Level 1 and previous data cleared.']);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
