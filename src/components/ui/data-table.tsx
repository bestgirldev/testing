"use client";

import * as React from "react";
import {
  ColumnDef,
  FilterFn,
  Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Payment, usePaymentsStore } from "@/store/paymnet";

type DataTableProps<TData extends Payment> = {
  columns: ColumnDef<TData>[];
};

const globalCellFilter: FilterFn<any> = (row, _columnId, filterValue) => {
  const search = String(filterValue ?? "")
    .toLowerCase()
    .trim();

  if (!search) return true;

  return row.getAllCells().some((cell) => {
    const value = cell.getValue();

    if (value === null || value === undefined) return false;

    return String(value).toLowerCase().includes(search);
  });
};

type RowDragContextValue = Pick<
  ReturnType<typeof useSortable>,
  "attributes" | "listeners" | "setActivatorNodeRef"
>;

const RowDragContext = React.createContext<RowDragContextValue | null>(null);

function DragHandle() {
  const context = React.useContext(RowDragContext);

  if (!context) return null;

  return (
    <Button
      ref={context.setActivatorNodeRef}
      variant="ghost"
      size="icon"
      className="size-7 cursor-grab active:cursor-grabbing"
      {...context.attributes}
      {...context.listeners}
    >
      <GripVertical className="size-4" />
      <span className="sr-only">Drag row</span>
    </Button>
  );
}

function DraggableRow<TData extends Payment>({ row }: { row: Row<TData> }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.id,
  });

  return (
    <RowDragContext.Provider
      value={{
        attributes,
        listeners,
        setActivatorNodeRef,
      }}
    >
      <TableRow
        ref={setNodeRef}
        data-state={row.getIsSelected() && "selected"}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.7 : 1,
          position: "relative",
          zIndex: isDragging ? 1 : 0,
        }}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    </RowDragContext.Provider>
  );
}

export function DataTable<TData extends Payment>({
  columns,
}: DataTableProps<TData>) {
  const payments = usePaymentsStore((state) => state.payments);
  const reorderPayments = usePaymentsStore((state) => state.reorderPayments);

  const [globalFilter, setGlobalFilter] = React.useState("");

  const columnsWithDrag = React.useMemo<ColumnDef<TData>[]>(
    () => [
      {
        id: "drag",
        header: "",
        cell: () => <DragHandle />,
        enableSorting: false,
        enableHiding: false,
        enableGlobalFilter: false,
      },
      ...columns,
    ],
    [columns],
  );

  const table = useReactTable({
    data: payments as TData[],
    columns: columnsWithDrag,
    getRowId: (row) => String(row.id),

    state: {
      globalFilter,
    },

    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalCellFilter,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    reorderPayments(String(active.id), String(over.id));
  }

  const rowIds = table.getRowModel().rows.map((row) => row.id);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search all payments..."
        value={globalFilter}
        onChange={(event) => setGlobalFilter(event.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
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
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              <SortableContext
                items={rowIds}
                strategy={verticalListSortingStrategy}
              >
                {table.getRowModel().rows.length ? (
                  table
                    .getRowModel()
                    .rows.map((row) => <DraggableRow key={row.id} row={row} />)
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columnsWithDrag.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>
    </div>
  );
}
