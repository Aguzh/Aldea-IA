import { useState } from 'react';
import type { LogEntry } from '../types/simulation';

interface EventLogPanelProps {
  logs: LogEntry[];
}

const TONE_DOTS: Record<LogEntry['tone'], string> = {
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  sky: 'text-sky-400',
  violet: 'text-violet-400',
  slate: 'text-slate-400',
};

const MAX_DISPLAYED_LOGS = 20;

export function EventLogPanel({ logs }: EventLogPanelProps) {
  const [minimized, setMinimized] = useState(false);
  const visibleLogs = logs.slice(0, MAX_DISPLAYED_LOGS);

  return (
    <section
      className={`bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col gap-2.5 ${
        minimized ? 'shrink-0' : 'flex-1 min-h-[260px]'
      }`}
      data-testid="event-log-panel"
    >
      <div className="flex items-center justify-between gap-2 shrink-0">
        <h2 className="text-xs font-semibold tracking-wide text-slate-400">Crónica de la Aldea</h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tabular-nums text-slate-500" data-testid="event-log-count">
            {visibleLogs.length}/{logs.length} reg. (máx 20)
          </span>
          <button
            type="button"
            aria-expanded={!minimized}
            aria-label={minimized ? 'Expandir Crónica de la Aldea' : 'Minimizar Crónica de la Aldea'}
            data-testid="toggle-eventlog-panel"
            onClick={() => setMinimized((v) => !v)}
            className="w-6 h-6 rounded bg-[#0b1120] border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-mono flex items-center justify-center transition-colors"
          >
            {minimized ? '+' : '−'}
          </button>
        </div>
      </div>

      {!minimized && (
        <ul
          className="flex flex-col divide-y divide-slate-800/80 flex-1 min-h-0 overflow-y-auto pr-1"
          data-testid="event-log"
        >
          {visibleLogs.map((entry) => (
            <li key={entry.id} className="py-2 text-xs leading-relaxed text-slate-200 flex gap-2">
              <span className={`font-mono tabular-nums shrink-0 ${TONE_DOTS[entry.tone]}`}>
                Día {entry.day}
              </span>
              <span className="text-slate-300">{entry.text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
