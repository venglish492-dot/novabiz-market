'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { publishAction, saveDraftAction, unpublishAction, type SavedPreset } from '@/app/actions/profile';
import { validateDocument, type DocumentIssue, type ProfileDocument } from '@/features/profiles/document';
import type { AssetMap } from '@/features/profiles/types';
import { DEFAULT_THEME, mergeTheme, type ProfileTheme } from '@/features/themes/schema';
import type { LibraryAsset } from '@/features/uploads/service';
import { useToast } from '@/components/ui/Toast';

export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'invalid' | 'error' | 'conflict' | 'offline';

export type EditorInit = {
  profileId: string;
  username: string;
  doc: ProfileDocument;
  revision: number;
  isPublished: boolean;
  publishedAt: string | null;
  hasUnpublishedChanges: boolean;
  verified: boolean;
  aliases: string[];
  viewCount: number;
  library: LibraryAsset[];
  presets: SavedPreset[];
  email: string;
};

type EditorApi = {
  init: EditorInit;
  doc: ProfileDocument;
  username: string;
  setUsername: (name: string) => void;
  aliases: string[];
  setAliases: (aliases: string[]) => void;
  status: SaveStatus;
  statusMessage: string | null;
  issues: DocumentIssue[];
  lastSavedAt: Date | null;
  published: { isPublished: boolean; publishedAt: string | null; hasUnpublishedChanges: boolean };
  update: (mutate: (doc: ProfileDocument) => ProfileDocument, options?: { coalesce?: string }) => void;
  updateTheme: (patch: Record<string, unknown>, coalesce?: string) => void;
  setTheme: (theme: ProfileTheme) => void;
  resetThemeSection: (key: keyof ProfileTheme) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveNow: () => Promise<boolean>;
  publish: () => Promise<void>;
  unpublish: () => Promise<void>;
  publishing: boolean;
  library: LibraryAsset[];
  setLibrary: React.Dispatch<React.SetStateAction<LibraryAsset[]>>;
  assetMap: AssetMap;
  presets: SavedPreset[];
  setPresets: React.Dispatch<React.SetStateAction<SavedPreset[]>>;
};

const EditorContext = createContext<EditorApi | null>(null);

export function useEditor(): EditorApi {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used inside <EditorProvider>');
  return ctx;
}

const HISTORY_LIMIT = 80;
const AUTOSAVE_MS = 900;

export function EditorProvider({ init, children }: { init: EditorInit; children: React.ReactNode }) {
  const toast = useToast();
  const [doc, setDoc] = useState<ProfileDocument>(init.doc);
  const [username, setUsername] = useState(init.username);
  const [aliases, setAliases] = useState(init.aliases);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [issues, setIssues] = useState<DocumentIssue[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [published, setPublished] = useState({ isPublished: init.isPublished, publishedAt: init.publishedAt, hasUnpublishedChanges: init.hasUnpublishedChanges });
  const [publishing, setPublishing] = useState(false);
  const [library, setLibrary] = useState(init.library);
  const [presets, setPresets] = useState(init.presets);
  const [history, setHistory] = useState<{ past: ProfileDocument[]; future: ProfileDocument[] }>({ past: [], future: [] });

  const revision = useRef(init.revision);
  const savedJson = useRef(JSON.stringify(init.doc));
  const docRef = useRef(doc);
  const saving = useRef<Promise<boolean> | null>(null);
  const timer = useRef<number | null>(null);
  const lastCoalesce = useRef<{ key: string; at: number } | null>(null);
  const rescheduleRef = useRef<() => void>(() => {});

  const save = useCallback(async (): Promise<boolean> => {
    if (saving.current) {
      await saving.current;
    }
    const current = docRef.current;
    const json = JSON.stringify(current);
    if (json === savedJson.current) {
      setStatus('saved');
      return true;
    }
    const check = validateDocument(current);
    if (!check.ok) {
      setIssues(check.issues);
      setStatus('invalid');
      setStatusMessage(check.issues[0]?.message ?? 'Some fields need attention.');
      return false;
    }
    setIssues([]);
    setStatus('saving');
    const run = (async () => {
      try {
        const result = await saveDraftAction(current, revision.current);
        if (result.ok) {
          revision.current = result.revision;
          savedJson.current = json;
          setLastSavedAt(new Date());
          setPublished((p) => ({ ...p, hasUnpublishedChanges: true }));
          setStatusMessage(null);
          setStatus(JSON.stringify(docRef.current) === json ? 'saved' : 'dirty');
          return true;
        }
        if (result.reason === 'invalid') {
          setIssues(result.issues);
          setStatus('invalid');
          setStatusMessage(result.issues[0]?.message ?? 'Some fields need attention.');
        } else if (result.reason === 'conflict') {
          setStatus('conflict');
          setStatusMessage(result.message);
        } else {
          setStatus('error');
          setStatusMessage('message' in result ? result.message : 'Couldn’t save. Retrying when you make another change.');
        }
        return false;
      } catch {
        setStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
        setStatusMessage('Couldn’t reach the server. Your changes are kept here — we’ll retry.');
        return false;
      } finally {
        saving.current = null;
      }
    })();
    saving.current = run;
    return run;
  }, []);

  const schedule = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      void save().then((ok) => {
        // Edits made while a save was in flight get their own save.
        if (ok && JSON.stringify(docRef.current) !== savedJson.current) rescheduleRef.current();
      });
    }, AUTOSAVE_MS);
  }, [save]);
  useEffect(() => {
    rescheduleRef.current = schedule;
  }, [schedule]);

  const update = useCallback(
    (mutate: (d: ProfileDocument) => ProfileDocument, options?: { coalesce?: string }) => {
      const prev = docRef.current;
      const next = mutate(prev);
      if (next === prev) return;
      const now = Date.now();
      const coalesce = options?.coalesce && lastCoalesce.current?.key === options.coalesce && now - lastCoalesce.current.at < 700;
      lastCoalesce.current = options?.coalesce ? { key: options.coalesce, at: now } : null;
      if (!coalesce) setHistory((h) => ({ past: [...h.past.slice(-HISTORY_LIMIT + 1), prev], future: [] }));
      docRef.current = next;
      setDoc(next);
      setStatus('dirty');
      schedule();
    },
    [schedule],
  );

  const updateTheme = useCallback((patch: Record<string, unknown>, coalesce?: string) => update((d) => ({ ...d, theme: mergeTheme(d.theme, patch) }), { coalesce }), [update]);
  const setTheme = useCallback((theme: ProfileTheme) => update((d) => ({ ...d, theme })), [update]);
  const resetThemeSection = useCallback((key: keyof ProfileTheme) => update((d) => ({ ...d, theme: { ...d.theme, [key]: DEFAULT_THEME[key] } })), [update]);

  const undo = useCallback(() => {
    setHistory((h) => {
      const previous = h.past[h.past.length - 1];
      if (!previous) return h;
      const current = docRef.current;
      docRef.current = previous;
      setDoc(previous);
      setStatus('dirty');
      schedule();
      return { past: h.past.slice(0, -1), future: [current, ...h.future] };
    });
  }, [schedule]);

  const redo = useCallback(() => {
    setHistory((h) => {
      const next = h.future[0];
      if (!next) return h;
      const current = docRef.current;
      docRef.current = next;
      setDoc(next);
      setStatus('dirty');
      schedule();
      return { past: [...h.past, current], future: h.future.slice(1) };
    });
  }, [schedule]);

  const publish = useCallback(async () => {
    setPublishing(true);
    try {
      if (timer.current) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      const ok = await save();
      if (!ok) {
        toast.show('error', 'Fix the highlighted issues before publishing', statusMessage ?? undefined);
        return;
      }
      const result = await publishAction();
      if (result.ok) {
        setPublished({ isPublished: true, publishedAt: result.publishedAt, hasUnpublishedChanges: false });
        toast.show('success', 'Published', `Live at /@${result.username}`);
        for (const warning of result.warnings) toast.show('info', 'Heads up', warning);
      } else {
        toast.show('error', 'Couldn’t publish', result.message);
      }
    } catch {
      toast.show('error', 'Couldn’t publish', 'Check your connection and try again.');
    } finally {
      setPublishing(false);
    }
  }, [save, toast, statusMessage]);

  const unpublish = useCallback(async () => {
    const result = await unpublishAction();
    if (result.ok) {
      setPublished((p) => ({ ...p, isPublished: false }));
      toast.show('info', 'Unpublished', 'Your page is hidden until you publish again.');
    } else toast.show('error', 'Couldn’t unpublish', result.message);
  }, [toast]);

  // Never lose work silently.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(docRef.current) !== savedJson.current) {
        event.preventDefault();
      }
    };
    const onOnline = () => {
      if (JSON.stringify(docRef.current) !== savedJson.current) schedule();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('online', onOnline);
    };
  }, [schedule]);

  // Undo/redo shortcuts — left to the browser inside text fields.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input[type="text"], input[type="url"], input:not([type]), textarea, [contenteditable="true"]')) return;
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const assetMap = useMemo<AssetMap>(() => {
    const map: AssetMap = {};
    for (const asset of library) map[asset.id] = { id: asset.id, kind: asset.kind, url: asset.url, posterUrl: asset.posterUrl, width: asset.width, height: asset.height, mime: asset.mime };
    return map;
  }, [library]);

  const value: EditorApi = {
    init,
    doc,
    username,
    setUsername,
    aliases,
    setAliases,
    status,
    statusMessage,
    issues,
    lastSavedAt,
    published,
    update,
    updateTheme,
    setTheme,
    resetThemeSection,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    saveNow: save,
    publish,
    unpublish,
    publishing,
    library,
    setLibrary,
    assetMap,
    presets,
    setPresets,
  };
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

/** Field-level error for a document path such as "links.2.url". */
export function useIssue(path: string): string | undefined {
  const { issues } = useEditor();
  return issues.find((issue) => issue.path === path || issue.path.startsWith(`${path}.`))?.message;
}
