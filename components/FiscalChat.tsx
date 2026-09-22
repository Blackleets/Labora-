
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, Calculator, TrendingUp, AlertTriangle, Sparkles, Receipt, FileText } from 'lucide-react';
import { getFiscalAdvice } from '../services/geminiService';
import { useData } from '../contexts/DataContext';
import { useCountry } from '../contexts/CountryContext';

interface Message {
  role: 'user' | 'model';
  text: string;
  actions?: ActionSuggestion[];
}

interface ActionSuggestion {
  label: string;
  icon: any;
  query?: string; // Si es para enviar otro mensaje al chat
  view?: string;  // Si es para navegar (simulado)
}

const FiscalChat: React.FC<{ embedded?: boolean; contextLabel?: string }> = ({ embedded = false, contextLabel }) => {
  const { currentUser } = useData();
  const { selectedCountry } = useCountry();
  const fiscalReady = selectedCountry.knowledge.status === 'verified';
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: `¡Hola ${currentUser?.name.split(' ')[0] || ''}! Soy tu copiloto Labora+ para ${selectedCountry.display_name}. \n\nPuedo ayudarte a organizar tu trabajo, entender tus números, preparar documentos y resolver dudas fiscales. ¿Qué necesitas?`,
      actions: [
        { label: fiscalReady ? 'Calcular impuestos' : 'Preparar consulta fiscal', icon: Calculator, query: fiscalReady ? `¿Cómo funciona el cálculo de impuestos para trabajadores en ${selectedCountry.display_name}?` : 'Ayúdame a preparar una pregunta fiscal clara para mi gestoría' },
        { label: 'Gastos Deducibles', icon: TrendingUp, query: 'Dime ejemplos de gastos deducibles para mi actividad' },
        { label: 'Obligaciones', icon: FileText, query: '¿Qué modelos o declaraciones debo presentar?' }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update initial message if country changes (optional, keeps chat consistent)
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'model') {
       setMessages([{ 
        role: 'model', 
        text: `¡Hola ${currentUser?.name.split(' ')[0] || ''}! Soy tu copiloto Labora+ para ${selectedCountry.display_name}. \n\nPuedo ayudarte a organizar tu trabajo, entender tus números, preparar documentos y resolver dudas fiscales. ¿Qué necesitas?`,
        actions: [
          { label: fiscalReady ? 'Calcular impuestos' : 'Preparar consulta fiscal', icon: Calculator, query: fiscalReady ? `¿Cómo funciona el cálculo de impuestos para trabajadores en ${selectedCountry.display_name}?` : 'Ayúdame a preparar una pregunta fiscal clara para mi gestoría' },
          { label: 'Gastos Deducibles', icon: TrendingUp, query: 'Dime ejemplos de gastos deducibles para mi actividad' },
          { label: 'Obligaciones', icon: FileText, query: '¿Qué modelos o declaraciones debo presentar?' }
        ]
      }]);
    }
  }, [selectedCountry.country_code]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  // Función simple para renderizar negritas de Markdown (**texto**)
  const renderFormattedText = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const generateSmartActions = (text: string): ActionSuggestion[] => {
    const actions: ActionSuggestion[] = [];
    const lowerText = text.toLowerCase();

    if (lowerText.includes('irpf') || lowerText.includes('retención') || lowerText.includes('isr') || lowerText.includes('tax')) {
      actions.push({ label: 'Simular Cuota', icon: Calculator, query: 'Hazme una simulación rápida de mis impuestos basada en mis ingresos.' });
    }
    if (lowerText.includes('gasto') || lowerText.includes('factura') || lowerText.includes('ticket')) {
      actions.push({ label: 'Registrar Gasto', icon: Receipt, query: '¿Cómo subo un ticket correctamente para que sea deducible?' });
    }
    if (lowerText.includes('multa') || lowerText.includes('sanción') || lowerText.includes('requerimiento')) {
      actions.push({ label: 'Riesgos', icon: AlertTriangle, query: '¿Qué hago si recibo una notificación oficial?' });
    }
    return actions;
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    // 1. Añadir mensaje de usuario
    const userMsg: Message = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. Preparar historial para la API
      const historyForService = messages.map(m => ({ role: m.role, text: m.text }));
      
      // Add the active screen as private context while keeping the message clean in the UI.
      const contextualPrompt = contextLabel
        ? `[Contexto actual: ${contextLabel}] ${textToSend}`
        : textToSend;
      const responseText = await getFiscalAdvice(historyForService, contextualPrompt, selectedCountry);
      
      // 4. Generar acciones sugeridas basadas en la respuesta
      const newActions = generateSmartActions(responseText);

      // 5. Añadir respuesta de la IA
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: responseText, 
        actions: newActions.length > 0 ? newActions : undefined 
      }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Lo siento, he tenido un problema de conexión. Por favor, inténtalo de nuevo." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${embedded ? 'h-full rounded-none border-0 shadow-none' : 'h-[calc(100vh-140px)] rounded-[32px] border shadow-2xl'} flex flex-col bg-[var(--labora-surface)] border-[var(--labora-border)] overflow-hidden animate-in slide-in-from-bottom-4 duration-500`}>
      {/* Header */}
      <div className="p-6 bg-[var(--labora-primary)] text-white flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner ring-1 ring-white/30">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-black text-xl tracking-tight">Copiloto Labora+</h3>
            <div className="flex items-center gap-1.5 opacity-90">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
               <span className="text-[10px] font-bold text-blue-50 uppercase tracking-widest flex items-center gap-1">
                 Listo para ayudarte <span className="bg-white/20 px-1.5 rounded text-white">{selectedCountry.country_code}</span>{contextLabel ? <span className="hidden sm:inline"> · {contextLabel}</span> : null}
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[var(--labora-canvas)] custom-scrollbar scroll-smooth">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm mt-auto ${
                msg.role === 'user' ? 'bg-[var(--labora-primary)] text-white' : 'bg-[var(--labora-surface)] text-[var(--labora-primary)] border border-[var(--labora-border)]'
              }`}>
                {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={18} />}
              </div>

              {/* Bubble */}
              <div className={`p-4 md:p-5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-[var(--labora-primary)] text-white rounded-br-none'
                  : 'bg-[var(--labora-surface)] text-gray-700 rounded-bl-none border border-[var(--labora-border)]'
              }`}>
                {renderFormattedText(msg.text)}
              </div>
            </div>
            
            {/* Smart Actions Suggestions */}
            {msg.actions && msg.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 ml-11 md:ml-12 max-w-[90%]">
                {msg.actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => action.query && handleSend(action.query)}
                    className="flex items-center gap-2 px-3 py-2 bg-[var(--labora-surface)] text-[var(--labora-primary)] text-xs font-bold rounded-xl border border-[var(--labora-border)] shadow-sm hover:bg-[var(--labora-moss-soft)] hover:border-[var(--labora-border)] transition-all active:scale-95 animate-in zoom-in duration-300"
                    style={{ animationDelay: `${i * 100}ms` }}
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
          <div className="flex gap-3 animate-pulse ml-1">
            <div className="w-8 h-8 rounded-xl bg-[var(--labora-surface)] border border-[var(--labora-border)] flex items-center justify-center text-[#2D6CDF]">
              <Bot size={18} />
            </div>
            <div className="bg-[var(--labora-surface)] px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-[var(--labora-border)] flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#2D6CDF]" />
              <span className="text-xs text-gray-400 font-bold">{fiscalReady ? `Consultando contexto de ${selectedCountry.display_name}...` : 'Organizando tu consulta...'}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
        className="p-4 md:p-6 bg-[var(--labora-surface)] border-t border-[var(--labora-border)] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-20"
      >
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Consulta fiscal para ${selectedCountry.display_name}...`}
            className="w-full pl-6 pr-14 py-4 bg-[var(--labora-surface-2)] border border-[var(--labora-border)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--labora-moss-soft)] focus:bg-[var(--labora-surface)] focus:border-[var(--labora-primary)] transition-all text-[var(--labora-ink)] placeholder-[var(--labora-muted)] font-medium"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[var(--labora-primary)] text-white rounded-xl hover:bg-[var(--labora-primary-2)] disabled:opacity-50 disabled:bg-[var(--labora-surface-2)] disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
          >
            <Send size={20} strokeWidth={2.5} />
          </button>
        </div>
        <div className="mt-3 flex justify-center items-center gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
           <Shield size={10} />
           <span>{fiscalReady ? `Fuentes verificadas para ${selectedCountry.display_name}` : `Fiscalidad de ${selectedCountry.display_name} en revisión`}</span>
        </div>
      </form>
    </div>
  );
};

// Simple icon for footer
const Shield = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default FiscalChat;
