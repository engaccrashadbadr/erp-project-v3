<?php
session_start();
require_once 'db.php';

function checkAuth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(["error" => "غير مصرح"]);
        exit;
    }
}

function getUserPermissions($userId) {
    global $pdo;
    $stmt = $pdo->prepare("
        SELECT p.name 
        FROM users u
        JOIN role_permissions rp ON u.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = ?
    ");
    $stmt->execute([$userId]);
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}