'use client';

import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion as m } from 'motion/react';
import { BadgeIcon } from '@/features/badges/BadgeIcon';
import { useProfile } from '../context';
import { LinkButtons } from '../parts';
import { WidgetList } from '../widgets/WidgetView';
import { AudioPlayer } from '../AudioPlayer';

type TabDef = { id: string; label: string; icon: string; render: () => React.ReactNode };

/**
 * Accessible tabs (WAI-ARIA tabs pattern: arrow keys, Home/End) with a soft
 * cross-fade. "Links" holds buttons and untabbed widgets; each creator tab
 * holds its own widgets; "Music" appears when tracks exist.
 */
export function TabbedContent({ includeLinksTab = true, className = '' }: { includeLinksTab?: boolean; className?: string }) {
  const { profile, theme, motion } = useProfile();
  const baseId = useId();
  const widgets = profile.doc.widgets.filter((w) => w.visible);
  const tabs = useMemo<TabDef[]>(() => {
    const list: TabDef[] = [];
    const untabbed = widgets.filter((w) => !w.tabId || !profile.doc.tabs.some((t) => t.id === w.tabId));
    const hasLinkContent = profile.doc.links.some((l) => l.visible && (l.kind === 'button' || l.displayMode !== 'icon')) || untabbed.length > 0;
    if (includeLinksTab && hasLinkContent) {
      list.push({
        id: 'links',
        label: 'Links',
        icon: 'link',
        render: () => (
          <div className="space-y-3">
            <LinkButtons />
            <WidgetList widgets={untabbed} />
          </div>
        ),
      });
    }
    for (const tab of profile.doc.tabs) {
      const own = widgets.filter((w) => w.tabId === tab.id);
      list.push({ id: tab.id, label: tab.label, icon: tab.icon, render: () => (own.length ? <WidgetList widgets={own} /> : <p className="p-muted py-6 text-center text-sm">Nothing here yet.</p>) });
    }
    if (profile.doc.tracks.length && theme.visibility.audio && theme.audio.placement === 'dock' && !profile.doc.tabs.some((t) => t.label.toLowerCase() === 'music')) {
      list.push({ id: 'music', label: 'Music', icon: 'music', render: () => <AudioPlayer forceStyle="full" /> });
    }
    return list;
  }, [profile, widgets, includeLinksTab, theme.visibility.audio, theme.audio.placement]);

  const [active, setActive] = useState(tabs[0]?.id ?? '');
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  if (!tabs.length || !current) return null;

  const onKey = (event: KeyboardEvent, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    setActive(tabs[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div className={className}>
      <div role="tablist" aria-label="Profile sections" className="p-sub mb-4 flex gap-1 overflow-x-auto p-1 scrollbar-thin">
        {tabs.map((tab, i) => {
          const selected = tab.id === current.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => onKey(event, i)}
              className="p-btn-font relative flex min-h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[calc(var(--p-card-radius)*0.45)] px-3 text-[0.82em] font-semibold transition-colors"
              style={{ color: selected ? 'var(--p-text)' : 'var(--p-muted)' }}
            >
              {selected && (
                <m.span
                  layoutId={`${baseId}-pill`}
                  className="absolute inset-0 rounded-[inherit]"
                  style={{ background: 'var(--p-accent-soft)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--p-accent) 45%, transparent)' }}
                  transition={motion ? { type: 'spring', stiffness: 400, damping: 34 } : { duration: 0 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <BadgeIcon name={tab.icon} size={13} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={current.id}
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-${current.id}`}
          initial={motion ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={motion ? { opacity: 0, y: -6 } : undefined}
          transition={{ duration: 0.22 }}
        >
          {current.render()}
        </m.div>
      </AnimatePresence>
    </div>
  );
}
