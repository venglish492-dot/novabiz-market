import type { Metadata } from 'next';
import { PageHeader } from '@/components/marketing/PageHeader';
import { CHANGELOG } from '@/content/help';

export const metadata: Metadata = { title: 'Changelog', description: 'What’s new in VYBE.', alternates: { canonical: '/changelog' } };

export default function ChangelogPage() {
  return (
    <>
      <PageHeader eyebrow="Changelog" title="What’s new" />
      <div className="container-page max-w-3xl py-12">
        <ol className="relative space-y-10 border-l border-line pl-8">
          {CHANGELOG.map((entry) => (
            <li key={entry.version} className="relative">
              <span className="absolute -left-[37px] top-1.5 size-3 rounded-full bg-primary ring-4 ring-primary/20" aria-hidden />
              <p className="font-mono text-xs text-lavender">
                v{entry.version} · <time dateTime={entry.date}>{new Date(entry.date).toLocaleDateString('en', { dateStyle: 'long' })}</time>
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{entry.title}</h2>
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-muted">
                {entry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
