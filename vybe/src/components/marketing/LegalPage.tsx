import type { LegalDoc } from '@/content/legal';
import { PageHeader } from './PageHeader';

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <PageHeader eyebrow={`Updated ${new Date(doc.updated).toLocaleDateString('en', { dateStyle: 'long' })}`} title={doc.title} description={doc.intro} />
      <div className="container-page max-w-3xl space-y-10 py-12">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold">{section.heading}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-muted">
              {section.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
