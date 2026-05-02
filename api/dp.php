<?php
$host = 'localhost';
$dbname = 'erp_db';
$user = 'root';       // غيّرها حسب إعداداتك
$pass = '';           // غيّرها حسب إعداداتك

$passwordHash = password_hash('123', PASSWORD_BCRYPT);
$stmt = $pdo->prepare("INSERT INTO users (username, password, role_id) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE username=username");
$stmt->execute(['admin', $passwordHash]);

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(["error" => "فشل الاتصال بقاعدة البيانات"]));
}

