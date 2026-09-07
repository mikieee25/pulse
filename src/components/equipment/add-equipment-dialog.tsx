"use client"

import { FormEvent, ReactNode, useMemo, useState } from "react"
import { addEquipment, type EquipmentInput, updateEquipment } from "@/app/actions/equipment"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type Option = { id: string; code?: string; full_name?: string; fullName?: string; name?: string; plantilla_status?: string; division_id?: string }
export type EquipmentFormValue = EquipmentInput & { id?: string }

export function AddEquipmentDialog({ children, category, divisions, personnel, initial }: { children: ReactNode; category: string; divisions: Option[]; personnel: Option[]; initial?: EquipmentFormValue }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<EquipmentInput>(initial || {
    categoryName: category,
    brand: null,
    model: null,
    year_acquired: new Date().getFullYear(),
    serial_number: null,
    procurement_method: null,
    division_id: divisions[0]?.id || "",
    assigned_to: null,
    remarks: null,
  })
  const eligiblePersonnel = useMemo(() => personnel.filter((person) => person.division_id === form.division_id && person.plantilla_status === "Regular"), [personnel, form.division_id])
  const set = (key: keyof EquipmentInput, value: string | number | null) => setForm((current) => ({ ...current, [key]: value }))
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const result = initial?.id ? await updateEquipment(initial.id, form) : await addEquipment(form)
    if (result.error) setError(result.error)
    else setOpen(false)
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger render={children as React.ReactElement} />
    <DialogContent className="sm:max-w-[560px] bg-canvas-deep border-line text-paper">
      <DialogHeader><DialogTitle>{initial?.id ? "Edit equipment" : `Add ${category}`}</DialogTitle><DialogDescription className="text-slate">All changes are checked against the database rules.</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="space-y-1 text-sm text-slate">Category<select value={form.categoryName} onChange={(e) => set("categoryName", e.target.value)} className="w-full h-9 rounded-md border border-line bg-canvas px-2 text-paper">{["Laptop", "Tablet", "Desktop", "Drone", "Camera", "Printer"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="space-y-1 text-sm text-slate">Division<select required value={form.division_id} onChange={(e) => setForm((current) => ({ ...current, division_id: e.target.value, assigned_to: null }))} className="w-full h-9 rounded-md border border-line bg-canvas px-2 text-paper">{divisions.map((division) => <option key={division.id} value={division.id}>{division.code} — {division.full_name || division.fullName}</option>)}</select></label>
        <label className="space-y-1 text-sm text-slate">Brand<Input value={form.brand || ""} onChange={(e) => set("brand", e.target.value || null)} /></label>
        <label className="space-y-1 text-sm text-slate">Model<Input value={form.model || ""} onChange={(e) => set("model", e.target.value || null)} /></label>
        <label className="space-y-1 text-sm text-slate">Year acquired<Input type="number" value={form.year_acquired || ""} onChange={(e) => set("year_acquired", e.target.value ? Number(e.target.value) : null)} /></label>
        <label className="space-y-1 text-sm text-slate">Serial number<Input value={form.serial_number || ""} onChange={(e) => set("serial_number", e.target.value || null)} /></label>
        <label className="space-y-1 text-sm text-slate">Procurement method<Input value={form.procurement_method || ""} onChange={(e) => set("procurement_method", e.target.value || null)} /></label>
        <label className="space-y-1 text-sm text-slate">Assigned to<select value={form.assigned_to || ""} onChange={(e) => set("assigned_to", e.target.value || null)} className="w-full h-9 rounded-md border border-line bg-canvas px-2 text-paper"><option value="">Unassigned</option>{eligiblePersonnel.map((person) => <option key={person.id} value={person.id}>{person.full_name || person.fullName}</option>)}</select></label>
        <label className="space-y-1 text-sm text-slate sm:col-span-2">Remarks<textarea value={form.remarks || ""} onChange={(e) => set("remarks", e.target.value || null)} className="min-h-20 w-full rounded-md border border-line bg-canvas px-3 py-2 text-paper" /></label>
        {error && <p className="sm:col-span-2 text-sm text-alert">{error}</p>}
        <div className="sm:col-span-2 flex justify-end"><Button type="submit">{initial?.id ? "Save changes" : `Save ${category}`}</Button></div>
      </form>
    </DialogContent>
  </Dialog>
}
