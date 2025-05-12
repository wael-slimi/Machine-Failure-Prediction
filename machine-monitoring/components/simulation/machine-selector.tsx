"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Machine } from "@/lib/types"

interface MachineSelectorProps {
  machines: Machine[]
  selectedMachineId: number
  onMachineChange: (machineId: number) => void
}

export default function MachineSelector({ machines, selectedMachineId, onMachineChange }: MachineSelectorProps) {
  return (
    <div className="w-full max-w-xs">
      <Select value={selectedMachineId.toString()} onValueChange={(value) => onMachineChange(Number.parseInt(value))}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a machine" />
        </SelectTrigger>
        <SelectContent>
          {machines.map((machine) => (
            <SelectItem key={machine.machine_id} value={machine.machine_id.toString()}>
              {machine.machine_label}
              {!machine.is_active && " (Inactive)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
