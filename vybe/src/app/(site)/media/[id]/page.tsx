import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { getMediaPage } from '@/features/uploads/service';
import { CopyButton, MediaReportButton } from '@/components/media/MediaActions';

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const user = await getCurrentUser();
  return getMediaPage(id, user?.id ?? null);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const media = await load((await params).id);
  if (!media) return { title: 'File not found', robots: { index: false } };
  return {
    title: media.filename,
    robots: { index: media.visibility === 'public', follow: false },
    openGraph: media.kind === 'image' ? { images: [{ url: media.url }] } : undefined,
  };
}

function size(bytes: number) {
  return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function MediaDetailPage({ params }: Props) {
  const media = await load((await params).id);
  if (!media) notFound();
  return (
    <div className="container-page py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex min-h-[50vh] items-center justify-center overflow-hidden rounded-3xl border border-line bg-black/40 p-2">
          {media.kind === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element -- user media
            <img src={media.url} alt={media.filename} className="max-h-[78vh] w-auto rounded-2xl object-contain" />
          )}
          {media.kind === 'video' && <video src={media.url} poster={media.posterUrl ?? undefined} controls playsInline className="max-h-[78vh] w-full rounded-2xl" />}
          {media.kind === 'audio' && <audio src={media.url} controls className="w-full max-w-lg" />}
          {media.kind === 'font' && (
            <div className="p-8 text-center">
              <style>{`@font-face{font-family:'PreviewFont';src:url('${media.url}');}`}</style>
              <p className="text-5xl" style={{ fontFamily: 'PreviewFont' }}>
                The quick brown fox
              </p>
              <p className="mt-4 text-2xl" style={{ fontFamily: 'PreviewFont' }}>
                ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789
              </p>
            </div>
          )}
        </div>
        <aside className="space-y-5">
          <div>
            <h1 className="break-words text-xl font-semibold">{media.filename}</h1>
            <p className="mt-1 text-sm text-muted">
              {media.kind} · {size(media.sizeBytes)}
              {media.width && media.height ? ` · ${media.width}×${media.height}` : ''}
            </p>
            <p className="mt-1 text-sm text-faint">Uploaded {new Date(media.createdAt).toLocaleDateString('en', { dateStyle: 'medium' })}</p>
          </div>
          {media.owner.username && (
            <p className="text-sm">
              Shared by{' '}
              <Link href={`/@${media.owner.username}`} className="font-semibold text-lavender hover:underline">
                @{media.owner.username}
              </Link>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <CopyButton text={`/media/${media.id}`} label="Copy page link" />
            <CopyButton text={media.url} label="Copy direct link" />
            <a href={media.url} download={media.filename} className="btn btn-secondary btn-sm">
              <Download className="size-4" aria-hidden /> Download
            </a>
          </div>
          {media.isOwner ? (
            <p className="rounded-2xl border border-line bg-white/[0.03] p-4 text-sm text-muted">
              You own this file ({media.visibility}). Manage it in your{' '}
              <Link href="/dashboard/media" className="text-lavender hover:underline">
                media library
              </Link>
              .
            </p>
          ) : (
            <MediaReportButton id={media.id} />
          )}
        </aside>
      </div>
    </div>
  );
}
