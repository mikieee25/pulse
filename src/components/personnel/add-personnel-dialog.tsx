"use client"

import { FormEvent, ReactNode, useState } from "react"
import { addPersonnel, type PersonnelInput, updatePersonnel } from "@/app/actions/personnel"
import { PLANTILLA_STATUSES, suggestedInitials, type PlantillaStatus } from "@/lib/pulse"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type Division = { id: string; code: string; full_name: string }
type PersonnelFormValue = PersonnelInput & { id?: string }

export function AddPersonnelDialog({ children, divisions, initial }: { children: ReactNode; divisions: Division[]; initial?: PersonnelFormValue }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<PersonnelInput>(initial || {
    full_name: "",
    initials: "",
    position: "",
    division_id: divisions[0]?.id || "",
    plantilla_status: "Regular",
  })
  const set = <K extends keyof PersonnelInput>(key: K, value: PersonnelInput[K]) => setForm((current) => ({ ...current, [key]: value }))
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const result = initial?.id
      ? await updatePersonnel(initial.id, { ...form, initials: form.initials || suggestedInitials(form.full_name) })
      : await addPersonnel({ ...form, initials: form.initials || suggestedInitials(form.full_name) })
    if (result.error) setError(result.error)
    else {
      setOpen(false)
      if (!initial?.id) setForm({ ...form, full_name: "", initials: "", position: "" })
    }
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={children as React.ReactElement} /><DialogContent className="sm:max-w-[520px] bg-canvas-deep border-line text-paper"><DialogHeader><DialogTitle>{initial?.id ? "Edit personnel" : "Add personnel"}</DialogTitle><DialogDescription className="text-slate">Initials are suggested from the name but remain editable.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4">
    <label className="block space-y-1 text-sm text-slate">Full name<Input required value={form.full_name} onChange={(e) => setForm((current) => ({ ...current, full_name: e.target.value, initials: current.initials || suggestedInitials(e.target.value) }))} /></label>
    <label className="block space-y-1 text-sm text-slate">Initials<Input required value={form.initials} onChange={(e) => set("initials", e.target.value.toUpperCase())} /></label>
    <label className="block space-y-1 text-sm text-slate">Position<Input required value={form.position} onChange={(e) => set("position", e.target.value)} /></label>
    <label className="block space-y-1 text-sm text-slate">Division<select required value={form.division_id} onChange={(e) => set("division_id", e.target.value)} className="w-full h-9 rounded-md border border-line bg-canvas px-2 text-paper">{divisions.map((division) => <option key={division.id} value={division.id}>{division.code} — {division.full_name}</option>)}</select></label>
    <label className="block space-y-1 text-sm text-slate">Plantilla status<select value={form.plantilla_status} onChange={(e) => set("plantilla_status", e.target.value as PlantillaStatus)} className="w-full h-9 rounded-md border border-line bg-canvas px-2 text-paper">{PLANTILLA_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label>
    {error && <p className="text-sm text-alert">{error}</p>}<div className="flex justify-end"><Button type="submit">{initial?.id ? "Save changes" : "Save personnel"}</Button></div>
  </form></DialogContent></Dialog>
}
