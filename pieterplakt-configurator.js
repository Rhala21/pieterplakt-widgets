/* ================================================================
   PIETER PLAKT — PRIJSCONFIGURATOR WIDGET
   ----------------------------------------------------------------
   Gebruik in Webflow:
   1. Host dit bestand (bijv. GitHub + jsDelivr)
   2. Plaats een Embed-element op je pagina met:

      <div id="pp-configurator"></div>
      <script src="JOUW-URL/pieterplakt-configurator.js" defer></script>

   Alle klassen hebben een "pp-" voorvoegsel en alle styling staat
   in dit bestand, dus het botst nergens met je Webflow-classes.
   ================================================================ */
(function () {
  "use strict";

  /* ================================================================
     INSTELLINGEN — PAS HIER ALLES NAAR WENS AAN
     Alle bedragen zijn in euro's, inclusief BTW en installatie.
     ================================================================ */
  const CONFIG = {
    toonTitel: true,               // false = geen "Bereken jouw prijs." kop
    telefoon: "0511 700 258",
    email: "info@pieterplakt.nl",
    plaats: "Burgum",
    vanafPrijs: 175,               // getoond als "vanaf \u20ac 175" totdat een carrosserietype is gekozen
    disclaimer: "Aan de getoonde prijzen kunnen geen rechten worden ontleend. Prijzen onder voorbehoud van fouten en wijzigingen.",
    // PROFESSIONELE MAILKOPPELING (aanbevolen): plak hier de webhook-URL uit Make.com
    // (zie make-setup-instructies.md). Mails gaan dan echt vanaf info@pieterplakt.nl.
    // Zolang dit leeg is, wordt de FormSubmit-terugvaloptie hieronder gebruikt.
    webhookUrl: "https://hook.eu1.make.com/l3k3ofbyejfu2ov33k4gz87npymd3ns9",
    // Terugvaloptie (FormSubmit, gratis maar met FormSubmit-opmaak):
    formEndpoint: "https://formsubmit.co/info@pieterplakt.nl",
  };

  /* ----------------------------------------------------------------
     PRIJZEN PER CARROSSERIETYPE
     Elk type heeft een eigen blok:
       voorruit   = Voorruit Standaard Ceramisch
       chameleon  = meerprijs Chameleon-folie op de voorruit
       XR / XRPLUS = prijzen per onderdeel, per foliepakket
     Prijs aanpassen = alleen het getal wijzigen in het juiste blok.
     ---------------------------------------------------------------- */
  const PRIJZEN = {
    h3: {          // Hatchback 3-deurs
      voorruit: 195, chameleon: 70,
      XR:     { voorportieren: 170, achterportieren: 175, achterruit: 125 },
      XRPLUS: { voorportieren: 170, achterportieren: 225, achterruit: 150 },
    },
    h5: {          // Hatchback 5-deurs
      voorruit: 195, chameleon: 70,
      XR:     { voorportieren: 170, achterportieren: 275, achterruit: 125 },
      XRPLUS: { voorportieren: 170, achterportieren: 325, achterruit: 150 },
    },
    coupe: {       // Coupé
      voorruit: 195, chameleon: 70,
      XR:     { voorportieren: 170, achterportieren: 295, achterruit: 125 },
      XRPLUS: { voorportieren: 170, achterportieren: 350, achterruit: 165 },
    },
    sedan: {       // Sedan
      voorruit: 195, chameleon: 70,
      XR:     { voorportieren: 170, achterportieren: 375, achterruit: 125 },
      XRPLUS: { voorportieren: 170, achterportieren: 450, achterruit: 165 },
    },
    suv5: {        // Station / SUV
      voorruit: 195, chameleon: 70,
      XR:     { voorportieren: 170, achterportieren: 350, achterruit: 125 },
      XRPLUS: { voorportieren: 170, achterportieren: 450, achterruit: 150 },
    },
    pickup: {      // Pick-up
      voorruit: 225, chameleon: 70,
      XR:     { voorportieren: 175, achterportieren: 175, achterruit: 125 },
      XRPLUS: { voorportieren: 175, achterportieren: 175, achterruit: 165 },
    },
    bus: {         // Bus (met zijramen achterpaneel)
      voorruit: 225, chameleon: 70,
      XR:     { voorportieren: 175, achterportieren: 150, zijramen: 150, achterruit: 125 },
      XRPLUS: { voorportieren: 175, achterportieren: 185, zijramen: 185, achterruit: 150 },
    },
    tesla3: {      // Tesla Model 3
      voorruit: 225, chameleon: 95,
      XR:     { voorportieren: 160, achterportieren: 495, achterruit: 280 },
      XRPLUS: { voorportieren: 160, achterportieren: 495, achterruit: 280 },
    },
  };

  const ZONNEBAND_PRIJS = 95;       // extra optie zonneband voorruit

  /* ----------------------------------------------------------------
     MODELTOESLAGEN — uitzonderingen op de regel
     Wordt automatisch toegepast via de kentekencheck (RDW).
     Nieuwe uitzondering? Kopieer een blok en pas de waarden aan.
     ---------------------------------------------------------------- */
  const MODEL_TOESLAGEN = [
    {
      label: "VW Golf (type 5 t/m 8)",
      merkModel: ["VOLKSWAGEN GOLF"],
      vanafBouwjaar: 2003,            // Golf 5 en nieuwer
      toeslag: { achterportieren: 50, achterruit: 25 },
    },
  ];

  /* ----------------------------------------------------------------
     AUTOMATISCHE TYPE-HERKENNING via kenteken
     Herkent modellen met een eigen prijstabel.
     ---------------------------------------------------------------- */
  const MODEL_TYPES = [
    { merkModel: ["TESLA MODEL 3"], body: "tesla3" },
  ];
  /* ================================================================ */

  const CATS = [
    { id: "auto",    name: "Auto's",                  tag: "Bereken jouw prijs", items: ["Blindering van ramen", "Warmtewerend folie", "Verschillende tintpercentages"] },
    { id: "bus",     name: "Werkbussen",              tag: "Offerte aanvragen",  items: ["Blindering van ramen", "Warmtewerend folie", "Verschillende tintpercentages"] },
    { id: "machine", name: "Machines & Vrachtwagens", tag: "Offerte aanvragen",  items: ["Blindering van ramen", "Warmtewerend folie", "Op locatie"] },
    { id: "pand",    name: "Woning & Bedrijfspand",   tag: "Offerte aanvragen",  items: ["Blindering van ramen", "Warmtewerend folie", "Op locatie"] },
  ];

  const BODIES = [
    { id: "h3",     name: "Hatchback 3-deurs" },
    { id: "h5",     name: "Hatchback 5-deurs" },
    { id: "coupe",  name: "Coupé" },
    { id: "sedan",  name: "Sedan" },
    { id: "suv5",   name: "Station / SUV" },
    { id: "pickup", name: "Pick-up" },
    { id: "bus",    name: "Bus" },
    { id: "tesla3", name: "Tesla Model 3" },
  ];

  const WINDOWS = {
    voorportieren:   "Voorportieren links & rechts",
    achterportieren: "Achterportieren / achterklep",
    zijramen:        "Zijramen achterpaneel",
    achterruit:      "Enkel achterruit",
  };
  const NAAM_ANDERS = {              // afwijkende benaming per carrosserietype
    pickup: { achterportieren: "Achterportieren links & rechts" },
    bus:    { achterportieren: "Achterportieren links & rechts" },
  };
  const bodyWindows = (body) => body === "bus"
    ? ["voorportieren", "achterportieren", "zijramen", "achterruit"]
    : ["voorportieren", "achterportieren", "achterruit"];
  const winNaam = (body, w) => (NAAM_ANDERS[body] && NAAM_ANDERS[body][w]) || WINDOWS[w];

  const CHAMELEON_ITEMS = [
    "Kleurverloop: blauw, rood/oranje, groen/oranje & paars/roze",
    "Unieke uitstraling",
    "Warmtewering",
  ];

  const PKGS = [
    { id: "XR", name: "Pakket XR", tint: 0.55, items: [
      "Houdt 85% warmtestraling tegen",
      "Blokkeert tot 99% schadelijke UV-straling",
      "Minder airco nodig, bespaart brandstof",
      "Zonder dot-matrix afwerking"] },
    { id: "XRPLUS", name: "Pakket XR+", tint: 0.82, badge: "Meest gekozen", items: [
      "Houdt 85% warmtestraling tegen",
      "Blokkeert tot 99% schadelijke UV-straling",
      "Minder airco nodig, bespaart brandstof",
      "Met dot-matrix afwerking"] },
  ];

  /* ================================================================
     LIVEBEELD — Audi-silhouet met tintbare raamvlakken
     ================================================================ */
  /* ----------------------------------------------------------------
     AUTOMODELLEN — worden per stuk geladen uit de map "cars/" naast
     dit bestand (of vooraf meegegeven via window.PP_CARS).
     Nieuw model? Voeg cars/<naam>.json toe en koppel hem hieronder.
     ---------------------------------------------------------------- */
  const CAR_VOOR_TYPE = {
    h3: "h3", h5: "h5", coupe: "coupe", sedan: "sedan",
    suv5: "station", pickup: "pickup", bus: "bus", tesla3: "tesla3",
  };
  const STANDAARD_AUTO = "station";
  const CAR_BASE = (typeof document !== "undefined" && document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/[^/]*(\?.*)?$/, "") : "";
  const CAR_CACHE = (typeof window !== "undefined" && window.PP_CARS) ? window.PP_CARS : {};
  const CAR_LADEN = {};
  function laadAuto(n) {
    if (CAR_CACHE[n]) return Promise.resolve(CAR_CACHE[n]);
    if (!CAR_LADEN[n]) {
      CAR_LADEN[n] = fetch(CAR_BASE + "cars/" + n + ".json")
        .then((r) => r.json())
        .then((d) => { CAR_CACHE[n] = d; return d; });
    }
    return CAR_LADEN[n];
  }
  /* ================================================================
     STYLING — huisstijl Pieter Plakt, volledig gescoped op .pp-w
     ================================================================ */
  const FONT_URL = "https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap";
  const CSS = `
.pp-w{--pp-black:#000;--pp-white:#fff;--pp-yellow:#ffb700;--pp-yellow-soft:rgba(255,183,0,.12);
  --pp-text-body:#555;--pp-main-grey:#f6f8fd;--pp-grey:#e3e7f1;--pp-radius:20px;--pp-pill:999px;
  font-family:"Clash Display","Inter",system-ui,sans-serif;font-size:15px;line-height:1.6;color:var(--pp-black);
  background:var(--pp-main-grey);border-radius:var(--pp-radius);padding:28px 20px 0;position:relative;}
.pp-w *,.pp-w *::before,.pp-w *::after{box-sizing:border-box;margin:0;padding:0}
@media (prefers-reduced-motion:reduce){.pp-w *{transition:none!important;animation:none!important}}

.pp-h1{font-weight:600;letter-spacing:-.01em;font-size:clamp(26px,4vw,40px);line-height:1.08}
.pp-h1 em{font-style:normal;color:var(--pp-yellow)}
.pp-sub{color:var(--pp-text-body);margin-top:8px;max-width:560px;font-weight:400}

.pp-steps{display:flex;gap:6px;margin:24px 0 28px;height:6px;max-height:6px;overflow:hidden}
.pp-steps .pp-s{flex:1 1 0;height:6px!important;max-height:6px!important;min-height:0;padding:0!important;border:0;border-radius:var(--pp-pill);background:var(--pp-grey);transition:background .3s}
.pp-steps .pp-s.pp-done{background:var(--pp-yellow)}
.pp-steps .pp-s.pp-active{background:linear-gradient(90deg,var(--pp-yellow) 50%,var(--pp-grey) 50%)}
.pp-step-label{display:inline-block;background:var(--pp-black);color:var(--pp-white);font-weight:500;
  font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:5px 14px;border-radius:var(--pp-pill);margin-bottom:12px}
.pp-step-title{font-weight:600;letter-spacing:-.01em;font-size:clamp(21px,3vw,28px);margin-bottom:6px}
.pp-step-sub{color:var(--pp-text-body);margin-bottom:22px;max-width:620px}
.pp-group-title{font-weight:600;font-size:19px;margin:28px 0 4px}
.pp-group-sub{color:var(--pp-text-body);font-size:14px;margin-bottom:14px}

.pp-panel{display:none}
.pp-panel.pp-visible{display:block;animation:ppfade .35s ease}
@keyframes ppfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

.pp-grid{display:grid;gap:14px}
.pp-grid.pp-c2{grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
.pp-grid.pp-c4{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}

.pp-card{background:var(--pp-white);border:1.5px solid var(--pp-grey);border-radius:var(--pp-radius);
  padding:20px;cursor:pointer;transition:border-color .2s,box-shadow .2s,transform .15s;position:relative}
.pp-card:hover{border-color:#c9d2e4;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.05)}
.pp-card:focus-visible{outline:2.5px solid var(--pp-yellow);outline-offset:2px}
.pp-card.pp-selected{border-color:var(--pp-yellow);box-shadow:0 0 0 3px var(--pp-yellow-soft),0 8px 24px rgba(0,0,0,.05)}
.pp-card .pp-name{font-weight:600;font-size:17px;letter-spacing:-.005em;padding-right:28px}
.pp-card .pp-tag{font-size:12px;color:var(--pp-text-body);margin-top:2px}
.pp-card .pp-price{font-weight:700;font-size:19px;margin-top:12px}
.pp-card ul{margin:12px 0 0;padding-left:17px;color:var(--pp-text-body);font-size:13px;list-style:disc}
.pp-card ul li{margin-bottom:4px}
.pp-badge{position:absolute;top:-11px;right:16px;background:var(--pp-yellow);color:var(--pp-black);
  font-size:11px;font-weight:600;letter-spacing:.04em;padding:4px 12px;border-radius:var(--pp-pill)}
.pp-check{position:absolute;top:16px;right:16px;width:22px;height:22px;border-radius:50%;
  border:1.5px solid var(--pp-grey);display:grid;place-items:center;font-size:12px;color:var(--pp-black);
  transition:all .2s;background:var(--pp-white)}
.pp-card.pp-selected .pp-check{background:var(--pp-yellow);border-color:var(--pp-yellow)}
.pp-card.pp-selected .pp-check::after{content:"\\2713";font-weight:700}

.pp-preview{background:var(--pp-white);border:1.5px solid var(--pp-grey);border-radius:var(--pp-radius);
  padding:16px 16px 6px;margin-bottom:22px}
.pp-preview .pp-hint{font-size:12px;color:var(--pp-text-body);text-align:center;padding-bottom:10px}
.pp-preview{perspective:1200px;overflow:hidden}
.pp-preview svg{width:100%;height:190px;display:block;margin:0 auto;transform-origin:center;
  transition:transform .42s cubic-bezier(.33,.9,.35,1),opacity .42s cubic-bezier(.33,.9,.35,1)}
@media(max-width:560px){.pp-preview svg{height:150px}}
.pp-preview svg.pp-notrans{transition:none!important}
.pp-preview svg.pp-out-l{transform:rotateY(-72deg) translateZ(-70px) scale(.94);opacity:0}
.pp-preview svg.pp-out-r{transform:rotateY(72deg) translateZ(-70px) scale(.94);opacity:0}
.pp-car{fill:var(--pp-black)}
.pp-win{transition:fill .35s;pointer-events:none}
.pp-zb{fill:var(--pp-yellow);opacity:0;transition:opacity .35s;stroke:var(--pp-yellow);stroke-width:0;stroke-linejoin:round}
svg[data-view="side"] .pp-zb{stroke-width:1.4}
.pp-zb.pp-on{opacity:.96}
.pp-zbm{opacity:0;transition:opacity .35s;pointer-events:none}
.pp-zbm.pp-on{opacity:1}

.pp-kenteken{display:flex;gap:0;max-width:340px;margin-bottom:8px;border-radius:12px;overflow:hidden;border:1.5px solid var(--pp-grey)}
.pp-kenteken .pp-nl{background:#003399;color:#fff;font-weight:600;font-size:12px;display:grid;place-items:center;padding:0 12px}
.pp-kenteken input{flex:1;border:0;background:var(--pp-yellow);color:var(--pp-black);
  font-family:inherit;font-weight:700;font-size:22px;letter-spacing:.15em;text-transform:uppercase;padding:12px 14px;min-width:0}
.pp-kenteken input::placeholder{color:var(--pp-black);opacity:.35}
.pp-kenteken input:focus{outline:none}
.pp-rdw{font-size:13px;color:var(--pp-text-body);margin:2px 0 6px;min-height:18px}
.pp-rdw strong{color:var(--pp-black);font-weight:600}
.pp-field{margin-bottom:14px}
.pp-field label{display:block;font-size:13px;color:var(--pp-text-body);margin-bottom:6px;font-weight:500}
.pp-field input,.pp-field select,.pp-field textarea{width:100%;background:var(--pp-white);border:1.5px solid var(--pp-grey);
  color:var(--pp-black);border-radius:14px;padding:12px 14px;font-family:inherit;font-size:14px}
.pp-field input:focus,.pp-field select:focus,.pp-field textarea:focus{outline:none;border-color:var(--pp-yellow);box-shadow:0 0 0 3px var(--pp-yellow-soft)}
.pp-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}
@media(max-width:560px){.pp-form-grid{grid-template-columns:1fr}}

.pp-toggle{display:flex;align-items:flex-start;gap:12px;background:var(--pp-white);border:1.5px solid var(--pp-grey);
  border-radius:var(--pp-radius);padding:18px 20px;cursor:pointer;margin-top:18px;transition:border-color .2s}
.pp-toggle:hover{border-color:#c9d2e4}
.pp-toggle input{margin-top:3px;accent-color:var(--pp-yellow);width:17px;height:17px;flex:none}
.pp-toggle .pp-t-title{font-weight:600}
.pp-toggle .pp-t-sub{font-size:13px;color:var(--pp-text-body)}
.pp-toggle ul{margin:6px 0 0;padding-left:16px;font-size:13px;color:var(--pp-text-body);list-style:disc}
.pp-toggle ul li{margin-bottom:2px}

.pp-bar{position:sticky;bottom:0;z-index:20;margin:26px -20px 0;
  background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-top:1px solid var(--pp-grey);
  border-radius:0 0 var(--pp-radius) var(--pp-radius)}
.pp-bar-in{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.pp-total .pp-lbl{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--pp-text-body);font-weight:500}
.pp-total .pp-amt{font-weight:700;font-size:24px;letter-spacing:-.005em;font-variant-numeric:tabular-nums}
.pp-total .pp-btw{font-size:11px;color:var(--pp-text-body)}
.pp-btns{display:flex;gap:10px}
.pp-btn{font-family:inherit;font-weight:500;font-size:14px;border-radius:var(--pp-pill);padding:13px 26px;
  cursor:pointer;border:1.5px solid var(--pp-black);background:var(--pp-black);color:var(--pp-white);transition:all .2s}
.pp-btn:hover{opacity:.85}
.pp-btn:focus-visible{outline:2.5px solid var(--pp-yellow);outline-offset:2px}
.pp-btn.pp-primary{background:var(--pp-yellow);border-color:var(--pp-yellow);color:var(--pp-black);font-weight:600}
.pp-btn.pp-primary:hover{filter:brightness(1.05);opacity:1}
.pp-btn:disabled{opacity:.3;cursor:not-allowed}

.pp-summary{background:var(--pp-white);border:1.5px solid var(--pp-grey);border-radius:var(--pp-radius);padding:24px;margin-bottom:22px}
.pp-summary h3{font-weight:600;font-size:17px;letter-spacing:-.005em;margin-bottom:14px}
.pp-row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px dashed var(--pp-grey);font-size:14px;color:var(--pp-text-body)}
.pp-row:last-of-type{border-bottom:0}
.pp-row .pp-r-price{font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--pp-black);font-weight:600}
.pp-row.pp-total-row{border-top:1.5px solid var(--pp-grey);border-bottom:0;margin-top:6px;padding-top:14px;font-weight:700;font-size:18px;color:var(--pp-black)}
.pp-row.pp-total-row .pp-r-price{background:var(--pp-yellow);padding:2px 14px;border-radius:var(--pp-pill)}
.pp-note{font-size:12px;color:var(--pp-text-body);margin-top:10px}

.pp-status{counter-reset:ppst;list-style:none;margin-top:6px}
.pp-status li{counter-increment:ppst;position:relative;padding:0 0 18px 42px;font-size:14px;color:var(--pp-text-body)}
.pp-status li::before{content:counter(ppst);position:absolute;left:0;top:-3px;width:28px;height:28px;border-radius:50%;
  border:1.5px solid var(--pp-grey);display:grid;place-items:center;font-weight:600;font-size:12px;color:var(--pp-black);background:var(--pp-white)}
.pp-status li::after{content:"";position:absolute;left:13.5px;top:28px;bottom:0;width:1.5px;background:var(--pp-grey)}
.pp-status li:last-child::after{display:none}
.pp-status li:first-child::before{background:var(--pp-yellow);border-color:var(--pp-yellow)}

.pp-contact{display:flex;flex-wrap:wrap;gap:8px 24px;font-size:13px;color:var(--pp-text-body);margin-top:18px}
.pp-contact strong{color:var(--pp-black);font-weight:600}

.pp-done{text-align:center;padding:56px 20px}
.pp-done-msg{max-width:520px;margin:24px auto 0;background:var(--pp-yellow-soft);border:1.5px solid var(--pp-yellow);
  border-radius:var(--pp-radius);padding:18px 22px;font-size:14px;color:var(--pp-black)}
.pp-done-msg strong{white-space:nowrap}
.pp-done .pp-ring{width:68px;height:68px;border-radius:50%;background:var(--pp-yellow);
  display:grid;place-items:center;margin:0 auto 20px;font-size:32px;color:var(--pp-black);font-weight:700}
.pp-hidden{display:none!important}
`;

  /* ================================================================
     MARKUP
     ================================================================ */
  const HTML = `
  ${CONFIG.toonTitel ? `
  <h2 class="pp-h1">Bereken jouw prijs<em>.</em></h2>
  <p class="pp-sub">Stel in een paar stappen jouw blindering samen en zie direct de totaalprijs, inclusief installatie.</p>` : ""}

  <div class="pp-steps" data-pp="stepBar" aria-hidden="true"></div>

  <section class="pp-panel" data-pp="p1">
    <div class="pp-step-label">Stap 1 van 4</div>
    <h3 class="pp-step-title">Wat wil je laten blinderen?</h3>
    <p class="pp-step-sub">Voor auto's berekenen we direct jouw prijs. Voor overige categorie\u00ebn stellen we een offerte op maat op.</p>
    <div class="pp-grid pp-c4" data-pp="catGrid"></div>
  </section>

  <section class="pp-panel" data-pp="p2">
    <div class="pp-step-label">Stap 2 van 4</div>
    <h3 class="pp-step-title">Voertuiggegevens</h3>
    <p class="pp-step-sub">Vul je kenteken in en we halen automatisch je voertuiggegevens op. Kies daarna het type dat bij jouw voertuig past.</p>
    <div class="pp-kenteken">
      <div class="pp-nl">NL</div>
      <input data-pp="kenteken" placeholder="XX-999-X" maxlength="8" aria-label="Kenteken">
    </div>
    <p class="pp-rdw" data-pp="rdwStatus"></p>
    <div class="pp-grid pp-c4" data-pp="bodyGrid" style="margin-top:16px"></div>
  </section>

  <section class="pp-panel" data-pp="p3">
    <div class="pp-step-label">Stap 3 van 4</div>
    <h3 class="pp-step-title">Kies jouw foliepakket</h3>
    <p class="pp-step-sub">Het pakket geldt voor de zijruiten en achterruit. Alle pakketten zijn inclusief installatie en montage.</p>
    <div class="pp-preview">
      <svg data-pp="carSvg2" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Livebeeld tintniveau"></svg>
      <div class="pp-hint">Livebeeld van het tintniveau van jouw pakket \u00b7 v3.3</div>
    </div>
    <div class="pp-grid pp-c2" data-pp="pkgGrid"></div>
  </section>

  <section class="pp-panel" data-pp="p4">
    <div class="pp-step-label">Stap 4 van 4</div>
    <h3 class="pp-step-title">Welke ruiten wil je laten blinderen?</h3>
    <p class="pp-step-sub">Selecteer de ruiten. In het livebeeld zie je direct welke ruiten getint worden.</p>
    <div class="pp-preview">
      <svg data-pp="carSvg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Livebeeld van geselecteerde ruiten"></svg>
      <div class="pp-hint">Livebeeld \u2014 jouw pakketkeuze bepaalt hoe donker de tint is \u00b7 v3.3</div>
    </div>

    <h4 class="pp-group-title">Voorzijde</h4>
    <p class="pp-group-sub">Optioneel: kies een folie voor de voorruit.</p>
    <div class="pp-grid pp-c2" data-pp="vrGrid"></div>
    <label class="pp-toggle">
      <input type="checkbox" data-pp="zonneband">
      <span>
        <span class="pp-t-title">Extra optie: zonneband voorruit <span data-pp="zbPrijs"></span></span><br>
        <span class="pp-t-sub">Alleen het bovenste deel van de voorruit.</span>
      </span>
    </label>

    <h4 class="pp-group-title">Zijruiten & achterruit</h4>
    <p class="pp-group-sub">Prijzen op basis van jouw voertuig en pakket <span data-pp="pkgNaam"></span>.</p>
    <div class="pp-grid pp-c2" data-pp="winGrid"></div>

    <label class="pp-toggle">
      <input type="checkbox" data-pp="removeFoil">
      <span>
        <span class="pp-t-title">Bestaande raamfolie verwijderen</span><br>
        <span class="pp-t-sub">Afhankelijk van de hoeveelheid en oppervlakte is dit maatwerk. Daarom berekenen we dit op locatie.</span>
      </span>
    </label>
  </section>

  <section class="pp-panel" data-pp="p5">
    <div class="pp-step-label" data-pp="p5Label">Bijna klaar</div>
    <h3 class="pp-step-title">Mooi, wat leuk dat je met ons kennis wilt maken.</h3>
    <div class="pp-summary" data-pp="summaryBox"></div>
    <div data-pp="quoteForm">
      <div class="pp-form-grid">
        <div class="pp-field"><label>Voornaam*</label><input data-pp="fn" required></div>
        <div class="pp-field"><label>Achternaam</label><input data-pp="ln"></div>
        <div class="pp-field"><label>E-mailadres*</label><input data-pp="em" type="email" required></div>
        <div class="pp-field"><label>Telefoonnummer*</label><input data-pp="tel" type="tel" required></div>
        <div class="pp-field">
          <label>Voorkeursdatum (op basis van beschikbaarheid)</label>
          <select data-pp="wanneer">
            <option>Over 1 week</option><option>Over 2 weken</option><option>Over 3 weken</option><option>Later</option>
          </select>
        </div>
        <div class="pp-field" data-pp="locField" style="display:none"><label>Locatie*</label><input data-pp="loc"></div>
      </div>
      <div class="pp-field"><label>Bericht</label><textarea data-pp="msg" rows="3"></textarea></div>
      <div class="pp-summary">
        <h3>Status van jouw aanvraag</h3>
        <ol class="pp-status">
          <li>Aanvraag verstuurd</li>
          <li>Je ontvangt een overzicht per e-mail</li>
          <li>We nemen contact met je op</li>
          <li>Binnen 2 werkdagen sturen we een mail met de eerst beschikbare mogelijkheid</li>
          <li>Blindering gepland \u2014 je ontvangt een bevestiging per e-mail</li>
        </ol>
        <div class="pp-contact">
          <span>Liever direct contact? <strong>${CONFIG.telefoon}</strong></span>
          <span><strong>${CONFIG.email}</strong></span>
          <span>${CONFIG.plaats}</span>
        </div>
      </div>
    </div>
    <div class="pp-done pp-hidden" data-pp="doneBox">
      <div class="pp-ring">\u2713</div>
      <h3 class="pp-step-title">Aanvraag verstuurd.</h3>
      <p class="pp-step-sub" style="margin:8px auto 0">Je ontvangt een overzicht per e-mail.</p>
      <div class="pp-done-msg">Bedankt voor je aanvraag! Wij sturen binnen 2 werkdagen een mailtje met de eerst beschikbare mogelijkheid. Kun je daar niet op wachten? Neem dan telefonisch contact met ons op via <strong>${CONFIG.telefoon}</strong>.</div>
    </div>
  </section>

  <div class="pp-bar">
    <div class="pp-bar-in">
      <div class="pp-total">
        <div class="pp-lbl">Totaalbedrag</div>
        <div class="pp-amt" data-pp="totalAmt">\u20ac 0</div>
        <div class="pp-btw" data-pp="btwLine">Inclusief BTW \u00b7 inclusief installatie</div>
      </div>
      <div class="pp-btns">
        <button type="button" class="pp-btn" data-pp="btnPrev">Vorige stap</button>
        <button type="button" class="pp-btn pp-primary" data-pp="btnNext" disabled>Volgende stap</button>
      </div>
    </div>
  </div>`;

  /* ================================================================
     WIDGET-LOGICA
     ================================================================ */
  function init(root) {
    root.classList.add("pp-w");
    root.innerHTML = HTML;
    const $ = (name) => root.querySelector('[data-pp="' + name + '"]');

    const state = {
      step: 1, cat: null, body: null,
      windows: new Set(["achterportieren"]),                 // standaard voorgeselecteerd
      voorzijde: null,                                         // null | "ceramisch" | "chameleon"
      rdw: null, modelToeslag: null,
      removeFoil: false, pkg: "XR", zonneband: false,          // Pakket XR standaard
    };
    const euro = (n) => "\u20ac " + n.toLocaleString("nl-NL");
    const prijzen = () => PRIJZEN[state.body] || PRIJZEN.sedan;

    $("zbPrijs").textContent = "(+ " + euro(ZONNEBAND_PRIJS) + ")";

    function cardHTML(o) {
      return `<div class="pp-card" role="button" tabindex="0" data-id="${o.id}">
        <div class="pp-check"></div>
        <div class="pp-name">${o.name}</div>
        ${o.tag ? `<div class="pp-tag">${o.tag} \u00b7 inclusief installatie</div>` : `<div class="pp-tag">Inclusief installatie</div>`}
        ${o.badge ? `<div class="pp-badge">${o.badge}</div>` : ""}
        ${o.price != null ? `<div class="pp-price">${o.price}</div>` : ""}
        ${o.items ? `<ul>${o.items.map((i) => `<li>${i}</li>`).join("")}</ul>` : ""}
      </div>`;
    }
    function bindCards(grid, onPick) {
      grid.querySelectorAll(".pp-card").forEach((c) => {
        const act = () => onPick(c.dataset.id, c);
        c.addEventListener("click", act);
        c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
      });
    }
    function selectOne(grid, id) {
      grid.querySelectorAll(".pp-card").forEach((c) => c.classList.toggle("pp-selected", c.dataset.id === id));
    }

    /* -------- kentekencheck (RDW Open Data, gratis) -------- */
    function zoekMatch(lijst, merk, model, jaar) {
      const naam = ((merk || "") + " " + (model || "")).toUpperCase();
      return lijst.find((t) =>
        t.merkModel.some((z) => naam.includes(z.toUpperCase())) &&
        (!t.vanafBouwjaar || (jaar && jaar >= t.vanafBouwjaar)) &&
        (!t.totBouwjaar || (jaar && jaar <= t.totBouwjaar))
      ) || null;
    }
    function bodyVanRdw(v, carr) {
      const deuren = parseInt(v.aantal_deuren, 10) || 0;
      const soort = (v.voertuigsoort || "").toLowerCase();
      const inr = (v.inrichting || "").toLowerCase();
      // 1) Europese carrosseriecode (betrouwbaarst): AA=sedan, AB=hatchback, AC=station, AD=coupé, AE=cabrio, AF=MPV
      const code = carr ? String(carr.carrosserietype || "").toUpperCase() : "";
      const oms = carr ? String(carr.type_carrosserie_europese_omschrijving || "").toLowerCase() : "";
      if (soort.includes("bedrijfsauto") || inr.includes("gesloten opbouw") || inr.includes("bestel")) return "bus";
      if (code === "AB" || oms.includes("hatchback")) return deuren >= 4 ? "h5" : "h3";
      if (code === "AA" || oms.includes("sedan")) return "sedan";
      if (code === "AC" || oms.includes("station")) return "suv5";
      if (code === "AD" || code === "AE" || oms.includes("coup") || oms.includes("cabrio")) return "coupe";
      if (code === "AF" || oms.includes("multipurpose") || oms.includes("mpv")) return "suv5";
      // 2) Terugvallen op het inrichting-veld
      if (inr.includes("pick")) return "pickup";
      if (inr.includes("hatchback")) return deuren >= 4 ? "h5" : "h3";
      if (inr.includes("sedan")) return "sedan";
      if (inr.includes("station") || inr.includes("mpv") || inr.includes("multipurpose") || inr.includes("terrein")) return "suv5";
      if (inr.includes("coup") || inr.includes("cabrio")) return "coupe";
      return null;
    }
    let rdwTimer = null;
    async function kentekenCheck() {
      const raw = $("kenteken").value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      const status = $("rdwStatus");
      state.rdw = null; state.modelToeslag = null;
      if (raw.length < 6) { status.textContent = ""; update(); return; }
      status.textContent = "Kenteken opzoeken\u2026";
      try {
        const [res, resCarr] = await Promise.all([
          fetch("https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=" + encodeURIComponent(raw)),
          fetch("https://opendata.rdw.nl/resource/vezc-m2t6.json?kenteken=" + encodeURIComponent(raw)).catch(() => null),
        ]);
        const data = await res.json();
        let carr = null;
        try { const c = resCarr ? await resCarr.json() : null; carr = Array.isArray(c) && c.length ? c[0] : null; } catch (e) {}
        if (Array.isArray(data) && data.length) {
          const v = data[0];
          const jaar = v.datum_eerste_toelating ? parseInt(String(v.datum_eerste_toelating).slice(0, 4), 10) : null;
          state.rdw = { merk: v.merk || "", model: v.handelsbenaming || "", jaar: jaar };
          state.modelToeslag = zoekMatch(MODEL_TOESLAGEN, state.rdw.merk, state.rdw.model, jaar);
          let extra = state.modelToeslag ? " \u00b7 modeltoeslag " + state.modelToeslag.label + " van toepassing" : "";
          const typeMatch = zoekMatch(MODEL_TYPES, state.rdw.merk, state.rdw.model, jaar);
          const autoBody = (typeMatch && PRIJZEN[typeMatch.body]) ? typeMatch.body : bodyVanRdw(v, carr);
          if (autoBody && PRIJZEN[autoBody]) {
            state.body = autoBody;
            selectOne($("bodyGrid"), state.body);
            delete $("carSvg").dataset.view; delete $("carSvg2").dataset.view;
            ensureCar();
            extra += autoBody === "suv5"
              ? " \u00b7 herkend als Station/SUV \u2014 rijd je een hatchback? Pas het type hieronder aan"
              : " \u00b7 type automatisch geselecteerd \u2014 klopt het niet? Pas het hieronder aan";
          }
          status.innerHTML = "\u2713 Gevonden: <strong>" + state.rdw.merk + " " + state.rdw.model + (jaar ? " (" + jaar + ")" : "") + "</strong>" + extra;
        } else {
          status.textContent = "Kenteken niet gevonden \u2014 je kunt gewoon verder.";
        }
      } catch (err) {
        status.textContent = "Kentekencheck is nu niet beschikbaar \u2014 kies hieronder zelf je type.";
      }
      update();
    }
    $("kenteken").addEventListener("input", () => { clearTimeout(rdwTimer); rdwTimer = setTimeout(kentekenCheck, 600); });
    $("kenteken").addEventListener("blur", kentekenCheck);

    $("catGrid").innerHTML = CATS.map(cardHTML).join("");
    bindCards($("catGrid"), (id) => { state.cat = id; selectOne($("catGrid"), id); update(); });

    $("bodyGrid").innerHTML = BODIES.map(cardHTML).join("");
    bindCards($("bodyGrid"), (id) => { state.body = id; state.windows = new Set(["achterportieren"]); selectOne($("bodyGrid"), id); delete $("carSvg").dataset.view; delete $("carSvg2").dataset.view; ensureCar(); update(); });

    $("pkgGrid").innerHTML = PKGS.map(cardHTML).join("");
    bindCards($("pkgGrid"), (id) => { state.pkg = id; selectOne($("pkgGrid"), id); update(); });
    selectOne($("pkgGrid"), state.pkg);

    function renderWindows() {
      const P = prijzen();
      const pakket = state.pkg || "XR";
      $("pkgNaam").textContent = "(" + (PKGS.find((p) => p.id === pakket) || PKGS[0]).name + ")";
      // Voorzijde: twee fysieke keuzes
      $("vrGrid").innerHTML = [
        cardHTML({
          id: "ceramisch", name: "Voorruit",
          tag: "Warmtewerend \u00b7 heldere doorkijk",
          price: euro(P.voorruit),
        }),
        cardHTML({
          id: "chameleon", name: "Chameleon-folie",
          price: "+ " + euro(P.chameleon),
          items: CHAMELEON_ITEMS,
        }),
      ].join("");
      bindCards($("vrGrid"), (id) => {
        state.voorzijde = state.voorzijde === id ? null : id;
        setView("front");
        $("vrGrid").querySelectorAll(".pp-card").forEach((c) => c.classList.toggle("pp-selected", c.dataset.id === state.voorzijde));
        update();
      });
      $("vrGrid").querySelectorAll(".pp-card").forEach((c) => c.classList.toggle("pp-selected", c.dataset.id === state.voorzijde));
      // Zijruiten & achterruit
      const list = bodyWindows(state.body);
      state.windows.forEach((w) => { if (!list.includes(w)) state.windows.delete(w); });
      $("winGrid").innerHTML = list.map((w) => cardHTML({ id: w, name: winNaam(state.body, w), price: euro(P[pakket][w]) })).join("");
      bindCards($("winGrid"), (id) => {
        state.windows.has(id) ? state.windows.delete(id) : state.windows.add(id);
        setView(id === "achterruit" ? "rear" : "side");
        $("winGrid").querySelectorAll(".pp-card").forEach((c) => c.classList.toggle("pp-selected", state.windows.has(c.dataset.id)));
        update();
      });
      $("winGrid").querySelectorAll(".pp-card").forEach((c) => c.classList.toggle("pp-selected", state.windows.has(c.dataset.id)));
    }

    $("removeFoil").addEventListener("change", (e) => { state.removeFoil = e.target.checked; update(); });
    $("zonneband").addEventListener("change", (e) => { state.zonneband = e.target.checked; setView("front"); update(); });

    state.view = "side";
    const carName = () => CAR_VOOR_TYPE[state.body] || STANDAARD_AUTO;
    const carViews = () => CAR_CACHE[carName()] || null;
    function ensureCar(cb) {
      const n = carName();
      if (CAR_CACHE[n]) { if (cb) cb(); return; }
      laadAuto(n).then(() => { if (cb) cb(); }).catch(() => {});
    }
    function drawView(svg, view) {
      const C = carViews();
      if (!C) {
        svg.innerHTML = "";
        delete svg.dataset.view;
        ensureCar(() => { drawView(svg, view); paintSvg(svg); });
        return;
      }
      const V = C[view];
      svg.setAttribute("viewBox", V.vb);
      // verloop-ID's uniek maken per preview, anders breekt de kleur zodra
      // dezelfde tekening in twee previews staat (verborgen paneel wint de ID)
      const uid = (svg.dataset.pp || svg.getAttribute("data-pp") || "pp") + "-" + view + "-" + Math.random().toString(36).slice(2, 7);
      const artU = V.art
        .replace(/id="([^"]+)"/g, 'id="$1-' + uid + '"')
        .replace(/url\((['"]?)#([^)'"]+)\1\)/g, "url(#$2-" + uid + ")")
        .replace(/href="#([^"]+)"/g, 'href="#$1-' + uid + '"');
      svg.innerHTML = artU;
      svg.dataset.view = view;
    }
    function mengTint(donker, a) {
      // donkere tint gemengd met de glaskleur (#e9eef2) — zo kleurt de vectorvorm zelf
      const d = [1, 3, 5].map((i) => parseInt(donker.slice(i, i + 2), 16));
      const g = [233, 238, 242];
      return "#" + d.map((v, i) => Math.round(a * v + (1 - a) * g[i]).toString(16).padStart(2, "0")).join("");
    }
    function paintSvg(svg) {
      const tint = state.pkg ? PKGS.find((p) => p.id === state.pkg).tint : 0.65;
      svg.querySelectorAll(".pp-win").forEach((w) => {
        let key = w.dataset.w;
        if (key === "kwart") key = state.body === "bus" ? "zijramen" : "achterportieren";
        if (key === "busachter") key = state.windows.has("achterportieren") ? "achterportieren" : "achterruit";
        const isVR = key === "voorruit";
        let on = isVR ? !!state.voorzijde : state.windows.has(key);
        // het zichtbare randje van de achterruit in het zijaanzicht kleurt ook mee met achterportieren/achterklep
        if (key === "achterruit" && svg.dataset.view === "side" && !on) on = state.windows.has("achterportieren");
        w.style.fill = on
          ? (isVR && state.voorzijde === "chameleon" ? mengTint("#3B4E9E", 0.8) : mengTint("#0a0d12", isVR ? 0.7 : tint))
          : "#e9eef2";
      });
      svg.querySelectorAll(".pp-zb").forEach((zb) => zb.classList.toggle("pp-on", state.zonneband));
    }
    function paintCar() {
      const c1 = $("carSvg"), c2 = $("carSvg2");
      if (!c1.dataset.view) drawView(c1, state.view);
      if (!c2.dataset.view) drawView(c2, "side");
      paintSvg(c1); paintSvg(c2);
    }
    const VIEW_ORDER = { front: 0, side: 1, rear: 2 };
    function setView(view) {
      if (!carViews()) { state.view = view; ensureCar(() => { drawView($("carSvg"), view); paintSvg($("carSvg")); }); return; }
      if (!carViews()[view]) return;
      state.view = view;
      const svg = $("carSvg");
      const from = svg.dataset.view;
      if (from === view) { paintSvg(svg); return; }
      if (svg.dataset.busy) { drawView(svg, view); paintSvg(svg); return; }
      svg.dataset.busy = "1";
      const naarRechts = VIEW_ORDER[view] > VIEW_ORDER[from];   // side->rear draait de auto naar links weg
      svg.classList.add(naarRechts ? "pp-out-l" : "pp-out-r");
      setTimeout(() => {
        drawView(svg, view);
        paintSvg(svg);
        // binnenkomen vanaf de andere kant, zonder overgang klaarzetten
        svg.classList.add("pp-notrans");
        svg.classList.remove("pp-out-l", "pp-out-r");
        svg.classList.add(naarRechts ? "pp-out-r" : "pp-out-l");
        void svg.getBoundingClientRect();
        svg.classList.remove("pp-notrans");
        svg.classList.remove("pp-out-l", "pp-out-r");
        setTimeout(() => { delete svg.dataset.busy; }, 430);
      }, 430);
    }

    function isQuoteFlow() { return state.cat && state.cat !== "auto"; }
    function calc() {
      if (isQuoteFlow()) return { rows: [], total: 0 };
      const P = prijzen();
      const pkgP = P[state.pkg || "XR"];
      const rows = [];
      let total = 0;
      if (state.voorzijde) {
        rows.push(["Voorruit \u2014 warmtewerende folie", P.voorruit]); total += P.voorruit;
        if (state.voorzijde === "chameleon") { rows.push(["Chameleon-folie meerprijs", P.chameleon]); total += P.chameleon; }
      }
      if (state.zonneband) { rows.push(["Zonneband voorruit", ZONNEBAND_PRIJS]); total += ZONNEBAND_PRIJS; }
      bodyWindows(state.body).forEach((w) => {
        if (!state.windows.has(w)) return;
        rows.push([winNaam(state.body, w), pkgP[w]]); total += pkgP[w];
        if (state.modelToeslag && state.modelToeslag.toeslag[w]) {
          rows.push(["Modeltoeslag " + state.modelToeslag.label, state.modelToeslag.toeslag[w]]);
          total += state.modelToeslag.toeslag[w];
        }
      });
      if (state.removeFoil) { rows.push(["Bestaande folie verwijderen", "op locatie"]); }
      return { rows, total };
    }

    const TOTAL_STEPS = 5;
    function stepValid() {
      switch (state.step) {
        case 1: return !!state.cat;
        case 2: return !!state.body;
        case 3: return !!state.pkg;
        case 4: return state.windows.size > 0 || !!state.voorzijde;
        case 5: return true;
      }
    }
    function goto(step) {
      state.step = step;
      for (let i = 1; i <= TOTAL_STEPS; i++) $("p" + i).classList.toggle("pp-visible", i === step);
      if (step === 4) { renderWindows(); state.view = "side"; drawView($("carSvg"), "side"); }
      if (step === 5) renderSummary();
      paintCar();
      update();
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function next() {
      if (state.step === 1 && isQuoteFlow()) { goto(5); return; }
      if (state.step === 5) { submit(); return; }
      goto(state.step + 1);
    }
    function prev() {
      if (state.step === 5 && isQuoteFlow()) { goto(1); return; }
      if (state.step > 1) goto(state.step - 1);
    }
    $("btnNext").addEventListener("click", next);
    $("btnPrev").addEventListener("click", prev);

    function renderSummary() {
      $("locField").style.display = (state.cat === "machine" || state.cat === "pand") ? "" : "none";
      const kent = $("kenteken").value.trim().toUpperCase();
      if (isQuoteFlow()) {
        const cat = CATS.find((c) => c.id === state.cat);
        $("summaryBox").innerHTML = `
          <h3>Jouw aanvraag</h3>
          <div class="pp-row"><span>Categorie</span><span>${cat.name}</span></div>
          <div class="pp-row"><span>Prijs</span><span class="pp-r-price">Op aanvraag</span></div>
          <p class="pp-note">Hiervoor gelden maatwerkprijzen. Maak je aanvraag af en we stellen een offerte op.</p>`;
        return;
      }
      const { rows, total } = calc();
      const body = BODIES.find((b) => b.id === state.body);
      const pkg = state.pkg && state.windows.size ? PKGS.find((p) => p.id === state.pkg).name : "";
      $("summaryBox").innerHTML = `
        <h3>Jouw gekozen opties</h3>
        <div class="pp-row"><span>Voertuig</span><span>${state.rdw ? state.rdw.merk + " " + state.rdw.model + " \u00b7 " : ""}${body.name}${kent ? " \u00b7 " + kent : ""}</span></div>
        ${pkg ? `<div class="pp-row"><span>Foliepakket zijruiten/achterruit</span><span>${pkg}</span></div>` : ""}
        ${rows.map(([n, p]) => `<div class="pp-row"><span>${n}</span><span class="pp-r-price">${typeof p === "number" ? euro(p) : p}</span></div>`).join("")}
        <div class="pp-row pp-total-row"><span>Totaalbedrag</span><span class="pp-r-price">${euro(total)}</span></div>
        <p class="pp-note">Inclusief BTW en installatie \u00b7 Datum afspraak in overleg \u00b7 Tintpercentage kan op locatie bepaald worden</p>
        <p class="pp-note">${CONFIG.disclaimer}</p>`;
    }

    function bouwOverzicht() {
      const kent = $("kenteken").value.trim().toUpperCase();
      if (isQuoteFlow()) {
        const cat = CATS.find((c) => c.id === state.cat);
        return "Categorie: " + cat.name + "\nPrijs: op aanvraag (offerte volgt)";
      }
      const { rows, total } = calc();
      const body = BODIES.find((b) => b.id === state.body);
      const pkg = state.pkg && state.windows.size ? PKGS.find((p) => p.id === state.pkg).name : "";
      return "Voertuig: " + (state.rdw ? state.rdw.merk + " " + state.rdw.model + " \u00b7 " : "") + (body ? body.name : "") + (kent ? " \u00b7 " + kent : "") +
        (pkg ? "\nFoliepakket zijruiten/achterruit: " + pkg : "") + "\n" +
        rows.map(([n, p]) => n + ": " + (typeof p === "number" ? euro(p) : p)).join("\n") +
        "\nTotaalbedrag: " + euro(total) + " (inclusief BTW en installatie)";
    }

    function bouwOverzichtHtml() {
      const kent = $("kenteken").value.trim().toUpperCase();
      const rij = (n, p) => '<tr><td style="padding:8px 0;border-bottom:1px dashed #e3e7f1;color:#555;font-size:14px">' + n + '</td><td style="padding:8px 0;border-bottom:1px dashed #e3e7f1;text-align:right;font-weight:600;font-size:14px;white-space:nowrap">' + p + "</td></tr>";
      if (isQuoteFlow()) {
        const cat = CATS.find((c) => c.id === state.cat);
        return '<table width="100%" cellpadding="0" cellspacing="0">' + rij("Categorie", cat.name) + rij("Prijs", "Op aanvraag") + "</table>";
      }
      const { rows, total } = calc();
      const body = BODIES.find((b) => b.id === state.body);
      const pkg = state.pkg && state.windows.size ? PKGS.find((p) => p.id === state.pkg).name : "";
      let h = '<table width="100%" cellpadding="0" cellspacing="0">';
      h += rij("Voertuig", (state.rdw ? state.rdw.merk + " " + state.rdw.model + " \u00b7 " : "") + (body ? body.name : "") + (kent ? " \u00b7 " + kent : ""));
      if (pkg) h += rij("Foliepakket zijruiten/achterruit", pkg);
      rows.forEach(([n, p]) => { h += rij(n, typeof p === "number" ? euro(p) : p); });
      h += '<tr><td style="padding:14px 0 0;font-weight:700;font-size:16px">Totaalbedrag</td><td style="padding:14px 0 0;text-align:right"><span style="background:#ffb700;border-radius:999px;padding:4px 16px;font-weight:700;font-size:16px;white-space:nowrap">' + euro(total) + "</span></td></tr></table>";
      return h;
    }

    async function submit() {
      if (!$("fn").value.trim() || !$("em").value.trim() || !$("tel").value.trim()) {
        alert("Vul de verplichte velden in (voornaam, e-mailadres en telefoonnummer).");
        return;
      }
      if (CONFIG.formEndpoint) {
        const btn = $("btnNext");
        btn.disabled = true;
        btn.textContent = "Versturen\u2026";
        const overzicht = bouwOverzicht();
        const payload = {
          Voornaam: $("fn").value.trim(),
          Achternaam: $("ln").value.trim(),
          "E-mailadres": $("em").value.trim(),
          Telefoonnummer: $("tel").value.trim(),
          Voorkeursdatum: $("wanneer").value,
          Locatie: $("loc").value.trim(),
          Kenteken: $("kenteken").value.trim().toUpperCase(),
          Bericht: $("msg").value.trim(),
          Overzicht: overzicht,
          _subject: "Nieuwe aanvraag ramen blinderen \u2014 " + $("fn").value.trim() + " " + $("ln").value.trim(),
          _replyto: $("em").value.trim(),
          _template: "table",
          _autoresponse: "Bedankt voor je aanvraag bij Pieter Plakt!\n\nDit is jouw overzicht:\n\n" + overzicht +
            "\n\nWij sturen binnen 2 werkdagen een mailtje met de eerst beschikbare mogelijkheid. Kun je daar niet op wachten? Neem dan telefonisch contact met ons op via " + CONFIG.telefoon + ".\n\n" + CONFIG.disclaimer,
        };
        if (CONFIG.webhookUrl) {
          const data = {
            voornaam: $("fn").value.trim(),
            achternaam: $("ln").value.trim(),
            email: $("em").value.trim(),
            telefoon: $("tel").value.trim(),
            voorkeursdatum: $("wanneer").value,
            locatie: $("loc").value.trim(),
            kenteken: $("kenteken").value.trim().toUpperCase(),
            bericht: $("msg").value.trim(),
            overzicht: overzicht,
            overzichtHtml: bouwOverzichtHtml(),
            onderwerp: "Nieuwe aanvraag ramen blinderen \u2014 " + $("fn").value.trim() + " " + $("ln").value.trim(),
          };
          let frame = document.getElementById("pp-mailframe");
          if (!frame) {
            frame = document.createElement("iframe");
            frame.id = "pp-mailframe";
            frame.name = "pp-mailframe";
            frame.style.display = "none";
            document.body.appendChild(frame);
          }
          const f = document.createElement("form");
          f.method = "POST";
          f.action = CONFIG.webhookUrl;
          f.target = "pp-mailframe";
          f.style.display = "none";
          Object.keys(data).forEach((k) => {
            const inp = document.createElement("input");
            inp.type = "hidden";
            inp.name = k;
            inp.value = data[k];
            f.appendChild(inp);
          });
          document.body.appendChild(f);
          f.submit();
          await new Promise((r) => setTimeout(r, 900));
          f.remove();
        } else {
        payload._captcha = "false";
        // Versturen via een verborgen formulier-post: werkt vanaf elk domein, zonder CORS-beperkingen
        let frame = document.getElementById("pp-mailframe");
        if (!frame) {
          frame = document.createElement("iframe");
          frame.id = "pp-mailframe";
          frame.name = "pp-mailframe";
          frame.style.display = "none";
          document.body.appendChild(frame);
        }
        const f = document.createElement("form");
        f.method = "POST";
        f.action = CONFIG.formEndpoint;
        f.target = "pp-mailframe";
        f.style.display = "none";
        Object.keys(payload).forEach((k) => {
          const inp = document.createElement("input");
          inp.type = "hidden";
          inp.name = k;
          inp.value = payload[k];
          f.appendChild(inp);
        });
        document.body.appendChild(f);
        f.submit();
        await new Promise((r) => setTimeout(r, 900));
        f.remove();
        }
      }
      $("quoteForm").classList.add("pp-hidden");
      $("summaryBox").classList.add("pp-hidden");
      $("doneBox").classList.remove("pp-hidden");
      $("p5Label").textContent = "Klaar \u2713";
      root.querySelector(".pp-bar").classList.add("pp-hidden");
      $("stepBar").querySelectorAll(".pp-s").forEach((d) => { d.className = "pp-s pp-done"; });
    }

    function update() {
      const bar = $("stepBar");
      bar.innerHTML = "";
      for (let i = 1; i <= TOTAL_STEPS; i++) {
        const d = document.createElement("div");
        d.className = "pp-s" + (i < state.step ? " pp-done" : i === state.step ? " pp-active" : "");
        bar.appendChild(d);
      }
      const { total } = calc();
      $("totalAmt").textContent = isQuoteFlow() ? "Op aanvraag" :
        (state.body ? euro(total) : "vanaf " + euro(CONFIG.vanafPrijs));
      $("btwLine").textContent = isQuoteFlow() ? "Maatwerk \u00b7 offerte binnen 3 werkdagen" : "Inclusief BTW \u00b7 inclusief installatie \u00b7 prijzen onder voorbehoud";
      $("btnPrev").disabled = state.step === 1;
      $("btnNext").disabled = !stepValid();
      $("btnNext").textContent = state.step === 5 ? "Aanvraag versturen" :
        (state.step === 1 && isQuoteFlow()) ? "Offerte aanvragen" : "Volgende stap";
      paintCar();
    }

    // Start (zonder scroll bij eerste render)
    state.step = 1;
    for (let i = 1; i <= TOTAL_STEPS; i++) $("p" + i).classList.toggle("pp-visible", i === 1);
    paintCar();
    update();
  }

  /* ================================================================
     BOOT — injecteer font + styling en start op #pp-configurator
     ================================================================ */
  function boot() {
    if (!document.getElementById("pp-configurator-font")) {
      const link = document.createElement("link");
      link.id = "pp-configurator-font";
      link.rel = "stylesheet";
      link.href = FONT_URL;
      document.head.appendChild(link);
    }
    if (!document.getElementById("pp-configurator-css")) {
      const style = document.createElement("style");
      style.id = "pp-configurator-css";
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    document.querySelectorAll("#pp-configurator, [data-pp-configurator]").forEach((el) => {
      if (!el.dataset.ppInit) { el.dataset.ppInit = "1"; init(el); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
