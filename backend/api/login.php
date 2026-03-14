<?php
require_once '../auth_utils.php';
setup_api_headers();
start_secure_session();

require_once '../db.php';

error_log("Login Request: " . $_SERVER['REQUEST_METHOD'] . " User: " . ($_POST['username'] ?? 'unknown'));
error_log("Session ID (Pre): " . session_id());
error_log("Session Data (Pre): " . print_r($_SESSION, true));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];

            error_log("Session set for: " . $user['username'] . " (ID: " . $user['id'] . ") Session ID: " . session_id());


            session_write_close();
            echo json_encode([
                "status" => "success",
                "message" => "Login successful",
                "username" => $user['username'],
                "user_id" => $user['id']
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid username or password"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
}
?>