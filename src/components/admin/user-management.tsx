"use client"

import { FormEvent, useState } from "react"
import { UserPlus, UsersRound } from "lucide-react"
import { createUser, updateUser } from "@/app/actions/admin"
import { SectionPanel } from "@/components/layout/section-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type User = { id: string; email: string; full_name: string; role: "Admin" | "Viewer"; division_scope: string | null }
export type Division = { id: string; code: string }

export function UserManagement({ users, divisions }: { users: User[]; divisions: Division[] }) {
  const [message, setMessage] = useState("")

  async function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const result = await createUser({ email: String(form.get("email")), full_name: String(form.get("full_name")), temporary_password: String(form.get("temporary_password")), role: String(form.get("role")) as "Admin" | "Viewer", division_scope: String(form.get("division_scope") || "") || null })
    setMessage(result.error || "User created. Give them the temporary password securely.")
    if (!result.error) event.currentTarget.reset()
  }

  async function save(user: User, event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const result = await updateUser(user.id, { role: String(form.get("role")) as "Admin" | "Viewer", division_scope: String(form.get("division_scope") || "") || null })
    setMessage(result.error || "User settings saved.")
  }

  return (
    <div className="space-y-6">
      <SectionPanel title="Add user" description="Create a login with a temporary password. The user must change it on first sign-in.">
        <form onSubmit={addUser} className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-6">
          <Input required name="full_name" aria-label="Full name" placeholder="Full name" />
          <Input required name="email" type="email" aria-label="Email address" placeholder="Email address" />
          <Input required minLength={12} name="temporary_password" type="password" autoComplete="new-password" aria-label="Temporary password" placeholder="Temporary password" />
          <select name="role" aria-label="User role" className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm text-paper outline-none transition focus:border-pulse focus:ring-2 focus:ring-pulse/15"><option>Viewer</option><option>Admin</option></select>
          <select name="division_scope" aria-label="Division scope" className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm text-paper outline-none transition focus:border-pulse focus:ring-2 focus:ring-pulse/15"><option value="">All divisions</option>{divisions.map((division) => <option key={division.id} value={division.id}>{division.code}</option>)}</select>
          <Button className="inline-flex items-center gap-2"><UserPlus className="size-4" aria-hidden="true" />Add user</Button>
        </form>
      </SectionPanel>

      {message && <p role="status" className="rounded-xl border border-pulse/20 bg-pulse/5 px-4 py-3 text-sm text-pulse">{message}</p>}

      <SectionPanel title="Registered users" description="Update roles and division access for existing users.">
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">Registered PULSE users</caption>
            <thead className="bg-canvas text-left text-slate"><tr className="border-b border-line"><th scope="col" className="px-5 py-3 font-medium">Name</th><th scope="col" className="px-4 py-3 font-medium">Email</th><th scope="col" className="px-4 py-3 font-medium">Settings</th></tr></thead>
            <tbody>
              {users.map((user) => <tr key={user.id} className="border-b border-line/50 transition hover:bg-paper/[0.025]"><th scope="row" className="px-5 py-4 text-left font-medium text-paper">{user.full_name}</th><td className="px-4 py-4 text-slate">{user.email}</td><td className="px-4 py-4"><form onSubmit={(event) => save(user, event)} className="flex flex-wrap gap-2"><select name="role" aria-label={`Role for ${user.full_name}`} defaultValue={user.role} className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm text-paper outline-none transition focus:border-pulse focus:ring-2 focus:ring-pulse/15"><option>Viewer</option><option>Admin</option></select><select name="division_scope" aria-label={`Division scope for ${user.full_name}`} defaultValue={user.division_scope || ""} className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm text-paper outline-none transition focus:border-pulse focus:ring-2 focus:ring-pulse/15"><option value="">All divisions</option>{divisions.map((division) => <option key={division.id} value={division.id}>{division.code}</option>)}</select><Button size="sm">Save</Button></form></td></tr>)}
              {!users.length && <tr><td colSpan={3} className="h-32 text-center text-slate"><UsersRound className="mx-auto mb-2 size-6" aria-hidden="true" />No registered users.</td></tr>}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  )
}
