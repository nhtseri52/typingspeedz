// Dữ liệu mẫu (Giả lập Database)
let users = [
    { id: 1, username: "thanhnguyen", password: "123", email: "admin@gmail.com", country: "🇻🇳", created_at: "01/01/2026", role: "admin", max_wpm: 50, min_wpm: 45, best_rank: 2, current_rank: 1 },
    { id: 2, username: "longcr7", password: "123", email: "proplayer@gmail.com", country: "🇺🇸", created_at: "10/02/2026", role: "user", max_wpm: 55, min_wpm: 50, best_rank: 1, current_rank: 2 },
    { id: 3, username: "huy", password: "123", email: "gamervn@gmail.com", country: "🇻🇳", created_at: "15/03/2026", role: "user", max_wpm: 42, min_wpm: 30, best_rank: 3, current_rank: 3 }
];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') return res.status(200).end();

    const body = req.body || {};
    const query = req.query || {};
    const action = query.action || body.action;

    // Đăng nhập
    if (action === 'login') {
        const u = users.find(x => x.username === body.username && x.password === body.password);
        if (u) {
            return res.status(200).json({ status: "success", user: u });
        }
        return res.status(400).json({ status: "error", message: "Mật khẩu hoặc tên tài khoản không chính xác!" });
    }

    // Đăng ký
    if (action === 'register') {
        const exists = users.find(x => x.username === body.username);
        if (exists) return res.status(400).json({ status: "error", message: "Tên tài khoản đã tồn tại!" });

        const newUser = {
            id: users.length + 1,
            username: body.username,
            password: body.password,
            email: body.email || "",
            country: body.country || "🇻🇳",
            created_at: new Date().toLocaleDateString('vi-VN'),
            role: "user",
            max_wpm: 0,
            min_wpm: 0,
            best_rank: 999,
            current_rank: users.length + 1
        };
        users.push(newUser);
        return res.status(200).json({ status: "success", user: newUser });
    }

    // Lưu điểm & Tính hạng
    if (action === 'save_score') {
        const u = users.find(x => x.id == body.user_id);
        if (u) {
            const wpm = Number(body.wpm);
            if (wpm > u.max_wpm) u.max_wpm = wpm;
            if (u.min_wpm === 0 || wpm < u.min_wpm) u.min_wpm = wpm;

            // Tính toán lại Bảng xếp hạng
            users.sort((a, b) => b.max_wpm - a.max_wpm);
            users.forEach((usr, idx) => {
                const currentRank = idx + 1;
                usr.current_rank = currentRank;
                if (!usr.best_rank || currentRank < usr.best_rank) {
                    usr.best_rank = currentRank;
                }
            });
            return res.status(200).json({ status: "success", rank: u.current_rank });
        }
        return res.status(400).json({ status: "error" });
    }

    // Đổi mật khẩu
    if (action === 'change_password') {
        const u = users.find(x => x.id == body.user_id);
        if (!u) return res.status(400).json({ status: "error", message: "Tài khoản không tồn tại!" });

        if (u.password !== body.old_password) {
            return res.status(400).json({ status: "error", message: "Mật khẩu cũ không chính xác!" });
        }

        u.password = body.new_password;
        return res.status(200).json({ status: "success", message: "Đổi mật khẩu thành công!" });
    }

    // Lấy thông tin Hồ sơ
    if (action === 'get_profile') {
        const u = users.find(x => x.id == query.user_id);
        if (u) return res.status(200).json(u);
        return res.status(404).json({ message: "Not found" });
    }

    // Bảng xếp hạng
    if (action === 'get_leaderboard') {
        const list = [...users].sort((a, b) => b.max_wpm - a.max_wpm);
        return res.status(200).json(list);
    }

    // Admin Quản lý
    if (action === 'admin_get_users') {
        return res.status(200).json(users);
    }

    if (action === 'admin_update_user') {
        const u = users.find(x => x.id == body.id);
        if (u) {
            u.username = body.username || u.username;
            u.email = body.email || u.email;
            if (body.password) u.password = body.password;
            return res.status(200).json({ status: "success", message: "Cập nhật thành công!" });
        }
        return res.status(400).json({ status: "error", message: "Cập nhật thất bại!" });
    }

    return res.status(200).json({ message: "API Active" });
}
