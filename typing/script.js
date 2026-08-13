// Cấu hình kết nối API backend trên Host cũ
const API_BASE = "https://typingspeed.gamer.gd/api.php";

const wordListVi = ["nhà", "xe", "máy", "báo", "trường", "lớp", "học", "sinh", "sách", "vở", "bút", "thước", "máy", "tính", "điện", "thoại", "mạng", "xã", "hội", "lập", "trình", "mã", "nguồn", "dữ", "liệu", "phát", "triển", "công", "nghệ", "thông", "tin", "bàn", "phím", "chuột", "màn", "hình", "tai", "nghe"];
const wordListEn = ["house", "car", "school", "student", "book", "pen", "computer", "phone", "network", "code", "data", "develop", "tech", "keyboard", "mouse", "screen", "audio", "system", "program", "game", "speed", "test", "type"];

let words = [];
let currentWordIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let timeLeft = 60;
let timer = null;
let isPlaying = false;
let authMode = 'login';
let currentUser = null;
let currentPage = 1;

// Khởi chạy khi load trang
document.addEventListener("DOMContentLoaded", () => {
    checkLoggedInUser();
    resetGame();

    document.getElementById("word-input").addEventListener("input", handleTyping);
    document.getElementById("lang-select").addEventListener("change", resetGame);
});

function switchSection(section) {
    document.querySelectorAll(".tab-item").forEach(btn => btn.classList.remove("active"));
    document.getElementById(`btn-tab-${section}`).classList.add("active");

    document.getElementById("section-typing").classList.add("hidden");
    document.getElementById("section-leaderboard").classList.add("hidden");
    document.getElementById("section-profile").classList.add("hidden");

    document.getElementById(`section-${section}`).classList.remove("hidden");

    if (section === 'leaderboard') loadLeaderboard(currentPage);
    if (section === 'profile') loadProfile();
}

function resetGame() {
    clearInterval(timer);
    isPlaying = false;
    timeLeft = 60;
    currentWordIndex = 0;
    correctCount = 0;
    incorrectCount = 0;

    document.getElementById("timer").innerText = "60s";
    document.getElementById("word-input").value = "";
    document.getElementById("word-input").disabled = false;

    const lang = document.getElementById("lang-select").value;
    const baseList = lang === "vi" ? wordListVi : wordListEn;
    words = [];
    for (let i = 0; i < 60; i++) {
        words.push(baseList[Math.floor(Math.random() * baseList.length)]);
    }

    renderWords();
}

function renderWords() {
    const display = document.getElementById("words-display");
    display.innerHTML = "";
    words.forEach((w, idx) => {
        const span = document.createElement("span");
        span.className = "word";
        if (idx === currentWordIndex) span.classList.add("current");
        span.innerText = w;
        display.appendChild(span);
    });
}

function handleTyping(e) {
    const val = e.target.value;

    if (!isPlaying && val.length > 0) {
        isPlaying = true;
        timer = setInterval(() => {
            timeLeft--;
            document.getElementById("timer").innerText = `${timeLeft}s`;
            if (timeLeft <= 0) endGame();
        }, 1000);
    }

    if (val.endsWith(" ")) {
        const typedWord = val.trim();
        const currentWord = words[currentWordIndex];
        const wordSpans = document.querySelectorAll(".words-display .word");

        if (typedWord === currentWord) {
            wordSpans[currentWordIndex].className = "word correct";
            correctCount++;
        } else {
            wordSpans[currentWordIndex].className = "word incorrect";
            incorrectCount++;
        }

        currentWordIndex++;
        if (currentWordIndex < wordSpans.length) {
            wordSpans[currentWordIndex].classList.add("current");
        }

        e.target.value = "";
    }
}

function endGame() {
    clearInterval(timer);
    document.getElementById("word-input").disabled = true;

    const wpm = correctCount;
    const total = correctCount + incorrectCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    document.getElementById("res-wpm").innerText = wpm;
    document.getElementById("res-acc").innerText = `${accuracy}%`;

    document.getElementById("result-modal").classList.remove("hidden");

    if (currentUser) {
        saveScore(wpm, accuracy);
    } else {
        document.getElementById("rank-display").innerText = "Hạng: Đăng nhập để lưu điểm";
    }
}

function closeResult() {
    document.getElementById("result-modal").classList.add("hidden");
    resetGame();
}

// Auth Logic
function openAuth() { document.getElementById("auth-modal").classList.remove("hidden"); }
function closeAuth() { document.getElementById("auth-modal").classList.add("hidden"); }

function setAuthMode(mode) {
    authMode = mode;
    document.getElementById("tab-login").classList.toggle("active", mode === 'login');
    document.getElementById("tab-register").classList.toggle("active", mode === 'register');
    document.getElementById("auth-email").classList.toggle("hidden", mode === 'login');
    document.getElementById("auth-confirm-password").classList.toggle("hidden", mode === 'login');
    document.getElementById("auth-submit").innerText = mode === 'login' ? "Đăng nhập" : "Đăng ký";
}

async function handleAuth(e) {
    e.preventDefault();
    const user = document.getElementById("auth-username").value;
    const pass = document.getElementById("auth-password").value;
    const email = document.getElementById("auth-email").value;
    const confirmPass = document.getElementById("auth-confirm-password").value;
    const msg = document.getElementById("auth-msg");

    if (authMode === 'register' && pass !== confirmPass) {
        msg.innerText = "Mật khẩu nhập lại không khớp!";
        return;
    }

    const action = authMode === 'login' ? 'login' : 'register';
    const body = { action, username: user, password: pass, email };

    try {
        const res = await fetch(API_BASE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.status === "success") {
            currentUser = data.user;
            localStorage.setItem("typing_user", JSON.stringify(currentUser));
            updateUserUI();
            closeAuth();
        } else {
            msg.innerText = data.message || "Có lỗi xảy ra!";
        }
    } catch (err) {
        msg.innerText = "Lỗi kết nối máy chủ!";
    }
}

function checkLoggedInUser() {
    const saved = localStorage.getItem("typing_user");
    if (saved) {
        currentUser = JSON.parse(saved);
        updateUserUI();
    }
}

function updateUserUI() {
    const area = document.getElementById("user-area");
    if (currentUser) {
        area.innerHTML = `<span style="color:#38bdf8; font-weight:600;"><i class="fa-solid fa-user"></i> ${currentUser.username}</span> <button class="btn-primary" style="background:#ef4444;" onclick="logout()">Thoát</button>`;
    } else {
        area.innerHTML = `<button class="btn-primary" onclick="openAuth()">Đăng Nhập</button>`;
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem("typing_user");
    updateUserUI();
    switchSection('typing');
}

async function saveScore(wpm, accuracy) {
    try {
        const res = await fetch(API_BASE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "save_score", user_id: currentUser.id, wpm, accuracy })
        });
        const data = await res.json();
        if (data.rank) {
            document.getElementById("rank-display").innerText = `Hạng của bạn: Top ${data.rank}`;
        }
    } catch (err) {}
}

async function loadLeaderboard(page) {
    currentPage = page;
    document.querySelectorAll(".page-btn").forEach((b, i) => b.classList.toggle("active", i + 1 === page));

    const tbody = document.getElementById("leaderboard-body");
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Đang tải...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}?action=get_leaderboard&page=${page}`);
        const list = await res.json();

        tbody.innerHTML = "";
        list.forEach((item, idx) => {
            const rank = (page - 1) * 25 + idx + 1;
            tbody.innerHTML += `
                <tr>
                    <td><strong>#${rank}</strong></td>
                    <td>🇻🇳 VN</td>
                    <td>${item.username}</td>
                    <td><strong style="color:#22c55e;">${item.wpm}</strong> WPM</td>
                    <td>${item.accuracy}%</td>
                </tr>
            `;
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ef4444;">Không tải được dữ liệu!</td></tr>`;
    }
}

async function loadProfile() {
    if (!currentUser) {
        document.getElementById("profile-not-login").classList.remove("hidden");
        document.getElementById("profile-content").classList.add("hidden");
        return;
    }

    document.getElementById("profile-not-login").classList.add("hidden");
    document.getElementById("profile-content").classList.remove("hidden");

    document.getElementById("prof-username").innerText = currentUser.username;
    document.getElementById("prof-created").innerText = currentUser.created_at || "Vừa xong";

    try {
        const res = await fetch(`${API_BASE}?action=get_profile&user_id=${currentUser.id}`);
        const data = await res.json();

        document.getElementById("prof-max-wpm").innerText = data.max_wpm || 0;
        document.getElementById("prof-min-wpm").innerText = data.min_wpm || 0;
        document.getElementById("prof-best-rank").innerText = data.best_rank ? `#${data.best_rank}` : "-";
        document.getElementById("prof-current-rank").innerText = data.current_rank ? `#${data.current_rank}` : "-";
    } catch (err) {}
}
