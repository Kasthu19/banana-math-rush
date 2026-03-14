<?php
require_once '../auth_utils.php';
setup_api_headers();
start_secure_session();
require_auth();

require_once '../db.php';

$userId = $_SESSION['user_id'];

header('Content-Type: application/json');

try {
    $stmt = $pdo->prepare("UPDATE users SET highest_level = 1 WHERE id = ?");
    $stmt->execute([$userId]);
    echo json_encode(['status' => 'success', 'message' => 'Progress reset to Level 1']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
