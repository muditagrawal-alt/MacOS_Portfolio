# macOS Portfolio — Build Roadmap

Living reference for the build. **One feature at a time**, each landed without
breaking what already works.

Legend: ✅ done · 🔨 in progress · ⬜ queued · 💭 needs a decision

---

## Ground rules

1. **Never regress a shipped feature.** Every change ends with the full
   syntax + console + visual check.
2. **One render path per concept.** Duplicated paths are why Quick Look
   zoomed in one place and not another. Search for an existing
   implementation before adding a second.
3. **No `requestAnimationFrame` for anything that must happen.** It is
   suspended in background tabs. Use a forced reflow (`void el.offsetWidth`).
   This has bitten us twice (hello stroke, progress bar).
4. **Verify in a fresh tab.** `sessionStorage` persists across reloads in the
   same tab and will silently skip boot/lock, making tests lie.
5. **The test browser is not the user's browser.** Autoplay is permitted in
   the automation pane and blocked in real Chrome. Never conclude "audio
   works" from the pane alone.
6. **No secrets client-side.** Keys go in a serverless function (`api/`).

---

## Foundation (shipped)

| Area | Status | Notes |
| --- | --- | --- |
| Window manager | ✅ | drag, clamp, focus states, cascade, maximise, z-order |
| Menu bar | ✅ | per-app menus, switches with frontmost window |
| Dock | ✅ | magnification + neighbour falloff, running dots |
| Spotlight (⌘K) | ✅ | apps + corpus + files + inline math |
| Launchpad (⌥L) | ✅ | grid, search, distinct per-app icons |
| Context menus | ✅ | desktop / icon / window / dock / Finder row |
| Boot animation | ✅ | name + bar, Apple cursive `hello` stroke |
| Lock screen | ✅ | swipe-to-unlock, live weather, battery, date |
| Quick Look | ✅ | Space in Finder + desktop, content zoom, replace-on-open |
| Finder | ✅ | icons/list/columns, sidebar, Network → socials |
| Notification Centre | ✅ | **live** GitHub feed, no backend needed |
| Security | ✅ | XSS sinks escaped, no client-side keys |

---

## In flight

### 🔨 1. Startup chime — single guaranteed path
**Problem:** two code paths (autoplay probe vs power gate) meant two ways to
fail, and boot was skipped entirely on refresh so the chime played only once
per tab session.
**Decision:** one path only — always show the power-on gate. The click is a
real user gesture, which is the *only* thing guaranteed to unlock audio in
every browser. Chime and progress bar start together and finish together.

### ⬜ 2. Control Centre
Menu-bar toggle opening the panel: Wi-Fi, Bluetooth, AirDrop, Focus,
Display + Sound + Keyboard sliders, Now Playing, screen-mirroring, plus
**Edit Controls** so the visitor can add/remove tiles. Sliders must do
something real (Sound → Music volume, Display → wallpaper brightness).

### ⬜ 3. Drag & drop
- Dock: reorder by dragging; resets on refresh.
- Finder → Desktop / Dock / Trash: drag any file or folder.
- Shared HTML5 drag layer so both use one implementation.

---

## App reworks

### ⬜ 4. Music — real playback
Local audio files, real `<audio>` engine, queue, seek, artwork, and a
Now Playing tile wired into Control Centre.
*Needs from you:* the audio files (MP3) + artwork.

### ⬜ 5. Notes — rework
Current inline editing is half-broken. Rebuild: working folders, search,
pinned notes, checklists, persistence via `localStorage`.

### ⬜ 6. Mail — rework
Threaded reading, working compose with attachment previews, VIP/flags,
proper empty states, and a send path that actually reports success/failure.

### ⬜ 7. Maps
💭 *Suggestion:* not a Google Maps clone. A "Places I've been / worked"
map — naval bases, IILM, internship locations — rendered from a static
vector map with pins that open a card. No API key, no tracking, and it
tells a story instead of duplicating a service.

### ⬜ 8. Iris — scaled-down Siri
Understand and answer queries about **you and this site only**. Hard
guardrail: politely refuse everything else. Local intent matching over
`PORTFOLIO_CORPUS`, optional hosted model via `api/iris.js`, Siri-style orb
and waveform.

### ⬜ 9. App Store — fix
Broken filters/detail views. Each project gets a real product page:
screenshots, version history, "what's new", tech stack, Install → GitHub.

### ⬜ 10. Photos — fix
Currently shows wallpapers, which it shouldn't. Restrict to certificates +
real work screenshots; drop the Wallpapers album.

### ⬜ 11. Applications folder
Finder location listing every app, launchable, matching Launchpad's set.

### ⬜ 12. Arcade — mini games
Snake, Breakout, Pac-Man, Tetris, Donkey Kong. Canvas-based, keyboard +
touch, high scores in `localStorage`. Ship **one at a time**, Snake first.

### ⬜ 13. Trash — real behaviour
Drag to delete; item disappears for the visitor, then **quietly restores
after 5–10s**. Nothing is ever really destroyed; full reset on refresh.

### ⬜ 14. AirDrop
💭 *Suggestion:* the share sheet for the portfolio. "AirDrop" the résumé
(downloads the PDF), a vCard contact, or a link to this site with a QR
code — the receiving-device animation makes it feel native.

### ⬜ 15. YouTube clone
Project demo videos.
💭 *Channel sync:* YouTube Data API v3 needs a key → must go through
`api/` (same pattern as `api/feeds.js`). Free quota 10k units/day; a
channel-uploads query costs ~3 units, so this is comfortably free. A
channel's uploads playlist is also available as RSS with **no key at all** —
`https://www.youtube.com/feeds/videos.xml?channel_id=…` — which our existing
RSS proxy can already read. Recommend RSS first.

---

## Later

### ⬜ 16. iOS version
Device detection on the same URL → phone gets iOS, laptop/tablet gets macOS.
Springboard home screen, app grid, swipe gestures, iOS status bar, Control
Centre pull-down. Reuse the data layer (`js/data/*`) untouched; only the
shell differs.

---

## Decisions log

- **Weather:** Open-Meteo, not OpenWeatherMap — no API key, so nothing
  secret ships to the browser. Location from browser timezone first, IP
  lookup only to refine the city name.
- **LinkedIn feed:** not possible. No public API without Partner approval;
  we link to the profile instead of faking posts.
- **GitHub feed:** direct from the browser. CORS-enabled, keyless,
  60 req/hr per visitor — no backend on the critical path.
- **Boot chime:** always gated behind a click. A user gesture is the only
  mechanism guaranteed to unlock audio in every browser.
