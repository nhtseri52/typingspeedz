import { createClient } from '@supabase/supabase-js';

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
        // 1. ĐĂNG NHẬP (Có kiểm tra khóa tài khoản)
        if (action === 'login') {
            const { data: u, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', body.username)
                .eq('password', body.password)
                .single();

            if (u && !error) {
                // Kiểm tra xem tài khoản có đang bị khóa hay không
                if (u.banned_until) {
                    const banTime = new Date(u.banned_until);
                    const now = new Date();
                    if (banTime > now) {
                        return res.status(403).json({
                            status: "error",
                            message: `Tài khoản của bạn đã bị khóa cho đến: ${banTime.toLocaleString('vi-VN')}`
                        });
                    }
                }
                
                // Cập nhật thời gian hoạt động gần nhất (để tính user online)
                await supabase.from('users').update({ last_active: new Date().toISOString() }).eq('id', u.id);
                return res.status(200).json({ status: "success", user: u });
            }
            return res.status(400).json({ status: "error", message: "Tài khoản hoặc mật khẩu không chính xác!" });
        }

        // 2. ĐĂNG KÝ
        if (action === 'register') {
            const { data: exists } = await supabase.from('users').select('id').eq('username', body.username).single();
            if (exists) return res.status(400).json({ status: "error", message: "Tên tài khoản đã tồn tại!" });

            const { data: newUser, error } = await supabase
                .from('users')
                .insert([{
                    username: body.username,
                    password: body.password,
                    email: body.email || "",
                    country: body.country || "🇻🇳",
                    role: "user",
                    max_wpm: 0,
                    accuracy: 0,
                    last_active: new Date().toISOString()
                }])
                .select().single();

            if (error) return res.status(400).json({ status: "error", message: "Không thể tạo tài khoản!" });
            return res.status(200).json({ status: "success", user: newUser });
        }

        // 3. LƯU ĐIỂM (SAVE SCORE)
        if (action === 'save_score') {
            const wpm = Number(body.wpm);
            const accuracy = Number(body.accuracy || 100);
            const { data: u } = await supabase.from('users').select('*').eq('id', body.user_id).single();

            if (u) {
                // Kiểm tra khóa tài khoản
                if (u.banned_until && new Date(u.banned_until) > new Date()) {
                    return res.status(403).json({ status: "error", message: "Tài khoản đang bị khóa, không thể lưu điểm!" });
                }

                let newMax = Math.max(u.max_wpm || 0, wpm);
                await supabase.from('users').update({
                    max_wpm: newMax,
                    accuracy: accuracy,
                    last_active: new Date().toISOString()
                }).eq('id', u.id);

                return res.status(200).json({ status: "success" });
            }
            return res.status(400).json({ status: "error", message: "User không tồn tại" });
        }

        // 4. BẢNG XẾP HẠNG TOP 100
        if (action === 'get_leaderboard') {
            const { data: list } = await supabase
                .from('users')
                .select('id, username, country, max_wpm, accuracy, role')
                .order('max_wpm', { ascending: false })
                .limit(100);

            return res.status(200).json(list || []);
        }

        // 5. ADMIN: LẤY DANH SÁCH USER & THỐNG KÊ ONLINE
        if (action === 'admin_get_users') {
            const { data: list } = await supabase.from('users').select('*').order('id', { ascending: true });
            
            // Tính số lượng người dùng đang Online (hoạt động trong 5 phút qua)
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const onlineCount = list ? list.filter(u => u.last_active && u.last_active >= fiveMinsAgo).length : 0;

            return res.status(200).json({
                users: list || [],
                total_users: list ? list.length : 0,
                online_users: onlineCount
            });
        }

        // 6. ADMIN: SỬA THÔNG TIN / WPM / TỈ LỆ CHÍNH XÁC
        if (action === 'admin_update_user') {
            const { error } = await supabase
                .from('users')
                .update({
                    username: body.username,
                    email: body.email,
                    password: body.password,
                    max_wpm: Number(body.max_wpm || 0),
                    accuracy: Number(body.accuracy || 100),
                    role: body.role || 'user'
                })
                .eq('id', body.id);

            if (error) return res.status(400).json({ status: "error", message: "Không thể cập nhật!" });
            return res.status(200).json({ status: "success", message: "Cập nhật thành công!" });
        }

        // 7. ADMIN: KHÓA TÀI KHOẢN THEO THỜI GIAN
        if (action === 'admin_ban_user') {
            const { id, minutes } = body; // minutes = -1 là khóa vĩnh viễn
            let bannedUntil = null;

            if (minutes === -1) {
                bannedUntil = new Date('2099-12-31T23:59:59Z').toISOString(); // Khóa vĩnh viễn
            } else if (minutes > 0) {
                bannedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
            }

            const { error } = await supabase
                .from('users')
                .update({ banned_until: bannedUntil })
                .eq('id', id);

            if (error) return res.status(400).json({ status: "error", message: "Không thể thực hiện khóa!" });
            return res.status(200).json({ status: "success", message: "Đã cập nhật trạng thái khóa!" });
        }

        // 8. ADMIN: XÓA TÀI KHOẢN
        if (action === 'admin_delete_user') {
            await supabase.from('users').delete().eq('id', body.id);
            return res.status(200).json({ status: "success", message: "Đã xóa người dùng!" });
        }

        // 9. LẤY HỒ SƠ NGƯỜI DÙNG
        if (action === 'get_profile') {
            const userId = query.user_id || body.user_id;
            const { data: u } = await supabase.from('users').select('*').eq('id', userId).single();
            if (u) return res.status(200).json(u);
            return res.status(404).json({ message: "Not found" });
        }

    } catch (err) {
        return res.status(500).json({ status: "error", message: err.message });
    }

    return res.status(200).json({ message: "Admin API Ready" });
}
