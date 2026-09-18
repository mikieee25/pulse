"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteEquipment,
  reassignEquipment,
  retireEquipment,
  setEquipmentRts,
  updateEquipmentState,
} from "@/app/actions/equipment";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { EquipmentCondition } from "@/lib/pulse";

type Person = {
  id: string;
  full_name: string;
  position?: string;
  plantilla_status?: string;
};
type PendingEquipmentAction =
  "custodian" | "assignee" | "archive" | "state" | "rts" | "delete" | null;

export function EquipmentActions({
  id,
  personnel,
  currentState,
  currentCustodianId,
  currentAssigneeId,
  currentRts,
}: {
  id: string;
  personnel: Person[];
  currentState: EquipmentCondition;
  currentCustodianId: string | null;
  currentAssigneeId: string | null;
  currentRts: boolean;
}) {
  const [selectedCustodian, setSelectedCustodian] = useState(
    currentCustodianId || ""
  );
  const [selectedAssignee, setSelectedAssignee] = useState(
    currentAssigneeId || ""
  );
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [pendingAction, setPendingAction] =
    useState<PendingEquipmentAction>(null);
  const [state, setState] = useState(currentState);
  const [isRts, setIsRts] = useState(currentRts);
  const router = useRouter();
  const eligibleCustodians = personnel.filter(
    (person) =>
      person.plantilla_status === "Regular" &&
      !["PSS", "PES"].includes(person.position || "")
  );
  const eligibleAssignees = personnel.filter((person) =>
    ["PSS", "PES"].includes(person.position || "")
  );

  async function saveCustodian() {
    if (pendingAction) return;
    setPendingAction("custodian");
    setMessage("");
    try {
      const result = await reassignEquipment(
        id,
        selectedCustodian || null,
        "",
        "Custodian"
      );
      setMessage(result.error || "Custodian updated.");
      setMessageIsError(Boolean(result.error));
      if (!result.error) router.refresh();
    } catch {
      setMessage("Could not update custodian.");
      setMessageIsError(true);
    } finally {
      setPendingAction(null);
    }
  }
  async function saveAssignee() {
    if (pendingAction) return;
    setPendingAction("assignee");
    setMessage("");
    try {
      const result = await reassignEquipment(
        id,
        selectedAssignee || null,
        "",
        "Assignee"
      );
      setMessage(result.error || "Assignee updated.");
      setMessageIsError(Boolean(result.error));
      if (!result.error) router.refresh();
    } catch {
      setMessage("Could not update assignee.");
      setMessageIsError(true);
    } finally {
      setPendingAction(null);
    }
  }
  async function retire() {
    if (pendingAction) return;
    if (!window.confirm("Archive this equipment? Its history will be kept."))
      return;
    setPendingAction("archive");
    setMessage("");
    try {
      const result = await retireEquipment(id);
      setMessage(result.error || "Equipment archived.");
      setMessageIsError(Boolean(result.error));
      if (!result.error) router.refresh();
    } catch {
      setMessage("Could not archive equipment.");
      setMessageIsError(true);
    } finally {
      setPendingAction(null);
    }
  }
  async function handleStateChange(newState: EquipmentCondition) {
    if (pendingAction) return;
    const previousState = state;
    setPendingAction("state");
    setState(newState);
    setMessage("");
    try {
      const result = await updateEquipmentState(id, newState);
      if (result.error) {
        setState(previousState as EquipmentCondition);
        setMessage(result.error);
      } else setMessage(`Condition updated to ${newState}.`);
      setMessageIsError(Boolean(result.error));
      if (!result.error) router.refresh();
    } catch {
      setState(previousState as EquipmentCondition);
      setMessage("Could not update equipment state.");
      setMessageIsError(true);
    } finally {
      setPendingAction(null);
    }
  }

  async function toggleRts() {
    if (pendingAction) return;
    setPendingAction("rts");
    setMessage("");
    try {
      const next = !isRts;
      const result = await setEquipmentRts(id, next);
      if (result.error) setMessage(result.error);
      else {
        setIsRts(next);
        setMessage(next ? "Marked RTS." : "RTS tag removed.");
        router.refresh();
      }
      setMessageIsError(Boolean(result.error));
    } catch {
      setMessage("Could not update RTS tag.");
      setMessageIsError(true);
    } finally {
      setPendingAction(null);
    }
  }

  async function removeEquipment() {
    if (pendingAction) return;
    if (!window.confirm("Delete this equipment and its assignment history? This cannot be undone.")) return;
    setPendingAction("delete");
    setMessage("");
    try {
      const result = await deleteEquipment(id);
      if (result.error) {
        setMessage(result.error);
        setMessageIsError(true);
      } else router.push("/equipment");
    } catch {
      setMessage("Could not delete equipment.");
      setMessageIsError(true);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start justify-between">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <NativeSelect
            wrapperClassName="w-56"
            disabled={pendingAction !== null}
            aria-label="Select custodian"
            value={selectedCustodian}
            onChange={(event) => setSelectedCustodian(event.target.value)}
            className="h-8 w-56 rounded-lg border border-line bg-canvas pl-2.5 pr-10 text-sm text-paper font-sans outline-none focus-visible:ring-2 focus-visible:ring-pulse/50 transition-all"
          >
            <option value="">Unassign Custodian</option>
            {eligibleCustodians.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name}
              </option>
            ))}
          </NativeSelect>
          <Button
            variant="outline"
            disabled={pendingAction !== null}
            onClick={saveCustodian}
          >
            {pendingAction === "custodian" ? "Saving…" : "Save Custodian"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <NativeSelect
            wrapperClassName="w-56"
            disabled={pendingAction !== null}
            aria-label="Select assignee"
            value={selectedAssignee}
            onChange={(event) => setSelectedAssignee(event.target.value)}
            className="h-8 w-56 rounded-lg border border-line bg-canvas pl-2.5 pr-10 text-sm text-paper font-sans outline-none focus-visible:ring-2 focus-visible:ring-pulse/50 transition-all"
          >
            <option value="">Unassign Assignee</option>
            {eligibleAssignees.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name}
              </option>
            ))}
          </NativeSelect>
          <Button
            variant="outline"
            disabled={pendingAction !== null}
            onClick={saveAssignee}
          >
            {pendingAction === "assignee" ? "Saving…" : "Save Assignee"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-line">
          <Button
            variant="outline"
            disabled={pendingAction !== null}
            onClick={retire}
          >
            {pendingAction === "archive" ? "Archiving…" : "Archive"}
          </Button>
          <Button
            variant="outline"
            disabled={pendingAction !== null}
            onClick={toggleRts}
            aria-pressed={isRts}
          >
            {pendingAction === "rts"
              ? "Saving…"
              : isRts
                ? "Clear RTS"
                : "Mark RTS"}
          </Button>
          <Button
            variant="destructive"
            disabled={pendingAction !== null}
            onClick={removeEquipment}
          >
            {pendingAction === "delete" ? "Deleting…" : "Delete equipment"}
          </Button>
        </div>
        {message && (
          <p
            role={messageIsError ? "alert" : "status"}
            className="text-sm text-slate"
          >
            {message}
          </p>
        )}
      </div>

      <div className="space-y-2 shrink-0 md:min-w-64">
        <span id="equipment-condition-label" className="text-sm text-slate">
          Condition
        </span>
        <div className="flex items-center rounded-lg border border-line bg-canvas p-1">
          {["Good", "For Replacement", "Broken"].map((s) => {
            const isActive = state === s;
            const activeColor =
              s === "Good"
                ? "text-pulse"
                : s === "For Replacement"
                  ? "text-alert"
                  : "text-warning";
            return (
              <Button
                variant="ghost"
                size="sm"
                key={s}
                type="button"
                disabled={pendingAction !== null}
                aria-pressed={isActive}
                aria-labelledby="equipment-condition-label"
                onClick={() => handleStateChange(s as EquipmentCondition)}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isActive ? `${activeColor} bg-canvas-deep shadow-sm` : "text-slate hover:text-paper"}`}
              >
                {pendingAction === "state" ? "Saving…" : s}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
