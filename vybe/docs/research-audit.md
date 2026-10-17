# Competitor research audit: guns.lol (for VYBE)

Date: 2026-10-17. Purpose: a factual feature inventory of a link-in-bio / profile-page platform, used to scope
an ORIGINAL product (VYBE). Nothing here is copied code, assets or branding. Do not reuse guns.lol names, copy,
icons, badge art or layouts verbatim.

## Important limitation (read first)

**No guns.lol page could be opened directly in this session.** Every request to `guns.lol`, `help.guns.lol` and
`i.guns.lol` failed:

- WebFetch: `getaddrinfo ENOTFOUND guns.lol` / `ENOTFOUND help.guns.lol`.
- curl through the session's egress proxy: `CONNECT tunnel failed, response 403` (proxy reports
  `connect_rejected`, i.e. the host is not allowed for this session).
- Archive fallback (`web.archive.org`) is also blocked for WebFetch.

The findings below therefore come from three weaker sources. Each claim is tagged:

| Tag | Source | Reliability |
|-----|--------|-------------|
| **[S]** | Web-search index snippets of guns.lol / help.guns.lol pages (titles, URLs and summarized excerpts returned by WebSearch restricted to those domains) | Medium. These are excerpts, not full pages, and the summaries were model-generated. Wording and current state are unverified. |
| **[U]** | The 5 screenshots supplied by the user (described in the task, not viewed by this agent) | Medium-high for visuals, but only what is in frame. |
| **[I]** | Inference from the above or from general knowledge of the category | Low. Treat as a hypothesis. |

Nothing is marked "verified from a page", because no page was rendered or read in full.

## 1. Pages inspected

| URL | Status | Notes |
|-----|--------|-------|
| https://guns.lol/ | failed: DNS ENOTFOUND (WebFetch), proxy 403 (curl) | Search snippets only: "Claim Now" CTA, "link-in-bio", user count around 2.42-2.43M [S] |
| https://guns.lol/pricing | failed: same | Snippets: Premium 7,99 EUR lifetime; Custom Badge 8,99 EUR; Image Host 4,99 EUR; Verified 14,99 EUR [S] |
| https://guns.lol/compare | failed: same | Search title "guns.lol vs Linktree, Beacons & Carrd"; sub-page `/compare/carrd` exists [S] |
| https://guns.lol/leaderboard | failed: same | Changelog snippet: profile-views leaderboard, added 2026-03-15 [S] |
| https://help.guns.lol/ | failed: same | Title "How can we help you?"; guides, popular articles, changelog [S] |
| https://help.guns.lol/getting-started/customization | failed: same | Snippets: opacity, blur, glow, accent/background colors, swap box colors, username effects, background effects [S] |
| https://help.guns.lol/getting-started/premium | failed: same | Title "Explore guns.lol Premium" [S] |
| https://help.guns.lol/premium-guides/layout-settings | failed: same | Snippets: Default / Modern / Simplistic / Sleek layouts [S] |
| https://help.guns.lol/premium-guides/cursor-profile-effects | failed: same | Snippets: cursor effects (some recolorable), profile animations [S] |
| https://help.guns.lol/general/profile-analytics | failed: same | Snippets: analytics for all users; views, clicks, click rate, devices, top socials [S] |
| https://help.guns.lol/how-to-guides/assets | failed: same | Snippets: background, avatar, cursor, banner, font and badge uploads; size limits [S] |
| https://help.guns.lol/how-to-guides/profile-audio | failed: same | Snippets: Audio Manager, .mp3/.aac, 10MB, player widget toggle [S] |
| https://help.guns.lol/how-to-guides/image-host | failed: same | Snippets: custom domains, DNS check, XShare (Android) config [S] |
| https://help.guns.lol/changelog | failed: same | Snippets: dated entries 2025-03 to 2026-08-18 [S] |
| https://help.guns.lol/how-to-guides/discord (discovered) | failed: proxy 403 | Snippets: "Connect Discord" on account page, presence toggle [S] |
| https://help.guns.lol/how-to-guides/profile-badges (discovered) | failed: not fetched (host blocked) | Snippets: Premium, Server Booster, Helper badges [S] |
| https://help.guns.lol/premium-guides/metadata (discovered) | failed: proxy 403 | Snippets: favicon, title, embed image, search preview [S] |
| https://help.guns.lol/premium-guides/second-tab (discovered) | failed: not fetched (host blocked) | Snippets: second tab with widgets, Modern layout only [S] |
| https://help.guns.lol/how-to-guides/all-guides, /premium-guides/all-guides, /getting-started/introduction, /getting-started/share-profile (discovered) | failed: not fetched (host blocked) | Index titles only, plus "copy URL or QR code" for share-profile [S] |
| https://guns.lol/guns.lol (example profile, discovered) | failed: proxy 403 | Index title "@guns.lol" only |
| https://i.guns.lol/ (image host, discovered) | failed: proxy 403 | - |
| https://web.archive.org/web/2025/https://guns.lol/pricing | failed: WebFetch refuses this domain | - |

No public example profile could be opened. Search-index titles show that profile pages use the title format
`@<display name>` and that some reserved-looking paths (`/docs`, `/documentation`, `/shop`) are ordinary user
profiles, one showing "User Not found" [S].

## 2. Observed interaction patterns

Not observed directly. What the snippets and screenshots suggest:

**Marketing site**
- Landing page with a username-claim CTA ("Claim Now") and a large user-count social proof figure [S].
- Positions itself as a faster and more aesthetic alternative to Linktree, with comparison pages per competitor
  (`/compare`, `/compare/carrd`) [S].
- Pricing page with dark rounded cards: Free 0 EUR vs Premium 7.99 EUR lifetime, "Most Popular" tag, gift icon
  (gift purchase likely) [U]. Separate one-time add-ons: Custom Badge, Image Host, Verified [S].
- Public leaderboard of most-viewed profiles [S].

**Signup / claim flow**
- Claim a username on the landing page, then create the account [S]. Step-by-step flow not documented in the
  snippets. [I] Likely: enter handle, check availability, register, land in the dashboard.
- Dashboard areas named in help snippets: `/account` (Discord connect, share URL or QR code), `/customize`
  (general customization, assets, Audio Manager), `/premium` (layout choice, "Special Customization",
  "Profile Customization"), `/premium/layout` (per-layout settings), `/imagehost/setup` [S].

**Profile pages** (`guns.lol/<username>`)
- An enter/click-to-enter splash screen exists (changelog: "customizable page enter text"), which also gives
  the browser a user gesture to allow audio autoplay [S]/[I].
- Single centered card on a full-bleed image or video background [U].
- Below the card: numbered round buttons 1-5 (likely switches between multiple audio tracks) and a pill with a
  volume slider and an opacity/visibility slider [U].
- Optional bottom music player with artwork, time, progress and prev/pause/next controls [U].
- Particle overlays such as snow or floating dots [U].

## 3. Feature inventory

Gating key: **Free**, **Premium** (7.99 EUR lifetime), **Add-on** (separate one-time purchase), **?** (unknown).

### 3.1 Profile basics
| Feature | Gating | Evidence |
|---|---|---|
| Username URL `guns.lol/<name>` | Free | [S] |
| Avatar, display name, description/bio | Free | [S] [U] |
| Banner image (Default/Sleek layouts) | Premium (layout setting) | [S] |
| Location line in footer | ? | [U] (e) |
| Share profile via URL copy or QR code | Free | [S] |
| Enter screen with custom text | Premium? (changelog says customizable) | [S] |

### 3.2 Appearance
| Feature | Gating | Evidence |
|---|---|---|
| Accent/highlight color, text color, background color | Free | [S] |
| Profile box opacity | Free | [S] |
| Profile box blur (glass) | Free | [S] |
| Glow settings (text/icons) | Free | [S] |
| "Swap box colors" (accent used as widget background) | Free? | [S] |
| Profile gradients | Premium? | [I], gradients are commonly gated in this category |
| Border color / width / radius | Premium (layout settings) | [S]; colored borders seen in [U] (a) teal, (b) gold |
| Username effects (sparkle, rainbow and similar) | Premium | [S] |

### 3.3 Background
| Feature | Gating | Evidence |
|---|---|---|
| Background image | Free | [S] [U] |
| Background video (up to 100MB) | Free? | [S] (assets table) |
| Background effects (blur, particles, snow, etc.) | Free basic, Premium special | [S] "Basic Effects" on free; [U] (d) snow, (e) particles |

### 3.4 Audio
| Feature | Gating | Evidence |
|---|---|---|
| Upload audio (.mp3, .aac, max 10MB) via Audio Manager | Free | [S] |
| Multiple tracks with selector buttons | ? | [U] (a) buttons 1-5 [I] |
| Audio player widget (artwork, progress, controls) | ? (changelog 2025-03) | [S] [U] (d) |
| Volume slider on the profile | ? | [U] (a) |
| Click sounds | Premium | [S] changelog |

### 3.5 Cursor and profile effects
| Feature | Gating | Evidence |
|---|---|---|
| Custom cursor image upload | Free? | [S] (assets list includes cursors) |
| Cursor effects (trails etc., some recolorable) | Premium | [S] |
| Profile animations on load | Premium | [S] |
| Help note: effects need OS animation effects enabled | - | [S], meaning the site honors `prefers-reduced-motion` [I] |

### 3.6 Layouts (Premium)
| Layout | Options | Evidence |
|---|---|---|
| Default | Banner; border color, width, radius | [S] |
| Modern | Second-tab widgets; border settings | [S] |
| Simplistic | Buttons and icons; custom buttons; button settings | [S] |
| Sleek | Banner radius, avatar radius, border color/width | [S] |

### 3.7 Fonts
| Feature | Gating | Evidence |
|---|---|---|
| Preset text fonts | Premium | [S] |
| Upload own font | Premium | [S] (fonts in asset list) |
| Decorative fonts seen: blackletter username, pixel font, monospace bio | - | [U] (a), (e) |

### 3.8 Typewriter / description
| Feature | Gating | Evidence |
|---|---|---|
| Typewriter animation of description, typing and deletion speed | Premium | [S] (pricing lists "Typewriter Animation") |
| Multiple rotating description lines | ? | [I], implied by "deletion speed" |

### 3.9 Badges
| Feature | Gating | Evidence |
|---|---|---|
| Badge pill row on profile | Free (display) | [U] (a), (d), (e) |
| Premium badge | Premium | [S] |
| Server Booster, Helper and other Discord-role badges | Earned | [S] |
| Verified badge | Add-on 14.99 EUR | [S] |
| Custom badge (own icon) | Add-on 8.99 EUR | [S] |
| Show/hide or reorder badges | ? | [I] |

### 3.10 Social links
| Feature | Gating | Evidence |
|---|---|---|
| Icon links (Discord, GitHub, YouTube, TikTok, etc.) | Free | [U] (a) |
| Monochrome white glowing icons vs. colorful brand icons | Free? | [U] (a) vs (e) |
| Custom buttons (Simplistic layout) | Premium | [S] |

### 3.11 Widgets
| Feature | Gating | Evidence |
|---|---|---|
| Discord presence card (status, activity, avatar) | Free (needs Discord connect) | [S] [U] (d), (e) |
| Presence options: badges, guild/server tag, custom idle text (2025-11) | ? | [S] |
| Discord server invite card (online/member counts, Join) | Premium ("Profile Widgets") | [S] [U] (e) |
| Spotify track, YouTube channel, Telegram channel | Premium | [S] |
| Weather widget; choose which widget shows (2026-08-18) | ? | [S] |
| Speech-bubble status on avatar | ? | [U] (d) |

### 3.12 Tabs
| Feature | Gating | Evidence |
|---|---|---|
| Second tab holding widgets, Modern layout only | Premium | [S] |

### 3.13 SEO / metadata
| Feature | Gating | Evidence |
|---|---|---|
| Custom page title, favicon, embed (OG) image, search-preview mock | Premium | [S] |

### 3.14 Aliases
| Feature | Gating | Evidence |
|---|---|---|
| Alias usernames that redirect to the main profile (Alias Manager, 2026-03) | Free 1 slot; Premium 5 slots plus 1 credit | [S] |

### 3.15 Analytics
| Feature | Gating | Evidence |
|---|---|---|
| Public view counter on profile | Free | [U] (a), (d), (e) |
| Views, clicks, click rate | Free | [S] |
| Devices, most-clicked socials ("detailed analytics for all", 2025-04) | Free | [S] |
| No cookies for analytics (privacy policy) | - | [S] |
| Public leaderboard ranked by views | - | [S] |

### 3.16 Image host / media
| Feature | Gating | Evidence |
|---|---|---|
| Image host on `i.guns.lol` | Add-on 4.99 EUR | [S] |
| Custom domains (public/private, DNS check) | Add-on | [S] |
| Upload clients: XShare config (Android); old ShareX config deprecated; desktop screenshot app (Win/macOS/Linux) | Add-on | [S] |
| Built-in pastebin (2026-08-18) | ? | [S] |
| ToS: not a general CDN or backend for automated systems | - | [S] |
| Asset limits: images about 5-10MB, background video 100MB, audio 10MB | - | [S] |

### 3.17 Account / privacy
| Feature | Gating | Evidence |
|---|---|---|
| Discord account linking | Free | [S] |
| Templates with preview before apply (2025-03) | ? | [S] |
| Username reclaim/suspension for offensive or confusing names (ToS) | - | [S] |
| 2FA / account security settings | unknown, not found | [S] (absence) |
| Gift Premium | ? | [U] (c) gift icon [I] |

## 4. Visual-design observations

From snippets [S] and user screenshots [U]. No CSS was inspected.

- **Palette:** Near-black backgrounds. Marketing accent is purple (checkmarks, pill buttons) [U] (c). Profiles
  are user-themed: teal, gold or amber borders and glows [U].
- **Type:** Clean sans-serif on marketing pages [I]. Profiles use expressive display fonts: blackletter, pixel
  and monospace [U].
- **Cards:** Large radius, translucent black "glass" with backdrop blur and a 1-2px colored border, sometimes
  glowing [U].
- **Buttons:** Fully rounded pills (purple on marketing). Circular icon buttons for track selection [U].
- **Screenshot notes:**
  - (a) Blurred photo background. Black glass card with teal-ish border. Round avatar. Gothic blackletter
    username. Pill row of small badge icons. Typewriter monospace bio, then a divider. Centered white glowing
    social icons (Discord/GitHub/YouTube/TikTok). "Profile Views" eye counter bottom-left. Below the card:
    numbered round buttons 1-5, and a pill with a volume slider and an opacity/eye slider.
  - (b) Same profile with a cartoon background and a gold border. Shows that theme swaps keep the layout the same.
  - (c) Pricing: dark rounded cards, Free 0 EUR vs Premium 7.99 EUR lifetime, purple checkmarks, purple pill
    buttons, "Most Popular" tag, gift icon.
  - (d) Black minimal profile "sade". Speech-bubble status on the avatar, glowing username, badge pill,
    Discord-presence card, Spotify track card, view counter and a decorative curved line. Bottom music player
    with cross artwork, time, progress and prev/pause/next. Snow particles.
  - (e) Warm amber blurred profile "Aryan". Avatar wings decoration, pixel font, badge pill. Discord presence
    card with status, Discord server invite card (online/members/Join). Colorful glowing brand social icons.
    Footer with view count and location pin. Floating particles.
- **Avatar decorations** such as wings appear to be a distinct feature (frames/overlays) [U] (e).

## 5. Mobile and desktop observations

Inferred only [I]; no viewport testing was possible.
- The profile is a single centered column with a fixed max width (about 400-600px), so it adapts naturally
  to phones. Widgets stack vertically.
- Cursor effects and custom cursors are desktop-only by nature. On touch devices they should be off.
- Audio needs a user gesture on mobile, which explains the enter/click-to-enter screen.
- Full-screen video backgrounds cost a lot of data and battery on mobile, and 100MB uploads make this worse.
- The help-center note about OS animation settings suggests effects are suppressed under reduced-motion
  preferences.
- The desktop screenshot uploader and the Android XShare config show that the image host targets both platforms.

## 6. Features documented but not directly testable

- The whole dashboard is behind login: `/account`, `/customize`, `/premium`, `/premium/layout`,
  `/imagehost/setup`, the Alias Manager, Template preview, Audio Manager and the analytics views.
- Payment, gifting and add-on purchase flows.
- Discord OAuth linking and live presence updates.
- Image-host upload API, custom domain DNS verification, pastebin and the screenshot app.
- Leaderboard ranking method and how bot or duplicate views are filtered.
- Moderation and username reclaim processes.
- Actual rendering of every effect, font and layout. Even the public pages were unreachable from this session.

## 7. Proposed improvements for VYBE

Principles: every feature is free, privacy first, safe media, accessible by default.

1. **No paywalls.** Layouts, fonts, cursor and profile effects, typewriter, widgets, SEO metadata, aliases (with a
   reasonable anti-squatting cap), the second tab and analytics are all free. Fund the product with optional
   donations or cosmetic tips that unlock nothing functional.
2. **Original identity.** Use our own layout names, effect set, badge art and iconography. Do not use the
   "1-5 numbered buttons" UI; use a labeled track list instead.
3. **Privacy-conscious analytics.** Cookieless and aggregate only. Store no raw IPs (use a daily-rotating salted
   hash), and use a coarse country only. The public view counter is opt-in. Analytics export and deletion are
   available, and data retention is documented.
4. **Leaderboard as opt-in.** Profiles are excluded by default, and view counts are bot-filtered.
5. **Safe media hosting.** Check MIME types against magic bytes. Re-encode or strip EXIF/metadata on images.
   Cap sizes, with lower defaults than 100MB video. Scan for malware and CSAM using industry hash-matching
   services. Serve from a separate cookie-less domain with strict `Content-Type`, `nosniff` and CSP. Add
   report/takedown and DMCA flows, plus per-user quotas and rate limits.
6. **Accessibility.** WCAG 2.2 AA contrast checks in the editor, with a warning when text on glass or blur falls
   below 4.5:1. Social icons get accessible names. Everything works by keyboard with visible focus. Decorative
   fonts are paired with a readable fallback, and screen readers get plain text.
7. **Reduced motion.** Honor `prefers-reduced-motion`: disable particles, cursor trails, typewriter and video
   autoplay, and show static text. Visitors get a "Reduce effects" toggle on every profile. Cursor effects are
   off on touch devices.
8. **Audio etiquette.** No autoplay without a gesture. Visible mute and volume controls with labels. The
   visitor's volume preference is remembered per browser.
9. **Performance.** Poster images for video backgrounds, `preload="none"` audio, lazy widgets, and a data-saver
   mode that serves a static background on slow connections.
10. **Account security.** 2FA (TOTP plus passkeys), session list and revoke, and an email-verified claim flow.
    The username-reclaim policy is published.
11. **Widgets via official APIs.** Discord presence uses a bot or OAuth with explicit scopes. Spotify and YouTube
    use oEmbed or official embeds. No scraping.
12. **Templates and theme presets** come with live preview and one-click revert (version history).
13. **SEO/OG.** Auto-generated OG card per profile. Users can override it, and a `noindex` opt-out is available.

## 8. Feature checklist → implementation location

All features below are free for every account; there is no premium tier or locked control.
Paths are relative to `vybe/`.

| Feature | Status | Where |
| --- | --- | --- |
| Username claim with live availability, reserved routes | Done | `src/components/marketing/ClaimForm.tsx`, `src/app/api/username`, `src/features/profiles/username.ts` |
| Sign-up / sign-in / sign-out / reset / change password / delete account | Done (reset email needs Resend in prod) | `src/app/actions/auth.ts`, `src/app/(auth)/*`, `src/lib/auth/*` |
| Public profile at `/@username`, aliases → redirect | Done | `next.config.ts` rewrite, `src/app/u/[username]`, `profile_aliases` table |
| Draft editing, autosave, publish/unpublish, conflict detection | Done | `src/components/editor/EditorProvider.tsx`, `src/features/profiles/service.ts` |
| Undo/redo, reset section, live preview (desktop/tablet/phone) | Done | `EditorProvider.tsx`, `EditorShell.tsx` |
| Theme presets, save/duplicate/delete custom presets, import/export | Done | `src/components/editor/sections/ManageSections.tsx`, `theme_presets` table |
| 8 layouts (glass, minimal, creator, HUD, editorial, bento, tabs, terminal) | Done | `src/components/profile/layouts/*` |
| 8 scenes (forest, nebula, cyberpunk, obsidian, glacier, ocean, studio, particles) | Done (procedural) | `src/components/profile/scenes/*` |
| Image/video/gradient/solid backgrounds, overlay, blur, brightness, saturation, zoom, focus, tint | Done | `BackgroundStage.tsx`, `DesignSections.tsx` |
| Rain, fog, 7 particle kinds, vignette, grain, parallax, speed, disable-all | Done | `EffectsCanvas.tsx`, `BackgroundStage.tsx` |
| Visitor scene switcher (numbered buttons), volume & dim sliders | Done | `ProfileView.tsx` |
| Colours, gradients, card opacity/blur/width/radius/border/shadow/glow/padding/align/position | Done | `theme schema`, `AppearanceSection` |
| Avatar size/roundness/border/glow/decoration; banner height/fade; icon style/size/gap | Done | same |
| 24 fonts + uploaded fonts, per-element fonts, sizes, spacing, username effects | Done | `src/features/themes/fonts.ts`, `TypographySection` |
| Entrance animations, float/pulse loops, hover, card tilt, cursor effects, intro (cinematic / click-to-enter) | Done | `profile.css`, `CursorEffect.tsx`, `IntroOverlay.tsx`, `MotionSection` |
| Typewriter with multiple strings, speeds, pause, repeat, cursor, reduced-motion fallback | Done | `Typewriter.tsx`, `ProfileSection` |
| 50 link platforms, custom buttons, icons/buttons/cards, accent, custom icon, new tab, visibility, reorder (drag + keyboard) | Done | `src/features/socials/platforms.ts`, `SocialsSection` |
| 15 widget types, tabs, sizes, visibility, reorder | Done | `src/features/profiles/document.ts`, `widgets/WidgetView.tsx`, `WidgetsSection` |
| Music player: playlist, covers, seek, volume, mute, next/prev, styles, dock, remembered volume, no autoplay | Done | `audio-store.ts`, `AudioPlayer.tsx`, `AudioSection` |
| Custom badges (icon, colours, tooltip, link); verification only by moderators | Done | `BadgesSection`, admin page |
| Media library: drag-and-drop, progress, cancel, search, filter, sort, rename, delete, visibility, in-use, storage usage, share links | Done | `MediaSection.tsx`, `src/app/api/uploads`, `src/features/uploads/*` |
| Public media pages & gallery (`/media`, `/media/[id]`) | Done | `src/app/(site)/media/*` |
| Analytics: views, clicks, CTR, daily avg, series, top links/widgets/referrers/devices/countries, date ranges, table view | Done | `src/features/analytics/service.ts`, `AnalyticsView.tsx` |
| SEO: title, description, OG image (custom or generated), favicon, theme colour, noindex, canonical, JSON-LD, sitemap, robots | Done | `src/app/u/[username]/page.tsx`, `src/app/og/[username]`, `sitemap.ts` |
| Privacy controls, data export, unlisted profiles | Done | `PrivacySection` |
| Discover, leaderboard (all-time / 30 days) | Done | `src/app/(site)/discover`, `leaderboard` |
| Reports + moderation (suspend, verify, feature, make file private) | Done | `ReportDialog.tsx`, `src/app/admin`, `src/app/actions/community.ts` |
| Pricing ($0 forever), compare, help, changelog, contact, privacy, terms, guidelines | Done | `src/app/(site)/*` |
| Higgsfield-generated footage | **Not generated** — account plan refused generation; prompts + slots ready | `docs/higgsfield-asset-package.md`, `src/features/backgrounds/manifest.ts` |
| OAuth sign-in | Not implemented (no provider configured; no buttons shown) | — |
| Live Discord/Spotify presence | Not implemented (needs official API credentials; link/embed cards instead) | `WidgetView.tsx` |

