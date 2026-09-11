"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { reassignEquipment, retireEquipment, updateEquipmentState } from "@/app/actions/equipment"
import { Button } from "@/components/ui/button"
import type { EquipmentCondition } from "@/lib/pulse"

type Person = { id: string; full_name: string; position?: string; plantilla_status?: string }

export function EquipmentActions({ id, personnel, currentState, currentCustodianId, currentAssigneeId }: { id: string; personnel: Person[], currentState: EquipmentCondition, currentCustodianId: string | null, currentAssigneeId: string | null }) {
  const [selectedCustodian, setSelectedCustodian] = useState(currentCustodianId || "")
  const [selectedAssignee, setSelectedAssignee] = useState(currentAssigneeId || "")
  const [message, setMessage] = useState("")
  const [state, setState] = useState(currentState)
  const router = useRouter()
  const eligibleCustodians = personnel.filter((person) => person.plantilla_status === "Regular" && !["PSS", "PES"].includes(person.position || ""))
  const eligibleAssignees = personnel.filter((person) => ["PSS", "PES"].includes(person.position || ""))
  
  async function saveCustodian() {
    const result = await reassignEquipment(id, selectedCustodian || null, "", "Custodian")
    setMessage(result.error || "Custodian updated.")
    if (!result.error) router.refresh()
  }
  async function saveAssignee() {
    const result = await reassignEquipment(id, selectedAssignee || null, "", "Assignee")
    setMessage(result.error || "Assignee updated.")
    if (!result.error) router.refresh()
  }
  async function retire() {
    if (!window.confirm("Archive this equipment? Its history will be kept.")) return
    const result = await retireEquipment(id)
    setMessage(result.error || "Equipment archived.")
    if (!result.error) router.refresh()
  }
  async function handleStateChange(newState: EquipmentCondition) {
    const previousState = state
    setState(newState)
    const result = await updateEquipmentState(id, newState)
    if (result.error) { setState(previousState as EquipmentCondition); setMessage(result.error) }
    else setMessage(`State updated to ${newState}.`)
    if (!result.error) router.refresh()
  }

  return <div className="flex flex-col xl:flex-row gap-8 items-start justify-between">
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <select aria-label="Select custodian" value={selectedCustodian} onChange={(event) => setSelectedCustodian(event.target.value)} className="h-8 w-56 rounded-lg border border-line bg-canvas px-2.5 text-sm text-paper font-sans outline-none focus-visible:ring-2 focus-visible:ring-pulse/50 transition-all">
          <option value="">Unassign Custodian</option>
          {eligibleCustodians.map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}
        </select>
        <Button variant="outline" onClick={saveCustodian}>Save Custodian</Button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select aria-label="Select assignee" value={selectedAssignee} onChange={(event) => setSelectedAssignee(event.target.value)} className="h-8 w-56 rounded-lg border border-line bg-canvas px-2.5 text-sm text-paper font-sans outline-none focus-visible:ring-2 focus-visible:ring-pulse/50 transition-all">
          <option value="">Unassign Assignee</option>
          {eligibleAssignees.map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}
        </select>
        <Button variant="outline" onClick={saveAssignee}>Save Assignee</Button>
      </div>
      <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-line">
        <Button variant="outline" onClick={retire}>Archive</Button>
      </div>
      {message && <p role="alert" className="text-sm text-slate">{message}</p>}
    </div>

    <div className="space-y-2 shrink-0 md:min-w-64">
       <span id="equipment-state-label" className="text-sm text-slate">State</span>
      <div className="flex items-center rounded-lg border border-line bg-canvas p-1">
         {["Good", "For Replacement", "Broken"].map(s => {
            const isActive = state === s
            const activeColor = s === "Good" ? "text-pulse" : s === "For Replacement" ? "text-alert" : "text-amber-300"
             return <button key={s} type="button" aria-pressed={isActive} aria-labelledby="equipment-state-label" onClick={() => handleStateChange(s as EquipmentCondition)} className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isActive ? `${activeColor} bg-canvas-deep shadow-sm` : 'text-slate hover:text-paper'}`}>
              {s}
            </button>
         })}
      </div>
    </div>
  </div>
}
