// Harita bağlantısı çözücü (Supabase Edge Function) — yalnızca yöneticiler.
// Google Haritalar / Apple Haritalar kısa bağlantılarını (maps.app.goo.gl, maps.apple/p/...) takip eder
// ve işaretli noktanın KESİN koordinatını döndürür. Öncelik:
//   1) Google yer işareti  !3d<enlem>!4d<boylam>   (haritanın merkezi değil, işaretlenen yer)
//   2) Apple  coordinate=  /  q=  /  ll=           (açık koordinat)
//   3) Google @<enlem>,<boylam>                    (son çare: harita merkezi — "approx" olarak işaretlenir)
// Yalnızca izin verilen harita alan adlarına gidilir; başka bir siteye yönlendirme olursa durulur.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const ALLOWED = [/^maps\.app\.goo\.gl$/, /^goo\.gl$/, /^(www\.)?google\.[a-z.]+$/, /^maps\.google\.[a-z.]+$/, /^consent\.google\.com$/,
  /^maps\.apple$/, /^maps\.apple\.com$/, /^(www\.)?apple\.com$/];
const allowed = (u: URL) => u.protocol === 'https:' && ALLOWED.some((re) => re.test(u.hostname));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150 Safari/537.36';

type Hit = { lat: number; lng: number; how: 'place' | 'coordinate' | 'center'; approx: boolean; address?: string };
const num = (s: string) => Number(s);
function extract(href: string): Hit | null {
  const s = decodeURIComponent(href);
  let m = s.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (m) return { lat: num(m[1]), lng: num(m[2]), how: 'place', approx: false };
  m = s.match(/[?&](?:coordinate|q|ll|daddr|sll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (m) {
    const addr = s.match(/[?&]address=([^&]+)/);
    return { lat: num(m[1]), lng: num(m[2]), how: 'coordinate', approx: false, address: addr ? addr[1].replace(/\+/g, ' ') : undefined };
  }
  m = s.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (m) return { lat: num(m[1]), lng: num(m[2]), how: 'center', approx: true };
  return null;
}

async function resolve(raw: string): Promise<Hit & { url: string } | { url: string; error: string }> {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return { url: raw, error: 'Geçersiz bağlantı' }; }
  for (let i = 0; i < 8; i++) {
    if (!allowed(u)) return { url: raw, error: 'Desteklenmeyen site: ' + u.hostname };
    const direct = extract(u.href);
    if (direct && direct.how !== 'center') return { url: raw, ...direct };
    const res = await fetch(u.href, { redirect: 'manual', headers: { 'User-Agent': UA, 'Accept-Language': 'tr' } });
    const loc = res.headers.get('location');
    if (loc) { u = new URL(loc, u); continue; }
    if (direct) return { url: raw, ...direct };
    // son sayfanın içinde koordinat (Apple bazen sayfa gövdesine yazar)
    const body = res.ok ? (await res.text()).slice(0, 200000) : '';
    const inBody = extract(body) || (() => {
      const m = body.match(/"(?:latitude|lat)"\s*:\s*(-?\d+\.\d+)\s*,\s*"(?:longitude|lng|lon)"\s*:\s*(-?\d+\.\d+)/);
      return m ? { lat: num(m[1]), lng: num(m[2]), how: 'coordinate' as const, approx: false } : null;
    })();
    if (inBody) return { url: raw, ...inBody };
    return { url: raw, error: 'Bağlantıda koordinat bulunamadı' };
  }
  return { url: raw, error: 'Çok fazla yönlendirme' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST bekleniyor' }, 405);
  const url = Deno.env.get('SUPABASE_URL')!, anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const asCaller = createClient(url, anon, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await asCaller.auth.getUser();
  if (!user) return json({ error: 'Giriş gerekli' }, 401);
  const { data: isAdmin } = await asCaller.rpc('is_admin');
  if (!isAdmin) return json({ error: 'Sadece yöneticiler' }, 403);

  let body: { urls?: string[] };
  try { body = await req.json(); } catch { return json({ error: 'Geçersiz istek' }, 400); }
  const urls = (body.urls || []).filter((x) => typeof x === 'string' && x.trim()).slice(0, 60);
  if (!urls.length) return json({ error: 'Bağlantı yok' }, 400);
  const out = [];
  for (const u of urls) {
    try { out.push(await resolve(u)); } catch (e) { out.push({ url: u, error: 'Çözülemedi: ' + (e as Error).message }); }
  }
  return json({ results: out });
});
