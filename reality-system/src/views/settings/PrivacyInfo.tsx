import { CloudOff, Lock, ShieldCheck, WifiOff } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'

export function PrivacyInfo() {
  return (
    <div className="grid gap-gap lg:grid-cols-2">
      <Panel title="What is stored, and where" icon={<Lock className="size-4" />}>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
          <li>Your profile name, quests, goals, milestones, focus sessions, XP ledger, achievements, skill unlocks, rewards, reflections, calendar events, notifications and all settings.</li>
          <li>Everything is kept in this browser's local database (IndexedDB) on this computer. A copy of a few appearance choices is also kept in local storage so the theme loads instantly.</li>
          <li>An imported avatar image is resized and stored in the same local database. Remove it any time in Customization → Avatar.</li>
          <li>Backups are files you export yourself. They go only where your browser saves downloads.</li>
        </ul>
      </Panel>
      <Panel title="What is never done" icon={<CloudOff className="size-4" />}>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
          <li>No accounts, passwords, emails, cloud databases or sign-in.</li>
          <li>No analytics, telemetry, tracking scripts, advertising or social features.</li>
          <li>No remote fonts, images or scripts — every asset is bundled locally. The production build enforces this with a Content-Security-Policy that only allows the app's own files.</li>
          <li>No AI service is used. The daily planner is a set of transparent local rules. If an AI provider is ever added, it will be optional, off by default and require your explicit setup.</li>
        </ul>
      </Panel>
      <Panel title="Offline" icon={<WifiOff className="size-4" />}>
        <p className="text-sm text-muted">After the first launch, the app's own files are cached by a local service worker, so the core app opens and works without an internet connection while the local server is running. Service-worker behaviour depends on your browser. The local server must be running for the app to open (see the README).</p>
      </Panel>
      <Panel title="Honest limits" icon={<ShieldCheck className="size-4" />}>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
          <li>Browser storage is not encrypted by this app. Anyone with access to your Windows account and browser profile could inspect it.</li>
          <li>Local data can be lost if site data is cleared or the device fails — keep exported backups somewhere safe.</li>
          <li>Attributes and ranks are gamified tracking scores, not scientific measurements. The focus timer cannot verify that you were actually focused.</li>
        </ul>
      </Panel>
    </div>
  )
}
