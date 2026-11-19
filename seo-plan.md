# Rathi's Build Mart: search strategy

How the site should be structured and sequenced to rank for brand and product
searches. Written 19 Oct 2026. Companion to `rathis-build-mart-content.md`.

> **Unvalidated:** the competitive reads below are reasoned from how these
> markets are structured, not measured. Before committing budget, check the
> actual SERPs from Raipur for a dozen of the target queries, and open Search
> Console on the current domain.

---

## 1. The strategic call

Reece runs an inspiration hub because it already owns the transactional layer —
full catalogue, prices, stock, a 3D planner. Inspiration is the *top* of their
funnel; the bottom already converts.

Rathi's owns none of that layer and, by its own constraints, cannot build it:
no online selling, no prices, and a hard limit on product photography. Leading
with inspiration content would rank for "bathroom ideas" and land people on a
page that cannot sell them anything.

**Win dealer-and-stock intent first. Add the inspiration layer second, once
there is something for it to point at.**

### Where Rathi's can actually win

| Query type | Who owns it today | Odds |
|---|---|---|
| "hansgrohe taps price" | Brand site, Amazon, Pepperfry | Poor — do not fight |
| "best tiles for bathroom" | National blogs, large e-com | Hard, slow, low intent |
| **"hansgrohe dealer raipur"** | Effectively nobody | **Strong** |
| **"tile showroom bilaspur"** | JustDial, IndiaMART stubs | **Strong** |
| **"is <brand> available in Chhattisgarh"** | Nobody | **Strong** |

A brand's own site will not say where to buy it in Raipur. Amazon cannot sell a
28,000 sq ft showroom. Directory listings are thin by construction. That gap is
the whole opportunity.

### The defensible asset

Programmatic pages rank when they carry data nobody else holds. Rathi's data is
**what it physically stocks and displays**.

Nobody else can publish "we carry 14 Hansgrohe collections, six on display in
Raipur, here is the bay." Not the brand, not Amazon, not a directory. That fact
is what stops 100 brand pages from being thin content.

It also resolves the photography constraint: shoot **display bays, materials and
people**, never products. A lit Hansgrohe bay is proprietary, cannot be copied
by a competitor, and does not expose a product design the way a catalogue shot
does.

---

## 2. Site architecture

```
/                             home
/brands/                      hub, filterable by department
/brands/<brand>/              ~100 pages — the money pages
/departments/<dept>/          7 pages
/departments/<dept>/<cat>/    ~40 pages
/stores/<city>/               3 pages — raipur, bilaspur, jagdalpur
/guides/                      hub
/guides/<topic>/              editorial, phase 4
```

Subfolders, never subdomains — subfolders consolidate domain authority.

### Brand page: the quality gate

A brand page ships **only** when it carries all of:

- [ ] Which departments it sits in
- [ ] What Rathi's actually stocks from it (collections, ranges, finishes)
- [ ] Authorised/certified dealer status — **only where paperwork exists**
- [ ] Which of the three stores display it
- [ ] Price band (everyday / premium / signature)
- [ ] A display-bay photograph from the store
- [ ] A specific reason to visit

**No stock data, no page.** Twenty-five real brand pages beat a hundred
logo-and-a-paragraph pages, which is the most common way these programmes earn a
thin-content penalty.

### Schema

| Page | Markup |
|---|---|
| Store pages | `LocalBusiness` + `Store`, with `openingHours`, `geo`, `telephone` |
| Brand pages | `Brand` + `OfferCatalog` (no prices — omit `Offer`) |
| Guides | `Article` + `FAQPage` where the format suits |
| All | `BreadcrumbList` |

---

## 3. Three traps specific to this business

**1. No city pages where there is no store.**
The ads brief targets Bhopal, Indore, Nagpur, Jabalpur. Pages like "Hansgrohe
dealer in Bhopal", with no Bhopal store, are textbook doorway pages — the one
pattern Google issues manual actions for. Serve those regions with honest
framing on the store pages ("customers travel from Nagpur and Jabalpur") and
with paid ads. Not with fabricated local pages.

**2. No dealer claim without paperwork.**
Authorised-dealer status is a real ranking and trust signal, and a legal problem
if wrong. Collect the certificates before the pages go live. Still open in
`rathis-build-mart-content.md`.

**3. Google Business Profile will out-earn this entire programme in year one.**
For a store-visit business most "near me" traffic resolves in the map pack and
never reaches a website. Three fully-built profiles with photos, hours,
departments and a steady review flow are cheaper and faster than 100 pages.
Unglamorous, and the highest-ROI item on this list.

---

## 4. Sequence

### Phase 1 — Local foundation
*Highest return, lowest effort. Do this before anything else.*

- Google Business Profile for all three stores: categories, hours, department
  list, interior photography, Q&A seeded
- A review engine — ask at the point of sale, respond to every review
- `/stores/raipur/`, `/stores/bilaspur/`, `/stores/jagdalpur/` with
  `LocalBusiness` schema, directions, call buttons, department list
- Collect dealer certificates

### Phase 2 — Brand pages
*The core of the programme.*

- `/brands/` hub — already built as the home page section; each tile needs a
  destination
- The 20–25 brands with real stock and display data, against the gate above
- Display-bay photography for each, from the shoot
- Internal links: brand ↔ department ↔ store

### Phase 3 — Departments and categories
- 7 department pages, ~40 category pages
- Each lists the brands Rathi's carries in it — linking back to Phase 2

### Phase 4 — Guides
*Now the Reece move, and the imagery constraint stops mattering entirely,
because the content is comparisons and tables rather than product shots.*

- Vitrified vs ceramic — which belongs where
- BWP vs BWR plywood grades
- What flexstone is and where it works
- How to budget a bathroom across everyday / premium / signature

Cheap to produce, no product photography, and each one feeds the brand and
category pages through internal links.

---

## 5. Build it for AI answers from the start

A growing share of "where can I buy Kohler in Raipur" is answered by an
assistant rather than a blue link. What gets cited is clean structured data and
plainly stated facts:

> Rathi's Build Mart stocks Kohler at its Raipur store on Devpuri Road.

Near-free if the pages are built this way from the start, expensive to retrofit.
Write the first sentence of every brand page as a direct, quotable statement of
what is stocked where.

---

## 6. What to measure

| Phase | Leading indicator | Lagging |
|---|---|---|
| 1 | GBP views, direction requests, calls | Store footfall |
| 2 | Brand pages indexed, impressions on "<brand> + city" | Enquiries citing a brand |
| 3 | Category page impressions | Visit bookings |
| 4 | Guide sessions, internal clicks to brand pages | Assisted conversions |

Watch for: thin-content warnings, keyword cannibalisation between brand and
category pages, and brand pages that never get crawled (orphan check).
