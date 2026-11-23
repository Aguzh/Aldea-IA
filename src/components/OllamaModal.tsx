import { useState, type FormEvent } from 'react';
import type { OllamaConfig } from '../types/simulation';

interface OllamaModalProps {
  config: OllamaConfig;
  onSave: (next: OllamaConfig) => void;
  onClose: () => void;
}

export function OllamaModal({ config, onSave, onClose }: OllamaModalProps) {
  const [url, setUrl] = useState(config.url);
  const [model, setModel] = useState(config.model);
  const [enabled, setEnabled] = useState(config.enabled);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({
      enabled,
      url: url.trim() || 'http://localhost:11434/api/generate',
      model: model.trim() || 'qwen2.5:3b',
    });
  }

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ollama-modal-title"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#111827] border border-slate-700 rounded-xl p-5 w-full max-w-md flex flex-col gap-3.5"
      >
        <h2 id="ollama-modal-title" className="text-base font-bold text-slate-50">
          Configurar Qwen 2.5 Local (Ollama)
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Conectá tu modelo local en Ollama (por ejemplo <code className="font-mono text-slate-200">qwen2.5:3b</code>). Si Ollama no está encendido, el motor local integrado ejecutará tus órdenes automáticamente.
        </p>

        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded border-slate-600 bg-[#0b1120] text-emerald-500"
          />
          <span>Activar peticiones en vivo a Ollama</span>
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-300">
          <span>URL del endpoint</span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-[#0b1120] border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 font-mono"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-300">
          <span>Modelo instalado</span>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-[#0b1120] border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 font-mono"
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
          >
            Guardar configuración
          </button>
        </div>
      </form>
    </div>
  );
}
