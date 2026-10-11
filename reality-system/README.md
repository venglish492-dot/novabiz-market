# REALITY SYSTEM

*Your life. Your quests. Your evolution.*

REALITY SYSTEM is a private RPG-style productivity app with an anime-inspired look. It runs only on your own computer:

- **Local only.** There are no accounts and no cloud. It has no analytics or tracking and never contacts a remote server.
- **Your data stays in your browser.** Everything is stored in your browser's local database (IndexedDB) on this computer.
- **Works offline.** After the one-time setup, the app runs without an internet connection.

---

## 1. What you need

| | |
|---|---|
| Computer | Windows 10 or 11 (macOS and Linux also work using the commands in section 9) |
| Node.js | Version 20.19 or newer. Install the **LTS** version from <https://nodejs.org> with the default options. |
| Browser | Chrome or Edge recommended (Firefox works too) |
| Internet | Needed **once**, for the first start (to download dependencies). After that it is not needed. |

## 2. Getting the files onto your computer

You only need to do this once.

1. Download this project folder.
   - On GitHub: open the branch, click **Code → Download ZIP**, then unzip it.
   - Or use `git clone`.
2. Move the `reality-system` folder somewhere permanent, for example `C:\Users\<you>\Apps\reality-system`.
   - Avoid temporary folders such as `Downloads`.

Once the files are on your computer, the app does not need GitHub or any other online service.

## 3. First start

Double-click **`Start REALITY SYSTEM.bat`** inside the `reality-system` folder. The launcher will:

1. Check that Node.js is installed. If it isn't, it tells you exactly what to do.
2. Install the dependencies. **This is the only step that needs the internet**, and it takes a few minutes.
3. Build the app.
4. Start a small local server and open **<http://localhost:4747>** in your default browser.

Windows may ask whether to allow Node.js through the firewall. The server only listens on your own computer (`localhost`), so you can choose **Cancel / Don't allow** for public and private networks and the app still works.

On the first launch you'll see a short activation sequence (you can skip it), followed by a setup wizard. Every step of the wizard can be skipped or changed later.

## 4. Opening it every day

1. Double-click **`Start REALITY SYSTEM.bat`**.
   - If the app is already running, the launcher simply opens your browser.
2. Bookmark **<http://localhost:4747>** for convenience.

> **Always use the same address and the same browser.** Browser data belongs to one exact address (`http://localhost:4747`) in one browser profile.
>
> - `http://127.0.0.1:4747` counts as a different address.
> - A different browser has its own separate storage.
>
> Opening the app either way would show an empty system. Your data is not lost; it is waiting at the usual address.

**Optional: install as an app.** In Chrome or Edge, use the install icon in the address bar ("Install REALITY SYSTEM") to get a desktop window and a Start-menu icon. Installation behaviour depends on your browser.

## 5. Stopping the app

To stop the local server, do one of the following:

- Close the black launcher window.
- Press **Ctrl+C** in it.
- Double-click **`Stop REALITY SYSTEM.bat`**.

**Stopping the server does not delete anything.** Your progress lives in your browser, not in the server. Next time, start the launcher again.

An offline cache (a service worker) may let an already-open tab, or the installed app, keep working briefly after the server stops. Don't rely on that: start the launcher when you want to use the app.

## 6. Where your data is saved

- **Location:** your browser's IndexedDB storage for `http://localhost:4747`, inside your browser profile on this PC.
  - For example, Chrome uses `%LOCALAPPDATA%\Google\Chrome\User Data\Default\IndexedDB\http_localhost_4747.indexeddb.leveldb`.
  - Don't edit these files by hand.
- **What is saved:** profile, quests and every completed occurrence, the XP ledger, levels and ranks, attributes, goals and milestones, focus sessions, calendar events, reflections, achievements, skill-tree progress, rewards, notifications and all settings.
- **How data can be lost:** clearing your browser's history or *cookies and site data* (for all sites, or for localhost) deletes it. So do uninstalling the browser, resetting your Windows profile, or a disk failure.
- **It is private, not encrypted.** Anyone who can use your Windows account and browser profile could read it. The app never claims otherwise and stores no passwords (it has no accounts).

Go to **Settings → Data & backups** to see a count of stored records and whether the browser granted persistent storage.

## 7. Backups (please do this regularly)

**To export a backup:** go to **Settings → Data & backups → Export backup**.

- Your browser saves a versioned `.json` file to its downloads folder. Nothing is uploaded.
- Copy it somewhere safe, such as a USB stick or your own cloud folder, if you choose.

**To import a backup:** go to **Settings → Data & backups → Import backup…**. The file is checked and summarised before anything changes. Then you choose how to import it:

- **Merge** adds records you don't have yet. It keeps everything you already have.
- **Replace** restores exactly what is in the backup. A *recovery snapshot* of your current data is saved first, so you can undo it from **Recovery snapshots**.

Invalid or damaged files are rejected and nothing changes. A backup made by a newer app version is refused, with a message asking you to update first.

The app shows a gentle reminder when your last export is older than 7 days. You can change or disable this in Settings. **Backups are never automatic.** Only the files you export count as backups.

## 8. Updating the app later

1. Replace the `reality-system` folder's files with the new version.
   - Your progress is in the browser, not in this folder, so it is safe.
2. Double-click **`Rebuild REALITY SYSTEM.bat`**.
3. Start the app as usual.

The database upgrades itself step by step through versioned migrations. Updates never wipe it. Exporting a backup before an update is still a good habit.

## 9. Commands (for the curious)

Run these from inside the `reality-system` folder.

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (once) |
| `npm start` | Build, then serve at http://localhost:4747 and open the browser |
| `npm run dev` | Development server with live reload (same address and port) |
| `npm run build` | Production build into `dist/` |
| `npm test` | Unit and component tests (Vitest) |
| `npm run test:e2e` | Browser end-to-end tests (Playwright). Run `npx playwright install chromium` once first. |
| `npm run lint` / `npm run typecheck` | Code checks |
| `npm run verify` | Typecheck, lint, unit tests and build in one go |

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| "Node.js was not found" | Install the LTS version from nodejs.org, then reopen the launcher. |
| "Port 4747 is already in use" | Another copy may be running. Use `Stop REALITY SYSTEM.bat`, or close the other program using that port. |
| My progress is gone! | Check the address is exactly `http://localhost:4747` and you're in the same browser and profile as before. If you cleared browsing data, import your latest backup. |
| Blank page after updating files | Run `Rebuild REALITY SYSTEM.bat`. |
| The 3D scene doesn't appear | Your browser or graphics driver may not support WebGL. The app automatically uses 2D emblems instead. You can also turn 3D off in **Customization → Motion & 3D**. |
| Too much animation | Go to **Customization → Motion & 3D** and choose **Minimal**, or set *Reduced motion* to *Always reduce*. |
| "Local storage unavailable" | Don't use a private or incognito window, and allow site data for localhost. |

---

## How it works

### Progression rules (all editable in Settings → Game rules)

- **XP and levels.** Quests award XP by difficulty (Easy 10, Normal 20, Challenging 35, Hard 50, Epic 80).
  - Rewards are clamped per quest, and a daily cap (1,500 XP from quests) prevents accidental inflation.
  - The XP needed to go from level *L* to *L+1* is `round(100 × L^1.15)`.
- **The ledger is the source of truth.** Every XP change is an append-only ledger entry.
  - Undoing a completion adds a *reversal* entry instead of erasing history.
  - Level, rank and attributes are always recalculated from the ledger.
  - Changing the rules affects future rewards only.
- **Completions count exactly once.** Each quest occurrence has one deterministic ID, and saving happens in a single database transaction. Double-clicks, repeated requests and reloads can't award XP twice.
- **Ranks.** The default ranks are E (from level 1), D (5), C (10), B (20), A (32) and S (45). Ranks are bigger milestones than levels.
- **Attributes.** A quest's XP is added to its attribute. Recurring quests and routines also give 25% of their XP to Discipline. Completed focus sessions grow Focus.
  - Attributes never decrease for taking breaks.
  - They are gamified scores, not scientific measurements.
- **Focus sessions.** A finished session of at least 10 minutes earns 1 XP per minute, up to 90 XP. Cancelled sessions earn nothing. The timer can't verify that you actually stayed focused.
- **Recurring quests.** Each day (or week) is a separate occurrence. Completing today's occurrence never completes future ones. Missed days are never penalised.

### Architecture

| Area | Location |
|---|---|
| Data model & validation | `src/domain/` (Zod schemas, from which the types are generated) |
| Local database & migrations | `src/db/` (Dexie / IndexedDB) |
| Game rules, levels, ranks, achievements, skill tree, progression engine | `src/game/` |
| Quests, recurrence, goals, focus timer, planner | `src/quests/`, `src/goals/`, `src/focus/`, `src/planner/` |
| Backup & restore | `src/backup/` |
| Themes & motion tokens | `src/theme/`, `src/motion/` |
| 3D scenes (React Three Fiber, lazy-loaded, with 2D fallbacks) | `src/three/` |
| Procedural animated backgrounds (Canvas 2D) | `src/background/` |
| UI components & screens | `src/components/`, `src/views/` |
| Tests | `src/**/*.test.ts(x)` and `tests/e2e/` |

**Privacy safeguards in the build.** The production build sets a Content-Security-Policy that only allows the app's own files. Fonts are bundled, sounds are generated on your device, and there are no remote assets.

The daily planner is a set of transparent local rules. It is **not AI**.
