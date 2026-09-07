"use client"

import { FormEvent, useState } from "react"
import { inviteUser, updateUser } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type User = { id: string; email: string; full_name: string; role: "Admin" | "Viewer"; division_scope: string | null }
export type Division = { id: string; code: string }

export function UserManagement({ users, divisions }: { users: User[]; divisions: Division[] }) {
  const [message, setMessage] = useState("")
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const result = await inviteUser({ email: String(form.get("email")), full_name: String(form.get("full_name")), role: String(form.get("role")) as "Admin" | "Viewer", division_scope: String(form.get("division_scope") || "") || null })
    setMessage(result.error || "Invitation sent.")
  }
  async function save(user: User, event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const result = await updateUser(user.id, { role: String(form.get("role")) as "Admin" | "Viewer", division_scope: String(form.get("division_scope") || "") || null })
    setMessage(result.error || "User updated.")
  }
  return <div className="space-y-6"><form onSubmit={invite} className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-canvas-deep border border-line rounded-lg p-4"><Input required name="full_name" placeholder="Full name" /><Input required name="email" type="email" placeholder="Email" /><select name="role" className="h-9 rounded-md border border-line bg-canvas px-2 text-paper"><option>Viewer</option><option>Admin</option></select><Button>Invite user</Button></form>{message && <p className="text-sm text-slate">{message}</p>}<div className="bg-canvas-deep border border-line rounded-lg p-5 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-line text-left text-slate"><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Settings</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-line"><td className="p-2 text-paper">{user.full_name}</td><td className="p-2">{user.email}</td><td className="p-2"><form onSubmit={(event) => save(user, event)} className="flex flex-wrap gap-2"><select name="role" defaultValue={user.role} className="h-8 rounded border border-line bg-canvas px-2 text-paper"><option>Viewer</option><option>Admin</option></select><select name="division_scope" defaultValue={user.division_scope || ""} className="h-8 rounded border border-line bg-canvas px-2 text-paper"><option value="">All divisions</option>{divisions.map((division) => <option key={division.id} value={division.id}>{division.code}</option>)}</select><Button size="sm">Save</Button></form></td></tr>)}</tbody></table></div></div>
}
