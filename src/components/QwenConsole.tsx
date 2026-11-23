import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { QwenMessage, QwenPolicyState } from '../types/simulation';

interface QwenConsoleProps {
  messages: QwenMessage[];
  policies: QwenPolicyState;
  ollamaEnabled: boolean;
  ollamaModel: string;
  isBusy: boolean;
  onSendDirective: (text: string) => void;
}

const QUICK_DIRECTIVES = [
  'Construir plaza, puente y 2 casas',
  'Construir depósito general, ayuntamiento y comisaría',
  'Genera una economía, préstamos y comercios',
  'Establecer contratos de aprendizaje y reparar estructuras',
  'Agregar 2 vacas, 2 caballos y 1 perro',
];

export function QwenConsole({
  messages,
  policies,
  ollamaEnabled,
  ollamaModel,
  isBusy,
  onSendDirective,
}: QwenConsoleProps) {
  const [input, setInput] = useState('');
  const [minimized, setMinimized] = useState(false);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = logContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, minimized]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isBusy) return;
    onSendDirective(trimmed);
    setInput('');
  }

  const activePolicies: string[] = [];
  if (policies.economyFocus) activePolicies.push('Economía respaldada');
  if (policies.buildPriority) activePolicies.push('Prioridad casas');
  if (policies.workFocus) activePolicies.push('Oficios activos');
  if (policies.evolutionFocus) activePolicies.push('Foco evolución');
  if (policies.farmingFocus) activePolicies.push('Agricultura');
  if (!policies.reproductionRestraint) activePolicies.push('Crecimiento abierto');
  if (policies.healthPriority) activePolicies.push('Cuidado sanitario');

  return (
    <section className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shrink-0" data-testid="qwen-console-panel">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold tracking-wide text-slate-300">
          Hablar con Qwen 2.5
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 whitespace-nowrap">
            {ollamaEnabled ? `Ollama · ${ollamaModel}` : 'Motor Local Qwen'}
          </span>
          <button
            type="button"
            aria-expanded={!minimized}
            aria-label={minimized ? 'Expandir consola Qwen 2.5' : 'Minimizar consola Qwen 2.5'}
            data-testid="toggle-qwen-panel"
            onClick={() => setMinimized((v) => !v)}
            className="w-6 h-6 rounded bg-[#0b1120] border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-mono flex items-center justify-center transition-colors"
          >
            {minimized ? '+' : '−'}
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {activePolicies.length > 0 && (
            <div className="text-[11px] text-emerald-400/90 leading-relaxed">
              Reglas activas: {activePolicies.join(' · ')}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {QUICK_DIRECTIVES.map((dir) => (
              <button
                key={dir}
                type="button"
                disabled={isBusy}
                onClick={() => onSendDirective(dir)}
                className="px-2 py-1 text-[11px] rounded-md bg-[#0b1120] border border-slate-800 hover:border-emerald-500/60 text-slate-300 hover:text-emerald-200 transition-colors text-left"
              >
                {dir}
              </button>
            ))}
          </div>

          <div
            ref={logContainerRef}
            className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5 max-h-44 overflow-y-auto flex flex-col gap-2"
            data-testid="qwen-chat-log"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`text-xs leading-relaxed p-2 rounded-lg ${
                  m.role === 'user'
                    ? 'bg-slate-800/80 text-slate-100 self-end max-w-[92%]'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 self-start max-w-[96%]'
                }`}
              >
                <div className="text-[10px] text-slate-400 mb-0.5">
                  {m.role === 'user' ? 'Vos' : `Qwen 2.5 (${m.source === 'ollama' ? 'Ollama' : 'Reglas'})`}
                </div>
                <div>{m.text}</div>
                {m.appliedRules && m.appliedRules.length > 0 && (
                  <div className="mt-1 text-[11px] text-emerald-400 font-mono">
                    Ejecutado: {m.appliedRules.join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <label htmlFor="qwen-directive-input" className="sr-only">
              Orden para Qwen 2.5
            </label>
            <input
              id="qwen-directive-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ej: Construir ayuntamiento, préstamos o veda..."
              className="flex-1 bg-[#0b1120] border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isBusy || !input.trim()}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              {isBusy ? 'Aplicando...' : 'Ejecutar'}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
