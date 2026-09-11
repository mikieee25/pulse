"use client"

import { useState } from "react"
import { updatePassword } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { ReactElement } from "react"

export function ProfileSettings({ children }: { children: ReactElement }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(formData: FormData) {
    setError("")
    setSuccess("")
    const password = formData.get("password") as string
    const confirm = formData.get("confirmPassword") as string
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    const result = await updatePassword(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess("Password updated successfully.")
      setTimeout(() => setOpen(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); setError(""); setSuccess(""); }}>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-[400px] bg-canvas-deep border-line text-paper">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription className="text-slate">Change your account password.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <label htmlFor="profile-new-password" className="text-sm text-slate">New password</label>
            <Input id="profile-new-password" type="password" name="password" required minLength={12} className="bg-canvas border-line text-paper" />
          </div>
          <div className="space-y-1">
            <label htmlFor="profile-confirm-password" className="text-sm text-slate">Confirm new password</label>
            <Input id="profile-confirm-password" type="password" name="confirmPassword" required minLength={12} className="bg-canvas border-line text-paper" />
          </div>
          {error && <p role="alert" className="text-sm text-alert">{error}</p>}
          {success && <p role="status" className="text-sm text-pulse">{success}</p>}
          <div className="flex justify-end pt-2">
            <Button type="submit">Update Password</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
