/** Minimal hash router (works offline, from any static server, with no config). */
import { create } from 'zustand'
import { ROUTE_IDS, type RouteId } from '@/domain/settings'

function parseHash(): RouteId | null {
  const id = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0]
  return (ROUTE_IDS as readonly string[]).includes(id) ? (id as RouteId) : null
}

interface RouterState {
  route: RouteId
  navigate: (route: RouteId) => void
  init: (fallback: RouteId) => () => void
}

export const useRouter = create<RouterState>((set) => ({
  route: 'overview',
  navigate: (route) => {
    if (window.location.hash !== `#/${route}`) window.location.hash = `/${route}`
    set({ route })
  },
  init: (fallback) => {
    const sync = () => set({ route: parseHash() ?? fallback })
    if (!parseHash()) window.history.replaceState(null, '', `#/${fallback}`)
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  },
}))

export const navigate = (route: RouteId) => useRouter.getState().navigate(route)
