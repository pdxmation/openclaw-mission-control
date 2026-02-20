'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ProfileData {
  id: string
  name: string
  email: string
  telegram: string | null
  github: string | null
  timezone: string | null
  wakeTime: string | null
  location: string | null
  company: string | null
  companyLegal: string | null
  product: string | null
  stage: string | null
  communicationStyle: string | null
  workStartTime: string | null
  workEndTime: string | null
  preferences: unknown
  shortTermGoals: string[]
  mediumTermGoals: string[]
  longTermGoals: string[]
  techStack: string[]
  currentFocus: string | null
  myMission: string | null
  notes: string | null
}

interface ProfileFormProps {
  initialProfile: ProfileData
}

function listToText(list: string[] | null | undefined) {
  return (list || []).join('\n')
}

function textToList(text: string) {
  return text
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    name: initialProfile.name || '',
    email: initialProfile.email || '',
    telegram: initialProfile.telegram || '',
    github: initialProfile.github || '',
    timezone: initialProfile.timezone || '',
    wakeTime: initialProfile.wakeTime || '',
    location: initialProfile.location || '',
    company: initialProfile.company || '',
    companyLegal: initialProfile.companyLegal || '',
    product: initialProfile.product || '',
    stage: initialProfile.stage || '',
    communicationStyle: initialProfile.communicationStyle || '',
    workStartTime: initialProfile.workStartTime || '',
    workEndTime: initialProfile.workEndTime || '',
    preferences: initialProfile.preferences ? JSON.stringify(initialProfile.preferences, null, 2) : '',
    shortTermGoals: listToText(initialProfile.shortTermGoals),
    mediumTermGoals: listToText(initialProfile.mediumTermGoals),
    longTermGoals: listToText(initialProfile.longTermGoals),
    techStack: listToText(initialProfile.techStack),
    currentFocus: initialProfile.currentFocus || '',
    myMission: initialProfile.myMission || '',
    notes: initialProfile.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    let preferencesValue: unknown = null
    if (formData.preferences.trim()) {
      try {
        preferencesValue = JSON.parse(formData.preferences)
      } catch {
        setError('Preferences must be valid JSON.')
        setSaving(false)
        return
      }
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      telegram: formData.telegram.trim() || null,
      github: formData.github.trim() || null,
      timezone: formData.timezone.trim() || null,
      wakeTime: formData.wakeTime.trim() || null,
      location: formData.location.trim() || null,
      company: formData.company.trim() || null,
      companyLegal: formData.companyLegal.trim() || null,
      product: formData.product.trim() || null,
      stage: formData.stage.trim() || null,
      communicationStyle: formData.communicationStyle.trim() || null,
      workStartTime: formData.workStartTime.trim() || null,
      workEndTime: formData.workEndTime.trim() || null,
      preferences: preferencesValue,
      shortTermGoals: textToList(formData.shortTermGoals),
      mediumTermGoals: textToList(formData.mediumTermGoals),
      longTermGoals: textToList(formData.longTermGoals),
      techStack: textToList(formData.techStack),
      currentFocus: formData.currentFocus.trim() || null,
      myMission: formData.myMission.trim() || null,
      notes: formData.notes.trim() || null,
    }

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const message = await res.json().catch(() => ({ error: 'Save failed' }))
        setError(message.error || 'Save failed')
        return
      }

      setSuccess('Profile updated')
    } catch (err) {
      console.error('Profile update failed:', err)
      setError('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Keep your personal and work details up to date.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Telegram</label>
            <input
              value={formData.telegram}
              onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="@username"
            />
          </div>
          <div>
            <label className="text-sm font-medium">GitHub</label>
            <input
              value={formData.github}
              onChange={(e) => setFormData({ ...formData, github: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="github.com/you"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Timezone</label>
            <input
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="America/Los_Angeles"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Location</label>
            <input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="City, Country"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Company</label>
            <input
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Company Legal</label>
            <input
              value={formData.companyLegal}
              onChange={(e) => setFormData({ ...formData, companyLegal: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Product</label>
            <input
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Stage</label>
            <input
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="Seed / Series A / Bootstrapped"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Style</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Wake Time</label>
            <input
              value={formData.wakeTime}
              onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="07:00"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Communication Style</label>
            <input
              value={formData.communicationStyle}
              onChange={(e) => setFormData({ ...formData, communicationStyle: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="Direct, async, concise"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Work Start</label>
            <input
              value={formData.workStartTime}
              onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="09:00"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Work End</label>
            <input
              value={formData.workEndTime}
              onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              placeholder="18:00"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Preferences (JSON)</label>
            <textarea
              value={formData.preferences}
              onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg font-mono text-sm"
              rows={4}
              placeholder='{ "focusMode": true }'
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goals & Mission</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Short Term</label>
            <textarea
              value={formData.shortTermGoals}
              onChange={(e) => setFormData({ ...formData, shortTermGoals: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={4}
              placeholder="One per line"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Medium Term</label>
            <textarea
              value={formData.mediumTermGoals}
              onChange={(e) => setFormData({ ...formData, mediumTermGoals: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={4}
              placeholder="One per line"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Long Term</label>
            <textarea
              value={formData.longTermGoals}
              onChange={(e) => setFormData({ ...formData, longTermGoals: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={4}
              placeholder="One per line"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="text-sm font-medium">My Mission</label>
            <textarea
              value={formData.myMission}
              onChange={(e) => setFormData({ ...formData, myMission: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={4}
              placeholder="Describe your personal mission, purpose, or guiding principles..."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Your personal mission statement helps your AI assistant understand your core values and long-term direction.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tech Stack & Focus</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Tech Stack</label>
            <textarea
              value={formData.techStack}
              onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={4}
              placeholder="One per line"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Current Focus</label>
            <textarea
              value={formData.currentFocus}
              onChange={(e) => setFormData({ ...formData, currentFocus: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={4}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
