import MachineGrid from "@/components/dashboard/machine-grid"
import StatusOverview from "@/components/dashboard/status-overview"
import { SearchAndFilter } from "@/components/dashboard/search-filter"
import DashboardNotificationTable from "@/components/dashboard/dashboard-notification-table"

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Machine Dashboard</h1>

      {/* Notification Table at the top of the dashboard */}
      <DashboardNotificationTable />

      <StatusOverview />

      <div className="bg-white rounded-lg shadow p-6">
        <SearchAndFilter />
        <MachineGrid />
      </div>
    </div>
  )
}
