<?php
header("Content-Type: application/json; charset=UTF-8");
session_start();
date_default_timezone_set('Asia/Ho_Chi_Minh');

$db_host = 'sql108.infinityfree.com';
$db_name = 'if0_42622354_typing';
$db_user = 'if0_42622354';
$db_pass = 'locthinh1';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    $pdo->exec("SET time_zone = '+07:00'");
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Lỗi kết nối cơ sở dữ liệu!"]);
    exit();
}

// Khởi tạo bảng
$pdo->exec("CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    country VARCHAR(10) DEFAULT 'VN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    wpm INT NOT NULL,
    accuracy INT NOT NULL,
    lang VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)");

try { $pdo->exec("ALTER TABLE users ADD COLUMN email VARCHAR(100) DEFAULT NULL"); } catch (Exception $e) {}
try { $pdo->exec("ALTER TABLE users ADD COLUMN country VARCHAR(10) DEFAULT 'VN'"); } catch (Exception $e) {}

function getUserCountry() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if ($ip == '127.0.0.1' || $ip == '::1') return 'VN';
    try {
        $json = @file_get_contents("http://ip-api.com/json/{$ip}?fields=countryCode");
        if ($json) {
            $data = json_decode($json, true);
            if (!empty($data['countryCode'])) return $data['countryCode'];
        }
    } catch (Exception $e) {}
    return 'VN';
}

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents("php://input"), true);

if ($action === 'register') {
    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $country = getUserCountry();

    if (empty($username) || empty($password) || empty($email)) {
        echo json_encode(["status" => "error", "message" => "Vui lòng nhập đầy đủ thông tin!"]);
        exit();
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "Tên tài khoản đã tồn tại!"]);
        exit();
    }

    $hashedPass = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password, country) VALUES (?, ?, ?, ?)");
    if ($stmt->execute([$username, $email, $hashedPass, $country])) {
        $userId = $pdo->lastInsertId();
        $_SESSION['user'] = ["id" => $userId, "username" => $username, "country" => $country];
        echo json_encode(["status" => "success", "user" => $_SESSION['user']]);
    } else {
        echo json_encode(["status" => "error", "message" => "Đăng ký thất bại!"]);
    }
} 
elseif ($action === 'login') {
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user'] = ["id" => $user['id'], "username" => $user['username'], "country" => $user['country'] ?? 'VN'];
        echo json_encode(["status" => "success", "user" => $_SESSION['user']]);
    } else {
        echo json_encode(["status" => "error", "message" => "Tài khoản hoặc mật khẩu không chính xác!"]);
    }
} 
elseif ($action === 'check_session') {
    if (isset($_SESSION['user'])) {
        echo json_encode(["logged_in" => true, "user" => $_SESSION['user']]);
    } else {
        echo json_encode(["logged_in" => false]);
    }
} 
elseif ($action === 'logout') {
    session_destroy();
    echo json_encode(["status" => "success"]);
} 
elseif ($action === 'save_score') {
    if (!isset($_SESSION['user'])) {
        echo json_encode(["status" => "error", "message" => "Chưa đăng nhập!"]);
        exit();
    }
    $userId = $_SESSION['user']['id'];
    $wpm = intval($data['wpm'] ?? 0);
    $accuracy = intval($data['accuracy'] ?? 0);
    $lang = $data['lang'] ?? 'vi';

    $stmt = $pdo->prepare("INSERT INTO scores (user_id, wpm, accuracy, lang) VALUES (?, ?, ?, ?)");
    $stmt->execute([$userId, $wpm, $accuracy, $lang]);
    echo json_encode(["status" => "success"]);
} 
elseif ($action === 'get_leaderboard') {
    $lang = $_GET['lang'] ?? 'vi';
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    if ($page < 1) $page = 1;
    if ($page > 4) $page = 4;
    $offset = ($page - 1) * 25;

    $stmt = $pdo->prepare("
        SELECT u.username, u.country, MAX(s.wpm) as max_wpm, s.accuracy 
        FROM scores s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.lang = ? 
        GROUP BY s.user_id 
        ORDER BY max_wpm DESC, accuracy DESC 
        LIMIT 25 OFFSET ?
    ");
    $stmt->bindValue(1, $lang, PDO::PARAM_STR);
    $stmt->bindValue(2, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $leaderboard = $stmt->fetchAll();

    $userRank = "Top 100+";
    if (isset($_SESSION['user'])) {
        $stmtRank = $pdo->prepare("
            SELECT user_id, MAX(wpm) as max_wpm 
            FROM scores 
            WHERE lang = ? 
            GROUP BY user_id 
            ORDER BY max_wpm DESC
        ");
        $stmtRank->execute([$lang]);
        $allRanks = $stmtRank->fetchAll();
        foreach ($allRanks as $index => $row) {
            if ($row['user_id'] == $_SESSION['user']['id']) {
                $userRank = "#" . ($index + 1);
                break;
            }
        }
    }

    echo json_encode([
        "status" => "success", 
        "leaderboard" => $leaderboard, 
        "user_rank" => $userRank,
        "current_page" => $page
    ]);
}
elseif ($action === 'get_profile') {
    if (!isset($_SESSION['user'])) {
        echo json_encode(["status" => "error", "message" => "Chưa đăng nhập!"]);
        exit();
    }
    $userId = $_SESSION['user']['id'];
    $lang = $_GET['lang'] ?? 'vi';

    $stmtUser = $pdo->prepare("SELECT username, created_at FROM users WHERE id = ?");
    $stmtUser->execute([$userId]);
    $user = $stmtUser->fetch();

    $stmtWpm = $pdo->prepare("SELECT MAX(wpm) as max_wpm, MIN(wpm) as min_wpm FROM scores WHERE user_id = ?");
    $stmtWpm->execute([$userId]);
    $wpmData = $stmtWpm->fetch();

    $stmtAllScores = $pdo->prepare("SELECT wpm, lang FROM scores WHERE user_id = ?");
    $stmtAllScores->execute([$userId]);
    $userScores = $stmtAllScores->fetchAll();

    $bestRank = null;
    if (!empty($userScores)) {
        foreach ($userScores as $score) {
            $stmtRank = $pdo->prepare("SELECT COUNT(DISTINCT user_id) as higher_users FROM scores WHERE lang = ? AND wpm > ?");
            $stmtRank->execute([$score['lang'], $score['wpm']]);
            $rank = $stmtRank->fetch()['higher_users'] + 1;
            if ($bestRank === null || $rank < $bestRank) $bestRank = $rank;
        }
    }

    $stmtCurrentRank = $pdo->prepare("
        SELECT user_id, MAX(wpm) as max_wpm 
        FROM scores 
        WHERE lang = ? 
        GROUP BY user_id 
        ORDER BY max_wpm DESC
    ");
    $stmtCurrentRank->execute([$lang]);
    $allCurrentRanks = $stmtCurrentRank->fetchAll();
    
    $currentRank = "Chưa có";
    foreach ($allCurrentRanks as $index => $row) {
        if ($row['user_id'] == $userId) {
            $currentRank = "#" . ($index + 1);
            break;
        }
    }

    echo json_encode([
        "status" => "success",
        "profile" => [
            "username" => $user['username'],
            "created_at" => date("d/m/Y H:i", strtotime($user['created_at'])),
            "max_wpm" => $wpmData['max_wpm'] !== null ? $wpmData['max_wpm'] : 0,
            "min_wpm" => $wpmData['min_wpm'] !== null ? $wpmData['min_wpm'] : 0,
            "best_rank" => $bestRank !== null ? "#" . $bestRank : "Chưa có",
            "current_rank" => $currentRank
        ]
    ]);
}
?>