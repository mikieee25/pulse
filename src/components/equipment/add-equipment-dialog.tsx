"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import {
  addEquipment,
  type EquipmentInput,
  updateEquipment,
} from "@/app/actions/equipment";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_EQUIPMENT_CATEGORIES } from "@/lib/pulse";

type Option = {
  id: string;
  code?: string;
  full_name?: string;
  fullName?: string;
  name?: string;
  plantilla_status?: string;
  division_id?: string;
  position?: string;
};
export type EquipmentFormValue = EquipmentInput & { id?: string };

function newEquipmentForm(
  category: string,
  divisions: Option[]
): EquipmentInput {
  return {
    categoryName: category,
    brand: null,
    model: null,
    year_acquired: new Date().getFullYear(),
    serial_number: null,
    procurement_method: null,
    division_id: divisions[0]?.id || "",
    assigned_to: null,
    assignee_id: null,
    condition_state: "Good",
    remarks: null,
  };
}

export function AddEquipmentDialog({
  children,
  category,
  categories,
  divisions,
  personnel,
  initial,
}: {
  children: ReactNode;
  category: string;
  categories?: string[];
  divisions: Option[];
  personnel: Option[];
  initial?: EquipmentFormValue;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EquipmentInput>(
    initial || newEquipmentForm(category, divisions)
  );
  const categoryOptions = categories?.length
    ? categories
    : [...DEFAULT_EQUIPMENT_CATEGORIES];

  const eligibleCustodians = useMemo(
    () =>
      personnel.filter(
        (person) =>
          person.division_id === form.division_id &&
          person.plantilla_status === "Regular" &&
          !["PSS", "PES"].includes(person.position || "")
      ),
    [personnel, form.division_id]
  );
  const eligibleAssignees = useMemo(
    () =>
      personnel.filter(
        (person) =>
          person.division_id === form.division_id &&
          ["PSS", "PES"].includes(person.position || "")
      ),
    [personnel, form.division_id]
  );

  const set = (key: keyof EquipmentInput, value: string | number | null) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const result = initial?.id
        ? await updateEquipment(initial.id, form)
        : await addEquipment(form);
      if (result.error) setError(result.error);
      else {
        setOpen(false);
        if (!initial?.id) setForm(newEquipmentForm(category, divisions));
      }
    } catch {
      setError("Could not save equipment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-[560px] bg-canvas-deep border-line text-paper">
        <DialogHeader>
          <DialogTitle>
            {initial?.id ? "Edit equipment" : `Add ${category}`}
          </DialogTitle>
          <DialogDescription className="text-slate">
            All changes are checked against the database rules.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={submit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <label className="space-y-1 text-sm text-slate">
            Category
            <NativeSelect
              wrapperClassName="w-full"
              value={form.categoryName}
              onChange={(e) => set("categoryName", e.target.value)}
              className="w-full h-9 rounded-md border border-line bg-canvas pl-2 pr-10 text-paper"
            >
              {categoryOptions.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </NativeSelect>
          </label>
          <label className="space-y-1 text-sm text-slate">
            Division
            <NativeSelect
              wrapperClassName="w-full"
              required
              value={form.division_id}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  division_id: e.target.value,
                  assigned_to: null,
                  assignee_id: null,
                }))
              }
              className="w-full h-9 rounded-md border border-line bg-canvas pl-2 pr-10 text-paper"
            >
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.code} — {division.full_name || division.fullName}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="space-y-1 text-sm text-slate">
            Brand
            <Input
              value={form.brand || ""}
              onChange={(e) => set("brand", e.target.value || null)}
            />
          </label>
          <label className="space-y-1 text-sm text-slate">
            Model
            <Input
              value={form.model || ""}
              onChange={(e) => set("model", e.target.value || null)}
            />
          </label>
          <label className="space-y-1 text-sm text-slate">
            Year acquired
            <Input
              type="number"
              value={form.year_acquired || ""}
              onChange={(e) =>
                set(
                  "year_acquired",
                  e.target.value ? Number(e.target.value) : null
                )
              }
            />
          </label>
          <label className="space-y-1 text-sm text-slate">
            Serial number
            <Input
              value={form.serial_number || ""}
              onChange={(e) => set("serial_number", e.target.value || null)}
            />
          </label>
          <label className="space-y-1 text-sm text-slate">
            State
            <NativeSelect
              wrapperClassName="w-full"
              value={form.condition_state || "Good"}
              onChange={(e) => set("condition_state", e.target.value)}
              className="w-full h-9 rounded-md border border-line bg-canvas pl-2 pr-10 text-paper"
            >
              {["Good", "For Replacement", "Broken"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="space-y-1 text-sm text-slate">
            Procurement method
            <Input
              value={form.procurement_method || ""}
              onChange={(e) =>
                set("procurement_method", e.target.value || null)
              }
            />
          </label>
          <label className="space-y-1 text-sm text-slate">
            Custodian (Regulars)
            <NativeSelect
              wrapperClassName="w-full"
              value={form.assigned_to || ""}
              onChange={(e) => set("assigned_to", e.target.value || null)}
              className="w-full h-9 rounded-md border border-line bg-canvas pl-2 pr-10 text-paper"
            >
              <option value="">Unassigned</option>
              {eligibleCustodians.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name || person.fullName}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="space-y-1 text-sm text-slate">
            Assignee (PSS/PES)
            <NativeSelect
              wrapperClassName="w-full"
              value={form.assignee_id || ""}
              onChange={(e) => set("assignee_id", e.target.value || null)}
              className="w-full h-9 rounded-md border border-line bg-canvas pl-2 pr-10 text-paper"
            >
              <option value="">Unassigned</option>
              {eligibleAssignees.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name || person.fullName}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="space-y-1 text-sm text-slate sm:col-span-2">
            Remarks
            <Textarea
              value={form.remarks || ""}
              onChange={(e) => set("remarks", e.target.value || null)}
              className="min-h-20 w-full rounded-md border border-line bg-canvas px-3 py-2 text-paper"
            />
          </label>
          {error && (
            <p role="alert" className="sm:col-span-2 text-sm text-alert">
              {error}
            </p>
          )}
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving…"
                : initial?.id
                  ? "Save changes"
                  : `Save ${category}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
