"use client"

import { MachinesTable } from "./machines-table"

export function Dashboard() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Machine Dashboard</h1>
      <MachinesTable />
    </div>
  )
} 