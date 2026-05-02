<?php
$host = 'localhost';
$dbname = 'erp_db';
$user = 'root';       // غيّرها حسب إعداداتك
$pass = '';           // غيّرها حسب إعداداتك

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(["error" => "فشل الاتصال بقاعدة البيانات"]));
}