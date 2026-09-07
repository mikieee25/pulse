"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { addPersonnel } from "@/app/actions/personnel"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const formSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  position: z.string().min(1, "Position is required"),
  plantilla_status: z.string().min(1, "Status is required"),
  division_code: z.string().min(1, "Division code is required"),
})

export function AddPersonnelDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      position: "",
      plantilla_status: "Regular",
      division_code: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const result = await addPersonnel(values)
    if (!result?.error) {
      setOpen(false)
      form.reset()
    } else {
      console.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-canvas-deep border-line text-paper">
        <DialogHeader>
          <DialogTitle>Add Personnel</DialogTitle>
          <DialogDescription className="text-slate">
            Enter the details for the new personnel.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Juan Dela Cruz" {...field} className="bg-canvas border-line" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. IT Officer I" {...field} className="bg-canvas border-line" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="division_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Division Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. OD, AMD, SDD" {...field} className="bg-canvas border-line uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plantilla_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plantilla Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-canvas border-line">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-canvas-deep border-line text-paper">
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Contractual">Contractual</SelectItem>
                      <SelectItem value="Job Order">Job Order</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-pulse text-canvas-deep hover:bg-pulse/90">
                Save Personnel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
