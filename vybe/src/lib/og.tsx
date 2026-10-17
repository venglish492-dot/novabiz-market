import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[]> | null = null;

/** Fonts for Open Graph images (satori needs TTF/OTF/WOFF, not WOFF2). */
export function ogFonts() {
  fonts ??= (async () => {
    const dir = path.join(process.cwd(), 'node_modules', '@fontsource', 'space-grotesk', 'files');
    const [regular, bold] = await Promise.all([
      fs.readFile(path.join(dir, 'space-grotesk-latin-400-normal.woff')),
      fs.readFile(path.join(dir, 'space-grotesk-latin-700-normal.woff')),
    ]);
    return [
      { name: 'Space Grotesk', data: regular, weight: 400 as const, style: 'normal' as const },
      { name: 'Space Grotesk', data: bold, weight: 700 as const, style: 'normal' as const },
    ];
  })();
  return fonts;
}
