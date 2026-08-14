import { createClient } from '@supabase/supabase-js';

// Kết nối với Supabase Database vĩnh viễn
const SUPABASE_URL = "https://dbirecjdaffoelpatuqn.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaXJlY2pkYWZmb2VscGF0dXFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjcwNjc2NiwiZXhwIjoyMTAyMjgyNzY2fQ.G_qjo-CsgUes9H6T4Cw79fp-IkBmpNnZSOQQSAzXMXU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
    // 1. Bật CORS để Frontend gọi API không bị chặn
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const body = req.body || {};
    const query = req.query || {};
    const action = query.action || body.action;

    try {
        // ==========================================
        // 1. ĐĂNG NHẬP (LOGIN)
        // ==========================================
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

        // ==========================================
        // 2. ĐĂNG KÝ (REGISTER)
        // ==========================================
        if (action === 'register') {
            if (!body.username || !body.password) {
                return res.status(400).json({ status: "error", message: "Tên đăng nhập và mật khẩu không được trống!" });
            }

            // Kiểm tra tài khoản trùng tên
            const { data: exists } = await supabase
                .from('users')
                .select('id')
                .eq('username', body.username)
                .single();

            if (exists) {
                return res.status(400).json({ status: "error", message: "Tên tài khoản đã tồn tại!" });
            }

            // Tạo tài khoản mới vào Supabase
            const { data: newUser, error } = await supabase
                .from('users')
                .insert([{
                    username: body.username,
                    password: body.password,
                    email: body.email || "",
                    country: body.country || "🇻🇳",
                    role: "user",
                    max_wpm: 0,
                    min_wpm: 0,
                    best_rank: 999,
                    current_rank: 999
                }])
                .select()
                .single();

            if (error) {
                return res.status(400).json({ status: "error", message: "Lỗi hệ thống: Không thể tạo tài khoản!" });
            }

            return res.status(200).json({ status: "success", user: newUser });
        }

        // ==========================================
        // 3. LƯU ĐIỂM KHI GÕ XONG (SAVE SCORE)
        // ==========================================
        if (action === 'save_score') {
            const wpm = Number(body.wpm);
            const userId = body.user_id;

            if (!userId) return res.status(400).json({ status: "error", message: "Thiếu user_id!" });

            const { data: u } = await supabase.from('users').select('*').eq('id', userId).single();

            if (u) {
                // Tính WPM lớn nhất và nhỏ nhất
                let newMax = Math.max(u.max_wpm || 0, wpm);
                let newMin = (u.min_wpm === 0 || wpm < u.min_wpm) ? wpm : u.min_wpm;

                await supabase.from('users').update({ max_wpm: newMax, min_wpm: newMin }).eq('id', u.id);

                // Cập nhật lại Bảng xếp hạng và Thứ hạng cao nhất
                const { data: allUsers } = await supabase
                    .from('users')
                    .select('*')
                    .order('max_wpm', { ascending: false });

                if (allUsers) {
                    for (let idx = 0; idx < allUsers.length; idx++) {
                        const curRank = idx + 1;
                        const usr = allUsers[idx];
                        const bestRank = (!usr.best_rank || curRank < usr.best_rank) ? curRank : usr.best_rank;
                        
                        await supabase
                            .from('users')
                            .update({ current_rank: curRank, best_rank: bestRank })
                            .eq('id', usr.id);
                    }
                }
                return res.status(200).json({ status: "success", message: "Đã lưu điểm thành công!" });
            }
            return res.status(400).json({ status: "error", message: "Người dùng không tồn tại!" });
        }

        // ==========================================
        // 4. ĐỔI MẬT KHẨU (CHANGE PASSWORD)
        // ==========================================
        if (action === 'change_password') {
            const { data: u } = await supabase.from('users').select('*').eq('id', body.user_id).single();

            if (!u) {
                return res.status(400).json({ status: "error", message: "Tài khoản không tồn tại!" });
            }

            if (u.password !== body.old_password) {
                return res.status(400).json({ status: "error", message: "Mật khẩu cũ không chính xác!" });
            }

            await supabase.from('users').update({ password: body.new_password }).eq('id', u.id);
            return res.status(200).json({ status: "success", message: "Đổi mật khẩu thành công!" });
        }

        // ==========================================
        // 5. LẤY HỒ SƠ CÁ NHÂN (GET PROFILE)
        // ==========================================
        if (action === 'get_profile') {
            const userId = query.user_id || body.user_id;
            const { data: u } = await supabase.from('users').select('*').eq('id', userId).single();

            if (u) return res.status(200).json(u);
            return res.status(404).json({ message: "Không tìm thấy hồ sơ người dùng" });
        }

        // ==========================================
        // 6. LẤY BẢNG XẾP HẠNG (GET LEADERBOARD)
        // ==========================================
        if (action === 'get_leaderboard') {
            const { data: list } = await supabase
                .from('users')
                .select('id, username, country, max_wpm, current_rank, best_rank')
                .order('max_wpm', { ascending: false });

            return res.status(200).json(list || []);
        }

        // ==========================================
        // 7. ADMIN: DÀNH CHO QUẢN TRỊ VIÊN
        // ==========================================
        // 7.1. Lấy danh sách tất cả user
        if (action === 'admin_get_users') {
            const { data: list } = await supabase
                .from('users')
                .select('*')
                .order('id', { ascending: true });

            return res.status(200).json(list || []);
        }

        // 7.2. Admin cập nhật thông tin user
        if (action === 'admin_update_user') {
            const { error } = await supabase
                .from('users')
                .update({
                    username: body.username,
                    email: body.email,
                    password: body.password,
                    role: body.role || 'user'
                })
                .eq('id', body.id);

            if (error) {
                return res.status(400).json({ status: "error", message: "Lỗi cập nhật user!" });
            }
            return res.status(200).json({ status: "success", message: "Cập nhật tài khoản thành công!" });
        }

        // 7.3. Admin xóa tài khoản user
        if (action === 'admin_delete_user') {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', body.id);

            if (error) {
                return res.status(400).json({ status: "error", message: "Không thể xóa tài khoản!" });
            }
            return res.status(200).json({ status: "success", message: "Xóa tài khoản thành công!" });
        }

    } catch (err) {
        return res.status(500).json({ status: "error", message: err.message });
    }

    return res.status(200).json({ message: "Supabase API Serverless Running OK" });
}
