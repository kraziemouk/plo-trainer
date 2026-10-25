import { createClient } from "npm:@supabase/supabase-js@2";
import * as C from "./core.js";
import SRC from "./engine_src.js";
const URL_ = Deno.env.get("SUPABASE_URL")!, SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(URL_, SRK, { auth: { persistSession: false } });
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "content-type": "application/json" } });
async function userOf(req: Request) { const h = req.headers.get("authorization") || ""; const t = h.replace(/^Bearer\s+/i, ""); if (!t) return null;
  const { data } = await admin.auth.getUser(t); return data?.user || null; }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let b: any = {}; try { b = await req.json(); } catch (_) { /* empty */ }
  const op = String(b.op || "state"), id = String(b.table || "main").slice(0, 40);
  if (op === "lobby") { const { data } = await admin.from("mp_live_pub").select("id,name,humans,status,permanent").order("permanent", { ascending: false }); return J({ tables: data || [] }); }
  const user = ["join", "act", "rebuy", "leave", "beat"].includes(op) ? await userOf(req) : (req.headers.get("authorization") ? await userOf(req) : null);
  if (["join", "act", "rebuy", "leave"].includes(op) && !user) return J({ error: "Log in to take a seat." }, 401);
  let charge: any = null;
  if (op === "join" || op === "rebuy") { const amt = Math.max(1, Math.min(C.DAY_CAP, Math.round(+b.amount || 200)));
    const { data, error } = await admin.rpc("mp_charge", { p_uid: user!.id, p_amount: amt, p_room: id }); if (error) return J({ error: error.message }, 500); charge = data[0];
    if (op === "join" && charge.granted <= 0) { /* still allowed to sit only if they have chips pending; else refuse */ } }
  for (let attempt = 0; attempt < 8; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 40 + Math.random() * 160));
    const { data: row, error } = await admin.from("mp_live").select("id,name,state,version").eq("id", id).maybeSingle();
    if (error || !row) return J({ error: "No such table" }, 404);
    const now = Date.now(); const E = C.makeEngine(SRC, crypto); E.setBudget(900); const live = C.load(E, row.state);
    const norm = (x: any) => JSON.stringify(x || null, (k, v) => k === "seenAt" || k === "away" ? undefined : v); const before = norm(row.state);
    const prevSeen = (() => { try { const r = (row.state?.G?.seats || []).find((s: any) => s.remote && s.remote.uid === user?.id); return r ? r.remote.seenAt || 0 : 0; } catch (_) { return 0; } })();
    let res: any = { ok: true };
    const uid = user?.id;
    if (op === "join") res = C.apply(E, live, { type: "join", uid, name: String(b.name || user!.email?.split("@")[0] || "Player").slice(0, 16).replace(/[<>&"']/g, ""), granted: charge.granted }, now);
    else if (op === "rebuy") res = C.apply(E, live, { type: "rebuy", uid, granted: charge.granted, used: charge.used_today }, now);
    else if (op === "act") res = C.apply(E, live, { type: "act", uid, act: b.act, to: b.to }, now);
    else if (op === "leave") res = C.apply(E, live, { type: "leave", uid }, now);
    else if (uid) C.apply(E, live, { type: "beat", uid }, now);
    C.step(E, live, now);
    const st = C.save(E, live); const pub = C.publicState(E, live, id, row.name);
    const me = uid ? C.privateState(E, live, uid, 600) : null; if (me && charge) Object.assign(me, { granted: charge.granted, today: charge.used_today });
    const changed = norm(st) !== before || (!!user && now - prevSeen > 8000);
    if (changed) {
      const { data: upd } = await admin.from("mp_live").update({ state: st, version: row.version + 1, updated_at: new Date().toISOString() }).eq("id", id).eq("version", row.version).select("id");
      if (!upd || !upd.length) continue; // lost a race: retry on fresh state
      await admin.from("mp_live_pub").update({ pub, humans: pub.humans, status: pub.status, updated_at: new Date().toISOString() }).eq("id", id);
    }
    return J({ ...res, pub, me });
  }
  return J({ error: "busy, retry" }, 409);
});
