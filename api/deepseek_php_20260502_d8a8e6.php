$passwordHash = password_hash('123', PASSWORD_BCRYPT);
$stmt = $pdo->prepare("INSERT INTO users (username, password, role_id) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE username=username");
$stmt->execute(['admin', $passwordHash]);