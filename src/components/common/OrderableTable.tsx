import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
}

interface OrderableTableProps<T extends { id: string | number; order: number }> {
  data: T[];
  columns: Column<T>[];
  onReorder: (items: T[]) => void;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

function SortableRow<T extends { id: string | number; order: number }>({
  item,
  columns,
  onView,
  onEdit,
  onDelete,
}: {
  item: T;
  columns: Column<T>[];
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(item.id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-50 bg-muted/50' : ''}
    >
      <td className="w-10 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </td>
      {columns.map((col) => (
        <td key={col.key}>
          {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
        </td>
      ))}
      {(onView || onEdit || onDelete) && (
        <td className="text-right space-x-2">
          {onView && (
            <Button variant="ghost" size="sm" onClick={() => onView(item)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(String(item.id))}>
              Delete
            </Button>
          )}
        </td>
      )}
    </tr>
  );
}

export function OrderableTable<T extends { id: string | number; order: number }>({
  data,
  columns,
  onReorder,
  onView,
  onEdit,
  onDelete,
  loading = false,
}: OrderableTableProps<T>) {
  const [items, setItems] = useState(data);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    setItems(data);
  }, [data]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => String(i.id) === active.id);
    const newIndex = items.findIndex((i) => String(i.id) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    const withOrder = newItems.map((it, idx) => ({ ...it, order: idx }));
    onReorder(withOrder);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-10" />
              {columns.map((col) => (
                <th key={col.key} className="text-left px-4 py-3 font-medium">
                  {col.header}
                </th>
              ))}
              {(onView || onEdit || onDelete) && (
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 2} className="text-center py-8 text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="text-center py-8 text-muted-foreground">
                  No data
                </td>
              </tr>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={items.map((i) => String(i.id))}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map((item) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      columns={columns}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
