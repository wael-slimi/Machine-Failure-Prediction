"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getPaginationRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  Row,
  HeaderGroup,
  Cell,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Machine } from "@/lib/api"
import { fetchMachines } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export function MachinesTable() {
  const [machines, setMachines] = React.useState<Machine[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const { toast } = useToast()

  React.useEffect(() => {
    async function loadMachines() {
      try {
        const data = await fetchMachines()
        console.log('Machines data:', data) // Debug log
        if (data && data.machines) {
          setMachines(data.machines)
        } else {
          console.error('Invalid machines data format:', data)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Invalid data format received from server.",
          })
        }
      } catch (error) {
        console.error('Error loading machines:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load machines. Please try again.",
        })
      } finally {
        setLoading(false)
      }
    }
    loadMachines()
  }, [toast])

  const columns: ColumnDef<Machine>[] = [
    {
      accessorKey: "machine_id",
      header: "ID",
    },
    {
      accessorKey: "machine_label",
      header: "Label",
    },
    {
      accessorKey: "machine_model_id",
      header: "Model ID",
    },
    {
      accessorKey: "machine_type_id",
      header: "Type ID",
    },
    {
      accessorKey: "box_macaddress",
      header: "MAC Address",
    },
    {
      accessorKey: "installation_date",
      header: "Installation Date",
    },
    {
      accessorKey: "working",
      header: "Status",
      cell: ({ row }) => (
        <div className={`font-medium ${row.original.working ? 'text-green-600' : 'text-red-600'}`}>
          {row.original.working ? 'Active' : 'Inactive'}
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: machines,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading machines...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by machine label..."
          value={(table.getColumn("machine_label")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("machine_label")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No machines found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}