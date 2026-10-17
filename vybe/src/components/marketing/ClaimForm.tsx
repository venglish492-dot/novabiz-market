'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Loader2, X } from 'lucide-react';

type Status = { state: 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'; message?: string };

/** Username claim box with a debounced live availability check. */
export function ClaimForm({ size = 'lg', autoFocus = false, cta = 'Create your free page' }: { size?: 'lg' | 'md'; autoFocus?: boolean; cta?: string }) {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState('');
  const [result, setResult] = useState<Status & { name: string }>({ name: '', state: 'idle' });
  const controller = useRef<AbortController | null>(null);
  const trimmed = value.trim();
  const status: Status = !trimmed ? { state: 'idle' } : result.name === trimmed ? result : { state: 'checking' };
  const setStatus = (name: string, s: Status) => setResult({ ...s, name });

  useEffect(() => {
    const name = value.trim();
    if (!name) return;
    const timer = window.setTimeout(async () => {
      controller.current?.abort();
      controller.current = new AbortController();
      try {
        const response = await fetch(`/api/username?name=${encodeURIComponent(name)}`, { signal: controller.current.signal });
        const data = (await response.json()) as { available: boolean; error?: string };
        if (data.available) setStatus(name, { state: 'available', message: 'Available — it’s yours if you want it.' });
        else setStatus(name, { state: response.status === 429 ? 'error' : data.error?.includes('taken') ? 'taken' : 'invalid', message: data.error });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setStatus(name, { state: 'error', message: 'Couldn’t check right now. You can still continue.' });
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [value]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = value.trim().replace(/^@/, '');
    router.push(name ? `/signup?username=${encodeURIComponent(name)}` : '/signup');
  };

  const big = size === 'lg';
  const tone = status.state === 'available' ? 'text-emerald-300' : status.state === 'checking' || status.state === 'idle' ? 'text-muted' : 'text-rose-300';
  return (
    <form onSubmit={submit} className="w-full max-w-xl" noValidate>
      <label htmlFor={id} className="sr-only">
        Choose your username
      </label>
      <div className={`glass flex items-center gap-2 rounded-full p-1.5 pl-5 shadow-[0_20px_60px_-20px_rgb(182_92_255/0.5)] focus-within:ring-4 focus-within:ring-primary/25 ${big ? 'min-h-16' : 'min-h-14'}`}>
        <span className={`shrink-0 font-mono text-muted ${big ? 'text-base' : 'text-sm'}`} aria-hidden>
          vybe/@
        </span>
        <input
          id={id}
          value={value}
          onChange={(event) => setValue(event.target.value.slice(0, 24))}
          placeholder="yourname"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus={autoFocus}
          aria-describedby={`${id}-status`}
          aria-invalid={status.state === 'taken' || status.state === 'invalid'}
          className={`min-w-0 flex-1 bg-transparent font-mono outline-none placeholder:text-faint ${big ? 'text-lg' : 'text-base'}`}
        />
        <span className="w-5 shrink-0" aria-hidden>
          {status.state === 'checking' && <Loader2 className="size-4 animate-spin text-muted" />}
          {status.state === 'available' && <Check className="size-4 text-emerald-300" />}
          {(status.state === 'taken' || status.state === 'invalid') && <X className="size-4 text-rose-300" />}
        </span>
        <button type="submit" className={`btn btn-primary shrink-0 ${big ? 'min-h-13 px-6' : ''}`}>
          <span className="hidden sm:inline">{cta}</span>
          <span className="sm:hidden">Claim</span>
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
      <p id={`${id}-status`} className={`mt-2.5 min-h-5 pl-5 text-sm ${tone}`} aria-live="polite">
        {status.message ?? (status.state === 'idle' ? 'Free forever. Every feature included.' : '')}
      </p>
    </form>
  );
}
