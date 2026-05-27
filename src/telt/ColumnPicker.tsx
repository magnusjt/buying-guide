import { useEffect, useReducer, useRef, useState } from 'react';
import type { ColumnDefinition } from 'tabulator-tables';
import type { TabulatorHandle } from '../shared/TabulatorTable';

export interface ColumnGroup {
  label: string;
  columns: ColumnDefinition[];
}

interface Props {
  groups: ColumnGroup[];
  tableHandle: React.RefObject<TabulatorHandle | null>;
  /** Felt-navn som er skjult som default (brukt av Tilbakestill-knappen). */
  hiddenByDefault: Set<string>;
  /** Bumpes når tabellen er klar, så vi kan rendre korrekt sjekkbox-state. */
  tableReady: boolean;
}

export function ColumnPicker({ groups, tableHandle, hiddenByDefault, tableReady }: Props) {
  const [open, setOpen] = useState(false);
  const [, refresh] = useReducer((x: number) => x + 1, 0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const getTab = () => tableHandle.current?.table ?? null;

  const isVisible = (field: string): boolean => {
    const tab = getTab();
    if (!tab) return true;
    const c = tab.getColumn(field);
    return c ? c.isVisible() : true;
  };

  const toggle = (field: string) => {
    const c = getTab()?.getColumn(field);
    if (c) {
      c.toggle();
      refresh();
    }
  };

  const reset = () => {
    const tab = getTab();
    if (!tab) return;
    tab.getColumns().forEach((c) => {
      const f = c.getField();
      if (!f) return;
      const shouldHide = hiddenByDefault.has(f);
      if (shouldHide && c.isVisible()) c.hide();
      else if (!shouldHide && !c.isVisible()) c.show();
    });
    refresh();
  };

  const visibleCount = tableReady
    ? getTab()?.getColumns().filter((c) => c.isVisible()).length ?? 0
    : 0;
  const totalCount = groups.reduce((n, g) => n + g.columns.length, 0);

  return (
    <div className="column-picker" ref={containerRef}>
      <button
        type="button"
        className="column-picker-btn"
        onClick={() => setOpen((o) => !o)}
        disabled={!tableReady}
        aria-expanded={open}
      >
        Kolonner ({visibleCount}/{totalCount}) ▾
      </button>
      {open && (
        <div className="column-picker-panel" role="dialog" aria-label="Velg kolonner">
          <div className="column-picker-header">
            <strong>Vis kolonner</strong>
            <button type="button" onClick={reset} className="column-picker-reset">
              Tilbakestill
            </button>
          </div>
          <div className="column-picker-body">
            {groups.map((g) => (
              <fieldset key={g.label} className="column-picker-group">
                <legend>{g.label}</legend>
                {g.columns.map((col) => {
                  const field = col.field;
                  if (!field) return null;
                  const checked = isVisible(field);
                  return (
                    <label key={field} className="column-picker-item">
                      <input type="checkbox" checked={checked} onChange={() => toggle(field)} />
                      <span>{col.title}</span>
                    </label>
                  );
                })}
              </fieldset>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
