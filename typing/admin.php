<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TypingSpeed - Test Gõ Phím</title>

    <!-- Google AdSense Code -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2159939441444456"
         crossorigin="anonymous"></script>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="style.css">
    <script src="script.js" defer></script>
</head>
<body>

    <header class="header">
        <div class="nav-container">
            <div class="logo"><i class="fa-solid fa-keyboard"></i> TypingSpeed</div>
            <div class="nav-right">
                <select id="lang-select">
                    <option value="vi">🇻🇳 Tiếng Việt</option>
                    <option value="en">🇬🇧 English</option>
                </select>
                <a href="https://discord.gg/3HRkTTYZWp" target="_blank" class="btn-discord"><i class="fa-brands fa-discord"></i> Discord</a>
                <div id="user-area">
                    <button class="btn-primary" onclick="openAuth()">Đăng Nhập</button>
                </div>
            </div>
        </div>
    </header>

    <div class="app-wrap">
        <div class="main-tabs">
            <button id="btn-tab-typing" class="tab-item active" onclick="switchSection('typing')">
                <i class="fa-solid fa-bolt"></i> Kiểm Tra Gõ Phím
            </button>
            <button id="btn-tab-leaderboard" class="tab-item" onclick="switchSection('leaderboard')">
                <i class="fa-solid fa-trophy"></i> Bảng Xếp Hạng
            </button>
            <button id="btn-tab-profile" class="tab-item" onclick="switchSection('profile')">
                <i class="fa-solid fa-user"></i> Hồ Sơ
            </button>
        </div>

        <!-- Section 1: Typing -->
        <div id="section-typing" class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-keyboard"></i> Luyện Gõ Phím</h2>
                <div class="timer-badge" id="timer">60s</div>
            </div>

            <div class="words-wrapper">
                <div id="words-display" class="words-display"></div>
            </div>

            <div class="input-row">
                <input type="text" id="word-input" placeholder="Gõ từ tại đây và nhấn Space..." autocomplete="off" autofocus>
                <button id="restart-btn" class="btn-reload" onclick="resetGame()"><i class="fa-solid fa-rotate-right"></i> Làm mới</button>
            </div>
        </div>

        <!-- Section 2: Leaderboard -->
        <div id="section-leaderboard" class="card hidden">
            <div class="card-header">
                <h2><i class="fa-solid fa-ranking-star"></i> Bảng Xếp Hạng Top 100</h2>
                <span id="my-rank-badge" class="rank-badge">Hạng của bạn: Top 100+</span>
            </div>

            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Quốc gia</th>
                            <th>Người chơi</th>
                            <th>WPM</th>
                            <th>Chính xác</th>
                        </tr>
                    </thead>
                    <tbody id="leaderboard-body">
                        <tr><td colspan="5" style="text-align:center;">Đang tải bảng xếp hạng...</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Phân Trang 4 Trang -->
            <div class="pagination">
                <button onclick="changePage(1)" id="page-btn-1" class="page-btn active">1</button>
                <button onclick="changePage(2)" id="page-btn-2" class="page-btn">2</button>
                <button onclick="changePage(3)" id="page-btn-3" class="page-btn">3</button>
                <button onclick="changePage(4)" id="page-btn-4" class="page-btn">4</button>
            </div>
        </div>

        <!-- Section 3: Profile -->
        <div id="section-profile" class="card hidden">
            <div class="card-header">
                <h2><i class="fa-solid fa-id-card"></i> Hồ Sơ Cá Nhân</h2>
            </div>
            
            <div id="profile-not-login" class="profile-empty">
                <p>Vui lòng <a href="#" onclick="openAuth()">Đăng nhập</a> để xem thông tin hồ sơ của bạn.</p>
            </div>

            <div id="profile-content" class="profile-grid hidden">
                <div class="profile-info-box">
                    <p><strong>Tên tài khoản:</strong> <span id="prof-username">-</span></p>
                    <p><strong>Ngày đăng ký:</strong> <span id="prof-created">-</span></p>
                </div>

                <div class="stats-grid">
                    <div class="stat-card green">
                        <span class="stat-title">WPM Cao Nhất</span>
                        <span id="prof-max-wpm" class="stat-value">0</span>
                    </div>
                    <div class="stat-card red">
                        <span class="stat-title">WPM Thấp Nhất</span>
                        <span id="prof-min-wpm" class="stat-value">0</span>
                    </div>
                    <div class="stat-card gold">
                        <span class="stat-title">Hạng Cao Nhất</span>
                        <span id="prof-best-rank" class="stat-value">-</span>
                    </div>
                    <div class="stat-card blue">
                        <span class="stat-title">Hạng Hiện Tại</span>
                        <span id="prof-current-rank" class="stat-value">-</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Kết quả -->
    <div id="result-modal" class="modal-overlay hidden">
        <div class="modal-box">
            <h3><i class="fa-solid fa-medal"></i> Kết Quả Bài Test</h3>
            <div class="score-grid">
                <div class="score-card">
                    <span id="res-wpm" class="score-val">0</span>
                    <span class="score-lbl">WPM</span>
                </div>
                <div class="score-card">
                    <span id="res-acc" class="score-val">0%</span>
                    <span class="score-lbl">Chính Xác</span>
                </div>
            </div>
            <p id="rank-display" style="margin-bottom:15px; font-weight:600;">Hạng: -</p>
            <button class="btn-primary btn-full" onclick="closeResult()">Thử Lại</button>
        </div>
    </div>

    <!-- Modal Auth -->
    <div id="auth-modal" class="modal-overlay hidden">
        <div class="modal-box">
            <span class="close-x" onclick="closeAuth()">&times;</span>
            <div class="tab-header">
                <button type="button" id="tab-login" class="tab-btn active" onclick="setAuthMode('login')">Đăng nhập</button>
                <button type="button" id="tab-register" class="tab-btn" onclick="setAuthMode('register')">Đăng ký</button>
            </div>
            <form id="auth-form" onsubmit="handleAuth(event)">
                <input type="text" id="auth-username" placeholder="Tên tài khoản" required>
                <input type="email" id="auth-email" placeholder="Địa chỉ Email" class="hidden">
                <input type="password" id="auth-password" placeholder="Mật khẩu" required>
                <input type="password" id="auth-confirm-password" placeholder="Nhập lại mật khẩu" class="hidden">

                <button type="submit" id="auth-submit" class="btn-primary btn-full">Đăng nhập</button>
            </form>

            <p id="auth-msg" class="err-msg"></p>

            <div id="forgot-note" class="forgot-box">
                Nếu bạn quên mật khẩu? Vô nhóm <a href="https://discord.gg/3HRkTTYZWp" target="_blank">Discord</a> để được hỗ trợ.
            </div>
        </div>
    </div>

</body>
</html>
