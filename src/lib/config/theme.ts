/** Theme constants shared by the server (boot script) and the client (switcher). */
export type ThemeMode = 'dark' | 'light' | 'neon';
export const THEMES: ThemeMode[] = ['dark', 'light', 'neon'];
export const THEME_STORAGE_KEY = 'vl-theme';

/** Inline script that applies the saved theme before first paint (no flash). */
export const THEME_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;d.classList.add('js');var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark'||t==='neon'){d.setAttribute('data-theme',t)}}catch(e){}})()`;
