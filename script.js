const API_BASE = "/api";

const wordListVi = [
    "công", "nghệ", "thông", "tin", "lập", "trình", "máy", "tính", "bàn", "phím", "chuột", "màn", "hình", 
    "tai", "nghe", "học", "sinh", "sinh", "viên", "trường", "lớp", "thầy", "cô", "sách", "vở", "bút", "thước", 
    "nhà", "xe", "máy", "điện", "thoại", "mạng", "xã", "hội", "báo", "chí", "phát", "triển", "phần", "mềm"
];

const wordListEn = [
    "technology", "computer", "keyboard", "mouse", "screen", "developer", "software", "hardware", 
    "program", "code", "data", "system", "network", "internet", "website", "application", "mobile"
];

let words = [], currentWordIndex = 0, correctCount = 0, incorrectCount = 0;
let timeLeft = 60, timer = null, isPlaying = false, authMode = 'login', currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    checkLoggedInUser();
    resetGame();
    document.getElementById("word-input").addEventListener("input", handleTyping);
    document.getElementById("lang-select").addEventListener("change", resetGame);
});

function switchSection(section) {
    document.querySelectorAll(".tab-item").forEach(btn => btn.classList.remove("active"));
    const activeTab = document.getElementById(`btn-tab-${section}`);
    if (activeTab) activeTab.classList.add("active");

    document.getElementById("section-typing").classList.add("hidden");
    document.getElementById("section-leaderboard").classList.add("hidden");
    document.getElementById("section-profile").classList.add("hidden");
    document.getElementById("section-admin").classList.add("hidden");

    const sec = document.getElementById(`section-${section}`);
    if (sec) sec.classList.remove("hidden");

    if (section === 'leaderboard') loadLeaderboard();
    if (section === 'profile') loadProfile();
    if (section === 'admin') loadAdminUsers();
}

function resetGame() {
    clearInterval(timer);
    isPlaying = false; timeLeft = 60; currentWordIndex = 0; correctCount = 0; incorrectCount = 0;
    document.getElementById("timer").innerText = "60s";
    const input = document.getElementById("word-input");
    input.value = ""; input.disabled = false;
    words = []; generateMoreWords(100); renderWords();
}

function generateMoreWords(count) {
    const lang = document.getElementById("lang-select").value;
    const baseList = lang === "vi" ? wordListVi : wordListEn;
    for (let i = 0; i < count; i++) words.push(baseList[Math.floor(Math.random() * baseList.length)]);
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
        const wordSpans = document.querySelectorAll(".words-display .word");
        if (typedWord === words[currentWordIndex]) {
            wordSpans[currentWordIndex].className = "word correct";
            correctCount++;
        } else {
            wordSpans[currentWordIndex].className = "word incorrect";
            incorrectCount++;
        }
        currentWordIndex++;
        if (currentWordIndex < wordSpans.length) {
            const nextWord = wordSpans[currentWordIndex];
            nextWord.classList.add("current");
            nextWord.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        e.target.value = "";
    }
}

function endGame() {
    clearInterval(timer);
    document.getElementById("word-input").disabled = true;
    const wpm = correctCount;
    const accuracy = (correctCount + incorrectCount) > 0 ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) : 0;
    document.getElementById("res-wpm").innerText = wpm;
    document.getElementById("res-acc").innerText = `${accuracy}%`;
    document.getElementById("result-modal").classList.remove("hidden");
    if (currentUser) saveScore(wpm, accuracy);
}

function closeResult() { document.getElementById("result-modal").classList.add("hidden"); resetGame(); }
function openAuth() { document.getElementById("auth-modal").classList.remove("hidden"); }
function closeAuth() { document.getElementById("auth-modal").classList.add("hidden"); }

function setAuthMode(mode) {
    authMode = mode;
    document.getElementById("tab-login").classList.toggle("active", mode === 'login');
    document.getElementById("tab-register").classList.toggle("active", mode === 'register');
    document.getElementById("auth-email").classList.toggle("hidden", mode === 'login');
    document.getElementById("auth-submit").innerText = mode === 'login' ? "Đăng nhập" : "Đăng ký";
}

async function handleAuth(e) {
    e.preventDefault();
    const user = document.getElementById("auth-username").value;
    const pass = document.getElementById("auth-password").value;
    const email = document.getElementById("auth-email").value;
    const action = authMode === 'login' ? 'login' : 'register';

    try {
        const res = await fetch(API_BASE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, username: user, password: pass, email })
        });
        const data = await res.json();
        if (data.status === "success") {
            currentUser = data.user;
            localStorage.setItem("typing_user", JSON.stringify(currentUser));
            updateUserUI();
            closeAuth();
        } else {
            document.getElementById("auth-msg").innerText = data.message;
        }
    } catch (err) { document.getElementById("auth-msg").innerText = "Lỗi kết nối!"; }
}

function checkLoggedInUser() {
    const saved = localStorage.getItem("typing_user");
    if (saved) { currentUser = JSON.parse(saved); updateUserUI(); }
}

function updateUserUI() {
    const area = document.getElementById("user-area");
    const adminBtn = document.getElementById("btn-tab-admin");
    if (currentUser) {
        area.innerHTML = `<span style="color:#38bdf8; font-weight:600;"><i class="fa-solid fa-user"></i> ${currentUser.username}</span> <button class="btn-primary" style="background:#ef4444;" onclick="logout()">Thoát</button>`;
        if (currentUser.role === 'admin') adminBtn.classList.remove("hidden");
    } else {
        area.innerHTML = `<button class="btn-primary" onclick="openAuth()">Đăng Nhập</button>`;
        adminBtn.classList.add("hidden");
    }
}

function logout() { currentUser = null; localStorage.removeItem("typing_user"); updateUserUI(); switchSection('typing'); }

async function saveScore(wpm, accuracy) {
    await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_score", user_id: currentUser.id, wpm, accuracy })
    });
}

function maskEmail(email) {
    if (!email) return "Chưa cập nhật";
    const parts = email.split("@");
    if (parts.length < 2) return email;
    return parts[0].substring(0, 2) + "***@" + parts[1];
}

async function loadProfile() {
    if (!currentUser) {
        document.getElementById("prof-username").innerText = "Chưa đăng nhập";
        document.getElementById("prof-email").innerText = "-";
        document.getElementById("prof-created").innerText = "-";
        document.getElementById("prof-max-wpm").innerText = "0";
        document.getElementById("prof-min-wpm").innerText = "0";
        document.getElementById("prof-best-rank").innerText = "-";
        document.getElementById("prof-current-rank").innerText = "-";
        return;
    }
    try {
        const res = await fetch(`${API_BASE}?action=get_profile&user_id=${currentUser.id}`);
        const data = await res.json();
        document.getElementById("prof-username").innerText = data.username;
        document.getElementById("prof-email").innerText = maskEmail(data.email);
        document.getElementById("prof-created").innerText = data.created_at || "Mới đăng ký";
        document.getElementById("prof-max-wpm").innerText = data.max_wpm || 0;
        document.getElementById("prof-min-wpm").innerText = data.min_wpm || 0;
        document.getElementById("prof-best-rank").innerText = data.best_rank ? `#${data.best_rank}` : "-";
        document.getElementById("prof-current-rank").innerText = data.current_rank ? `#${data.current_rank}` : "-";
    } catch (err) {}
}

function openChangePassModal() { 
    if(!currentUser) { alert("Vui lòng đăng nhập!"); return; }
    document.getElementById("changepass-modal").classList.remove("hidden"); 
}
function closeChangePassModal() { document.getElementById("changepass-modal").classList.add("hidden"); }

async function handleChangePass(e) {
    e.preventDefault();
    const oldP = document.getElementById("pass-old").value;
    const newP = document.getElementById("pass-new").value;
    const confirmP = document.getElementById("pass-confirm").value;
    const msg = document.getElementById("pass-msg");

    if (newP !== confirmP) { msg.innerText = "Mật khẩu mới không khớp!"; return; }

    const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_password", user_id: currentUser.id, old_password: oldP, new_password: newP })
    });
    const data = await res.json();
    if (data.status === "success") {
        alert("Đổi mật khẩu thành công!");
        closeChangePassModal();
    } else {
        msg.innerText = data.message;
    }
}

// Bảng xếp hạng + Cờ Quốc Gia + Khung "Hạng của bạn"
async function loadLeaderboard() {
    const tbody = document.getElementById("leaderboard-body");
    const res = await fetch(`${API_BASE}?action=get_leaderboard`);
    const list = await res.json();
    tbody.innerHTML = "";

    let myRankFound = null;

    list.forEach((item, idx) => {
        const rank = idx + 1;
        if (currentUser && item.id === currentUser.id) {
            myRankFound = { rank, wpm: item.max_wpm };
        }
        tbody.innerHTML += `
            <tr ${currentUser && item.id === currentUser.id ? 'style="background:rgba(56,189,248,0.1); font-weight:bold;"' : ''}>
                <td>#${rank}</td>
                <td>${item.country || "🇻🇳"}</td>
                <td>${item.username}</td>
                <td><strong style="color:#22c55e;">${item.max_wpm}</strong> WPM</td>
            </tr>
        `;
    });

    // Hiển thị Hạng của bạn ở Khung trên
    if (currentUser && myRankFound) {
        document.getElementById("my-rank-val").innerText = `#${myRankFound.rank} (${currentUser.username})`;
        document.getElementById("my-rank-wpm").innerText = myRankFound.wpm;
    } else if (currentUser) {
        document.getElementById("my-rank-val").innerText = `Chưa có điểm (${currentUser.username})`;
        document.getElementById("my-rank-wpm").innerText = "0";
    } else {
        document.getElementById("my-rank-val").innerText = "Chưa đăng nhập";
        document.getElementById("my-rank-wpm").innerText = "0";
    }
}

async function loadAdminUsers() {
    const tbody = document.getElementById("admin-user-body");
    const res = await fetch(`${API_BASE}?action=admin_get_users`);
    const list = await res.json();
    tbody.innerHTML = "";
    list.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.id}</td>
                <td><input type="text" id="adm-user-${u.id}" value="${u.username}" class="input-modal" style="padding:4px; width:90px; margin:0;"></td>
                <td><input type="email" id="adm-email-${u.id}" value="${u.email}" class="input-modal" style="padding:4px; width:120px; margin:0;"></td>
                <td><input type="text" id="adm-pass-${u.id}" value="${u.password}" class="input-modal" style="padding:4px; width:90px; margin:0;"></td>
                <td><button class="btn-primary" style="padding:4px 8px; font-size:0.8rem;" onclick="saveAdminUser(${u.id})">Lưu</button></td>
            </tr>
        `;
    });
}

async function saveAdminUser(id) {
    const u = document.getElementById(`adm-user-${id}`).value;
    const e = document.getElementById(`adm-email-${id}`).value;
    const p = document.getElementById(`adm-pass-${id}`).value;

    const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "admin_update_user", id, username: u, email: e, password: p })
    });
    const data = await res.json();
    alert(data.message);
}
