/** The complete, free feature list — shared by the homepage, pricing and compare pages. */
export const FEATURE_GROUPS: { title: string; items: string[] }[] = [
  { title: 'Profile & identity', items: ['Custom username + up to 3 aliases', 'Avatar, banner, display name, status, location, pronouns', 'Custom decorative badges', 'Typewriter & rotating descriptions', 'Profile visibility & publishing controls'] },
  { title: 'Layouts & design', items: ['All 8 layouts', 'Every colour, gradient, glow, blur and opacity control', 'Card width, radius, border, shadow and alignment', '24 curated fonts + your own uploaded fonts', 'Username effects: glow, gradient, shimmer, glitch, sparkle, rainbow'] },
  { title: 'Backgrounds & motion', items: ['8 cinematic scenes, image & video backgrounds', 'Rain, fog, snow, fireflies, stars, bubbles, embers, petals', 'Parallax, 3D card tilt and cursor effects', 'Entrance animations, intro screen, reduced-motion support', 'Visitor scene switcher and dimming controls'] },
  { title: 'Links, widgets & music', items: ['50 link platforms + custom buttons', '15 widget types incl. YouTube, Spotify, Discord, projects', 'Multi-tab profiles', 'Music player with playlists and covers', 'Drag-free reordering with keyboard support'] },
  { title: 'Media & analytics', items: ['Media library and public share links', 'Galleries and image hosting', 'Profile analytics: views, clicks, CTR, referrers, devices', 'SEO title, description, Open Graph image & favicon', 'Theme presets, import & export'] },
];

export const HIGHLIGHTS = [
  { icon: 'clapperboard', title: 'Cinematic scenes', body: 'Eight hand-built animated environments with layered depth, fog, rain and light — or bring your own image or video.' },
  { icon: 'layout', title: 'Eight real layouts', body: 'Glass, minimal, creator, HUD, editorial, bento, tabs and terminal. Switch any time without losing content.' },
  { icon: 'palette', title: 'Every control unlocked', body: 'Colours, gradients, blur, glow, radius, fonts, effects. Nothing greyed out, nothing behind a paywall.' },
  { icon: 'music', title: 'Music & widgets', body: 'A real playlist player plus YouTube, Spotify, Discord, projects, galleries and more.' },
  { icon: 'chart', title: 'Honest analytics', body: 'Unique views, clicks and click-through rate — without cookies, fingerprints or stored IP addresses.' },
  { icon: 'images', title: 'Media hosting', body: 'Upload images, video, audio and fonts. Share public links or keep files private.' },
] as const;
