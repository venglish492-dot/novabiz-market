'use client';

import './globals.css';

/** Last-resort boundary (root layout failed). Kept dependency-free and bilingual. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru" data-theme="dark">
      <body>
        <main className="container-page flex min-h-dvh max-w-xl flex-col justify-center py-16">
          <p className="t-eyebrow">Vektor Lab</p>
          <h1 className="t-h1 mt-4 text-fg">Что-то пошло не так · Something went wrong</h1>
          <p className="t-lead mt-4">Попробуйте обновить страницу. Please try again.</p>
          <div className="mt-8 flex gap-3">
            <button type="button" onClick={reset} className="h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-fg">
              Обновить · Retry
            </button>
            <a href="mailto:hello@vektorlab.uz" className="inline-flex h-11 items-center px-3 text-sm text-fg-muted">
              hello@vektorlab.uz
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
