import { createClient } from '@supabase/supabase-js';

// Khởi tạo kết nối Supabase chính xác bằng Keys của bạn
const SUPABASE_URL = "https://dbirecjdaffoelpatuqn.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaXJlY2pkYWZmb2VscGF0dXFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjcwNjc2NiwiZXhwIjoyMTAyMjgyNzY2fQ.G_qjo-CsgUes9H6T4Cw79fp-IkBmpNnZSOQQSAzXMXU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

    try {
        // 1. Đăng nhập
        if (action === 'login') {
            const { data: u, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', body.username)
                .eq('password', body.password)
                .single();

            if (u && !error) {
                return res.status(200).json({ status: "success", user: u });
            }
            return res.status(400).json({ status: "error", message: "Tài khoản hoặc mật khẩu không chính xác!" });
        }

        // 2. Đăng ký
        if (action === 'register') {
            const { data: exists } = await supabase
                .from('users')
                .select('id')
                .eq('username', body.username)
                .single();

            if (exists) return res.status(400).json({ status: "error", message: "Tên tài khoản đã tồn tại!" });

            const { data: newUser, error } = await supabase
                .from('users')
                .insert([{
                    username: body.username,
                    password: body.password,
                    email: body.email || "",
                    country: body.country || "🇻🇳"
                }])
                .select()
                .single();

            if (error) return res.status(400).json({ status: "error", message: "Không thể tạo tài khoản!" });

            return res.status(200).json({ status: "success", user: newUser });
        }

        // 3. Lưu Điểm & Tính Hạng Cao Nhất Vĩnh Viễn
        if (action === 'save_score') {
            const wpm = Number(body.wpm);
            const { data: u } = await supabase.from('users').select('*').eq('id', body.user_id).single();

            if (u) {
                let newMax = Math.max(u.max_wpm || 0, wpm);
                let newMin = (u.min_wpm === 0 || wpm < u.min_wpm) ? wpm : u.min_wpm;

                await supabase.from('users').update({ max_wpm: newMax, min_wpm: newMin }).eq('id', u.id);

                // Cập nhật lại Bảng Xếp Hạng
                const { data: allUsers } = await supabase.from('users').select('*').order('max_wpm', { ascending: false });
                
                if (allUsers) {
                    for (let idx = 0; idx < allUsers.length; idx++) {
                        const curRank = idx + 1;
                        const usr = allUsers[idx];
                        const bestRank = (!usr.best_rank || curRank < usr.best_rank) ? curRank : usr.best_rank;
                        await supabase.from('users').update({ current_rank: curRank, best_rank: bestRank }).eq('id', usr.id);
                    }
                }
                return res.status(200).json({ status: "success" });
            }
            return res.status(400).json({ status: "error" });
        }

        // 4. Đổi Mật Khẩu
        if (action === 'change_password') {
            const { data: u } = await supabase.from('users').select('*').eq('id', body.user_id).single();
            if (!u) return res.status(400).json({ status: "error", message: "Tài khoản không tồn tại!" });

            if (u.password !== body.old_password) {
                return res.status(400).json({ status: "error", message: "Mật khẩu cũ không chính xác!" });
            }

            await supabase.from('users').update({ password: body.new_password }).eq('id', u.id);
            return res.status(200).json({ status: "success", message: "Đổi mật khẩu thành công!" });
        }

        // 5. Lấy Thông Tin Hồ Sơ
        if (action === 'get_profile') {
            const { data: u } = await supabase.from('users').select('*').eq('id', query.user_id).single();
            if (u) return res.status(200).json(u);
            return res.status(404).json({ message: "Not found" });
        }

        // 6. Lấy Bảng Xếp Hạng
        if (action === 'get_leaderboard') {
            const { data: list } = await supabase.from('users').select('*').order('max_wpm', { ascending: false });
            return res.status(200).json(list || []);
        }

        // 7. Admin Quản Lý
        if (action === 'admin_get_users') {
            const { data: list } = await supabase.from('users').select('*').order('id', { ascending: true });
            return res.status(200).json(list || []);
        }

        if (action === 'admin_update_user') {
            await supabase.from('users').update({
                username: body.username,
                email: body.email,
                password: body.password
            }).eq('id', body.id);
            return res.status(200).json({ status: "success", message: "Cập nhật thành công!" });
        }

    } catch (err) {
        return res.status(500).json({ status: "error", message: err.message });
    }

    return res.status(200).json({ message: "API Connected with Supabase" });
}
