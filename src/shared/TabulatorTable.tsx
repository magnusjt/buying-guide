import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import {
  TabulatorFull as Tabulator,
  type Options,
  type ColumnDefinition,
  type EventCallBackMethods,
} from 'tabulator-tables';

/** Imperativ handle som eksponerer den underliggende Tabulator-instansen.
 *  `table` er null før mount og etter unmount. Bruk det for å kalle f.eks.
 *  setFilter, getColumn, getRow, scrollTo direkte. */
export interface TabulatorHandle {
  readonly table: Tabulator | null;
}

type EventMap = Partial<{ [K in keyof EventCallBackMethods]: EventCallBackMethods[K] }>;

interface Props {
  /** Rad-data. Endring i denne propen kaller replaceData — ingen recreate. */
  data: object[];
  /** Kolonnedefinisjoner. Settes ved mount, ikke reaktiv. */
  columns: ColumnDefinition[];
  /** Alle andre Tabulator-options. Settes ved mount, ikke reaktiv. */
  options?: Omit<Options, 'data' | 'columns'>;
  /** Event-handlere. Latest-ref pattern — endringer plukkes opp uten re-binding. */
  events?: EventMap;
  className?: string;
}

/**
 * Tynn React-wrapper rundt tabulator-tables 6.x. Forskjellen fra å bruke
 * Tabulator direkte:
 *   - data-endringer kaller replaceData (bevarer header-filter, sort, scroll)
 *   - lifecycle håndteres internt (mount/unmount, ingen tap ved HMR av props)
 *   - event-handlere kan endres uten å re-binde (latest-ref via eventsRef)
 *   - imperativ tilgang til tabellen via forwardRef-handle
 */
export const TabulatorTable = forwardRef<TabulatorHandle, Props>(function TabulatorTable(
  { data, columns, options, events, className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<Tabulator | null>(null);
  /** Sist data-referanse vi sendte til replaceData. Brukes for å hoppe over
   *  StrictMode-replays av data-sync useEffect som ellers ville restartet
   *  tabellen med samme data. */
  const lastSyncedDataRef = useRef<unknown>(null);

  // Latest-ref pattern: handlerne og data leses fra ref ved hver kall så
  // endringer på props plukkes opp uten å destruere tabellen.
  const dataRef = useRef(data);
  const eventsRef = useRef(events);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useImperativeHandle(
    ref,
    () => ({
      get table() {
        return tabRef.current;
      },
    }),
    [],
  );

  // Mount én gang. Aldri re-mount på prop-endringer.
  useEffect(() => {
    if (!containerRef.current) return;
    const tab = new Tabulator(containerRef.current, {
      ...(options ?? {}),
      data: dataRef.current,
      columns,
    });
    tabRef.current = tab;
    // Marker initial data som allerede synket så data-sync useEffect ikke
    // dobbel-anvender den (og dermed unngår replaceData før tableBuilt).
    lastSyncedDataRef.current = dataRef.current;

    // Bind én wrapper per event-key (snapshot ved mount). Wrapperen henter
    // siste handler fra eventsRef ved hver invokering — nye event-typer
    // som tilføyes etter mount blir IKKE auto-bundet (sjelden tilfelle).
    const keys = Object.keys(eventsRef.current ?? {}) as (keyof EventCallBackMethods)[];
    for (const key of keys) {
      const dispatcher = (...args: unknown[]) => {
        const fn = eventsRef.current?.[key] as ((...a: unknown[]) => void) | undefined;
        fn?.(...args);
      };
      tab.on(key, dispatcher as never);
    }

    return () => {
      tab.destroy();
      tabRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync data uten å destruere tabellen — kun når data faktisk endrer referanse.
  // React 19 + StrictMode kan replaye useEffects flere ganger med SAMME data
  // (via Activity/reconnectPassiveEffects). En enkel `isInitial`-guard er ikke
  // nok — vi må sammenligne med sist synkede ref og hoppe over ekte duplikater.
  useEffect(() => {
    if (lastSyncedDataRef.current === data) return; // allerede synket denne ref
    lastSyncedDataRef.current = data;
    const tab = tabRef.current;
    if (!tab) return;
    void tab.replaceData(data);
  }, [data]);

  return <div ref={containerRef} className={className} />;
});
