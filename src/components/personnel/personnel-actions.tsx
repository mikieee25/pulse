"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deletePersonnel } from "@/app/actions/personnel"
import { AddPersonnelDialog } from "@/components/personnel/add-personnel-dialog"
import { Button } from "@/components/ui/button"
import type { PersonnelData } from "@/components/personnel/columns"

type Division = { id: string; code: string; full_name: string }

export function PersonnelActions({ person, divisions }: { person: PersonnelData; divisions: Division[] }) {
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function remove() {
    if (!window.confirm(`Delete ${person.full_name}? This cannot be undone.`)) return
    setDeleting(true)
    setError("")
    const result = await deletePersonnel(person.id)
    if (result.error) setError(result.error)
    else router.refresh()
    setDeleting(false)
  }

  return <div className="flex flex-wrap items-center gap-2">
    <AddPersonnelDialog
      divisions={divisions}
      initial={{
        id: person.id,
        full_name: person.full_name,
        initials: person.initials,
        position: person.position || "",
        division_id: person.division_id,
        plantilla_status: person.plantilla_status || "Regular",
      }}
    >
      <Button type="button" variant="outline" size="sm">Edit</Button>
    </AddPersonnelDialog>
    <Button type="button" variant="destructive" size="sm" onClick={remove} disabled={deleting}>
      {deleting ? "Deleting…" : "Delete"}
    </Button>
    {error && <span className="basis-full text-xs text-alert">{error}</span>}
  </div>
}
