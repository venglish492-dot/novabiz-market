'use client';

import type { LayoutId } from '@/features/themes/schema';
import { CinematicLayout } from './Cinematic';
import { MinimalLayout } from './Minimal';
import { CreatorLayout } from './Creator';
import { FuturisticLayout } from './Futuristic';
import { EditorialLayout } from './Editorial';
import { BentoLayout } from './Bento';
import { TabsLayout } from './Tabs';
import { TerminalLayout } from './Terminal';

const LAYOUTS: Record<LayoutId, () => React.ReactElement> = {
  cinematic: CinematicLayout,
  minimal: MinimalLayout,
  creator: CreatorLayout,
  futuristic: FuturisticLayout,
  editorial: EditorialLayout,
  bento: BentoLayout,
  tabs: TabsLayout,
  terminal: TerminalLayout,
};

export function LayoutRenderer({ layout }: { layout: LayoutId }) {
  const Component = LAYOUTS[layout] ?? CinematicLayout;
  return <Component />;
}
