/**
 * BentoDashboard Component
 *
 * API-driven Bento Grid layout with drag & drop.
 * Widgets are managed via PIN/UNPIN API, sized via S/M/L presets.
 */

'use client';

import { useState, useCallback } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { GripVertical, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

import 'react-grid-layout/css/styles.css';

// ============ Types ============
export interface WidgetConfig {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  size?: string;
  availableSizes?: string[];
  onSizeChange?: (size: string) => void;
  onRemove?: () => void;
}

export interface BentoDashboardProps {
  widgets: WidgetConfig[];
  initialLayout: Layout[];
  columns?: number;
  rowHeight?: number;
  gap?: number;
  onDragEnd?: (layout: Layout[]) => void;
  editable?: boolean;
}

// ============ Widget Card ============
function WidgetCard({
  title,
  icon,
  children,
  editable = false,
  size,
  availableSizes,
  onSizeChange,
  onRemove,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  editable?: boolean;
  size?: string;
  availableSizes?: string[];
  onSizeChange?: (size: string) => void;
  onRemove?: () => void;
}) {
  return (
    <div className={cn(
      "h-full w-full rounded-3xl border border-border bg-card shadow-lg overflow-hidden flex flex-col transition-all hover:shadow-xl",
      editable && "ring-2 ring-primary/20"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-primary shrink-0">{icon}</span>
          <h3 className="font-semibold text-sm truncate">{title}</h3>
        </div>

        {editable && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Size Selector */}
            {availableSizes && availableSizes.length > 1 && onSizeChange && (
              <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
                {availableSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSizeChange(s)}
                    className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-md transition-colors",
                      size === s
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Drag Handle */}
            <div className="drag-handle cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-muted transition-colors">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Remove */}
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto min-h-0">
        {children}
      </div>
    </div>
  );
}

// ============ Main Component ============
export function BentoDashboard({
  widgets,
  initialLayout,
  columns = 12,
  rowHeight = 80,
  gap = 16,
  onDragEnd,
  editable = false,
}: BentoDashboardProps) {
  const [layout, setLayout] = useState<Layout[]>(initialLayout);
  const [containerWidth, setContainerWidth] = useState(1200);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      resizeObserver.observe(node);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout);
  }, []);

  const handleDragStop = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout);
    onDragEnd?.(newLayout);
  }, [onDragEnd]);

  return (
    <div ref={containerRef} className="w-full bento-dashboard">
      <GridLayout
        className="layout"
        layout={layout}
        cols={columns}
        rowHeight={rowHeight}
        width={containerWidth}
        margin={[gap, gap]}
        containerPadding={[0, 0]}
        onLayoutChange={handleLayoutChange}
        onDragStop={handleDragStop}
        isDraggable={editable}
        isResizable={false}
        draggableHandle=".drag-handle"
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
      >
        {widgets.map((widget) => (
          <div key={widget.id}>
            <WidgetCard
              title={widget.title}
              icon={widget.icon}
              editable={editable}
              size={widget.size}
              availableSizes={widget.availableSizes}
              onSizeChange={widget.onSizeChange}
              onRemove={widget.onRemove}
            >
              {widget.component}
            </WidgetCard>
          </div>
        ))}
      </GridLayout>
    </div>
  );
}

// ============ Edit Mode Toggle ============
export function EditModeToggle({ isEditing, onToggle }: { isEditing: boolean; onToggle: () => void }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
        isEditing
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:text-foreground'
      )}
    >
      <Maximize2 className="h-4 w-4" />
      {isEditing ? t('layout.doneEditing') : t('layout.editLayout')}
    </button>
  );
}

export default BentoDashboard;
