// Tulula · abre Olva Zona Clientes como una persona, entra con el usuario y la clave (secretos de GitHub)
// y entrega a la base la llave de la sesión (dura 24 h). No muestra la llave ni la clave en el registro.
import { chromium } from 'playwright';
const SB = 'https://vlilvrxfppppzwyaeviu.supabase.co';
const AN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsaWx2cnhmcHBwcHp3eWFldml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDIwMTMsImV4cCI6MjEwMDIxODAxM30.Bmo4CNDDbSF7Vp9JpDm7ceKUlsKKdufKcKFDIGHS4Hs';
const { OLVA_USUARIO, OLVA_CLAVE, PUENTE_CLAVE } = process.env;
if (!OLVA_CLAVE || !PUENTE_CLAVE) { console.log('Faltan los secretos OLVA_CLAVE o PUENTE_CLAVE'); process.exit(1); }
const b = await chromium.launch();
try {
  const p = await b.newPage();
  p.on('dialog', d => d.dismiss().catch(() => {}));
  await p.goto('https://atc.olvaexpress.pe/user/login', { waitUntil: 'domcontentloaded' });
  await p.fill('input[name=_username]', OLVA_USUARIO);
  await p.fill('input[name=_password]', OLVA_CLAVE);
  await Promise.all([p.waitForNavigation({ timeout: 60000 }).catch(() => {}), p.press('input[name=_password]', 'Enter')]);
  await p.goto('https://atc.olvaexpress.pe/atc/follow', { waitUntil: 'domcontentloaded' });
  if (/\/login/.test(p.url())) throw new Error('Olva no dejó entrar (¿cambió la clave?)');
  await p.waitForFunction(() => { const e = document.querySelector('#jwt'); return e && e.value && e.value.split('.').length === 3; }, null, { timeout: 60000 });
  const t = await p.$eval('#jwt', e => e.value);
  const r = await fetch(SB + '/rest/v1/rpc/olva_sesion_guardar', {
    method: 'POST',
    headers: { apikey: AN, Authorization: 'Bearer ' + AN, 'Content-Type': 'application/json', 'Content-Profile': 'erp' },
    body: JSON.stringify({ p_clave: PUENTE_CLAVE, p_token: t }),
  });
  const x = await r.text();
  console.log('Resultado:', r.status, x);
  if (!/ok/.test(x)) process.exit(1);
} catch (e) { console.log('Falló:', e.message); process.exit(1); }
finally { await b.close(); }
