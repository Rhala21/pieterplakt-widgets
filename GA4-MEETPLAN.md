# GA4-MEETPLAN — Pieter Plakt configurator
*Stand: 14 november 2026 · hoort bij widget v3.15 · dit bestand hoort in de GitHub-repo naast PROJECT-DOSSIER.md.*

Alles wat de widget zelf meet is al ingebouwd (v3.15). Dit document beschrijft wat er is gevonden, wat de widget nu stuurt, en welke stappen Pieter zelf zet in **GTM**, **GA4** en **Looker Studio**. De widget stuurt alleen naar de `dataLayer`; GTM + CookieYes bepalen of er echt naar GA4 gaat — de meting respecteert de cookietoestemming dus vanzelf.

---

## 1. Audit — wat er al was (gevonden 14 nov 2026)

| Onderdeel | Status |
|---|---|
| GTM-container | **GTM-PCJNQNCK**, geladen via de Webflow-app "Google Site Tools" (niet in custom code — niet nogmaals toevoegen) |
| Cookiebanner | **CookieYes**, geladen in de site-head vóór GTM (ondersteunt Google Consent Mode v2) |
| Site-breed meetscript | In de site-footer (Webflow custom code): pusht `generate_lead` (Webflow-formulieren, met `form_name` + `lead_service`), `form_start`, `click_phone`, `click_whatsapp`, `click_email`, `cta_click`, `calculator_start` |
| Widget (t/m v3.14) | Alleen `offerte_aanvraag` (categorie, waarde, valuta) bij versturen |
| Oude namen uit de briefing | `configurator_gestart`, `resultaat_bekeken`, `aanvraag_configurator_verstuurd`, `aanvraag_direct_verstuurd` staan **nergens in de code** (site noch widget). Als ze ergens bestaan, is dat als tag-/eventnaam in GTM of GA4 — zie migratie (§5, punt 3) |

**Ontbrak:** start-, stap-, optie-, prijs- en terugnavigatie-meting in de configurator; een lead-event in het uniforme formaat. Dat zit nu allemaal in v3.15.

## 2. Wat de widget stuurt (v3.15)

Eén centrale `track()`-functie pusht naar `window.dataLayer`. Elk event krijgt automatisch `category` (auto / bus / machine / pand / reclame) mee. **Geen persoonsgegevens**: alleen optie-id's, stapnummers en prijssegmenten — nooit namen, e-mail, telefoon, kenteken of vrije tekst.

| Event | Wanneer | Extra parameters | Dubbeltelling voorkomen |
|---|---|---|---|
| `configurator_start` | Eerste bewuste interactie (kaart-klik of kenteken typen) | — | 1× per paginabezoek |
| `configurator_category_select` | Categorie gekozen in stap 1 | `category_label`, `step_number` | elke keuze telt |
| `configurator_step_view` | Stap wordt zichtbaar | `step_number`, `step_name` | 1× per stap per bezoek (terugnavigatie telt niet opnieuw) |
| `configurator_step_complete` | Stap afgerond (Volgende geklikt) | `step_number`, `step_name` | 1× per stap per bezoek |
| `configurator_option_select` | Optie gekozen (alleen áánzetten, niet uitzetten) | `option_group`, `option_value`, `step_number` | elke keuze telt |
| `configurator_price_view` | Echte totaalprijs (auto, bij overzicht) of prijsindicatie (reclame) getoond | `price_amount`, `currency`, `price_bucket`, `pricing_type` | alleen bij gewijzigd bedrag |
| `configurator_back` | Terug naar eerdere stap | `from_step`, `to_step` | elke keer telt (bewust) |
| `configurator_form_start` | Eerste veld van het aanvraagformulier aangeraakt | `request_type` | 1× per bezoek |
| `generate_lead` | **Pas na bevestigd succesvol versturen** (mislukte verzending telt niet) | `request_type`, `pricing_type`, `currency` | 1× (formulier verdwijnt na succes) |

Waarden: `step_number` = positie in de **route** (1–5 voor auto; 1–4 voor pand; 1–3 voor reclame — zo zijn categorieën vergelijkbaar), `step_name` = categorie/voertuig/pakket/ruiten/pand/ramen/reclame/contact. `option_group` ∈ voertuigtype, foliepakket, voorruit_folie, ruiten, zonneband, folie_verwijderen, pand_type, folie_soort, reclame_voertuig, reclame_pakket. `request_type` ∈ directe_prijs / offerte / prijsindicatie; `pricing_type` ∈ direct / offerte / indicatie. `price_bucket` ∈ 0-250, 250-500, 500-750, 750-1000, 1000+. Bewust **geen `value`** op `generate_lead` (offertebedragen zijn geen betrouwbare leadwaarde); voor de auto-categorie kan dat later alsnog.

Het foliepakket (XR/XR+) ís de tintkeuze — een apart tintpercentage bestaat niet in de configurator. Raammaten (cm) worden bewust niet gemeten (vrije invoer).

## 3. GTM-inrichting (eenmalig, ±20 min)

1. Open **tagmanager.google.com** → container GTM-PCJNQNCK.
2. **Variabelen** → User-Defined → New → *Data Layer Variable*, één per parameter: `category`, `category_label`, `step_number`, `step_name`, `option_group`, `option_value`, `price_amount`, `price_bucket`, `pricing_type`, `request_type`, `from_step`, `to_step`, `form_name`, `lead_service`, `currency`. (Naamgeving: "dlv - category" enz.)
3. **Triggers** → New → *Custom Event*, eventnaam: `configurator_start|configurator_category_select|configurator_step_view|configurator_step_complete|configurator_option_select|configurator_price_view|configurator_back|configurator_form_start|generate_lead` — vink **"Use regex matching"** aan. Eén trigger volstaat.
4. **Tags** → New → *Google Analytics: GA4 Event* → jouw GA4-measurement-id → Event Name: `{{Event}}` (de ingebouwde variabele) → onder Event Parameters alle variabelen uit stap 2 toevoegen (parameternaam = exact de namen hierboven) → trigger uit stap 3. Eén tag vangt zo alle configurator-events én generate_lead.
   - Check eerst of er al een GA4-event-tag op `generate_lead` bestaat (van de site-formulieren): zo ja, breid díé tag uit met de regex-trigger en de extra parameters in plaats van een tweede tag te maken — anders telt generate_lead dubbel.
5. **Consent**: tag → Advanced Settings → Consent Settings → "Require additional consent": `analytics_storage`. (CookieYes zet de consent-status; zo vuurt de tag alleen mét toestemming.)
6. **Preview** (Tag Assistant) → doorloop de configurator → controleer dat elk event één keer vuurt → **Submit/Publish**.

## 4. GA4-configuratie (eenmalig, ±15 min)

**Custom dimensions** (Beheer → Aangepaste definities → Aangepaste dimensies, scope *Event*): `category` ("Categorie"), `step_name` ("Stapnaam"), `option_group` ("Optiegroep"), `option_value` ("Optiewaarde"), `price_bucket` ("Prijssegment"), `pricing_type` ("Prijstype"), `request_type` ("Aanvraagtype"), `form_name` ("Formuliernaam"). Dat zijn er 8 van de 50 — ruim binnen de limiet. `step_number` hoeft geen dimensie (zit in step_name) en `from_step`/`to_step` alleen toevoegen als je terugnavigatie per stap wilt uitsplitsen.

**Custom metric** (scope Event, meeteenheid Standaard): `price_amount` ("Getoonde prijs"). Currency-parameters hoeven niet apart.

**Key events** (Beheer → Gebeurtenissen): markeer alleen **`generate_lead`** als key event (= conversie, ook bruikbaar voor Google Ads straks). `configurator_start` en `configurator_price_view` níét — dat vervuilt de conversierapporten.

**Funnel** (Verkennen → Trechterverkenning, "open funnel" uit):
1. `configurator_start` → 2. `configurator_category_select` → 3. `configurator_step_view` met step_number = 2 → 4. step_number = 3 → 5. step_number = 4 (alleen de auto-route heeft 5 stappen; zet stap 4–5 op "optioneel" of maak per categorie een variant) → 6. `configurator_price_view` (optioneel — alleen auto/reclame tonen een prijs) → 7. `configurator_form_start` → 8. `generate_lead`.
Maak hem één keer algemeen en dupliceer hem met filter **Categorie** (= de custom dimension) voor de per-categorie-versie. Uitsplitsen op apparaat/bron: voeg "Apparaatcategorie" of "Sessiebron/medium" als uitsplitsing toe.

## 5. Migratieplan oude events (dubbeltellingen voorkomen)

1. **`offerte_aanvraag`** — bestaat vanaf v3.15 niet meer (vervangen door `generate_lead`). Heeft GTM een tag/trigger op `offerte_aanvraag`? Pauzeer die bij het publiceren van de nieuwe tag. Stond er in GA4 een key event `offerte_aanvraag`, zet die uit zodra `generate_lead` binnenkomt.
2. **`calculator_start`** (site-footer-script) — overlapt met `configurator_start` op de configuratorpagina, maar meet óók het kentekenblok (#prijs) op andere pagina's. **Maak er geen GA4-tag voor** (of laat een bestaande tag alleen voor niet-configuratorpagina's vuren); `configurator_start` is voortaan de maat voor configurator-starts. Het footer-script zelf kan ongemoeid blijven.
3. **`configurator_gestart` / `resultaat_bekeken` / `aanvraag_configurator_verstuurd` / `aanvraag_direct_verstuurd`** — niet in de code gevonden. Staan ze als tags in GTM of als (key) events in GA4: pauzeren/uitzetten; hun opvolgers zijn respectievelijk `configurator_start`, `configurator_price_view` en `generate_lead`.
4. **`generate_lead` van de site-formulieren** (contactformulier e.d.) blijft bestaan — dat is gewenst: directe aanvragen en configurator-aanvragen samen onder één naam. Onderscheid: site-formulieren hebben `form_name`, de configurator heeft `request_type`. ("Directe aanvragen" in dashboard 5 = generate_lead mét form_name; "configurator-aanvragen" = mét request_type.)
5. `form_start`, `click_phone/whatsapp/email`, `cta_click` blijven zoals ze zijn.

## 6. Looker Studio — dashboardvoorstel (5 pagina's)

Nieuwe rapport → gegevensbron GA4-property → 5 pagina's. Periodefilter + vergelijkingsperiode bovenaan elke pagina.

| Pagina | Naam | Inhoud |
|---|---|---|
| 1 | **Overzicht** | Scorecards: Configurators gestart (eventcount configurator_start), Unieke gebruikers (totalUsers met eventfilter), Prijzen getoond (configurator_price_view), Aanvragen (generate_lead), Conversie % (berekend veld: generate_lead ÷ configurator_start). Alles met vorige-periode-vergelijking |
| 2 | **Conversietrechter** | Staafdiagram eventcount per step_name (gesorteerd op step_number), tabel met uitval-% per stap (berekende velden), uitsplitsing Apparaatcategorie, filterknop Categorie |
| 3 | **Productinteresse** | Taart/staaf: category_label (events category_select); tabel option_group × option_value (events option_select) — toont populairste pakketten, ruiten, folies; staaf price_bucket (events price_view) |
| 4 | **Marketingprestaties** | Tabel Sessiestandaardkanaalgroep (Organic/Paid/Direct/Social/Referral) met kolommen: sessies, configurator_start, generate_lead, conversie % (berekend). Tweede tabel op Sessiebron/medium |
| 5 | **Aanvragen** | Tijdreeks generate_lead per week/maand; staaf "Direct vs. configurator" (dimensie: form_name ingevuld → direct, request_type ingevuld → configurator — maak hiervoor een berekend veld `CASE WHEN form_name IS NOT NULL THEN "Direct formulier" ELSE "Configurator" END`); tabel conversie per Categorie |

Nederlandse labels invoeren bij elk diagram ("Gestart", "Aanvragen", "Conversie %"). GA4-data verschijnt met ±24u vertraging in standaardrapporten; DebugView en Realtime zijn direct.

## 7. Testplan (na uploaden + purgen van v3.15)

Voorbereiding: GTM **Preview** openen (Tag Assistant) op de configuratorpagina, en GA4 **DebugView** ernaast (Beheer → DebugView; Tag Assistant zet debug_mode automatisch aan).

| # | Doe | Verwacht |
|---|---|---|
| 1 | Pagina laden, nog niets aanklikken | géén configurator-event (alleen page_view) |
| 2 | Klik categorie Auto's | `configurator_start` + `configurator_category_select` (category=auto), daarna `configurator_step_view` stap 2 |
| 3 | Kenteken typen, pakket en ruiten kiezen | `configurator_option_select` per keuze (voertuigtype/foliepakket/ruiten), step_view/step_complete per stap, elk 1× |
| 4 | Naar het overzicht (stap 5) | `configurator_price_view` met price_amount + price_bucket, kloppend met het getoonde totaal |
| 5 | Terug en weer vooruit naar dezelfde stap | `configurator_back` vuurt; step_view/step_complete **niet** opnieuw |
| 6 | Eerste formulierveld aanklikken | `configurator_form_start` 1× (ook niet nogmaals bij tweede veld) |
| 7 | Versturen met internet uit | foutmelding, **géén** `generate_lead` |
| 8 | Versturen met internet aan | `generate_lead` precies 1× (en de drie mails komen binnen) |
| 9 | Herhaal 2–8 kort voor pand én reclame | zelfde patroon; pand zonder price_view, reclame mét (pricing_type=indicatie) |
| 10 | Mobiel (of DevTools device-modus) één flow | zelfde events |
| 11 | Cookiebanner **weigeren** (incognito) | events verschijnen wél in Tag Assistant-preview maar GA4-tag vuurt niet / DebugView blijft leeg |
| 12 | In GA4 na 24u | events zichtbaar in Rapporten; dimensies gevuld |

## 8. Beheer

- **Wijzig je prijzen of de flow?** `node test.js` draaien (checkt ook dat alle GA4-events nog bestaan) vóór het uploaden.
- Nieuwe optiegroepen meten = één `trackOptie("groep","waarde")`-aanroep op de juiste plek; eventstructuur nooit per categorie laten afwijken.
- De widget draait straks mogelijk ook op **ruitblinderen.nl**: zelfde code werkt daar direct, mits die site een eigen GTM/GA4 + consentbanner heeft. Gebruik dáár een eigen GA4-property of een `site`-parameter als je ze gescheiden wilt zien.
- Persoonsgegevens horen nooit in events; `test.js` bewaakt de eventnamen, de reviewregel bewaakt de parameters.
