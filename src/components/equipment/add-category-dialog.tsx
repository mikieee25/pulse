"use client"

import { FormEvent, ReactNode, useState } from "react"
import { addEquipmentCategory } from "@/app/actions/equipment-categories"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function AddCategoryDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSaving(true)
    const result = await addEquipmentCategory({ name })
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setName("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setError("") }}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="border-line bg-canvas-deep text-paper sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add equipment category</DialogTitle>
          <DialogDescription className="text-slate">New categories use PULSE&apos;s shared lifecycle rule.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1.5 text-sm text-slate">
            Category name
            <Input autoFocus required maxLength={50} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Server" />
          </label>
          {error && <p className="text-sm text-alert" role="alert">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add category"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
