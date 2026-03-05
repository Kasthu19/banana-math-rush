<?php
// backend/api/claim_reward.php
require_once '../db.php';
header('Content-Type: application/json');
session_save_path(__DIR__ . '/../sessions');
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$user_id = $_SESSION['user_id'];
$achievement_name = $_POST['achievement_name'] ?? null;
$is_level_reward = isset($_POST['is_level_reward']) && $_POST['is_level_reward'] == '1';

try {
    $pdo->beginTransaction();

    if ($is_level_reward) {
        $reward = 10; // Fixed level reward
        $stmt = $pdo->prepare("UPDATE users SET diamonds = diamonds + ? WHERE id = ?");
        $stmt->execute([$reward, $user_id]);
        $message = "Level reward claimed!";
    } else if ($achievement_name) {
        // Find achievement value
        $stmt = $pdo->prepare("SELECT id, diamond_value FROM achievements WHERE name = ?");
        $stmt->execute([$achievement_name]);
        $ach = $stmt->fetch();

        if (!$ach)
            throw new Exception("Achievement not found");

        // Check if earned but not claimed
        $stmt = $pdo->prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ? AND is_claimed = 0");
        $stmt->execute([$user_id, $ach['id']]);
        if ($stmt->fetch()) {
            $stmt = $pdo->prepare("UPDATE user_achievements SET is_claimed = 1 WHERE user_id = ? AND achievement_id = ?");
            $stmt->execute([$user_id, $ach['id']]);

            $stmt = $pdo->prepare("UPDATE users SET diamonds = diamonds + ? WHERE id = ?");
            $stmt->execute([$ach['diamond_value'], $user_id]);
            $reward = $ach['diamond_value'];
            $message = "Achievement reward claimed!";
        } else {
            throw new Exception("Reward already claimed or not earned");
        }
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => $message, "reward" => $reward]);

} catch (Exception $e) {
    if ($pdo->inTransaction())
        $pdo->rollBack();
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
