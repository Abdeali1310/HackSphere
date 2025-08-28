"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface TeamFormProps {
  eventId: string
  team?: { id: string; name: string; description: string }
  onSuccess: () => void
  onCancel: () => void
}

export default function TeamForm({ eventId, team, onSuccess, onCancel }: TeamFormProps) {
  const [name, setName] = useState(team?.name || "")
  const [description, setDescription] = useState(team?.description || "")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!name.trim()) return toast({ title: "Team name required", variant: "destructive" })
    setLoading(true)
    try {
      const res = await fetch(team ? `/api/teams/${team.id}` : `/api/events/${eventId}/teams`, {
        method: team ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: team ? "Team updated!" : "Team created!" })
        onSuccess()
      } else throw new Error(data.error)
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <Label>Name</Label>
      <Input value={name} onChange={(e) => setName(e.target.value)} />
      <Label>Description</Label>
      <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
