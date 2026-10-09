import type { ReactNode } from 'react';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import type { Locale } from '@/i18n/config';
import type { LegalDocument } from '@/content/legal';
import { LEGAL_UPDATED } from '@/content/legal';
import { formatDate } from '@/lib/format';
import { PageHeader } from './PageHeader';

export function LegalPage({ doc, path, t, locale, children }: { doc: LegalDocument; path: string; t: Dictionary; locale: Locale; children?: ReactNode }) {
  return (
    <>
      <PageHeader
        eyebrow={t.footer.legal}
        title={doc.title}
        description={doc.intro}
        crumbs={[
          { name: t.nav.home, href: '/' },
          { name: doc.title, href: path },
        ]}
        crumbLabel={t.product.breadcrumb}
      />
      <div className="container-page py-12 lg:py-16">
        <div className="prose-vl max-w-3xl">
          <p className="t-mono text-xs text-fg-subtle">
            {t.common.updated}: {formatDate(LEGAL_UPDATED, locale, 'long')}
          </p>
          {children}
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.list && (
                <ul>
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
