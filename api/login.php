<?php
require_once 'db.php';
session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'طريقة غير مسموحة']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'اسم المستخدم وكلمة المرور مطلوبان']);
    exit;
}

$stmt = $pdo->prepare("SELECT id, password, role_id FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['error' => 'بيانات الدخول غير صحيحة']);
    exit;
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['username'] = $username;
$_SESSION['role_id'] = $user['role_id'];

echo json_encode([
    'success' => true,
    'user' => [
        'id' => $user['id'],
        'username' => $username,
        'role' => $user['role_id']
    ]
]);