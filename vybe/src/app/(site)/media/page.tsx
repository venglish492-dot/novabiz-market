import type { Metadata } from 'next';
import Link from 'next/link';
import { Globe2, Link2, Lock, UploadCloud } from 'lucide-react';
import { PageHeader } from '@/components/marketing/PageHeader';
import { recentPublicMedia } from '@/features/uploads/service';

export const metadata: Metadata = { title: 'Media hosting', description: 'Upload images, video, audio and fonts. Share public links or keep files private.', alternates: { canonical: '/media' } };
export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  const items = await recentPublicMedia(24);
  return (
    <>
      <PageHeader eyebrow="Media hosting" title="Your files, beautifully shared." description="Every account gets a media library for avatars, backgrounds, music, galleries and fonts — with shareable links and per-file privacy.">
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard/media" className="btn btn-primary">
            <UploadCloud className="size-4" aria-hidden /> Open your library
          </Link>
          <Link href="/help#media" className="btn btn-secondary">How it works</Link>
        </div>
      </PageHeader>
      <div className="container-page py-14">
        <ul className="grid gap-4 md:grid-cols-3">
          {[
            [Globe2, 'Public', 'Listed on your gallery and here, and shareable by link.'],
            [Link2, 'Unlisted', 'Anyone with the link can view it. Not listed anywhere. The default.'],
            [Lock, 'Private', 'Only you can open it. Private files never appear on your public page.'],
          ].map(([Icon, title, body]) => {
            const I = Icon as typeof Globe2;
            return (
              <li key={title as string} className="card p-6">
                <I className="size-5 text-lavender" aria-hidden />
                <h2 className="mt-4 font-semibold">{title as string}</h2>
                <p className="mt-1.5 text-sm text-muted">{body as string}</p>
              </li>
            );
          })}
        </ul>
        <section className="mt-16" aria-labelledby="recent">
          <h2 id="recent" className="text-2xl font-bold">Recently shared</h2>
          {items.length === 0 ? (
            <p className="mt-6 text-muted">Nothing has been shared publicly yet.</p>
          ) : (
            <ul className="mt-6 columns-2 gap-3 sm:columns-3 lg:columns-4">
              {items.map((item) => (
                <li key={item.id} className="mb-3 break-inside-avoid">
                  <Link href={`/media/${item.id}`} className="group block overflow-hidden rounded-2xl border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element -- user media */}
                    <img src={item.kind === 'video' ? (item.posterUrl ?? '') : item.url} alt={item.filename} loading="lazy" className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" style={{ aspectRatio: item.width && item.height ? `${item.width}/${item.height}` : '1' }} />
                    <span className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-muted">
                      <span className="truncate">@{item.username}</span>
                      <span className="uppercase">{item.kind}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
