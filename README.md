# Typing Practice — Vanilla JS + Supabase

## Included
- Normal: exactly 200 vocabulary entries per language.
- Advanced: exactly 1000 vocabulary/phrase entries per language.
- 15s, 30s, 1m, 3m, 5m timers.
- WPM, accuracy, correct/incorrect and Top 100 rank display.
- Community publish/search/favorites/likes.
- Sandbox with `|` and `{a|b|c}` random syntax.
- Supabase Auth + profiles + scores + community tables.
- Vietnamese, English, French, Spanish, Portuguese UI/data folders.
- Responsive/mobile typing input.

## Setup
1. Create a Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Edit `js/config.js` with your project URL and public anon/publishable key.
4. Keep the service_role/secret key OUT of frontend code.
5. Deploy the folder to GitHub Pages/Netlify/Vercel.

## Local preview
Any static server works. For example, Python:
`python -m http.server 8080`

Open `http://localhost:8080/`.

## Routes
`/normal/`, `/advanced/`, `/leaderboard/`, `/custom-community/`, `/sandbox/`, `/profile/`, `/login/`, `/register/`.

## Note
For username-or-email login, use a secure Supabase Edge Function to resolve username -> email. Do not expose service_role keys in the browser.
