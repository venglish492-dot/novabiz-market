/**
 * Infrastructure-safety limits. These protect storage and keep the service
 * healthy; they are the same for every account and are never sold as upgrades.
 * Upload sizes can be overridden on the server through environment variables
 * (see src/lib/env.ts).
 */
export const limits = {
  username: { min: 2, max: 24 },
  displayName: 140,
  description: 280,
  statusText: 60,
  location: 60,
  pronouns: 24,
  typewriterStrings: 8,
  typewriterStringLength: 140,
  links: 40,
  widgets: 40,
  tabs: 6,
  badges: 16,
  audioTracks: 10,
  aliases: 3,
  customPresets: 30,
  backgroundScenes: 5,
  seoTitle: 70,
  seoDescription: 200,
  /** Upload counts and total storage per account. */
  storagePerUserBytes: 1024 * 1024 * 1024,
  uploadsPerHour: 120,
} as const;
