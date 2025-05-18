"use client"

import { MachinesTable } from "./machines-table"
import StatusOverview from "./status-overview"
import { SearchAndFilter } from "./search-filter"
import MachineGrid from "./machine-grid"
import DashboardNotificationTable from "./dashboard-notification-table"

export function Dashboard() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Machine Dashboard</h1>
      <DashboardNotificationTable />
      <StatusOverview />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <SearchAndFilter />
          <MachineGrid />
        </div>
      </div>
    </div>
  )
} 