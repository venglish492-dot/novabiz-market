import Link from 'next/link';
import { ArrowRight, BarChart3, Check, Clapperboard, Images, LayoutGrid, Music, Palette } from 'lucide-react';
import { ClaimForm } from '@/components/marketing/ClaimForm';
import { ShowcaseFrame } from '@/components/marketing/ShowcaseFrame';
import { Playground } from '@/components/marketing/Playground';
import { ProfileCard } from '@/components/marketing/ProfileCard';
import { getPublicProfile, listProfiles } from '@/features/profiles/service';
import { SHOWCASE_PROFILE } from '@/features/profiles/showcase';
import { FEATURE_GROUPS, HIGHLIGHTS } from '@/content/features';
import { brand } from '@/config/brand';

export const dynamic = 'force-dynamic';

const ICONS = { clapperboard: Clapperboard, layout: LayoutGrid, palette: Palette, music: Music, chart: BarChart3, images: Images };

export default async function HomePage() {
  const [nova, featured, recent] = await Promise.all([getPublicProfile('nova'), listProfiles('featured', 8), listProfiles('recent', 12)]);
  const hero = nova.kind === 'profile' ? nova.profile : SHOWCASE_PROFILE;
  const gallery = [...featured, ...recent.filter((r) => !featured.some((f) => f.username === r.username))].slice(0, 8);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_50%_0%,#000_20%,transparent_70%)]" />
          <div className="absolute -top-40 left-1/2 h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(182_92_255/0.28),transparent)] blur-2xl" />
          <div className="absolute right-[-10%] top-40 h-[500px] w-[700px] rounded-full bg-[radial-gradient(closest-side,rgb(96_165_250/0.2),transparent)] blur-2xl" />
        </div>
        <div className="container-page grid items-center gap-12 pb-20 pt-14 lg:grid-cols-[1.02fr_1fr] lg:pt-20">
          <div className="min-w-0 animate-fade-up">
            <p className="eyebrow">Every feature free · forever</p>
            <h1 className="mt-5 text-[clamp(2.5rem,4.4vw,4.1rem)] font-bold leading-[1.02]">
              Your entire world.
              <br />
              <span className="text-gradient">One unforgettable link.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{brand.description}</p>
            <div className="mt-9">
              <ClaimForm />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3 pl-1">
              <Link href="/discover" className="inline-flex items-center gap-1.5 text-sm font-semibold text-lavender hover:text-text">
                Explore profiles <ArrowRight className="size-4" />
              </Link>
              <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {[
                  ['8', 'layouts'],
                  ['8', 'scenes'],
                  ['24', 'fonts'],
                  ['$0', 'forever'],
                ].map(([n, label]) => (
                  <div key={label} className="flex items-baseline gap-1.5">
                    <dt className="sr-only">{label}</dt>
                    <dd className="font-display text-lg font-bold">{n}</dd>
                    <span className="text-muted">{label}</span>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="relative min-w-0 [perspective:1600px]">
            <div className="animate-float [transform:rotateY(-9deg)_rotateX(4deg)] [transform-style:preserve-3d] lg:[transform:rotateY(-12deg)_rotateX(5deg)]">
              <ShowcaseFrame profile={hero} height={600} className="w-full" />
            </div>
            <div className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgb(96_165_250/0.25),transparent)] blur-2xl" aria-hidden />
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="container-page py-20" aria-labelledby="highlights">
        <div className="max-w-2xl">
          <p className="eyebrow">Built to look expensive</p>
          <h2 id="highlights" className="mt-3 text-3xl font-bold sm:text-4xl">
            A page that feels like a world, not a list of links.
          </h2>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <li key={item.title} className="card group p-6 transition-colors hover:border-line-strong">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/20 text-lavender ring-1 ring-white/10 transition-transform group-hover:scale-105">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Playground */}
      <section className="border-y border-line bg-black/20 py-20" aria-labelledby="playground">
        <div className="container-page">
          <div className="mb-10 max-w-2xl">
            <p className="eyebrow">Try it live</p>
            <h2 id="playground" className="mt-3 text-3xl font-bold sm:text-4xl">
              One profile. Eight layouts. Eight worlds.
            </h2>
            <p className="mt-3 text-muted">This is the real renderer every page uses — switch freely, nothing here is a screenshot.</p>
          </div>
          <Playground profile={hero} />
        </div>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="container-page py-20" aria-labelledby="gallery">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Made with {brand.name}</p>
              <h2 id="gallery" className="mt-3 text-3xl font-bold sm:text-4xl">
                Every page is its own aesthetic.
              </h2>
            </div>
            <Link href="/discover" className="btn btn-secondary">
              Discover more <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gallery.map((card) => (
              <li key={card.username}>
                <ProfileCard card={card} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Free forever */}
      <section className="container-page pb-20" aria-labelledby="free">
        <div className="relative overflow-hidden rounded-[32px] border border-primary/25 bg-gradient-to-br from-[#1a0f2b] via-[#120c1e] to-[#0b0d16] p-8 sm:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-primary/25 blur-3xl" aria-hidden />
          <div className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow">Free forever</p>
              <h2 id="free" className="mt-3 text-4xl font-bold">
                <span className="text-6xl">$0</span> <span className="text-xl font-medium text-muted">/ forever</span>
              </h2>
              <p className="mt-4 max-w-md text-muted">No premium tier. No locked layouts, fonts or effects. No credit counters. Every creative tool is available to every account from day one.</p>
              <Link href="/signup" className="btn btn-primary mt-8">
                Create your free page <ArrowRight className="size-4" />
              </Link>
              <p className="mt-4 text-xs text-faint">Fair-use upload limits keep the service healthy and are the same for everyone.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {FEATURE_GROUPS.slice(0, 4).map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-semibold">{group.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {group.items.slice(0, 4).map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm text-muted">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page pb-20" aria-labelledby="how">
        <h2 id="how" className="sr-only">
          How it works
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            ['Claim your name', 'Pick a username and create an account in under a minute.'],
            ['Shape your world', 'Choose a layout and scene, then tune every detail with a live preview.'],
            ['Publish & share', 'One click publishes vybe/@you. Track views and clicks as they come in.'],
          ].map(([title, body], i) => (
            <li key={title} className="card p-6">
              <span className="font-mono text-sm text-lavender">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-line py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_100%,rgb(182_92_255/0.22),transparent_60%)]" aria-hidden />
        <div className="container-page flex flex-col items-center text-center">
          <h2 className="max-w-2xl text-4xl font-bold sm:text-5xl">Claim your corner of the internet.</h2>
          <p className="mt-4 max-w-lg text-muted">Your name, your atmosphere, your links — live in minutes.</p>
          <div className="mt-8 flex w-full justify-center">
            <ClaimForm size="md" cta="Claim it" />
          </div>
        </div>
      </section>
    </>
  );
}
