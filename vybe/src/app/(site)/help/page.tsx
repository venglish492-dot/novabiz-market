import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/marketing/PageHeader';
import { HELP_ARTICLES } from '@/content/help';

export const metadata: Metadata = { title: 'Help center', description: 'Guides for building, customizing and sharing your VYBE page.', alternates: { canonical: '/help' } };

export default function HelpPage() {
  return (
    <>
      <PageHeader eyebrow="Help center" title="Guides & answers" description="Everything you need to build, customize and share your page." />
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Help topics" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {HELP_ARTICLES.map((article) => (
              <li key={article.id}>
                <a href={`#${article.id}`} className="block rounded-xl px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-text">
                  {article.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-6">
          {HELP_ARTICLES.map((article) => (
            <article key={article.id} id={article.id} className="card scroll-mt-24 p-6 sm:p-8">
              <h2 className="text-xl font-semibold">{article.title}</h2>
              <div className="mt-4 space-y-3 leading-relaxed text-muted">
                {article.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
          <p className="text-sm text-muted">
            Still stuck?{' '}
            <Link href="/contact" className="text-lavender hover:underline">
              Contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
