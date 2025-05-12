"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { fetchMachines } from "@/lib/api"
import type { Machine } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function MachineList({ selectedMachineId }: { selectedMachineId: number }) {
  const [machines, setMachines] = useState<Machine[]>([])
  const [filteredMachines, setFilteredMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const loadMachines = async () => {
      try {
        setLoading(true)
        const data = await fetchMachines()
        setMachines(data)
        setFilteredMachines(data)
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load machines. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadMachines()
  }, [toast])

  // Filter machines when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMachines(machines)
    } else {
      const filtered = machines.filter(
        (machine) =>
          machine.machine_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          machine.machine_id.toString().includes(searchTerm),
      )
      setFilteredMachines(filtered)
    }
  }, [searchTerm, machines])

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-4">Loading machines...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="font-semibold mb-2">Machine List</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search machines..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredMachines.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">No machines found</div>
      ) : (
        <div className="divide-y max-h-[500px] overflow-y-auto">
          {filteredMachines.map((machine) => (
            <Link
              key={machine.machine_id}
              href={`/monitoring/${machine.machine_id}`}
              className={`block p-4 hover:bg-gray-50 transition-colors ${
                machine.machine_id === selectedMachineId ? "bg-gray-100" : ""
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{machine.machine_label}</div>
                  <div className="text-sm text-muted-foreground">ID: {machine.machine_id}</div>
                </div>
                <Badge variant={machine.is_active ? "success" : "secondary"}>
                  {machine.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
