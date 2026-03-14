<?php
// backend/auth_utils.php

function setup_api_headers() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // Only set Access-Control-Allow-Origin if an Origin is actually sent.
    // This avoids sending '*' with 'Credentials: true', which is an invalid combination.
    if (!empty($origin)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Credentials: true");
    }
    
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Content-Type: application/json; charset=UTF-8");

    // Handle preflight OPTIONS requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit;
    }
}

function start_secure_session() {
    // Session configuration
    session_save_path(__DIR__ . '/sessions');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => false, // Set to true if using HTTPS
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function require_auth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "User not authenticated"]);
        exit;
    }
}
?>
