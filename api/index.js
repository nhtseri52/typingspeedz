export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { action } = req.query.action ? req.query : (req.body || {});

    if (action === 'login' || action === 'register') {
        const { username } = req.body || {};
        return res.status(200).json({
            status: "success",
            user: {
                id: 1,
                username: username || "Player1",
                created_at: new Date().toLocaleDateString('vi-VN')
            }
        });
    }

    if (action === 'save_score') {
        return res.status(200).json({ status: "success", rank: 1 });
    }

    if (action === 'get_leaderboard') {
        return res.status(200).json([
            { username: "ProTypist", wpm: 120, accuracy: 98 },
            { username: "SpeedDemon", wpm: 105, accuracy: 95 },
            { username: "GamerVN", wpm: 90, accuracy: 92 }
        ]);
    }

    return res.status(200).json({ message: "API Vercel Active" });
}
