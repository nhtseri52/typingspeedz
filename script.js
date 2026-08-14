const API_URL = "/api/index";

// KHO TỪ VỰNG DÀNH CHO CẢ 2 NGÔN NGỮ
const WORDS_DATABASE = {
    vi: [
        "các", "người", "một", "thế", "lại", "có", "ra", "thế", "xem", "biết", "trong", "này", "về",
        "cùng", "rất", "nhiều", "mình", "nên", "đất", "anh", "đang", "sẽ", "chỉ", "khi", "đó", "cho",
        "được", "không", "như", "đã", "với", "việc", "ngày", "làm", "phải", "đến", "sự", "từ"
    ],
    en: [
        "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with",
        "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her",
        "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up"
    ]
};

// BỘ TỪ ĐIỂN DỊCH GIAO DIỆN
const TRANSLATIONS = {
    vi: {
        tabGame: '<i class="fa-solid fa-bolt me-2"></i>Kiểm Tra Gõ Phím',
        tabBoard: '<i class="fa-solid fa-trophy me-2"></i>Bảng Xếp Hạng',
        tabProfile: '<i class="fa-solid fa-user me-2"></i>Hồ Sơ',
        titlePractice: '<i class="fa-solid fa-keyboard me-2"></i>Luyện Gõ Phím',
        inputPlaceholder: "Gõ từ tại đây và nhấn Space...",
        btnReload: '<i class="fa-solid fa-rotate-right me-1"></i> Làm mới',
        resTitle: "🎉 Kết Quả Bài Kiểm Tra",
        lblSpeed: "TỐC ĐỘ (WPM)",
        lblAcc: "ĐỘ CHÍNH XÁC",
        resSavedMsg: "Đã tự động lưu thành tích vào Bảng xếp hạng!",
        resGuestMsg: "Hãy đăng nhập để lưu thành tích vào Top 100!",
        btnTryAgain: "Thử Bài Khác",
        titleBoard: '<i class="fa-solid fa-trophy text-warning me-2"></i>Bảng Xếp Hạng Top 100',
        thPlayer: "Người chơi",
        thSpeed: "Tốc độ (WPM)",
        thAcc: "Độ chính xác",
        btnLogin: "Đăng Nhập",
        btnLogout: "Thoát",
        modalLoginTitle: "Đăng Nhập",
        modalRegTitle: "Đăng Kỳ Tài Khoản",
        lblUser: "Tài khoản",
        lblPass: "Mật khẩu",
        lblRegUser: "Tên tài khoản",
        lblRegEmail: "Email (không bắt buộc)",
        lblRegPass: "Mật khẩu",
        msgNoAcc: 'Chưa có tài khoản? <a href="#" data-bs-toggle="modal" data-bs-target="#registerModal">Đăng ký ngay</a>',
        profileGuest: 'Vui lòng <a href="#" data-bs-toggle="modal" data-bs-target="#loginModal">Đăng nhập</a> để xem thông tin hồ sơ.',
        profTitle: "Thông Tin Cá Nhân & Thành Tích",
        profHighscore: "Tốc độ cao nhất",
        profAvgAcc: "Độ chính xác TB",
        profTotalTests: "Bài test đã hoàn thành",
        profHistoryTitle: "Lịch Sử Luyện Tập",
        profDate: "Thời gian",
        profLoading: "Đang tải dữ liệu hồ sơ..."
    },
    en: {
        tabGame: '<i class="fa-solid fa-bolt me-2"></i>Typing Test',
        tabBoard: '<i class="fa-solid fa-trophy me-2"></i>Leaderboard',
        tabProfile: '<i class="fa-solid fa-user me-2"></i>Profile',
        titlePractice: '<i class="fa-solid fa-keyboard me-2"></i>Typing Practice',
        inputPlaceholder: "Type here and press Space...",
        btnReload: '<i class="fa-solid fa-rotate-right me-1"></i> Restart',
        resTitle: "🎉 Test Result",
        lblSpeed: "SPEED (WPM)",
        lblAcc: "ACCURACY",
        resSavedMsg: "Your score has been saved to the Leaderboard!",
        resGuestMsg: "Log in to save your score to the Top 100!",
        btnTryAgain: "Try Again",
        titleBoard: '<i class="fa-solid fa-trophy text-warning me-2"></i>Top 100 Leaderboard',
        thPlayer: "Player",
        thSpeed: "Speed (WPM)",
        thAcc: "Accuracy",
        btnLogin: "Log In",
        btnLogout: "Log Out",
        modalLoginTitle: "Log In",
        modalRegTitle: "Create Account",
        lblUser: "Username",
        lblPass: "Password",
        lblRegUser: "Username",
        lblRegEmail: "Email (optional)",
        lblRegPass: "Password",
        msgNoAcc: 'Don\'t have an account? <a href="#" data-bs-toggle="modal" data-bs-target="#registerModal">Register now</a>',
        profileGuest: 'Please <a href="#" data-bs-toggle="modal" data-bs-target="#loginModal">Log in</a> to view your profile.',
        profTitle: "User Profile & Statistics",
        profHighscore: "Highest Speed",
        profAvgAcc: "Avg. Accuracy",
        profTotalTests: "Tests Completed",
        profHistoryTitle: "Practice History",
        profDate: "Date",
        profLoading: "Loading profile data..."
    }
};

let currentLang = "vi";
let words = [];
let currentWordIndex = 0;
let timeLeft = 60;
let timer = null;
let isStarted = false;
let correctLetters = 0;
let totalLetters = 0;
let currentUser = JSON.parse(localStorage.getItem("typing_user")) || null;

document.addEventListener("DOMContentLoaded", () => {
    updateAuthUI();
    resetTest();
    loadLeaderboard();

    document.getElementById("inputField").addEventListener("input", handleInput);
});

// 1. ĐỔI NGÔN NGỮ
function changeLanguage() {
    currentLang = document.getElementById("langSelect").value;
    const t = TRANSLATIONS[currentLang];

    document.getElementById("tabBtnGame").innerHTML = t.tabGame;
    document.getElementById("tabBtnLeaderboard").innerHTML = t.tabBoard;
    document.getElementById("tabBtnProfile").innerHTML = t.tabProfile;
    document.getElementById("titlePractice").innerHTML = t.titlePractice;
    document.getElementById("inputField").placeholder = t.inputPlaceholder;
    document.getElementById("btnReload").innerHTML = t.btnReload;
    document.getElementById("resTitle").innerText = t.resTitle;
    document.getElementById("lblSpeed").innerText = t.lblSpeed;
    document.getElementById("lblAcc").innerText = t.lblAcc;
    document.getElementById("btnTryAgain").innerText = t.btnTryAgain;
    document.getElementById("titleBoard").innerHTML = t.titleBoard;
    document.getElementById("thPlayer").innerText = t.thPlayer;
    document.getElementById("thSpeed").innerText = t.thSpeed;
    document.getElementById("thAcc").innerText = t.thAcc;
    document.getElementById("modalLoginTitle").innerText = t.modalLoginTitle;
    document.getElementById("modalRegTitle").innerText = t.modalRegTitle;
    document.getElementById("lblUser").innerText = t.lblUser;
    document.getElementById("lblPass").innerText = t.lblPass;
    document.getElementById("btnLoginSubmit").innerText = t.btnLogin;
    document.getElementById("lblRegUser").innerText = t.lblRegUser;
    document.getElementById("lblRegEmail").innerText = t.lblRegEmail;
    document.getElementById("lblRegPass").innerText = t.lblRegPass;
    document.getElementById("msgNoAcc").innerHTML = t.msgNoAcc;

    updateAuthUI();
    resetTest();
    renderProfile();
}

// 2. CHUYỂN TAB
function switchTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.add("d-none"));

    event.currentTarget.classList.add("active");
    document.getElementById(`tab-${tabName}`).classList.remove("d-none");

    if (tabName === 'leaderboard') loadLeaderboard();
    if (tabName === 'profile') renderProfile();
}

// 3. TÀI KHOẢN & HỒ SƠ
function updateAuthUI() {
    const authNav = document.getElementById("authNav");
    const t = TRANSLATIONS[currentLang];

    if (currentUser) {
        authNav.innerHTML = `
            <span class="text-light me-2"><i class="fa-solid fa-user text-info me-1"></i>${currentUser.username}</span>
            <button class="btn btn-sm btn-outline-danger" onclick="logout()">${t.btnLogout}</button>
        `;
    } else {
        authNav.innerHTML = `
            <button class="btn btn-sm btn-primary" id="btnNavLogin" style="background-color: var(--primary-purple); border: none;" data-bs-toggle="modal" data-bs-target="#loginModal">${t.btnLogin}</button>
        `;
    }
}

async function handleLogin() {
    const u = document.getElementById("loginUsername").value;
    const p = document.getElementById("loginPassword").value;

    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username: u, password: p })
    });
    const data = await res.json();

    if (data.status === "success") {
        currentUser = data.user;
        localStorage.setItem("typing_user", JSON.stringify(currentUser));
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
        updateAuthUI();
        renderProfile();
    } else {
        alert(data.message || "Failed!");
    }
}

async function handleRegister() {
    const u = document.getElementById("regUsername").value;
    const e = document.getElementById("regEmail").value;
    const p = document.getElementById("regPassword").value;

    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", username: u, email: e, password: p })
    });
    const data = await res.json();

    if (data.status === "success") {
        currentUser = data.user;
        localStorage.setItem("typing_user", JSON.stringify(currentUser));
        bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
        updateAuthUI();
        renderProfile();
        alert("Success!");
    } else {
        alert(data.message || "Failed!");
    }
}

function logout() {
    localStorage.removeItem("typing_user");
    currentUser = null;
    updateAuthUI();
    renderProfile();
}

// XỬ LÝ RENDER CHI TIẾT HỒ SƠ + LỊCH SỬ BÀI TEST
async function renderProfile() {
    const p = document.getElementById("profileContent");
    const t = TRANSLATIONS[currentLang];

    if (!currentUser) {
        p.innerHTML = `<p class="text-center py-4 text-muted">${t.profileGuest}</p>`;
        return;
    }

    p.innerHTML = `<div class="text-center py-4 text-muted"><i class="fa-solid fa-spinner fa-spin me-2"></i>${t.profLoading}</div>`;

    // Gọi API lấy thông tin chi tiết user và lịch sử gõ phím
    let profileData = null;
    try {
        const res = await fetch(`${API_URL}?action=get_profile&user_id=${currentUser.id}`);
        profileData = await res.json();
    } catch (err) {
        console.error(err);
    }

    const userData = profileData && profileData.user ? profileData.user : currentUser;
    const history = profileData && profileData.history ? profileData.history : [];

    let historyHtml = "";
    if (history.length === 0) {
        historyHtml = `<tr><td colspan="3" class="text-center text-muted py-3">${currentLang === 'vi' ? 'Chưa có lịch sử gõ' : 'No typing history yet'}</td></tr>`;
    } else {
        history.forEach(item => {
            historyHtml += `
                <tr>
                    <td>${item.created_at || 'Recently'}</td>
                    <td class="text-warning fw-bold">${item.wpm} WPM</td>
                    <td class="text-info">${item.accuracy}%</td>
                </tr>
            `;
        });
    }

    p.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-secondary">
            <div class="d-flex align-items-center gap-3">
                <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style="width: 50px; height: 50px; font-size: 1.5rem;">
                    ${userData.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h5 class="fw-bold mb-0">${userData.username}</h5>
                    <small class="text-muted">${userData.email || 'No Email'}</small>
                </div>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="logout()"><i class="fa-solid fa-right-from-bracket me-1"></i>${t.btnLogout}</button>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-4">
                <div class="p-3 text-center rounded" style="background-color: #101216; border: 1px solid var(--card-border);">
                    <small class="text-muted d-block mb-1">${t.profHighscore}</small>
                    <span class="fs-3 fw-bold text-warning">${userData.max_wpm || 0}</span> <small class="text-muted">WPM</small>
                </div>
            </div>
            <div class="col-4">
                <div class="p-3 text-center rounded" style="background-color: #101216; border: 1px solid var(--card-border);">
                    <small class="text-muted d-block mb-1">${t.profAvgAcc}</small>
                    <span class="fs-3 fw-bold text-info">${userData.accuracy || 100}%</span>
                </div>
            </div>
            <div class="col-4">
                <div class="p-3 text-center rounded" style="background-color: #101216; border: 1px solid var(--card-border);">
                    <small class="text-muted d-block mb-1">${t.profTotalTests}</small>
                    <span class="fs-3 fw-bold text-success">${userData.total_tests || history.length || 0}</span>
                </div>
            </div>
        </div>

        <h6 class="fw-bold mb-3"><i class="fa-solid fa-clock-rotate-left me-2 text-primary"></i>${t.profHistoryTitle}</h6>
        <div class="table-responsive">
            <table class="table table-dark table-hover align-middle">
                <thead>
                    <tr class="text-muted">
                        <th>${t.profDate}</th>
                        <th>${t.lblSpeed}</th>
                        <th>${t.lblAcc}</th>
                    </tr>
                </thead>
                <tbody>
                    ${historyHtml}
                </tbody>
            </table>
        </div>
    `;
}

// 4. LOGIC GAME GÕ PHÍM
function resetTest() {
    clearInterval(timer);
    isStarted = false;
    timeLeft = 60;
    currentWordIndex = 0;
    correctLetters = 0;
    totalLetters = 0;

    document.getElementById("timer").innerText = "60s";
    document.getElementById("inputField").value = "";
    document.getElementById("inputField").disabled = false;
    document.getElementById("resultBox").classList.add("d-none");

    // Lấy danh sách từ theo ngôn ngữ được chọn
    words = [...WORDS_DATABASE[currentLang]].sort(() => Math.random() - 0.5);
    renderWords();
    document.getElementById("inputField").focus();
}

function renderWords() {
    const box = document.getElementById("wordsBox");
    box.innerHTML = words.map((w, idx) => {
        const letters = w.split("").map(l => `<span class="letter">${l}</span>`).join("");
        return `<span class="word ${idx === 0 ? 'active' : ''}" id="word-${idx}">${letters}</span>`;
    }).join(" ");
}

function handleInput() {
    if (!isStarted) {
        startTimer();
        isStarted = true;
    }

    const val = document.getElementById("inputField").value;
    const currentWordStr = words[currentWordIndex];
    const wordEl = document.getElementById(`word-${currentWordIndex}`);
    if (!wordEl) return;

    const letterEls = wordEl.querySelectorAll(".letter");

    if (val.endsWith(" ")) {
        const typedVal = val.trim();
        if (typedVal === currentWordStr) {
            correctLetters += currentWordStr.length + 1;
        }
        totalLetters += currentWordStr.length + 1;

        wordEl.classList.remove("active");
        currentWordIndex++;

        if (currentWordIndex >= words.length) {
            endTest();
            return;
        }

        const nextEl = document.getElementById(`word-${currentWordIndex}`);
        if (nextEl) {
            nextEl.classList.add("active");
            nextEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        document.getElementById("inputField").value = "";
        return;
    }

    const chars = val.split("");
    letterEls.forEach((el, idx) => {
        if (chars[idx] == null) el.className = "letter";
        else if (chars[idx] === currentWordStr[idx]) el.className = "letter correct";
        else el.className = "letter incorrect";
    });
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").innerText = `${timeLeft}s`;
        if (timeLeft <= 0) endTest();
    }, 1000);
}

async function endTest() {
    clearInterval(timer);
    document.getElementById("inputField").disabled = true;

    const finalWpm = Math.round(correctLetters / 5);
    const finalAcc = totalLetters > 0 ? Math.round((correctLetters / totalLetters) * 100) : 100;
    const t = TRANSLATIONS[currentLang];

    document.getElementById("resWpm").innerText = finalWpm;
    document.getElementById("resAcc").innerText = `${finalAcc}%`;
    document.getElementById("resultBox").classList.remove("d-none");

    if (currentUser) {
        document.getElementById("resMsg").innerText = t.resSavedMsg;
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "save_score",
                user_id: currentUser.id,
                wpm: finalWpm,
                accuracy: finalAcc
            })
        });
    } else {
        document.getElementById("resMsg").innerText = t.resGuestMsg;
    }
}

// 5. LOAD BẢNG XẾP HẠNG
async function loadLeaderboard() {
    const res = await fetch(`${API_URL}?action=get_leaderboard`);
    const list = await res.json();
    const tbody = document.getElementById("leaderboardBody");
    tbody.innerHTML = "";

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">No data</td></tr>`;
        return;
    }

    list.forEach((u, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                <td>${u.country || "🇻🇳"} ${u.username}</td>
                <td class="text-end text-warning fw-bold">${u.max_wpm || 0}</td>
                <td class="text-end text-info">${u.accuracy || 100}%</td>
            </tr>
        `;
    });
}
