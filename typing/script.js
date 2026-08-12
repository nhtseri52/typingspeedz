const wordListVi = ["như", "người", "sẽ", "được", "không", "có", "trong", "với", "những", "cho", "đã", "về", "cũng", "đến", "các", "nhiều", "hơn", "nhà", "khi", "ngày", "lại", "này", "ra", "phải", "làm", "một", "vào", "đang", "theo", "sau", "đó", "biết", "mình", "nên", "rất", "chỉ", "còn", "cùng", "thế", "qua", "xem", "đi", "lên", "mới", "anh", "em", "con", "mẹ", "trời", "đất"];
const wordListEn = ["the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "from", "or", "which", "one", "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if", "no", "man", "out", "other", "so", "what", "time"];

let currentLang = "vi";
let words = [];
let currentWordIndex = 0;
let timer = 60;
let timerInterval = null;
let isTesting = false;
let correctWords = 0;
let wrongWords = 0;
let currentUser = null;
let authMode = "login";
let currentPage = 1;

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("word-input").addEventListener("input", handleInput);
    document.getElementById("lang-select").addEventListener("change", (e) => {
        currentLang = e.target.value;
        resetGame();
        loadLeaderboard(1);
    });
    checkSession();
    loadLeaderboard(1);
    resetGame();
});

function switchSection(type) {
    document.getElementById('section-typing').classList.toggle('hidden', type !== 'typing');
    document.getElementById('section-leaderboard').classList.toggle('hidden', type !== 'leaderboard');
    document.getElementById('section-profile').classList.toggle('hidden', type !== 'profile');

    document.getElementById('btn-tab-typing').classList.toggle('active', type === 'typing');
    document.getElementById('btn-tab-leaderboard').classList.toggle('active', type === 'leaderboard');
    document.getElementById('btn-tab-profile').classList.toggle('active', type === 'profile');

    if (type === 'profile') loadProfile();
    if (type === 'leaderboard') loadLeaderboard(currentPage);
}

function openAuth() { document.getElementById('auth-modal').classList.remove('hidden'); }
function closeAuth() { document.getElementById('auth-modal').classList.add('hidden'); }
function closeResult() {
    document.getElementById('result-modal').classList.add('hidden');
    resetGame();
}

function setAuthMode(mode) {
    authMode = mode;
    document.getElementById("tab-login").classList.toggle("active", mode === "login");
    document.getElementById("tab-register").classList.toggle("active", mode === "register");
    document.getElementById("auth-submit").innerText = mode === "login" ? "Đăng nhập" : "Đăng ký";
    document.getElementById("auth-msg").innerText = "";

    const emailInput = document.getElementById("auth-email");
    const confirmPassInput = document.getElementById("auth-confirm-password");
    
    if (mode === "register") {
        emailInput.classList.remove("hidden");
        emailInput.required = true;
        confirmPassInput.classList.remove("hidden");
        confirmPassInput.required = true;
    } else {
        emailInput.classList.add("hidden");
        emailInput.required = false;
        confirmPassInput.classList.add("hidden");
        confirmPassInput.required = false;
    }
}

function generateWords() {
    const list = currentLang === "vi" ? wordListVi : wordListEn;
    words = [];
    for (let i = 0; i < 200; i++) {
        words.push(list[Math.floor(Math.random() * list.length)]);
    }
}

function renderWords() {
    const wordsDisplay = document.getElementById("words-display");
    wordsDisplay.innerHTML = "";
    wordsDisplay.style.top = "0px";
    words.forEach((w, index) => {
        const span = document.createElement("span");
        span.className = "word" + (index === 0 ? " current" : "");
        span.innerText = w;
        wordsDisplay.appendChild(span);
    });
}

function resetGame() {
    clearInterval(timerInterval);
    timer = 60;
    isTesting = false;
    currentWordIndex = 0;
    correctWords = 0;
    wrongWords = 0;

    document.getElementById("timer").innerText = "60s";
    const wordInput = document.getElementById("word-input");
    wordInput.value = "";
    wordInput.disabled = false;
    wordInput.focus();

    generateWords();
    renderWords();
}

function startTimer() {
    isTesting = true;
    timerInterval = setInterval(() => {
        timer--;
        document.getElementById("timer").innerText = timer + "s";
        if (timer <= 0) endGame();
    }, 1000);
}

function handleInput() {
    const wordInput = document.getElementById("word-input");
    const wordsDisplay = document.getElementById("words-display");

    if (!isTesting && wordInput.value.trim().length > 0) startTimer();

    const val = wordInput.value;
    const wordSpans = wordsDisplay.querySelectorAll(".word");

    if (val.endsWith(" ")) {
        const typed = val.trim();
        const currentTarget = words[currentWordIndex];

        if (typed === currentTarget) {
            wordSpans[currentWordIndex].className = "word correct";
            correctWords++;
        } else {
            wordSpans[currentWordIndex].className = "word wrong";
            wrongWords++;
        }

        currentWordIndex++;
        if (currentWordIndex < wordSpans.length) {
            wordSpans[currentWordIndex].classList.add("current");
            const currentSpan = wordSpans[currentWordIndex];
            const prevSpan = wordSpans[currentWordIndex - 1];
            if (currentSpan.offsetTop > prevSpan.offsetTop) {
                const currentTop = parseInt(wordsDisplay.style.top || "0");
                wordsDisplay.style.top = (currentTop - 40) + "px";
            }
        }
        wordInput.value = "";
    }
}

function endGame() {
    clearInterval(timerInterval);
    document.getElementById("word-input").disabled = true;

    const wpm = correctWords;
    const total = correctWords + wrongWords;
    const accuracy = total > 0 ? Math.round((correctWords / total) * 100) : 0;

    document.getElementById("res-wpm").innerText = wpm;
    document.getElementById("res-acc").innerText = accuracy + "%";
    document.getElementById("result-modal").classList.remove("hidden");

    if (currentUser) {
        saveScore(wpm, accuracy);
    } else {
        document.getElementById("rank-display").innerText = "Đăng nhập để lưu điểm!";
    }
}

async function handleAuth(e) {
    e.preventDefault();
    const u = document.getElementById("auth-username").value;
    const p = document.getElementById("auth-password").value;
    const email = document.getElementById("auth-email").value;
    const confirmP = document.getElementById("auth-confirm-password").value;

    if (authMode === "register" && p !== confirmP) {
        document.getElementById("auth-msg").innerText = "Mật khẩu xác nhận không khớp!";
        return;
    }

    try {
        const res = await fetch(`api.php?action=${authMode}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: u, password: p, email: email })
        });
        const data = await res.json();

        if (data.status === "success") {
            currentUser = data.user;
            updateUserUI();
            closeAuth();
            loadLeaderboard(1);
        } else {
            document.getElementById("auth-msg").innerText = data.message;
        }
    } catch (err) {
        document.getElementById("auth-msg").innerText = "Lỗi kết nối máy chủ!";
    }
}

async function checkSession() {
    try {
        const res = await fetch("api.php?action=check_session");
        const data = await res.json();
        if (data.logged_in) {
            currentUser = data.user;
            updateUserUI();
        }
    } catch (err) {}
}

function updateUserUI() {
    const userArea = document.getElementById("user-area");
    if (currentUser && userArea) {
        userArea.innerHTML = `
            <span style="font-size:0.9rem; margin-right:5px;"><i class="fa-solid fa-user"></i> ${currentUser.username}</span>
            <button id="logout-btn" onclick="logout()">Thoát</button>
        `;
    }
}

async function logout() {
    await fetch("api.php?action=logout");
    location.reload();
}

async function saveScore(wpm, accuracy) {
    try {
        await fetch("api.php?action=save_score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wpm, accuracy, lang: currentLang })
        });
        loadLeaderboard(currentPage);
    } catch (err) {}
}

function changePage(page) {
    currentPage = page;
    loadLeaderboard(page);
}

async function loadLeaderboard(page = 1) {
    try {
        const res = await fetch(`api.php?action=get_leaderboard&lang=${currentLang}&page=${page}`);
        const data = await res.json();

        if (data.status === "success") {
            const tbody = document.getElementById("leaderboard-body");
            tbody.innerHTML = "";

            document.getElementById("my-rank-badge").innerText = "Hạng của bạn: " + data.user_rank;
            document.getElementById("rank-display").innerText = "Hạng: " + data.user_rank;

            for (let i = 1; i <= 4; i++) {
                const btn = document.getElementById(`page-btn-${i}`);
                if (btn) btn.classList.toggle("active", i === page);
            }

            if (data.leaderboard.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Chưa có dữ liệu</td></tr>`;
                return;
            }

            const startRank = (page - 1) * 25;
            data.leaderboard.forEach((item, index) => {
                const countryCode = item.country ? item.country.toLowerCase() : 'vn';
                const flagUrl = `https://flagcdn.com/24x18/${countryCode}.png`;
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>#${startRank + index + 1}</strong></td>
                    <td><img src="${flagUrl}" class="flag-icon" alt="${item.country}"> ${item.country || 'VN'}</td>
                    <td>${item.username}</td>
                    <td><strong>${item.max_wpm}</strong></td>
                    <td>${item.accuracy}%</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {}
}

async function loadProfile() {
    const notLoginBox = document.getElementById("profile-not-login");
    const contentBox = document.getElementById("profile-content");

    if (!currentUser) {
        notLoginBox.classList.remove("hidden");
        contentBox.classList.add("hidden");
        return;
    }

    notLoginBox.classList.remove("hidden");
    contentBox.classList.remove("hidden");

    try {
        const res = await fetch(`api.php?action=get_profile&lang=${currentLang}`);
        const data = await res.json();

        if (data.status === "success") {
            const p = data.profile;
            document.getElementById("prof-username").innerText = p.username;
            document.getElementById("prof-created").innerText = p.created_at;
            document.getElementById("prof-max-wpm").innerText = p.max_wpm;
            document.getElementById("prof-min-wpm").innerText = p.min_wpm;
            document.getElementById("prof-best-rank").innerText = p.best_rank;
            document.getElementById("prof-current-rank").innerText = p.current_rank;
        }
    } catch (err) {}
}