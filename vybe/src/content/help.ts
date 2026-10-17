export const HELP_ARTICLES: { id: string; title: string; body: string[] }[] = [
  { id: 'getting-started', title: 'Getting started', body: ['Claim a username on the homepage or the sign-up page. Usernames use letters, numbers, dots, dashes and underscores (2–24 characters).', 'Your page lives at /@yourname. It stays private until you press Publish in the dashboard.', 'Every change in the dashboard is saved automatically as a draft. Publish whenever you want visitors to see the new version.'] },
  { id: 'customization', title: 'Customizing your page', body: ['Appearance controls colours, gradients, card opacity, blur, width, radius, borders, glow and shadows.', 'Layouts switches between eight layouts without losing content. Backgrounds chooses a scene, an uploaded image or video, a gradient or a solid colour.', 'Typography picks fonts for your name, body, buttons and headings — or upload your own font in WOFF2, WOFF, TTF or OTF.', 'Use “Reset section” to return any group of settings to defaults, undo/redo for experiments, and Presets to save, duplicate, import or export complete looks.'] },
  { id: 'layouts', title: 'Layouts', body: ['Cinematic Glass, Minimal, Creator Studio, Futuristic, Editorial, Bento, Multi-Tab and Terminal are all free.', 'Tabs appear automatically in the Multi-Tab layout, and in Cinematic or Creator layouts when you create at least one tab in Widgets & tabs.'] },
  { id: 'effects', title: 'Motion, cursor & profile effects', body: ['Motion & effects controls entrance animations, floating, pulsing, parallax, card tilt, cursor effects and the intro screen.', 'Visitors who prefer reduced motion always get a calm, static version of your page. You can also switch every animation off.'] },
  { id: 'audio', title: 'Music & audio', body: ['Upload MP3, M4A, OGG, WAV, FLAC or WebM audio (up to 20 MB) in Music & audio and add tracks to your playlist.', 'Music never starts by itself. Visitors press play, or — if you enable “Play on enter” with the click-to-enter intro — their click starts it.', 'Visitors’ volume choice is remembered on their device.'] },
  { id: 'widgets', title: 'Widgets & tabs', body: ['Add text, buttons, images, galleries, YouTube/Vimeo videos, Spotify embeds, Discord invites, GitHub and Telegram cards, projects, info lists, audio tracks, contact cards and featured links.', 'Third-party embeds load only after a visitor clicks them, so your page doesn’t send visitor data to other companies by default.'] },
  { id: 'media', title: 'Media library & image hosting', body: ['Upload images (PNG, JPEG, GIF, WebP, AVIF), videos (MP4, WebM, MOV), audio and fonts. SVG and HTML files are not accepted for safety.', 'Images are re-encoded and their metadata (including GPS location) is removed.', 'Each file is Public, Unlisted (default) or Private. Private files only open for you and never appear on your public page.', 'Share a file with its page link (/media/…) or its direct link.'] },
  { id: 'analytics', title: 'Profile analytics', body: ['Views count unique visitors per day. Your own visits and bots are not counted.', 'Clicks count visitors opening your links and buttons. Click-through rate is clicks divided by views over the selected range.', 'We don’t use cookies, fingerprinting or store IP addresses for analytics. Country appears only when the hosting provider supplies it.'] },
  { id: 'seo', title: 'SEO & sharing', body: ['Set a custom page title, description, share image and favicon in SEO & metadata. A share image is generated automatically if you don’t upload one.', 'Choose “Hide from search engines” or make your profile unlisted to keep it out of search results and Discover.'] },
  { id: 'aliases', title: 'Aliases', body: ['Add up to three aliases in Profile. Visiting /@alias redirects to your main page.'] },
  { id: 'safety', title: 'Safety & reporting', body: ['Every public profile and shared file has a Report option. Reports are reviewed by moderators.', 'Links must use https://, http:// or mailto:. Executable or local links are rejected.'] },
];

export const CHANGELOG: { version: string; date: string; title: string; items: string[] }[] = [
  {
    version: '1.0.0',
    date: '2026-10-17',
    title: 'First release',
    items: [
      'Eight layouts and eight procedural cinematic scenes',
      'Live editor with autosave, undo/redo, device previews and publishing',
      'Media library with uploads, visibility controls and share pages',
      'Fifteen widget types, tabs, custom badges and a playlist music player',
      'Privacy-conscious analytics, discovery and leaderboard',
      'Reports and moderator tools',
    ],
  },
];
