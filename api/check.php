<?php
require_once 'auth.php';
checkAuth();

$userId = $_SESSION['user_id'];
$permissions = getUserPermissions($userId);

echo json_encode([
    'authenticated' => true,
    'user' => [
        'id' => $userId,
        'username' => $_SESSION['username'],
        'role_id' => $_SESSION['role_id']
    ],
    'permissions' => $permissions
]);