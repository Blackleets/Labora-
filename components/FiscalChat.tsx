import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Calculator,
  FileText,
  Loader2,
  Receipt,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User as UserIcon
} from 'lucide-react';
import { useCountry } from '../contexts/CountryContext';
import { useData } from '../contexts/DataContext';
import { isAutomaticCountryCalculationEnabled } from '../modules/country-config/catalog';
import { getFiscalAdvice } from '../services/geminiService';

interface ActionSuggestion {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  query?: string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  actions?: ActionSuggestion[];
}

const FiscalChat: React.FC = () => {
  const { currentUser } = useData();
  const { selectedCountry } = useCountry();
  const fiscalVerified = isAutomaticCountryCalculationEnabled(selectedCountry.country_code);
  const firstName = currentUser?.name.split(' ')[0] || '';

  const welcome = useMemo<Message>(() => {
    if (!fiscalVerified) {
      return {
        role: 'model',
        text: `Hola ${firstName}. Labora+ todavía no tiene un pack fiscal verificado para ${selectedCountry.display_name}.\n\nPara protegerte de información inventada, el asesoramiento fiscal automático está desactivado en esta jurisdicción. Puedes seguir usando documentos, ingresos, gastos y mensajería para preparar la información que revisarás con tu gestoría o asesoría.`
      };
    }

    return {
      role: 'model',
      text: `Hola ${firstName}. El pack fiscal de ${selectedCountry.display_name} está habilitado para consultas informativas. Aun así, cualquier decisión o presentación oficial debe revisarse según tu situación concreta.`,
      actions: [
        { label: 'Entender impuestos', icon: Calculator, query: `Explícame de forma general el marco fiscal verificado para ${selectedCountry.display_name}.` },
        { label: 'Gastos', icon: TrendingUp, query: 'Explícame cómo revisar gastos antes de decidir si son deducibles.' },
        { label: 'Obligaciones', icon: FileText, query: 'Resume las obligaciones incluidas en el pack fiscal verificado.' }
      ]
    };
  }, [firstName, fiscalVerified, selectedCountry.country_code, selectedCountry.display_name]);

  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([welcome]);
    setInput('');
  }, [welcome]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const renderFormattedText = (text: string) => text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });

  const generateSmartActions = (text: string): ActionSuggestion[] => {
    const actions: ActionSuggestion[] = [];
    const lowerText = text.toLowerCase();

    if (lowerText.includes('irpf') || lowerText.includes('retención') || lowerText.includes('isr') || lowerText.includes('tax')) {
      actions.push({ label: 'Revisar cálculo', icon: Calculator, query: 'Explícame qué datos necesito revisar antes de hacer un cálculo fiscal.' });
    }
    if (lowerText.includes('gasto') || lowerText.includes('factura') || lowerText.includes('ticket')) {
      actions.push({ label: 'Registrar gasto', icon: Receipt, query: '¿Qué evidencia debo guardar junto a un gasto?' });
    }
    if (lowerText.includes('multa') || lowerText.includes('sanción') || lowerText.includes('requerimiento')) {
      actions.push({ label: 'Preparar revisión', icon: AlertTriangle, query: '¿Qué información debo recopilar para que un profesional revise una notificación oficial?' });
    }
    return actions;
  };

  const handleSend = async (textOverride?: string) => {
    if (!fiscalVerified || isLoading) return;
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyForService = messages.map((message) => ({ role: message.role, text: message.text }));
      const responseText = await getFiscalAdvice(historyForService, textToSend, selectedCountry);
      const newActions = generateSmartActions(responseText);
      setMessages((prev) => [...prev, {
        role: 'model',
        text: responseText,
        actions: newActions.length > 0 ? newActions : undefined
      }]);
    } catch (error) {
      console.error('[LABORA_FISCAL_CHAT_FAILED]', error);
      setMessages((prev) => [...prev, {
        role: 'model',
        text: 'No he podido consultar el asistente. No tomes una decisión fiscal basándote en una respuesta incompleta.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col overflow-hidden rounded-[32px] border border-[var(--labora-border)] bg-[var(--labora-surface)] shadow-2xl">
      <div className="z-10 flex items-center justify-between bg-gradient-to-r from-[#1A73E8] to-[#2D6CDF] p-6 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-inner ring-1 ring-white/30 backdrop-blur-md">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight">Asistente Labora+</h3>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-50">
              <span className={`h-2 w-2 rounded-full ${fiscalVerified ? 'bg-green-400' : 'bg-amber-300'}`} />
              {fiscalVerified ? 'Pack fiscal verificado' : 'Fiscalidad automática desactivada'}
              <span className="rounded bg-white/20 px-1.5 text-white">{selectedCountry.country_code}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-[var(--labora-canvas)] p-4 md:p-6">
        {!fiscalVerified && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <ShieldCheck size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-extrabold">Protección de jurisdicción activa</p>
              <p className="mt-1 text-xs leading-relaxed">
                No se enviarán preguntas fiscales al modelo para {selectedCountry.display_name} hasta que Labora+ publique un pack con fuentes oficiales, vigencia y tests.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex max-w-[90%] gap-3 md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                msg.role === 'user' ? 'bg-[#1A73E8] text-white' : 'border border-[var(--labora-border)] bg-[var(--labora-surface)] text-[#2D6CDF]'
              }`}>
                {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={18} />}
              </div>
              <div className={`whitespace-pre-wrap rounded-2xl p-4 text-sm leading-relaxed shadow-sm md:p-5 ${
                msg.role === 'user'
                  ? 'rounded-br-none bg-[#1A73E8] text-white'
                  : 'rounded-bl-none border border-[var(--labora-border)] bg-[var(--labora-surface)] text-gray-700'
              }`}>
                {renderFormattedText(msg.text)}
              </div>
            </div>

            {fiscalVerified && msg.actions && msg.actions.length > 0 && (
              <div className="ml-11 flex max-w-[90%] flex-wrap gap-2 md:ml-12">
                {msg.actions.map((action, index) => (
                  <button
                    type="button"
                    key={`${action.label}-${index}`}
                    onClick={() => action.query && handleSend(action.query)}
                    className="flex items-center gap-2 rounded-xl border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 py-2 text-xs font-bold text-[#1A73E8] shadow-sm hover:bg-[var(--labora-moss-soft)]"
                  >
                    <action.icon size={14} className="text-[#2D6CDF]" />
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="ml-1 flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--labora-border)] bg-[var(--labora-surface)] text-[#2D6CDF]">
              <Bot size={18} />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-none border border-[var(--labora-border)] bg-[var(--labora-surface)] px-4 py-3 shadow-sm">
              <Loader2 size={16} className="animate-spin text-[#2D6CDF]" />
              <span className="text-xs font-bold text-gray-400">Consultando pack fiscal verificado…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(event) => { event.preventDefault(); void handleSend(); }}
        className="z-20 border-t border-[var(--labora-border)] bg-[var(--labora-surface)] p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] md:p-6"
      >
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={!fiscalVerified || isLoading}
            placeholder={fiscalVerified
              ? `Consulta informativa para ${selectedCountry.display_name}...`
              : `Pack fiscal verificado pendiente para ${selectedCountry.display_name}`}
            className="w-full rounded-2xl border border-[var(--labora-border)] bg-[var(--labora-surface-2)] py-4 pl-6 pr-14 font-medium text-[var(--labora-ink)] outline-none transition focus:border-[#2D6CDF] focus:bg-[var(--labora-surface)] focus:ring-4 focus:ring-[var(--labora-moss-soft)] disabled:cursor-not-allowed disabled:opacity-65"
          />
          <button
            type="submit"
            disabled={!fiscalVerified || isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-[#1A73E8] p-2.5 text-white shadow-md transition hover:bg-[#1557B0] disabled:cursor-not-allowed disabled:bg-[var(--labora-surface-2)] disabled:opacity-50"
            aria-label="Enviar consulta"
          >
            <Send size={20} strokeWidth={2.5} />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-center text-[10px] font-medium uppercase tracking-wider text-gray-400">
          <ShieldCheck size={11} />
          <span>
            {fiscalVerified
              ? 'Pack fiscal versionado activo · confirma decisiones con un profesional'
              : 'Sin pack verificado · no se genera asesoramiento fiscal automático'}
          </span>
        </div>
      </form>
    </div>
  );
};

export default FiscalChat;
