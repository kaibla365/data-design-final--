# Fantasy League Manager — TECH 441

A Node.js, Express, and MongoDB fantasy sports project starter with fan/admin authentication, player browsing, named rosters, weekly stats, and optional Mockaroo sample history.

## Setup
1. Install Node.js 18+ and MongoDB (local or Atlas).
2. Copy `.env.example` to `.env`; set `MONGODB_URI` and a long random `SESSION_SECRET`.
3. Optional extra credit: add your Mockaroo key as `MOCKAROO_API_KEY`.
4. Run `npm install`, then `npm start`.
5. Visit http://localhost:3000.

## Create the first admin
Public registration creates fans only. In a terminal run:
`node scripts/create-admin.js "leagueadmin" "admin@example.com" "ChooseAStrongPassword1!"`
Use your own unique credentials. Never commit `.env` or real passwords.

## Features
- Fan registration and login; passwords hashed with bcrypt.
- Admin accounts stored separately and created only by the owner using the script.
- Server-side fan/admin route protection.
- Search active players by sport/name/team/position.
- Create multiple uniquely named rosters and manage player selections.
- Browse other fans' rosters.
- Admin-only player and completed-game stat entry.
- Weekly statistics and optional Mockaroo randomized historical demo records.

## Main routes
- `POST /api/auth/register` and `POST /api/auth/login`
- `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/players?search=&sport=`, admin `POST /api/players`
- `GET /api/rosters`, `GET /api/rosters?all=true`, fan `POST /api/rosters`
- fan `PATCH /api/rosters/:id/players`
- `GET /api/stats?week=&season=`, admin `POST /api/stats`
- `GET /api/history?count=10` (requires Mockaroo key)

## Example bodies
Fan registration: `{"username":"samfan","email":"sam@example.com","password":"StrongPass1!"}`
Roster creation: `{"teamName":"Sunday Legends","sport":"Football","players":[]}`
Stats submission: `{"playerId":"PLAYER_ID","gameDate":"2026-10-11","week":6,"season":2026,"sport":"Football","points":18,"passingYards":220,"touchdowns":2}`

## Notes
Mockaroo records are fictional randomized demonstrations, not verified real sports history. This is a course-project foundation, not a production-ready service. Test it with a clean clone before submitting. Add player records through the admin panel before creating rosters.
