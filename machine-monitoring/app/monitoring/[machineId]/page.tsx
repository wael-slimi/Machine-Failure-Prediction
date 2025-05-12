import { redirect } from "next/navigation"

export default function MonitoringPage({ params }: { params: { machineId: string } }) {
  // Redirect to the new simulation page
  redirect(`/simulation`)
}
