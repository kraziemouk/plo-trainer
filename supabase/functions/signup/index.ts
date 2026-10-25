import { createClient } from "npm:@supabase/supabase-js@2";
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "content-type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return J({ error: "POST only" }, 405);
  let b: any = {}; try { b = await req.json(); } catch (_) { return J({ error: "Bad request" }, 400); }
  const email = String(b.email || "").trim().toLowerCase(), pw = String(b.password || "");
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(email) || email.length > 254) return J({ error: "Enter a valid email." }, 400);
  if (pw.length < 8 || pw.length > 72) return J({ error: "Password must be 8–72 characters." }, 400);
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const hourAgo = new Date(Date.now() - 3600e3).toISOString(), minAgo = new Date(Date.now() - 60e3).toISOString();
  const { count: perIp } = await admin.from("mp_signup_log").select("id", { count: "exact", head: true }).eq("ip", ip).gte("at", hourAgo);
  const { count: global } = await admin.from("mp_signup_log").select("id", { count: "exact", head: true }).gte("at", minAgo);
  if ((perIp || 0) >= 5 || (global || 0) >= 30) return J({ error: "Too many sign-ups — try again later." }, 429);
  await admin.from("mp_signup_log").insert({ ip });
  const { error } = await admin.auth.admin.createUser({ email, password: pw, email_confirm: true });
  if (error) return J({ error: /already|registered|exists/i.test(error.message) ? "That email already has an account — log in instead." : "Couldn't create the account." }, 400);
  return J({ ok: true });
});
