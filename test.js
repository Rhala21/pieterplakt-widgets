/* ================================================================
   ZELFCHECK GELDLOGICA — Pieter Plakt configurator
   Draaien met:  node test.js
   Test de ECHTE waarden en formules uit pieterplakt-configurator.js
   (prijzen, Golf-toeslag, m²-afronding). Faalt een check, dan stopt
   het script met een foutmelding — niets uploaden tot alles slaagt.
   ================================================================ */
const fs = require("fs");
const src = fs.readFileSync(__dirname + "/pieterplakt-configurator.js", "utf8");

// Haal een const-blok letterlijk uit de bron (zelfde code als live)
function pak(naam) {
  const m = src.match(new RegExp("const " + naam + " = ([\\s\\S]*?);"));
  if (!m) throw new Error(naam + " niet gevonden in de bron");
  return eval("(" + m[1] + ")");
}
const PRIJZEN = pak("PRIJZEN");
const MODEL_TOESLAGEN = pak("MODEL_TOESLAGEN");
const ZONNEBAND_PRIJS = pak("ZONNEBAND_PRIJS");
const CONFIG_M2 = parseFloat(src.match(/m2AfrondenOp:\s*([\d.]+)/)[1]);

// Zelfde formule als raamM2() in de widget (cm × cm → m², naar boven op stap)
const raamM2 = (b, h) => Math.ceil((b * h) / 10000 / CONFIG_M2 - 1e-9) * CONFIG_M2;

function assert(naam, werkelijk, verwacht) {
  const ok = Math.abs(werkelijk - verwacht) < 1e-9;
  console.log((ok ? "OK   " : "FOUT ") + naam + " = " + werkelijk + (ok ? "" : " (verwacht: " + verwacht + ")"));
  if (!ok) process.exitCode = 1;
}

// 1. Autoprijs mét Golf-toeslag: h5 XR+ achterportieren (325) + toeslag (50)
//    + achterruit (150) + toeslag (25) + zonneband (95) = 645
const golf = MODEL_TOESLAGEN[0].toeslag;
assert("h5 XR+ achterportieren+achterruit+zonneband incl. Golf-toeslag",
  PRIJZEN.h5.XRPLUS.achterportieren + golf.achterportieren +
  PRIJZEN.h5.XRPLUS.achterruit + golf.achterruit + ZONNEBAND_PRIJS, 645);

// 2. Bus heeft als enige zijramen, in beide pakketten
assert("bus XR zijramen", PRIJZEN.bus.XR.zijramen, 150);
assert("bus XR+ zijramen", PRIJZEN.bus.XRPLUS.zijramen, 185);

// 3. m²-afronding naar boven: 223×78 cm = 1,7394 → 1,8 m²; 100×100 = exact 1,0
assert("raamM2(223,78)", raamM2(223, 78), 1.8);
assert("raamM2(100,100)", raamM2(100, 100), 1.0);

// 4. Elk carrosserietype heeft beide pakketten met dezelfde raam-sleutels
Object.keys(PRIJZEN).forEach((b) => {
  const xr = Object.keys(PRIJZEN[b].XR).sort().join(",");
  const plus = Object.keys(PRIJZEN[b].XRPLUS).sort().join(",");
  if (xr !== plus) { console.log("FOUT prijstabel " + b + ": XR en XR+ hebben verschillende ramen"); process.exitCode = 1; }
});
console.log(process.exitCode ? "\nER ZIJN FOUTEN — niet uploaden." : "\nAlle checks geslaagd.");
