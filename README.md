# THE ARCANA — cinematic tarot site

Next.js 16 · React 19 · TypeScript · Tailwind 4 · GSAP + ScrollTrigger · Framer Motion.
No payment gateway: data lives in Turso (SQLite-compatible, free tier); bookings open **WhatsApp (+91 90278 45106)** with the request pre-written. Free to host on Vercel.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Edit your business details — `src/config/site.ts`
WhatsApp number, Instagram link, service names and prices, time slots.

## Replace before launch
- `Sections.tsx` → `REVIEWS` are marked placeholders. Use real reviews with permission.
- `Sections.tsx` → `About`: add her real story/qualifications (nothing is invented).
- `SITE.instagram` in config.
- **Images** in `public/img/` are your reference pictures. Confirm you have the right to use them commercially (many AI/stock images carry licence limits). Card faces are original line-art emblems, not copied from any deck.

## Optional AI oracle
Copy `.env.example` → `.env.local` and set `ANTHROPIC_API_KEY`. Without it the Oracle uses its built-in English/Hindi local replies. The key stays server-side (`src/app/api/oracle/route.ts`).

## Deploy on Vercel (free) with Turso
1. **Database:** create a free database at turso.tech, then copy its URL and an auth token.
2. **Push** this project to GitHub and import it in Vercel.
3. In Vercel → Project → Settings → Environment Variables add: `ADMIN_PASSWORD`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (see `.env.example`). Optional: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`.
4. Deploy. Tables and starter data (services, slots, a welcome coupon) are created automatically on the first request.
5. Open `/admin`, sign in, and use **Settings → Erase all data** once if you tested with demo data. Download a backup first.

Locally: leave the Turso variables empty and the app uses `./data/arcana.db`.
Rotate the Turso token (Turso dashboard) if it is ever shared or leaked.

## Upgrading to real scroll-scrubbed video (scroll-world skill)
The "Four worlds" section already does a scroll-driven fly-through using your art. Each entry in `WORLDS` (`src/components/Worlds.tsx`) accepts `clip: "/video/xyz.mp4"`; if set, the clip is scrubbed by scroll position. The `scroll-world` skill (installed in `~/.claude/skills`) can generate those clips, but it needs paid Higgsfield/Monid credits plus `ffmpeg`.

## Later (not built yet)
Accounts, admin dashboard, online payments, blog, daily card, PDF export, voice reading.
