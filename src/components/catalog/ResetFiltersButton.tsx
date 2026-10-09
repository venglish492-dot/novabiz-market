'use client';

import { Button } from '@/components/ui/Button';
import { useCatalogNav } from './CatalogShell';

export function ResetFiltersButton({ label }: { label: string }) {
  const { reset } = useCatalogNav();
  return (
    <Button variant="secondary" onClick={() => reset()}>
      {label}
    </Button>
  );
}
