# Live multiplayer (logged-in seats)

- **Accounts:** Supabase Auth email + password. Account sheet: `https://mouk.ai/?login` (also 🌐 → 👤 Log in). Sign up, log in, log out, forgot password / set new password. Email confirmation is ON in this project.
- **Seats are tied to the auth user id and enforced on the server.** A player creates a join *ticket* with `mp_ticket()` (authenticated only; anon has no EXECUTE). Only the room's host (row in `mp_rooms`) can redeem it with `mp_claim()`, which returns the verified user id. Tickets are single use.
- **Private seat channel** `p-ROOM-<uid>` is a Realtime private channel: RLS on `realtime.messages` lets only that user and the room host join/send. Hole cards, actions, rebuys and leave go there; the public `room-ROOM` channel carries table state only (no hole cards until showdown). Spectators (anyone) can watch the public channel.
- **Daily buy-in limit:** `mp_buyins` ledger per user per calendar day in America/Chicago (`mp_day()`); buy-ins + rebuys across all sessions are capped at 10,000/day inside `mp_claim()` (row-locked). Stacks are not capped during play.
- **Host model:** the host's browser runs the engine, deals and plays the bots. Human seats never auto-act except the 30 s turn timeout (check, else fold). Leaving (button, sign-out, or 60 s disconnect) returns the seat to a bot at the next hand.

# Online multiplayer (optional)

Single-player is the default and works fully offline. Online play is opt-in and uses **Supabase Realtime** (Broadcast + Presence only — no database tables).

## Setup
1. Create a Supabase project (free tier is fine). Realtime is enabled by default.
2. Copy the **Project URL** and the **publishable (anon) key** from *Project Settings → API*.
3. Either:
   - put them in `MP_CONFIG` near the multiplayer section of `index.html` (`{url:"…", key:"…"}`), or
   - open the 🌐 sheet → *Online settings* and paste them (saved in this browser's localStorage; overrides `MP_CONFIG`).
   The publishable/anon key is meant for browsers. Never put the service-role key here.
4. Deploy `index.html` anywhere static (Vercel, GitHub Pages, etc.).

`supabase-js` v2 is loaded lazily from `https://esm.sh/@supabase/supabase-js@2` only when you host or join.

## Playing
- **Host:** 🌐 → *Host online game*. You get a 6-character room code and a share link (`?room=CODE`). The host's browser runs the game engine (host-authoritative). Mouk is always seat 0.
- **Join:** open the link (or enter the code), type a name, *Join*. You take the first empty bot seat from the next hand; the displaced bot goes to the waitlist. Unfilled seats stay bots.
- Hints are host-only; joiners see an equity panel computed from **their own cards only**.

## Channels & messages
| Channel | Who listens | Events |
|---|---|---|
| `room-CODE` | everyone | `state` (host → all: public table state: stacks, bets, board, pot, actions, hand #, tilt/drink, legal action info for the player to act), `join` / `rejoin` / `intent` (client → host). Presence: host tracks `host`, each player tracks its seat token. |
| `room-CODE-<req>` | one joiner + host, briefly | `ack` with `{seat, token}`. `<req>` is a random 16-char token the joiner generated. |
| `room-CODE-<token>` | one seat + host | `cards` (that seat's hole cards for the current hand). |

Hole cards never appear in the public `state` until showdown. Intents carry the seat token; the host ignores intents with an unknown token or out of turn, and validates amounts with the normal pot-limit rules (`allin` = max pot-limit raise).

## Disconnects
- Presence leave marks the seat *away*. If it is that seat's turn it auto-folds/checks after 3 s (30 s normal turn timer).
- An away seat returns to a bot at the start of a hand once it has been gone for 60 s.
- Reconnect: the client keeps `{code, token, seat}` in localStorage. Re-joining the same room sends `rejoin` with the token; the host clears *away* and resends the hole cards.

## Testing
Engine + messaging are tested in Node with an in-memory mock transport (host + 2 clients: seating, private cards, no card leaks, spoofed intents, disconnect → bot, reconnect by token). A live smoke test against the configured project (two supabase-js clients exchange broadcast messages and see each other's presence) passed.

## Security note
Broadcast channels are public to anyone who knows the room code and the publishable key. This is meant for casual home games and isn't secure against a determined cheater: a modified client that knows another seat's token could read its cards. For stronger guarantees use private channels with Realtime Authorization (RLS) and per-user JWTs.
