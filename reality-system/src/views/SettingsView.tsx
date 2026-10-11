import { useState } from 'react'
import { Tabs } from '@/components/ui/Tabs'
import { SectionTitle } from '@/components/ui/Misc'
import { GeneralSettings } from './settings/GeneralSettings'
import { GameRulesSettings } from './settings/GameRulesSettings'
import { AttributesCategoriesSettings } from './settings/AttributesCategoriesSettings'
import { DataSettings } from './settings/DataSettings'
import { PrivacyInfo } from './settings/PrivacyInfo'

type Section = 'general' | 'rules' | 'attributes' | 'data' | 'privacy'

export default function SettingsView() {
  const [section, setSection] = useState<Section>('general')
  return (
    <div>
      <SectionTitle eyebrow="System configuration" title="Settings" description="Preferences, game rules, your data and privacy. Resets are separated so changing one area never deletes another." />
      <Tabs
        label="Settings sections"
        value={section}
        onChange={setSection}
        className="mb-gap"
        items={[
          { id: 'general', label: 'General' },
          { id: 'rules', label: 'Game rules' },
          { id: 'attributes', label: 'Attributes & categories' },
          { id: 'data', label: 'Data & backups' },
          { id: 'privacy', label: 'Privacy' },
        ]}
      />
      {section === 'general' && <GeneralSettings />}
      {section === 'rules' && <GameRulesSettings />}
      {section === 'attributes' && <AttributesCategoriesSettings />}
      {section === 'data' && <DataSettings />}
      {section === 'privacy' && <PrivacyInfo />}
    </div>
  )
}
