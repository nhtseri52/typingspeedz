<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$db_host = 'sql108.infinityfree.com';
$db_name = 'if0_42622354_typing';
$db_user = 'if0_42622354';
$db_pass = 'locthinh1';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Lỗi kết nối CSDL"]));
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? $input['action'] ?? '';

// 1. Đăng ký / Đăng nhập
if ($action === 'register') {
    $u = $conn->real_escape_string($input['username']);
    $p = password_hash($input['password'], PASSWORD_DEFAULT);
    $e = $conn->real_escape_string($input['email']);

    $check = $conn->query("SELECT id FROM users WHERE username='$u'");
    if ($check->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "Tên tài khoản đã tồn tại!"]);
        exit;
    }

    $conn->query("INSERT INTO users (username, password, email) VALUES ('$u', '$p', '$e')");
    $id = $conn->insert_id;
    echo json_encode(["status" => "success", "user" => ["id" => $id, "username" => $u]]);
    exit;
}

if ($action === 'login') {
    $u = $conn->real_escape_string($input['username']);
    $p = $input['password'];

    $res = $conn->query("SELECT * FROM users WHERE username='$u'");
    if ($res->num_rows > 0) {
        $user = $res->fetch_assoc();
        if (password_verify($p, $user['password'])) {
            echo json_encode(["status" => "success", "user" => ["id" => $user['id'], "username" => $user['username'], "created_at" => $user['created_at']]]);
            exit;
        }
    }
    echo json_encode(["status" => "error", "message" => "Tài khoản hoặc mật khẩu không đúng!"]);
    exit;
}

// 2. Lưu điểm
if ($action === 'save_score') {
    $userId = (int)$input['user_id'];
    $wpm = (int)$input['wpm'];
    $acc = (int)$input['accuracy'];

    $conn->query("INSERT INTO scores (user_id, wpm, accuracy) VALUES ($userId, $wpm, $acc)");

    // Tính thứ hạng
    $rankRes = $conn->query("SELECT COUNT(DISTINCT user_id) + 1 AS rank FROM scores WHERE wpm > $wpm");
    $rankData = $rankRes->fetch_assoc();

    echo json_encode(["status" => "success", "rank" => $rankData['rank']]);
    exit;
}

// 3. Lấy Bảng xếp hạng Top 100 (Phân trang)
if ($action === 'get_leaderboard') {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = 25;
    $offset = ($page - 1) * $limit;

    $sql = "SELECT u.username, MAX(s.wpm) as wpm, s.accuracy 
            FROM scores s 
            JOIN users u ON s.user_id = u.id 
            GROUP BY s.user_id 
            ORDER BY wpm DESC 
            LIMIT $limit OFFSET $offset";
            
    $res = $conn->query($sql);
    $data = [];
    while($row = $res->fetch_assoc()) {
        $data[] = $row;
    }
    echo json_encode($data);
    exit;
}

// 4. Lấy thông tin Hồ sơ
if ($action === 'get_profile') {
    $userId = (int)$_GET['user_id'];

    $res = $conn->query("SELECT MAX(wpm) as max_wpm, MIN(wpm) as min_wpm FROM scores WHERE user_id = $userId");
    $stats = $res->fetch_assoc();

    echo json_encode([
        "max_wpm" => $stats['max_wpm'] ?? 0,
        "min_wpm" => $stats['min_wpm'] ?? 0,
        "best_rank" => 1,
        "current_rank" => 1
    ]);
    exit;
}
?>
