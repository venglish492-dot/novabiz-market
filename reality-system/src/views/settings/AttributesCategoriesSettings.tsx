import { useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Archive, ArchiveRestore } from 'lucide-react'
import { getDb } from '@/db/database'
import { useAttributes, useCategories } from '@/hooks/useData'
import { useUi } from '@/store/ui'
import { attributeSchema, categorySchema, type AttributeDef, type Category } from '@/domain/schemas'
import { Panel } from '@/components/ui/Panel'
import { Button, IconButton } from '@/components/ui/Button'
import { CommitInput, Field, Select } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { CATEGORY_ICON_CHOICES } from '@/components/ui/icons'
import { newId } from '@/lib/id'

/** Swaps the `order` of two rows to move one up or down. */
async function reorder<T extends { id: string; order: number }>(table: 'attributes' | 'categories', list: T[], index: number, dir: -1 | 1) {
  const j = index + dir
  if (j < 0 || j >= list.length) return
  const db = getDb()
  const t = db.table(table)
  await db.transaction('rw', t, async () => {
    await t.update(list[index].id, { order: list[j].order })
    await t.update(list[j].id, { order: list[index].order })
  })
}

export function AttributesCategoriesSettings() {
  return (
    <div className="grid gap-gap xl:grid-cols-2">
      <AttributesEditor />
      <CategoriesEditor />
    </div>
  )
}

function AttributesEditor() {
  const attributes = useAttributes(true)
  const pushToast = useUi((s) => s.pushToast)
  const save = async (a: AttributeDef, patch: Partial<AttributeDef>) => {
    const parsed = attributeSchema.safeParse({ ...a, ...patch })
    if (parsed.success) await getDb().attributes.put(parsed.data)
  }
  return (
    <Panel title="Attributes" eyebrow="Gamified tracking scores">
      <p className="mb-3 text-sm text-muted">Rename, recolour, reorder or hide attributes, or add your own. Hidden attributes keep their points; they are just not displayed. Attributes never decrease for taking breaks.</p>
      <ul className="space-y-3">
        {attributes?.map((a, i) => (
          <li key={a.id} className="rounded-xl border border-line/60 p-3">
            <div className="grid grid-cols-[56px_80px_1fr_auto] items-end gap-2">
              <Field label="Colour">{(id) => <input id={id} type="color" value={a.color} onChange={(e) => void save(a, { color: e.target.value })} className="h-10 w-full cursor-pointer rounded-lg border border-line bg-transparent" />}</Field>
              <Field label="Abbr.">{(id) => <CommitInput id={id} value={a.abbr} maxLength={6} onCommit={(v) => void save(a, { abbr: v.toUpperCase() })} />}</Field>
              <Field label="Name">{(id) => <CommitInput id={id} value={a.name} maxLength={40} onCommit={(v) => void save(a, { name: v })} />}</Field>
              <div className="flex">
                <IconButton size="sm" label={`Move ${a.name} up`} disabled={i === 0} onClick={() => void reorder('attributes', attributes, i, -1)}>
                  <ArrowUp className="size-4" />
                </IconButton>
                <IconButton size="sm" label={`Move ${a.name} down`} disabled={i === attributes.length - 1} onClick={() => void reorder('attributes', attributes, i, 1)}>
                  <ArrowDown className="size-4" />
                </IconButton>
                <IconButton size="sm" label={a.hidden ? `Show ${a.name}` : `Hide ${a.name}`} onClick={() => void save(a, { hidden: !a.hidden })}>
                  {a.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </IconButton>
              </div>
            </div>
            <CommitInput className="mt-2 text-xs" aria-label={`${a.name} description`} value={a.description} maxLength={400} onCommit={(v) => void save(a, { description: v })} />
          </li>
        ))}
      </ul>
      <Button
        className="mt-3"
        size="sm"
        icon={<Plus className="size-4" />}
        onClick={async () => {
          const order = (attributes?.length ?? 0) + 1
          await getDb().attributes.add({ id: newId('attr'), abbr: 'NEW', name: 'New attribute', description: 'Describe what grows this attribute.', color: '#a3e635', order: order * 10, hidden: false, builtin: false })
          pushToast({ kind: 'success', title: 'Attribute added', body: 'Assign it to quests in the quest editor.' })
        }}
      >
        Add attribute
      </Button>
    </Panel>
  )
}

function CategoriesEditor() {
  const categories = useCategories(true)
  const attributes = useAttributes(true)
  const [newName, setNewName] = useState('')
  const save = async (c: Category, patch: Partial<Category>) => {
    const parsed = categorySchema.safeParse({ ...c, ...patch })
    if (parsed.success) await getDb().categories.put(parsed.data)
  }
  return (
    <Panel title="Quest categories">
      <p className="mb-3 text-sm text-muted">Archived categories disappear from pickers but keep their history. Each category sets the default attribute for new quests.</p>
      <ul className="space-y-2">
        {categories?.map((c, i) => (
          <li key={c.id} className={`grid grid-cols-[44px_1fr] items-center gap-2 rounded-xl border border-line/60 p-2 sm:grid-cols-[44px_1fr_120px_110px_auto] ${c.archived ? 'opacity-55' : ''}`}>
            <label className="relative grid size-10 cursor-pointer place-items-center rounded-lg border border-line" style={{ color: c.color }} title="Change colour">
              <Icon name={c.icon} className="size-5" />
              <input type="color" aria-label={`${c.name} colour`} value={c.color} onChange={(e) => void save(c, { color: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
            </label>
            <CommitInput aria-label="Category name" value={c.name} maxLength={40} onCommit={(v) => void save(c, { name: v })} />
            <Select aria-label={`${c.name} icon`} value={c.icon} onChange={(e) => void save(c, { icon: e.target.value })}>
              {CATEGORY_ICON_CHOICES.map((ic) => (
                <option key={ic} value={ic}>
                  {ic}
                </option>
              ))}
            </Select>
            <Select aria-label={`${c.name} default attribute`} value={c.attributeId} onChange={(e) => void save(c, { attributeId: e.target.value })}>
              {attributes?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.abbr}
                </option>
              ))}
            </Select>
            <div className="flex">
              <IconButton size="sm" label={`Move ${c.name} up`} disabled={i === 0} onClick={() => void reorder('categories', categories, i, -1)}>
                <ArrowUp className="size-4" />
              </IconButton>
              <IconButton size="sm" label={`Move ${c.name} down`} disabled={i === categories.length - 1} onClick={() => void reorder('categories', categories, i, 1)}>
                <ArrowDown className="size-4" />
              </IconButton>
              <IconButton size="sm" label={c.archived ? `Restore ${c.name}` : `Archive ${c.name}`} disabled={c.id === 'general'} onClick={() => void save(c, { archived: !c.archived })}>
                {c.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
              </IconButton>
            </div>
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!newName.trim()) return
          const order = ((categories?.length ?? 0) + 1) * 10
          await getDb().categories.add({ id: newId('cat'), name: newName.trim().slice(0, 40), color: '#38bdf8', icon: 'star', attributeId: 'disc', order, archived: false, builtin: false })
          setNewName('')
        }}
      >
        <input className="input" aria-label="New category name" placeholder="New category name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button type="submit" variant="subtle" icon={<Plus className="size-4" />} disabled={!newName.trim()}>
          Add
        </Button>
      </form>
    </Panel>
  )
}
