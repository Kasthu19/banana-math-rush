<?php
// backend/db.php

$host = 'localhost';
$db = 'banana_game';
$user = 'root';
$pass = ''; // Leave empty if no password
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
     PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
     PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
     PDO::ATTR_EMULATE_PREPARES => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     header("Content-Type: application/json; charset=UTF-8");
     echo json_encode(["status" => "error", "message" => "Connection failed: " . $e->getMessage()]);
     exit;
}
