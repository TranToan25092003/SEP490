import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableCellMinContent,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectedItemsActions } from "./SelectedItemsActions";

/**
 * @typedef {Object} CRUDTableProps
 * @property {any[]} data
 * @property {string | undefined} [className]
 * @property {import("@tanstack/react-table").ColumnDef[]} columns
 * @property {(row: any) => string} getRowId
 * @property {(items: string[] | undefined) => void} [onSelectedItemsChange]
 * @property {string[] | undefined} [selectedItems]
 * @property {boolean} [isLoading=false]
 * @property {boolean} [readOnly=false]
 * @property {(row: any) => React.ReactNode} [children]
 */

/**
 * @param {CRUDTableProps} props
 * @returns {React.ReactNode}
 */
const convertToRowSelection = (selectedItems) => {
  return selectedItems.reduce((acc, item) => {
    acc[item] = true;
    return acc;
  }, {});
};

/**
  @param {CRUDTableProps} props
 * @returns {React.ReactElement}
 */
const CRUDTable = ({
  data,
  columns,
  getRowId,
  onSelectedItemsChange,
  isLoading = false,
  selectedItems,
  readOnly = false,
  children,
  className,
  ...props
}) => {
  const [sorting, setSorting] = useState([]);

  const columnHelper = useMemo(() => createColumnHelper(), []);
  const selectionEnabled =
    typeof onSelectedItemsChange === "function" &&
    !readOnly &&
    Array.isArray(selectedItems);

  const colDefs = useMemo(
    () => [
      ...(selectionEnabled
        ? [
            {
              id: "select",
              header: ({ table }) => (
                <Checkbox
                  checked={table.getIsAllRowsSelected()}
                  className="size-5"
                  onCheckedChange={(value) => {
                    if (typeof value === "boolean") {
                      table.toggleAllRowsSelected(value);
                    }
                  }}
                  disabled={readOnly}
                  aria-label="Select all"
                />
              ),
              cell: ({ row }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  className="size-5"
                  onCheckedChange={(value) => {
                    if (typeof value === "boolean") {
                      row.toggleSelected(value);
                    }
                  }}
                  disabled={!row.getCanSelect() || readOnly}
                  aria-label="Select row"
                />
              ),
            },
          ]
        : []),
      ...columns,
      ...(readOnly || typeof children !== "function"
        ? []
        : [
            columnHelper.display({
              id: "actions",
              header: "Hành động",
              cell: (info) => {
                const node = children(info.row.original);
                return node;
              },
            }),
          ]),
    ],
    [columns, columnHelper]
  );

  const table = useReactTable({
    data,
    columns: colDefs,
    state: {
      sorting,
      rowSelection: convertToRowSelection(selectedItems ?? []),
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: (updaterOrValue) => {
      const state =
        typeof updaterOrValue === "function"
          ? updaterOrValue(table.getState().rowSelection)
          : updaterOrValue;
      onSelectedItemsChange?.(Object.keys(state));
    },
    getRowId,
    enableRowSelection: true,
  });

  return (
    <Table className={cn(className)} {...props}>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const isFirst = header.column.getIsFirstColumn();
              const isLast = header.column.getIsLastColumn();

              return (
                <TableHead
                  key={header.id}
                  className={cn(
                    header.column.getCanSort()
                      ? "cursor-pointer select-none"
                      : "",
                    {
                      "pl-4": isFirst,
                      "pr-4": isLast,
                    }
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {header.column.getIsSorted() ? (
                      <span className="ml-2">
                        {header.column.getIsSorted() === "asc" ? "↑" : "↓"}
                      </span>
                    ) : null}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell
              colSpan={table.getAllColumns().length}
              className="text-center py-8"
            >
              <div className="flex justify-center">
                <Spinner className="h-6 w-6" />
              </div>
            </TableCell>
          </TableRow>
        ) : table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={table.getAllColumns().length}
              className="text-center py-8 text-muted-foreground"
            >
              Không có dữ liệu
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
            >
              {row.getVisibleCells().map((cell) => {
                const cellId = cell.column.id;
                const isFirst = cell.column.getIsFirstColumn();
                const isLast = cell.column.getIsLastColumn();
                const isSelect = cellId === "select";
                const isAction = cellId === "actions";
                const Comp =
                  isAction || isSelect ? TableCellMinContent : TableCell;
                return (
                  <Comp
                    className={cn({
                      "pl-2 pr-4": isSelect,
                      "pl-4": isFirst,
                      "pr-4": isLast,
                    })}
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Comp>
                );
              })}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

CRUDTable.SelectedItemsActions = SelectedItemsActions;

export default CRUDTable;
