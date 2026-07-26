import { Eye, Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RolePermissions } from "@/config/sidebarConfig";
import { Badge } from "@/components/ui/badge";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableWithActionsProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  permissions: RolePermissions;
  onView?: (item: T) => void;
  onCreate?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onApprove?: (item: T) => void;
  onReject?: (item: T) => void;
  title?: string;
  emptyMessage?: string;
}

export function DataTableWithActions<T extends { id: string }>({
  data,
  columns,
  permissions,
  onView,
  onCreate,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  title,
  emptyMessage = "No hay datos disponibles",
}: DataTableWithActionsProps<T>) {
  const hasActions =
    (permissions.canView && onView) ||
    (permissions.canEdit && onEdit) ||
    (permissions.canDelete && onDelete) ||
    (permissions.canApprove && (onApprove || onReject));

  return (
    <div className="space-y-4">
      {/* Header con título y botón crear */}
      {(title || (permissions.canCreate && onCreate)) && (
        <div className="flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {permissions.canCreate && onCreate && (
            <Button onClick={onCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Crear nuevo
            </Button>
          )}
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)}>{column.header}</TableHead>
              ))}
              {hasActions && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="text-center text-muted-foreground py-8"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((column) => (
                    <TableCell key={`${item.id}-${String(column.key)}`}>
                      {column.render
                        ? column.render(item)
                        : String(item[column.key as keyof T] ?? "")}
                    </TableCell>
                  ))}
                  {hasActions && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Ver - disponible para todos los roles */}
                        {permissions.canView && onView && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(item)}
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Editar - solo operador y admin */}
                        {permissions.canEdit && onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Aprobar - operador y admin */}
                        {permissions.canApprove && onApprove && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onApprove(item)}
                            title="Aprobar"
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Rechazar - operador y admin */}
                        {permissions.canApprove && onReject && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onReject(item)}
                            title="Rechazar"
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Eliminar - solo admin */}
                        {permissions.canDelete && onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(item)}
                            title="Eliminar"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default DataTableWithActions;
