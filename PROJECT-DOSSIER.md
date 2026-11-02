# PROJECT-DOSSIER — Pieter Plakt Prijsconfigurator
*Stand: 2 november 2026 · widget v3.13 · dit bestand hoort in de GitHub-repo naast de widget.*

**Voor een nieuwe Claude-sessie:** lees dit, kloon daarna ALTIJD eerst de live bron (`https://github.com/Rhala21/pieterplakt-widgets`) en bouw dáárop — nooit op bestanden uit een oud gesprek. Het Make-scenario kun je rechtstreeks lezen/wijzigen via de Make-koppeling. Werk na elke wijziging dit dossier mee bij in de repo.

---

## 1. Wat dit is

Prijsconfigurator-widget voor pieterplakt.nl (ramen blinderen/tinten), als embed in Webflow. Huisstijl: geel #ffb700, zwart, tekst #555, achtergrond #f6f8fd, randen #e3e7f1, font Clash Display (Fontshare), pill-knoppen. Bedrijf: Pieter Plakt, Burgum, 0511 700 258, info@pieterplakt.nl.

## 2. Hosting & livegang-routine

- **Repo:** `Rhala21/pieterplakt-widgets` → geserveerd via jsDelivr.
- **Embed:** `<div id="pp-configurator"></div><script src="https://cdn.jsdelivr.net/gh/Rhala21/pieterplakt-widgets@main/pieterplakt-configurator.js" defer></script>`
- **Bestanden in de repo:** `pieterplakt-configurator.js` (kern, ±80KB), `cars/*.json` (8 automodellen, on-demand geladen via pad naast het script of `window.PP_CARS`), `pieter-plakt-wit.png`, dit dossier.
- **Na elke wijziging:** bestand uploaden → cache purgen: `https://purge.jsdelivr.net/gh/Rhala21/pieterplakt-widgets@main/<bestand>` → harde refresh → **versienummer onder het livebeeld checken** (staat in de hint-teksten; bij elke wijziging ophogen, nu v3.13).
- **Testbestand:** `index.html` (alles-in-één met `window.PP_CARS` ingebakken, `</script>` in de code escapen naar `<\/script>`) voor static.app/tiiny — nooit naar GitHub.

## 3. Flow (stand v3.13)

Stap 1 categorie → per categorie een eigen route:
- **Auto's** (prijs): kenteken + carrosserietype → foliepakket XR/XR+ → ruiten (Voorruit/Chameleon-kaarten, zonneband-checkbox, zijruiten/achterruit, folie verwijderen) → contact.
- **Woning & Bedrijfspand** (offerte): type pand (woning/bedrijfspand, iconen) + soort folie (zonwerend/privacy/decoratief/veiligheid) → ramen per verdieping (referentieveld, breedte×hoogte in **cm**, m² automatisch, naar boven afgerond op `CONFIG.m2AfrondenOp`; ramen en verdiepingen toevoegen/verwijderen) → contact.
- **Bedrijfsreclame** (prijsindicatie, sinds aug): voertuigtype (`RECLAME_VOERTUIGEN`) + pakket (`RECLAME_PAKKETTEN`: standaard belettering / halve wrap / volledige wrap) met indicatie (`recIndicatie`).
- **Werkbussen / Machines & Vrachtwagens**: direct offerte.

Contactformulier: voornaam/achternaam/e-mail/telefoon, **voorkeursdatum met agenda-koppeling** (zie §6), **losse adresvelden** Straat*/Huisnummer*/Postcode*/Dorp-Stad* (zichtbaar bij categorieën met locatie), **Herkomst-dropdown** (Google / Social media / Via via / Eerder klant / Anders), bericht. Bevestiging "Klaar ✓".

## 4. Livebeeld (vectoraanpak — zo verwerken bij nieuwe tekeningen)

- 8 modellen in `cars/*.json`: h3, h5, coupe, sedan, station (VW Passat Variant), pickup, bus, tesla3; per model `{side|front|rear: {vb, art}}`. Drie aanzichten met richtingsbewuste zwenkanimatie.
- **Aanlevering:** svgz per aanzicht; voorruitglas **#7cc5ad**, overige ramen **#4c7a6b**; alleen lineaire gradients.
- **Verwerking:** raamelementen in de SVG-bron taggen (class + ` pp-win`, `data-w="<raam-id>"`); voorruit krijgt `id="vrglas"` met direct erna `<clipPath id="zbclip"><use href="#vrglas"/></clipPath><rect class="pp-zb" ...bovenste 26% bbox (side 42%)... clip-path="url(#zbclip)"/>` — zonneband exact glasgeclipt, valt vanzelf achter de spiegelhouder; markerkleuren → #e9eef2; svgo multipass floatPrecision 1; `<style>` scopen per model-view-class. De widget kleurt de vectorvormen zelf via `mengTint` (XR .55, XR+ .82; chameleon blauw #3B4E9E); niet-geselecteerd expliciet `#e9eef2` terugzetten (leeg laten = zwart!). `drawView` maakt gradient/clip-id's per preview uniek (anders witte auto's).
- Raam-id's: voorruit, voorportieren, achterportieren, achterruit, zijramen (bus), kwart (bus→zijramen, anders achterportieren). Achterruit-rand in side kleurt ook mee met achterportieren.

## 5. Kenteken & prijzen

RDW Open Data (basis m9d7-ebf2 + carrosserie vezc-m2t6, EU-codes). Auto-selectie type, Tesla Model 3-herkenning, VW Golf-toeslag (`MODEL_TOESLAGEN`). Prijzen per type×pakket in `PRIJZEN`; "vanaf € 175" tot type gekozen. Kentekencheck werkt niet in Claude-previews — testen op static.app/live.

## 6. Adres, reiskosten & agenda

- **Adres:** losse velden gaan ook los mee in de webhook (straat/huisnummer/postcode/plaats) plus samengesteld als `locatie`. Zichtbaar label is overal **"Adres"** (mails + FormSubmit); de webhook-veldnaam `locatie` NIET hernoemen (Make-mapping).
- **Reiskosten** (`CONFIG.reiskosten`: Burgum 53.1922/5.9905, €0,35/km, €75/uur excl. btw): bij verzenden geocoderen via **PDOK Locatieserver** (postcode+huisnummer), reserve Nominatim, route via OSRM; heen+terug, naar boven afgerond. Tekst is bewust **ASCII-only** ("28 km (heen+terug), ca. 0,6 uur reistijd = 52 euro excl. btw") — speciale tekens raakten verminkt in Outlook-citaten. Timeout 5s + fallback-tekst; blokkeert verzenden nooit. Gaat als apart veld `reiskosten` mee (niet in het klantoverzicht).
- **Mailveilige tekens:** `bouwOverzichtHtml` gaat door `veiligHtml()` (€/·/×/²/—/±/→ als HTML-entities). Bij nieuwe teksten met speciale tekens: zelfde aanpak.
- **Agenda-koppeling** (`CONFIG.agenda`): voorkeursdatum vraagt beschikbaarheid op via Make-webhook `4vm9arlf4mquzylukdhiu6blsoukq03c` (scenario "Integration Webhooks, Google Calendar", id 6579141: webhook → Google Agenda zoeken op afspraken "Pieter Plakt - Blinderen/Tinten" → antwoord `{"datums":[...]}` of `{"eersteDatum":"..."}`). Terugval: vandaag + `minDagenVooruit` (3). Blokkeert nooit.

## 7. Make-scenario "Integration Webhooks" (id 6453365)

Webhook `pieterplakt-configurator-emailform` (hook 3346447, URL eindigt op `l3k3ofbyejfu2ov33k4gz87npymd3ns9`) → drie mails via Titan SMTP (info@pieterplakt.nl):
1. **Klantmail** "Jouw aanvraag bij Pieter Plakt — overzicht" (filter: email bestaat): logo, aanhef, `{{overzichtHtml}}`, 2-werkdagen-kader. **Bevat bewust géén reiskosten.**
2. **Bedrijfsmail** (onderwerp = `{{onderwerp}}`, reply-to = klant): velden-tabel (Naam/E-mail/Telefoon/Voorkeursdatum/Herkomst/Kenteken/**Adres**/Bericht) + Gekozen opties. **Bevat bewust géén reiskosten** — deze mail wordt beantwoord richting de klant en het citaat gaat mee (zo lekte het ooit).
3. **Interne reiskostenmail** "Intern — reiskosten: naam" (filter: reiskosten bestaat, géén reply-to): naam, Adres, reiskosten in geel blok. Nooit beantwoorden richting klant.

Webhook-velden: voornaam, achternaam, email, telefoon, voorkeursdatum, herkomst, locatie, straat, huisnummer, postcode, plaats, kenteken, bericht, overzicht, overzichtHtml, reiskosten, onderwerp. Terugval in de widget: FormSubmit (veldnaam "Adres").

## 8. Werkwijze & lessen (voor elke volgende sessie)

1. **Bron = GitHub, nooit een oude kopie.** Op 2 nov overschreef een juli-sessie per ongeluk maanden werk; hersteld uit de git-historie. Dus: clone → check versienummer in de code == versienummer live → dan pas patchen.
2. **Patches altijd met asserts** op het exacte doel (stille replace-missers veroorzaakten eerder bugs) en daarna `node --check` + versiebump.
3. Eerst de volledige specificatie van de gebruiker, dan bouwen (de zonneband kostte ooit 5 rondes door gokken).
4. Na livegang: purge + versienummer onder het livebeeld is het bewijs.
5. Wijzig je mails/flow: Make rechtstreeks via de koppeling (scenario 6453365), en update daarna §7 hier.
