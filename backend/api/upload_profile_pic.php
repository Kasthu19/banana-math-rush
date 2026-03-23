<?php
// backend/api/upload_profile_pic.php
require_once '../auth_utils.php';
setup_api_headers();
start_secure_session();
require_auth();

require_once '../db.php';

$user_id = $_SESSION['user_id'];
$upload_dir = '../../frontend/assets/profile_pics/';

if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['profile_pic'])) {
    $file = $_FILES['profile_pic'];
    
    // Validate file
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($file['type'], $allowed_types)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid file type. Only JPG, PNG, and GIF are allowed."]);
        exit;
    }

    if ($file['size'] > 2 * 1024 * 1024) { // 2MB limit
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "File size too large. Max 2MB allowed."]);
        exit;
    }

    $file_ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $new_filename = 'user_' . $user_id . '_' . time() . '.' . $file_ext;
    $upload_path = $upload_dir . $new_filename;

    if (move_uploaded_file($file['tmp_name'], $upload_path)) {
        try {
            // Get old filename to delete it
            $stmt_old = $pdo->prepare("SELECT profile_pic FROM users WHERE id = ?");
            $stmt_old->execute([$user_id]);
            $old_pic = $stmt_old->fetchColumn();

            // Update database
            $stmt = $pdo->prepare("UPDATE users SET profile_pic = ? WHERE id = ?");
            $stmt->execute(['assets/profile_pics/' . $new_filename, $user_id]);

            // Delete old pic if exists
            if ($old_pic && file_exists('../../frontend/' . $old_pic)) {
                @unlink('../../frontend/' . $old_pic);
            }

            echo json_encode([
                "status" => "success",
                "message" => "Profile picture updated successfully.",
                "data" => ["profile_pic" => 'assets/profile_pics/' . $new_filename]
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to move uploaded file."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No file uploaded or invalid request."]);
}
?>
