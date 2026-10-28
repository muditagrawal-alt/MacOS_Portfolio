# The info bank

Everything about the portfolio's owner lives in one file, `js/data/profile.js`: name, photo, experience, projects, résumé, links. Both versions of the site, the Mac and the iPhone, read it, along with Finder, Spotlight, Terminal, Iris and every other app. Nothing personal is written anywhere else.

There are three ways to change it:

- **The admin.** Run `npm run admin` once the portfolio is yours. It's the questionnaire starting from what's live, with **Publish** to commit and push the changes. It only ever runs on your computer.
- **The questionnaire.** Run `npm run setup` (or `npm start` the first time). It edits a draft with a live preview, then writes the info bank, your files and everything generated from them.
- **By hand.** Edit `js/data/profile.js`, then run `npm run refresh` to regenerate the page titles, link previews and Home Screen name. Run `npm test` to check the result.

Only `name` is required. Leave anything else out and that part of the site simply doesn't appear.

## Editing by hand

The file is JSON inside `window.PROFILE_DATA = …;`. Keep it valid JSON: the questionnaire re-saves it in the same format, and `npm test` checks that it can. Paths are relative to the repository root; put your own files in `assets/me/`.

## Fields

### You

| Field | Example | Shown in |
| --- | --- | --- |
| `name` | `"Your Name"` | Everywhere: menu bar, About window, Lock Screen, Terminal, Iris |
| `pronouns` | `"she"`, `"he"` or `"they"` | How Iris and the site's copy refer to you |
| `role` | `"Software Engineer"` | About window, iPhone widgets, Iris |
| `tagline` | `"Software Engineer & Designer"` | Under your name; link previews |
| `bio` | Two or three sentences | About window; Iris's answer to "who is …?" |
| `focus` | `"Distributed systems"` | About This Mac; Terminal's `curl me` |
| `location` | `"London, UK"` | About This Mac ("Based in") |
| `lookingFor` | `"backend roles"` | Mail's first message: "I'm looking for …" |
| `photo` | `"assets/me/photo.jpg"` | About window, Launchpad, notifications. Your initials if empty |
| `handle` | `"yourname"` | Terminal prompt (`yourname@macbook`), `curl yourname.dev`. Defaults to your name |
| `values` | `["Ship small, measure, repeat"]` | Terminal: `cat philosophy.txt` |

### `contact`

| Field | Example | Notes |
| --- | --- | --- |
| `email` | `"you@example.com"` | Mail, the contact card, Iris |
| `phone` | `"+1 555 0100"` | Optional |
| `linkedin` | `"https://www.linkedin.com/in/you"` | A full URL |
| `github` | `"https://github.com/you"` | A full URL. Powers the GitHub widgets on both versions |

### `socials`

Any other profiles, as `[{ "network", "url", "handle", "blurb" }]`. `network` is one of `github`, `linkedin`, `huggingface`, `medium`, `substack`, `x`, `instagram`, `leetcode`, `youtube`, `kaggle`, `stackoverflow`, `dribbble`, `behance`, `mastodon`, `bluesky` or `website`; anything else is shown as a website. When `api/feeds.js` is deployed, Medium and Substack also feed the site's latest writing.

### `experience`

Newest first, as `[{ "role", "org", "dates", "bullets": [], "place" }]`. The first entry is what you're doing now: it's the green pill in the About window and Iris's "right now …". If every role contains "Intern", the About window counts internships instead of roles.

### `education`

```json
{
  "degree": "B.Sc. Computer Science",
  "university": "University of Somewhere",
  "years": "2021 – 2025",
  "grade": "3.8",
  "gradeLabel": "GPA",
  "schooling": [{ "title": "High School Diploma", "school": "Central High School", "year": "2021", "score": "92%" }]
}
```

Add `"place"` to the degree and to each school to pin them on the map (see [Places](#places)). `gradeLabel` is whatever your grade is called: GPA, CGPA, Class, Grade. Without a grade, the About window shows your skill count instead.

### `courses` and `certificates`

- `courses`: `[{ "title", "issuer", "year", "detail" }]`.
- `certificates`: `[{ "title", "issuer", "image", "file" }]`. `image` is a thumbnail (JPG or PNG) and `file` the original (PDF or image). They fill the Photos app on both versions.

### `projects`

| Field | Notes |
| --- | --- |
| `name` | Required |
| `title` | A longer name for the App Store page heading. Defaults to `name` |
| `subtitle` | One line under the name |
| `kind` | `"Web app"`, `"Library"`, `"Research"`… |
| `description` | The App Store page and Iris |
| `summary` | A short blurb for lists. Defaults to `description` |
| `highlights` | Bullet points |
| `tags` | `["Python", "FastAPI"]`: "Built with", search and categories |
| `link` | The live app, opened by the OPEN button. A GitHub link counts as source, not as live |
| `repo` | The repository |
| `date` | `"Mar 2025"` |
| `icon` | An image. The questionnaire draws one from the initials if you leave it empty |
| `category` | `ai`, `vision`, `web`, `mobile`, `data`, `systems`, `design`, `defense` or `games` (or a list). Guessed from the text otherwise |
| `featured` | `true` for the App Store's hero. Defaults to the first live project |
| `aliases` | Other names visitors might type, for Iris, Spotlight and Finder |
| `demo` | `{ "description", "requirements", "download", "stack" }`: adds an installer disk image to the Mac |
| `live` | Overrides whether the project counts as deployed |
| `video` | A demo video (YouTube link or a video file), played on the project's page |
| `embed` | Live apps open inside the iPhone version. Set `false` for a site that refuses to be embedded (it then opens in a browser tab), or give another address to embed, such as a Hugging Face Space's `https://<user>-<space>.hf.space` |

### `skills`

Groups, as `[{ "label": "Languages", "items": ["Python", "Go"] }]`.

### `writing`, `notes` and `cutIdeas`

- `writing`: `[{ "title", "topic", "summary", "url", "minutes" }]`. Safari's reading list and Iris.
- `notes`: `[{ "title", "folder", "body", "date" }]`. The Notes app on both versions. `body` understands `**bold**`, `*italic*`, `[links](https://…)`, `- ` lists, `> ` quotes and blank lines between paragraphs.
- `cutIdeas`: `[{ "name", "kind", "reason" }]`. The Trash: ideas you dropped, and why.

### `hackathons` and `events`

- `hackathons`: `[{ "name", "result", "date", "project", "place" }]`, for example `"result": "Top 25 finalist"`.
- `events`: `[{ "name", "date", "detail", "place" }]`: summits, expos and conferences you attended.

Both are pinned on the Maps app, and Iris can talk about them.

### Places

Anything with a `"place"` (a role, the degree, a school, a hackathon, an event) gets a pin on the iPhone version's Maps app:

```json
"place": { "name": "Venue or campus", "city": "City", "lat": 51.5007, "lng": -0.1246 }
```

Without `lat` and `lng` it's shown as text only. The questionnaire's **Pin it** button looks the place up with OpenStreetMap and fills them in.

### `resume`

`{ "file": "assets/me/resume.pdf", "preview": "assets/me/resume.png", "updated": "June 2025" }`. Used by the Preview window, the Résumé app and every download button. `preview` is an image of the first page and is optional.

### `site`

| Field | Notes |
| --- | --- |
| `url` | The published address, such as `https://you.github.io/MacOS_Portfolio/` or your own domain. Used for link previews, the canonical address and which sites may call Iris's endpoint. When it isn't on GitHub Pages, a copy that Pages still serves sends visitors here |
| `image` | The link-preview card, 1200 × 630. The questionnaire draws one from your name, photo and stats |
| `title`, `description` | Override the generated page title and description |

## What the setup writes

| File | What |
| --- | --- |
| `js/data/profile.js` | The info bank |
| `assets/me/` | Your photo, résumé, certificates, project icons and link-preview card |
| `index.html`, `ios.html` | The `<title>` and link-preview tags between the `profile:meta` markers |
| `manifest.webmanifest` | The Home Screen name |
| `api/_owner.js` | Who the serverless functions speak for |
| `js/config/config.js` | The contact-form key and Iris endpoint, if you gave them |
| `.portfolio/setup.json` | "Setup done", plus the previous info bank's unused files until you remove them. Git-ignored |

## Optional services

- **Contact form.** Mail sends visitors' messages to your inbox through [Web3Forms](https://web3forms.com), which is free and needs no backend. The access key goes in `js/config/config.js` (`WEB3FORMS_ACCESS_KEY`). It's public by design, because it can only send mail to you. Without a key, Mail offers visitors their own mail app.
- **Iris's hosted model.** Iris answers from the info bank on its own. Deploy `api/iris.js` (see `api/README.md`) and set `IRIS_ENDPOINT`, and it phrases its answers with a language model too.
- **Visitor analytics.** On Vercel, the site can count visits with [Vercel Web Analytics](https://vercel.com/docs/analytics): no cookies and nothing personal. Turn on **Visitor analytics** in **Site & services** (`VERCEL_ANALYTICS` in `js/config/config.js`), and Analytics for the project in Vercel (`vercel project web-analytics enable <project>`). It's never loaded locally or on GitHub Pages.

## Keeping it a template

`npm run test:template` fails if anything from the info bank (your name, email, handles, project names, employers) appears anywhere else in the code. That keeps your copy a clean template for whoever clones it next. If it flags an ordinary word, for example a surname that's also a CSS colour, add the word to `GENERIC` in `scripts/personal-tokens.js`.
