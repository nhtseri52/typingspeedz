<?php
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
    die("Lỗi kết nối cơ sở dữ liệu!");
}

$admin_pass = "123456"; 

if (isset($_POST['admin_login'])) {
    if ($_POST['pass'] === $admin_pass) {
        $_SESSION['is_admin'] = true;
    } else {
        $error = "Mật khẩu Admin không đúng!";
    }
}

if (isset($_GET['logout'])) {
    unset($_SESSION['is_admin']);
    header("Location: admin.php");
    exit();
}

if (!isset($_SESSION['is_admin'])) {
?>
    <!DOCTYPE html>
    <html lang="vi">
    <head><meta charset="UTF-8"><title>Admin Login</title>
    <style>
        body { background: #121316; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .login-box { background: #1a1c23; padding: 30px; border-radius: 8px; border: 1px solid #2a2d3d; text-align: center; }
        input, button { padding: 10px; margin-top: 10px; width: 100%; box-sizing: border-box; background: #232633; color: #fff; border: 1px solid #3a3f55; border-radius: 5px; }
        button { background: #4f46e5; cursor: pointer; font-weight: bold; border: none; }
    </style></head>
    <body>
        <div class="login-box">
            <h2>Đăng Nhập Admin</h2>
            <?php if (isset($error)) echo "<p style='color:red;'>$error</p>"; ?>
            <form method="POST">
                <input type="password" name="pass" placeholder="Nhập mật khẩu Admin..." required>
                <button type="submit" name="admin_login">Đăng nhập</button>
            </form>
        </div>
    </body>
    </html>
<?php
    exit();
}

$msg = "";

if (isset($_POST['update_user'])) {
    $uid = intval($_POST['user_id']);
    $new_username = trim($_POST['username']);
    $new_email = trim($_POST['email']);
    $new_password = $_POST['new_password'];

    if (!empty($new_password)) {
        $hashed = password_hash($new_password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?");
        $stmt->execute([$new_username, $new_email, $hashed, $uid]);
    } else {
        $stmt = $pdo->prepare("UPDATE users SET username = ?, email = ? WHERE id = ?");
        $stmt->execute([$new_username, $new_email, $uid]);
    }
    $msg = "Cập nhật tài khoản #$uid thành công!";
}

if (isset($_POST['update_score'])) {
    $sid = intval($_POST['score_id']);
    $new_wpm = intval($_POST['wpm']);
    $new_acc = intval($_POST['accuracy']);

    $stmt = $pdo->prepare("UPDATE scores SET wpm = ?, accuracy = ? WHERE id = ?");
    $stmt->execute([$new_wpm, $new_acc, $sid]);
    $msg = "Cập nhật điểm số #$sid thành công!";
}

if (isset($_GET['delete_user'])) {
    $uid = intval($_GET['delete_user']);
    $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$uid]);
    header("Location: admin.php");
    exit();
}

if (isset($_GET['delete_score'])) {
    $sid = intval($_GET['delete_score']);
    $pdo->prepare("DELETE FROM scores WHERE id = ?")->execute([$sid]);
    header("Location: admin.php");
    exit();
}

$total_users = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
$total_scores = $pdo->query("SELECT COUNT(*) FROM scores")->fetchColumn();
$online_users = $pdo->query("SELECT COUNT(DISTINCT user_id) FROM scores WHERE created_at >= NOW() - INTERVAL 5 MINUTE")->fetchColumn();
?>

<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Quản Lý Hệ Thống - Admin Panel</title>
    <style>
        * { box-sizing: border-box; }
        body { background: #121316; color: #e1e7ec; font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; margin: 0; }
        .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2a2d3d; padding-bottom: 10px; margin-bottom: 20px; }
        .btn-logout { background: #ef4444; color: #fff; text-decoration: none; padding: 8px 15px; border-radius: 5px; font-weight: bold; }
        .stats-wrap { display: flex; gap: 15px; margin-bottom: 25px; }
        .stat-card { flex: 1; background: #1a1c23; border: 1px solid #2a2d3d; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-card.active-users { border-color: #10b981; }
        .stat-number { font-size: 1.8rem; font-weight: bold; color: #10b981; display: block; margin-top: 5px; }
        .stat-label { font-size: 0.85rem; color: #8a94a6; }
        table { width: 100%; border-collapse: collapse; background: #1a1c23; margin-top: 10px; border-radius: 8px; overflow: hidden; }
        th, td { padding: 12px; border: 1px solid #2a2d3d; text-align: left; font-size: 0.9rem; }
        th { background: #232633; color: #8a94a6; }
        input[type="text"], input[type="number"], input[type="email"], input[type="password"] {
            background: #121316; color: #fff; border: 1px solid #3a3f55; padding: 6px 10px; border-radius: 4px; width: 100%;
        }
        .btn-save { background: #10b981; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn-del { color: #ef4444; text-decoration: none; font-weight: bold; margin-left: 8px; }
        .alert { background: #10b981; color: #fff; padding: 10px 15px; border-radius: 5px; margin-bottom: 15px; }
        .hash-code { font-family: monospace; font-size: 0.75rem; color: #8a94a6; word-break: break-all; max-width: 150px; display: inline-block; }
    </style>
</head>
<body>

    <div class="header-bar">
        <h1>Trang Quản Lý Admin</h1>
        <a href="?logout=1" class="btn-logout">Thoát Admin</a>
    </div>

    <div class="stats-wrap">
        <div class="stat-card active-users">
            <span class="stat-label">🟢 Đang Chơi (5 phút qua)</span>
            <span class="stat-number"><?=$online_users?> người</span>
        </div>
        <div class="stat-card">
            <span class="stat-label">👥 Tổng Tài Khoản</span>
            <span class="stat-number" style="color:#3b82f6;"><?=$total_users?></span>
        </div>
        <div class="stat-card">
            <span class="stat-label">⌨️ Tổng Lượt Test</span>
            <span class="stat-number" style="color:#f59e0b;"><?=$total_scores?></span>
        </div>
    </div>

    <?php if (!empty($msg)): ?>
        <div class="alert"><?=$msg?></div>
    <?php endif; ?>

    <h2>1. Danh Sách & Chỉnh Sửa Tài Khoản</h2>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Tên Tài Khoản</th>
                <th>Email</th>
                <th>Mật Khẩu Mới (Bỏ trống nếu không đổi)</th>
                <th>Pass Hash DB</th>
                <th>Quốc Gia</th>
                <th>Hành Động</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $users = $pdo->query("SELECT * FROM users ORDER BY id DESC")->fetchAll();
            foreach ($users as $u):
            ?>
            <tr>
                <form method="POST">
                    <td><strong>#<?=$u['id']?></strong><input type="hidden" name="user_id" value="<?=$u['id']?>"></td>
                    <td><input type="text" name="username" value="<?=$u['username']?>" required></td>
                    <td><input type="email" name="email" value="<?=$u['email']?>"></td>
                    <td><input type="password" name="new_password" placeholder="Nhập pass mới..."></td>
                    <td><span class="hash-code"><?=$u['password']?></span></td>
                    <td><?=$u['country']?></td>
                    <td>
                        <button type="submit" name="update_user" class="btn-save">Lưu</button>
                        <a href="?delete_user=<?=$u['id']?>" class="btn-del" onclick="return confirm('Xóa user này sẽ xóa toàn bộ điểm số liên quan?')">Xóa</a>
                    </td>
                </form>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <br><hr><br>

    <h2>2. Quản Lý Điểm Số Top 50 Mới Nhất</h2>
    <table>
        <thead>
            <tr>
                <th>ID Điểm</th>
                <th>Người Chơi</th>
                <th>WPM</th>
                <th>Chính Xác (%)</th>
                <th>Ngôn Ngữ</th>
                <th>Thời Gian</th>
                <th>Hành Động</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $scores = $pdo->query("
                SELECT s.id, u.username, s.wpm, s.accuracy, s.lang, s.created_at 
                FROM scores s 
                JOIN users u ON s.user_id = u.id 
                ORDER BY s.id DESC 
                LIMIT 50
            ")->fetchAll();

            foreach ($scores as $s):
            ?>
            <tr>
                <form method="POST">
                    <td><strong>#<?=$s['id']?></strong><input type="hidden" name="score_id" value="<?=$s['id']?>"></td>
                    <td><strong><?=$s['username']?></strong></td>
                    <td><input type="number" name="wpm" value="<?=$s['wpm']?>" style="width: 80px;" required></td>
                    <td><input type="number" name="accuracy" value="<?=$s['accuracy']?>" style="width: 80px;" min="0" max="100" required>%</td>
                    <td><?=$s['lang']?></td>
                    <td><?=$s['created_at']?></td>
                    <td>
                        <button type="submit" name="update_score" class="btn-save">Lưu Điểm</button>
                        <a href="?delete_score=<?=$s['id']?>" class="btn-del" onclick="return confirm('Xóa lượt điểm này?')">Xóa</a>
                    </td>
                </form>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

</body>
</html>