"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteEquipment, reassignEquipment, retireEquipment } from "@/app/actions/equipment"
import { Button } from "@/components/ui/button"

type Person = { id: string; full_name: string }

export function EquipmentActions({ id, personnel }: { id: string; personnel: Person[] }) {
  const [selected, setSelected] = useState("")
  const [message, setMessage] = useState("")
  const router = useRouter()
  async function reassign() {
    const result = await reassignEquipment(id, selected || null)
    setMessage(result.error || "Assignment updated.")
  }
  async function retire() {
    if (!window.confirm("Retire this equipment? Its history will be kept.")) return
    const result = await retireEquipment(id)
    setMessage(result.error || "Equipment retired.")
  }
  async function remove() {
    if (!window.confirm("Delete this equipment permanently?")) return
    const result = await deleteEquipment(id)
    if (!result.error) router.push("/equipment")
    else setMessage(result.error)
  }
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2">
      <select value={selected} onChange={(event) => setSelected(event.target.value)} className="h-9 rounded-md border border-line bg-canvas px-2 text-sm text-paper"><option value="">Unassign</option>{personnel.map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}</select>
      <Button variant="outline" onClick={reassign}>Save assignment</Button>
      <Button variant="outline" onClick={retire}>Retire</Button>
      <Button variant="destructive" onClick={remove}>Delete</Button>
    </div>
    {message && <p className="text-sm text-slate">{message}</p>}
  </div>
}
