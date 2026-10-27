# 🍎 MacOS Portfolio

A fully interactive, MacOS-themed portfolio website built with vanilla HTML, CSS, and JavaScript. Experience a complete desktop environment in your browser, featuring draggable windows, a functional dock, terminal emulator, and authentic macOS design aesthetics.

![MacOS Portfolio](https://img.shields.io/badge/Status-Live-success?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![HTML](https://img.shields.io/badge/HTML-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

## 📱 One link, two experiences

The same URL opens the right portfolio for the device:

| Device | Opens | What it is |
| --- | --- | --- |
| Laptop / desktop | `index.html` | The macOS desktop: Finder, Terminal, Safari, Music, games, Iris |
| iPhone / Android phone | `ios.html` | An iPhone: Lock Screen, Home Screen with live widgets, and 12 apps |
| iPad / tablet | `ios.html` | The same apps in an iPad layout |

`js/router.js` runs first in both pages, before anything paints, and decides by how the device is *used*: touch-first phones and tablets (including iPadOS, which reports itself as a Mac) get the iPhone version, while a narrow desktop window or a touchscreen laptop stays on the Mac. Visitors can switch either way, and the choice is remembered:

- **Mac → iPhone:** Apple menu ▸ *View iPhone Version*. On a computer the phone is drawn as a framed device, with *Back to the Mac version* underneath.
- **iPhone → Mac:** Settings ▸ *View Mac Version*.
- **For a link:** `?view=ios` or `?view=mac` forces a version for that visit only, and is removed from the address bar.

Both versions read the same data (`js/data/*`), use the same services (`js/shared/*`), and run the same Iris engine (`js/apps/iris-brain.js`), so a change to a project or the résumé shows up in both.

### The iPhone version

- **Navigation that feels native:** every page is a History API entry (`#/app/path`), so the phone's own back swipe and Android's Back button work, deep links open the right page, and Back walks up the app. Apps zoom out of their icons; the home bar (tap or drag up) goes home.
- **Messages is Iris:** answers come from the portfolio, each with source chips that open the app the answer came from.
- **Apps:** About (contact card, experience, education, skills), Projects (App Store product pages), Résumé, Photos (certificates), Notes (shared with the Mac's Notes in the same browser, plus *Recently Deleted* post-mortems), Mail (sends to Mudit), Safari (start page and portfolio search), Music (recordings, radio, and generative tracks synthesised in the browser), Weather, Calculator and Settings (light/dark, wallpaper, haptics).
- **Installable:** Add to Home Screen gives a full-screen app with its own icon.

## 📸 Screenshot

<div align="center">

![The desktop, with the About Mudit window](assets/og-image.jpg)

*First run: the About Mudit window, live widgets and the desktop files*

</div>

## ✨ Features

### 🖥️ Complete Desktop Experience
- **MacOS Menu Bar** - Fully functional top menu bar with Apple menu, Finder, View, Go, Window, and Help menus
- **Desktop Icons** - Double-click to open folders (About, Experience, Education, Projects, Skills, Contact)
- **Draggable Windows** - Click and drag windows anywhere on the desktop
- **Window Controls** - macOS-style traffic lights (close, minimize, maximize)
- **Dock** - Animated dock at the bottom with app icons and tooltips
- **Live Clock** - Real-time clock display in the menu bar
- **Battery Status** - Live battery indicator with charge level and charging status
- **Wi-Fi Indicator** - Connection status display

### 📁 Interactive Windows
Each window features:
- Sidebar navigation for quick access to all sections
- Smooth animations and transitions
- Authentic macOS window styling
- Content-specific layouts (grid, list, card views)

### 💼 Portfolio Sections

#### About Me
Personal introduction and professional overview

#### Experience
- **AI/ML Intern** - Carnot Research Pvt. Ltd. (IITD-incubated startup) (June 2026 – Present)
- **Machine Learning Intern** - Zee Tech and Innovation Centre (Dec 2025 – Jan 2026)
- **Summer Intern** - WESEE, Indian Navy (June 2025 – July 2025)

#### Education
- B.Tech in Computer Science (AI/ML) - IILM University (2023 – 2027) [CGPA: 7.68]
- Class 12 - Navy Children School, New Delhi (2023)
- Class 10 - Navy Children School, Mumbai (2021)

#### Projects
8 featured projects with live GitHub links:
- **OmniDoc** - RAG-based document intelligence system
- **Sliver.Ai** - Smart video clipping tool
- **S.W.O.R.D** - Real-time weapon detection system
- **Deepfake Detector** - ML-based deepfake and fake news detection
- **Helix-Compiler** - C-based compiler project
- **Multiva.Ai** - Multilingual AI voice cloning platform
- **Inflx** - AutoStream agent service
- **Artifex** - Creative AI project

#### Skills
Comprehensive tech stack including:
- **Languages**: Python, C, Java, HTML, CSS, Tailwind CSS
- **Frameworks**: PyTorch, TensorFlow, Keras, OpenCV, Flask, Gradio, Streamlit
- **Models**: YOLOv8/11/26, Whisper, XTTS, BLIP, Mistral 7B, FB-NLLB, Wav2Lip
- **Tools**: Git, GitHub, Hugging Face, Jupyter, FFMPEG

#### Contact
Direct links to:
- Email
- LinkedIn
- GitHub
- HuggingFace
- Blog
- Phone

### 🖨️ Resume Viewer
- PDF preview with embedded image
- One-click download button
- Full-screen viewing capability

### 💻 Terminal Emulator
Interactive terminal with custom commands:
- Navigate the portfolio
- Display system information
- Execute custom commands
- Authentic terminal styling

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server or build tools required - runs entirely client-side

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/muditagrawal-alt/MacOS_Portfolio.git
cd MacOS_Portfolio
```

2. **Open in browser**
```bash
# Option 1: Direct file open
open index.html

# Option 2: Use a local server (recommended)
python -m http.server 8000
# Then visit http://localhost:8000
```

3. **That's it!** No build process, dependencies, or configuration needed.

## 📂 Project Structure

See [Architecture](#architecture) below for a file-by-file map.

## 🎨 Customization

### Updating Content

Everything visitors read comes from a few data files, so one edit updates every app (Finder, Spotlight, Iris, Terminal, the About window):

1. **Profile, experience, education, contact, skills**: `js/data/profile.js`
2. **Projects**: the `proj-*` entries in `js/data/filesystem.js` and `js/data/corpus.js` (the App Store and Iris are built from these)
3. **Desktop files, Photos certificates, Trash post-mortems**: `js/data/desktop-files.js`
4. **Résumé**: replace `assets/MuditAgrawalResumeAugust2026.pdf` and its preview PNG

### Styling

- **Colours & motion tokens**: `css/variables.css` (the accent colour is `--accent`; System Settings can change it live)
- **Fonts**: the system font (San Francisco on Apple devices) is first in `--font-ui` in `css/base.css`; Inter is the fallback elsewhere

### Terminal Commands

Add a `case` to the `switch (cmd)` in `js/apps/terminal.js`, and list it in `TERMINAL_COMMANDS` for Tab completion.

## 🌐 Deployment

### GitHub Pages

1. Go to repository Settings
2. Navigate to Pages section
3. Select main branch as source
4. Your site will be live at `https://yourusername.github.io/MacOS_Portfolio`

### Netlify / Vercel

1. Connect your GitHub repository
2. Deploy with default settings (no build command needed)
3. Custom domain supported

### Manual Hosting

Upload all files to any static hosting service (AWS S3, Firebase Hosting, etc.)

## 🔧 Technical Details

### Pure Vanilla Stack
- **No frameworks** - Built entirely with vanilla HTML, CSS, and JavaScript
- **No dependencies** - Runs without npm, webpack, or build tools
- **No backend** - Fully static, client-side only
- **Lightweight** - Fast load times, minimal resource usage

### Browser Compatibility
- ✅ Chrome/Edge (90+)
- ✅ Firefox (88+)
- ✅ Safari (14+)
- ✅ Mobile browsers (responsive design)

### Features Implementation
- **Drag & Drop**: Custom JavaScript drag handlers
- **Window Management**: Z-index stacking and position tracking
- **Battery API**: Navigator Battery Status API
- **Responsive**: CSS media queries for mobile adaptation
- **Animations**: CSS transitions and transforms

## 📱 Mobile Responsiveness

Phones and tablets get the iPhone version (above). If a visitor chooses the Mac version on a phone, or narrows a desktop window, `css/responsive.css` adapts it:
- Windows become full-width sheets between the menu bar and the Dock
- Finder, Settings, Music and App Store sidebars become swipeable pill strips
- Mail and Notes push from the list to the detail, with a Back button
- The Dock keeps the essential apps; everything else is one tap away in Launchpad

## 🤝 Contributing

Contributions are welcome! If you'd like to improve this project:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Design inspired by macOS Big Sur/Monterey
- Icons from [Font Awesome](https://fontawesome.com/)
- Fonts from [Google Fonts](https://fonts.google.com/)

## 📧 Contact

**Mudit Agrawal**

- Email: muditagrawal03@gmail.com
- LinkedIn: [Mudit Agrawal](https://www.linkedin.com/in/mudit-agrawal-167610318)
- GitHub: [@muditagrawal-alt](https://github.com/muditagrawal-alt)
- HuggingFace: [muditagrawal03](https://huggingface.co/muditagrawal03)
- Substack: [standardissuemudit](https://substack.com/@standardissuemudit)
- Medium: [@muditagrawal03](https://medium.com/@muditagrawal03)
- X (Twitter): [@muditag52751860](https://x.com/muditag52751860)
- LeetCode: [muditagrawal03](https://leetcode.com/u/muditagrawal03/)

---

⭐ **Star this repository** if you found it helpful or interesting!

## Architecture

```
index.html              markup for the desktop, dock, menu bar and every app window
ios.html                the iPhone / iPad version
manifest.webmanifest    Add to Home Screen
css/
  variables.css         design tokens
  base.css              reset, desktop canvas, wallpaper
  menu-bar.css          menu bar + dynamic per-app menus
  dock.css              dock, magnification, running indicators
  window.css            window chrome, focus states, traffic lights
  context-menu.css      right-click menus + ⌥Tab switcher
  spotlight.css         ⌘K search panel
  quick-look.css        Space-bar preview overlay
  boot.css              startup animation
  system-ui.css         notification banners, brightness veil, window motion, Frosted Glass
  responsive.css        must load LAST — its media queries override the rest
  apps/*.css            one file per application
js/
  router.js             device router — loaded first by both pages
  data/profile.js       single source of truth for name, education, contact
  data/corpus.js        ONE search index, shared by Safari, Spotlight and Iris
  data/filesystem.js    Finder's folders and files (projects, skills, education, socials)
  data/desktop-files.js desktop files, Photos certificates, Trash post-mortems
  data/notes.js         Notes content
  data/music.js         music catalogue + radio fallbacks
  shared/live-data.js   live weather and GitHub activity, cached
  shared/contact-form.js  the one contact-form send path, vCard + share helpers
  shared/generative-audio.js  Web Audio engine for Music's generative tracks
  ios/system.js         iPhone shell: navigation, Lock & Home Screens, widgets, Search
  ios/apps/*.js         one file per iPhone app (+ css/ios/apps/*.css)
  config/config.js      runtime config — contains no secrets
  core/utils.js         escapeHtml / safeUrl / openExternal, math parser
  core/window-manager.js  open, close, focus, drag, clamp, cascade, maximize
  core/keyboard.js      global shortcuts (⌘K, ⌥-window commands) + ⌥Tab app switcher
  core/spotlight.js     ⌘K search + quick actions
  core/context-menu.js  right-click menus per surface
  core/menu-bar.js      clock + per-application menu definitions
  core/boot-animation.js  startup sequence (skippable, honours reduced-motion)
  core/quick-look.js    Space-bar previews
  core/system-status.js Wi-Fi + battery indicators
  core/control-center.js  Control Centre (brightness veil, volume, Now Playing)
  core/desktop-widgets.js live clock, weather and GitHub widgets
  apps/welcome.js       "About Mudit" first-run window
  apps/iris-brain.js    Iris's in-browser RAG: BM25 retrieval + cited answers
  apps/*.js             one controller per application
scripts/                CI gates 1–4 (see Testing)
api/iris.js             serverless model proxy — keeps the API key server-side
```

### Conventions

**Stylesheets are linked individually from `index.html`, never `@import`ed.**
`@import` forces a serial waterfall and previously caused four sheets to load
twice. `responsive.css` must stay last.

**Everything user-supplied is escaped before it reaches `innerHTML`.**
Use `escapeHtml()` for text, `escapeAttr()` inside inline handlers, and
`safeUrl()` / `openExternal()` for anything that becomes an `href`.

**There is one search corpus.** `window.PORTFOLIO_CORPUS` in
`js/data/corpus.js` backs Safari's "From this portfolio" results, Spotlight,
and Iris's offline answers. Add content there once, not in three places.

**No API keys in client code.** `js/config/config.js` is safe to commit.
Model access goes through `api/iris.js`; see `api/README.md`.

### Keyboard shortcuts

Every shortcut below reaches the page. Browsers and macOS reserve ⌘W, ⌘Q, ⌘N, ⌘T, ⌘M, ⌘Space and ⌘Tab
before a website ever sees them (⌘W would close your tab), so window commands use ⌥ instead. Press `?` on the desktop for this list.

| Shortcut | Action |
| --- | --- |
| `⌘K` | Spotlight — search everything |
| `⌥L` | Launchpad |
| `F3` | Mission Control |
| `⌥Tab` | Switch between running apps |
| `⌥W` | Close the frontmost window |
| `⌥M` | Minimise |
| `⌥N` | New Finder window / Note / Message (depending on the app) |
| `⌥T` | New Safari tab |
| `⌥,` | System Settings |
| `⌥1` `⌥2` `⌥3` | Finder: icons / list / columns |
| `⌘[` `⌘]` | Back / Forward in Finder and Safari |
| `⌘F` | Focus the frontmost app's search field |
| `⌘L` / `⌘R` | Safari: address bar / reload the page |
| `⌃L` | Clear the Terminal |
| `⌃⌥Q` | Lock Screen |
| `Space` | Quick Look the selection (arrow keys step through desktop files) |
| `↑` `↓` / `Tab` | Terminal history / completion |

## Testing

```bash
npm install
npx playwright install chromium   # once, for the browser suite
npm run test:all
```

| Gate | Command | What it checks |
| --- | --- | --- |
| 1 | `npm run test:syntax` | Every JS file parses |
| 2 | `npm run test:assets` | Every asset referenced from both pages, the manifest **and** JS exists |
| 3 | `npm run test:components` | Behaviour in jsdom, plus wiring integrity: every inline handler and menu command calls a real function, every linked Settings pane / Finder location exists |
| 4 | `npm run test:e2e` | Real Chromium: every Dock app, traffic lights, lock screen, Quick Look, Spotlight, Mail/Safari XSS, camera release, keyboard shortcuts, Iris grounding; device routing (iPhone, iPadOS, overrides); every iPhone app's main flow, Back/deep links, and no sideways scrolling on iPhone and iPad (265 checks) |

The E2E suite answers GitHub, weather, Wikipedia and radio requests from fixtures and intercepts the contact form, so it is deterministic and never sends real email. `npm run test:e2e -- safari` runs only matching sections.
