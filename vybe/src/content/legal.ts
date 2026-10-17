/**
 * Plain-language legal pages. These are a sound starting point that reflects
 * how the software actually behaves; have them reviewed by counsel for your
 * jurisdiction before a public launch (see docs/deployment.md).
 */
export type LegalDoc = { title: string; updated: string; intro: string; sections: { heading: string; body: string[] }[] };

export const PRIVACY: LegalDoc = {
  title: 'Privacy policy',
  updated: '2026-10-17',
  intro: 'We collect as little as we can, use it only to run VYBE, and never sell it.',
  sections: [
    { heading: 'What we store about creators', body: ['Your email address, a salted scrypt hash of your password, your profile content, your uploaded files and your settings.', 'Session cookies (vybe_session) keep you signed in. They are HTTP-only and contain a random token; we store only a hash of it.'] },
    { heading: 'What we store about visitors', body: ['Profile analytics record a coarse device type (mobile, tablet, desktop), the referring website’s domain, and — only if our hosting provider supplies it — a two-letter country code.', 'To count unique daily views we keep a one-way hash of the visitor’s network address and browser, salted with a secret and the date. These hashes are deleted after two days. We do not store IP addresses and do not use analytics cookies or fingerprinting.', 'If a visitor’s browser sends Global Privacy Control or Do Not Track, the view is counted without referrer or country.', 'Visitor preferences such as volume and whether the intro was seen are stored only in that visitor’s browser (localStorage).'] },
    { heading: 'Third-party embeds', body: ['YouTube, Vimeo and Spotify embeds load only after a visitor clicks them. Once loaded, those providers’ own privacy policies apply.'] },
    { heading: 'Uploads', body: ['Images are re-encoded and their metadata (including GPS location) is removed. Private files are only served to their owner.'] },
    { heading: 'Retention & deletion', body: ['Analytics events are kept for up to 400 days. Deleting your account permanently removes your profile, files, analytics and sessions.'] },
    { heading: 'Contact', body: ['Questions about privacy? Use the contact page.'] },
  ],
};

export const TERMS: LegalDoc = {
  title: 'Terms of service',
  updated: '2026-10-17',
  intro: 'By using VYBE you agree to these terms and to the community guidelines.',
  sections: [
    { heading: 'Your account', body: ['You must be at least 13 years old (or the minimum age in your country). Keep your password safe; you are responsible for activity on your account.'] },
    { heading: 'Your content', body: ['You keep ownership of everything you upload or write. You grant VYBE a limited licence to host, display and distribute it as needed to run the service.', 'Only upload content you have the right to share.'] },
    { heading: 'Free service', body: ['All creator features are free. We may set fair-use limits that apply equally to every account to protect the service.'] },
    { heading: 'Usernames', body: ['Usernames are first come, first served. We may reclaim names that impersonate others, infringe trademarks, or are held without use to resell them.'] },
    { heading: 'Moderation', body: ['We may remove content or suspend profiles that break these terms or the community guidelines. Verification badges are granted at our discretion and are never sold.'] },
    { heading: 'Disclaimer', body: ['VYBE is provided “as is” without warranties. To the extent permitted by law, we are not liable for indirect or consequential damages.'] },
  ],
};

export const GUIDELINES: LegalDoc = {
  title: 'Community guidelines',
  updated: '2026-10-17',
  intro: 'VYBE is for self-expression. Keep it safe for everyone.',
  sections: [
    { heading: 'Not allowed', body: ['Impersonating people, brands or VYBE itself — including badges designed to look like official verification.', 'Harassment, hate, threats or content that promotes violence.', 'Sexual content involving minors (reported to authorities), non-consensual intimate media, and explicit content on public pages.', 'Malware, phishing, scams, or links designed to deceive.', 'Content you don’t have rights to.'] },
    { heading: 'Reporting', body: ['Use the Report button on any profile or shared file. Moderators review reports and may hide content, unpublish profiles or suspend accounts.'] },
    { heading: 'Appeals', body: ['If you believe a decision was a mistake, contact us with the details.'] },
  ],
};
