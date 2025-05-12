"use client"

import dynamic from 'next/dynamic'

// Dynamically import NotificationTable with no SSR
const NotificationTable = dynamic(() => import('./notification-table'), {
  ssr: false,
})

export default function NotificationWrapper() {
  return <NotificationTable />
} 