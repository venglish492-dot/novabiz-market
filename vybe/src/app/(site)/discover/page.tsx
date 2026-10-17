import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/marketing/PageHeader';
import { ProfileCard } from '@/components/marketing/ProfileCard';
import { listProfiles } from '@/features/profiles/service';

export const metadata: Metadata = { title: 'Discover', description: 'Explore published profiles built with VYBE.', alternates: { canonical: '/discover' } };
export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
  const [featured, popular, recent] = await Promise.all([listProfiles('featured', 8), listProfiles('popular', 8), listProfiles('recent', 16)]);
  const sections = [
    { id: 'featured', title: 'Featured', cards: featured },
    { id: 'popular', title: 'Popular', cards: popular },
    { id: 'recent', title: 'Recently published', cards: recent },
  ].filter((s) => s.cards.length);
  return (
    <>
      <PageHeader eyebrow="Discover" title="Pages worth a visit." description="Public profiles from the community. Profiles marked Demo are examples created by VYBE." />
      <div className="container-page space-y-16 py-14">
        {sections.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-lg font-semibold">No public profiles yet.</p>
            <p className="mt-2 text-muted">Be the first — your page could be here.</p>
            <Link href="/signup" className="btn btn-primary mt-6">Create your page</Link>
          </div>
        )}
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={section.id}>
            <h2 id={section.id} className="text-2xl font-bold">{section.title}</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {section.cards.map((card) => (
                <li key={card.username}>
                  <ProfileCard card={card} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
