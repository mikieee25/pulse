"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { addDivision } from "@/app/actions/divisions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  code: z.string().min(1, "Division code is required"),
  full_name: z.string().min(1, "Division name is required"),
})

export function AddDivisionDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      full_name: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (saving) return
    setSaving(true)
    setError("")
    try {
      const result = await addDivision(values)
      if (!result?.error) {
        setOpen(false)
        form.reset()
      } else {
        setError(result.error)
      }
    } catch {
      setError("Could not save division.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-[425px] bg-canvas-deep border-line text-paper">
        <DialogHeader>
          <DialogTitle>Add Division</DialogTitle>
          <DialogDescription className="text-slate">
            Register a new division for the bureau.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Division Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ITD" {...field} className="bg-canvas border-line uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Information Technology Division" {...field} className="bg-canvas border-line" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p role="alert" className="text-sm text-alert">{error}</p>}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saving} className="bg-pulse text-canvas-deep hover:bg-pulse/90">
                {saving ? "Saving…" : "Save Division"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
