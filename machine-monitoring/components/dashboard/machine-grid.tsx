"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { fetchMachines } from "@/lib/api"
import type { Machine } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

export default function MachineGrid() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadMachines = async () => {
      try {
        setLoading(true)
        const data = await fetchMachines()
        console.log('Machines data in grid:', data) // Debug log
        if (data && data.machines) {
          setMachines(data.machines)
          setError(null)
        } else {
          console.error('Invalid machines data format in grid:', data)
          setError("Invalid data format received from server.")
          toast({
            title: "Error",
            description: "Invalid data format received from server.",
            variant: "destructive",
          })
        }
      } catch (err) {
        console.error('Error loading machines in grid:', err)
        setError("Failed to load machines. Please try again.")
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

  if (loading) {
    return <div className="flex justify-center p-8">Loading machines...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800">
        {error}
        <button className="ml-4 underline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (machines.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-md">
        <p className="text-muted-foreground mb-4">No machines found</p>
        <button className="bg-primary text-white px-4 py-2 rounded-md">Add Machine</button>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Machine ID</TableHead>
          <TableHead>Label</TableHead>
          <TableHead>Installation Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {machines.map((machine) => (
          <TableRow key={machine.machine_id}>
            <TableCell>{machine.machine_id}</TableCell>
            <TableCell>{machine.machine_label}</TableCell>
            <TableCell>{machine.installation_date}</TableCell>
            <TableCell>
              <Badge variant={machine.working ? "success" : "secondary"}>
                {machine.working ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell>
              <Link href={`/monitoring/${machine.machine_id}`} className="text-primary hover:underline">
                Monitor
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
