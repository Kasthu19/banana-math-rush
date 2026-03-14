<?php
require_once '../auth_utils.php';
setup_api_headers();
start_secure_session();
require_auth();

require_once '../db.php';

$user_id = $_SESSION['user_id'];
$amount = intval($_POST['amount'] ?? 0);
$purpose = $_POST['purpose'] ?? 'unknown';

if ($amount <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid amount"]);
    exit;
}

try {
    $pdo->beginTransaction();

    // Check balance
    $stmt = $pdo->prepare("SELECT diamonds FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if ($user['diamonds'] < $amount) {
        throw new Exception("Not enough diamonds! 💎");
    }

    // Deduct
    $stmt = $pdo->prepare("UPDATE users SET diamonds = diamonds - ? WHERE id = ?");
    $stmt->execute([$amount, $user_id]);

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Diamonds spent on $purpose", "new_balance" => $user['diamonds'] - $amount]);

} catch (Exception $e) {
    if ($pdo->inTransaction())
        $pdo->rollBack();
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
