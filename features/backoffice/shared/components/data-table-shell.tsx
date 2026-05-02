import type { ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type DataTableShellProps<T> = {
  columns: Array<{
    key: string
    header: string
    render: (item: T) => ReactNode
  }>
  rows: T[]
  getRowId: (item: T) => string
}

export function DataTableShell<T>({
  columns,
  rows,
  getRowId,
}: DataTableShellProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
     <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className="whitespace-nowrap px-4 py-3 text-start text-xs font-bold text-muted-foreground"
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => (
            <TableRow key={getRowId(row)} className="hover:bg-muted/40">
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className="align-middle px-4 py-3 text-start"
                >
                  <div className="min-w-0 overflow-hidden">
                    {column.render(row)}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}