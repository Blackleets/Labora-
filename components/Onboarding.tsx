
import React, { useState } from 'react';
import { ArrowRight, Check, Smartphone, Sparkles, ShieldCheck, Bike, Globe, Building2, Wallet } from 'lucide-react';
import CountrySelector from './CountrySelector';
import { useData } from '../contexts/DataContext';
import LogoResolver from './LogoResolver';

const Onboarding: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const { updateUserConfig } = useData();
  const [step, setStep] = useState(1);
  
  // State for selections
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  
  const [connecting, setConnecting] = useState<string | null>(null);

  // Configuration - using IDs that match our catalog where possible
  const platforms = [
    { id: 'uber_eats', name: 'Uber Eats', domain: 'ubereats.com' },
    { id: 'glovo', name: 'Glovo', domain: 'glovoapp.com' },
    { id: 'just_eat', name: 'Just Eat', domain: 'just-eat.com' },
    { id: 'stuart', name: 'Stuart', domain: 'stuart.com' },
    { id: 'bolt_food', name: 'Bolt Food', domain: 'bolt.eu' }, // Added fallback ID
    { id: 'catcher', name: 'Catcher', domain: 'catcher.eu' },
  ];

  const banks = [
    { id: 'bbva_es', name: 'BBVA', domain: 'bbva.es' },
    { id: 'santander_es', name: 'Santander', domain: 'santander.com' },
    { id: 'caixabank', name: 'CaixaBank', domain: 'caixabank.es' },
    { id: 'revolut', name: 'Revolut', domain: 'revolut.com' },
    { id: 'wise', name: 'Wise', domain: 'wise.com' },
    { id: 'n26', name: 'N26', domain: 'n26.com' },
    { id: 'sabadell', name: 'Sabadell', domain: 'bancsabadell.com' },
    { id: 'qonto', name: 'Qonto', domain: 'qonto.com' },
    { id: 'bunq', name: 'Bunq', domain: 'bunq.com' },
  ];

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      // Step 4 complete: Save and Finish
      updateUserConfig(selectedPlatforms, selectedBanks);
      onFinish();
    }
  };

  const togglePlatform = (id: string) => {
    if (selectedPlatforms.includes(id)) {
      setSelectedPlatforms(prev => prev.filter(s => s !== id));
    } else {
      setConnecting(id);
      setTimeout(() => {
        setSelectedPlatforms(prev => [...prev, id]);
        setConnecting(null);
      }, 500);
    }
  };

  const toggleBank = (id: string) => {
    if (selectedBanks.includes(id)) {
      setSelectedBanks(prev => prev.filter(s => s !== id));
    } else {
      setConnecting(id);
      setTimeout(() => {
        setSelectedBanks(prev => [...prev, id]);
        setConnecting(null);
      }, 500);
    }
  };

  const ServiceCard: React.FC<{ 
    service: { id: string, name: string, domain: string }, 
    isSelected: boolean,
    onToggle: (id: string) => void,
    category: 'platform' | 'bank'
  }> = ({ service, isSelected, onToggle, category }) => {
    const isLoading = connecting === service.id;

    return (
      <button 
        onClick={() => onToggle(service.id)}
        className={`relative p-3 rounded-[20px] border transition-all duration-300 flex flex-col items-center gap-2 group w-full hover:shadow-lg active:scale-95 ${
          isSelected 
            ? 'border-blue-500 bg-blue-50/50 shadow-md ring-1 ring-blue-200' 
            : 'border-gray-100 bg-white hover:border-gray-200'
        }`}
      >
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white rounded-full p-0.5 z-10 shadow-sm animate-in zoom-in">
            <Check size={10} strokeWidth={4} />
          </div>
        )}
        
        {/* Logo Container using Resolver */}
        <LogoResolver 
          id={service.id} 
          name={service.name} 
          domain={service.domain} 
          category={category === 'platform' ? 'delivery' : 'banking'}
          size="md"
          className={isSelected ? 'shadow-sm' : ''}
        />
        
        <span className={`text-[10px] font-bold text-center leading-tight transition-colors ${isSelected ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-800'}`}>
          {service.name}
        </span>

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center rounded-[20px] z-20">
             <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in duration-500 overflow-y-auto">
      <div className="w-full max-w-4xl space-y-8 text-center my-auto py-10">
        
        {/* Progress Bar */}
        <div className="flex gap-2 justify-center mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-8 bg-[#2D6CDF]' : 'w-2 bg-gray-200'}`} />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 max-w-lg mx-auto">
            <div className="w-32 h-32 bg-gradient-to-tr from-[#2D6CDF] to-[#7B3FE4] rounded-[32px] mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/30 rotate-3 hover:rotate-0 transition-transform duration-500">
              <Sparkles size={48} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#1A1A1A] mb-3 tracking-tight">Labora<span className="text-[#2ECC71]">+</span></h1>
              <p className="text-gray-500 text-base font-medium leading-relaxed px-4">
                El ecosistema fiscal definitivo para riders. Automatiza, deduce y ahorra.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Country Selection */}
        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 max-w-lg mx-auto">
            <div className="w-24 h-24 bg-blue-50 rounded-full mx-auto flex items-center justify-center text-[#2D6CDF] mb-4">
              <Globe size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Tu ubicación fiscal</h2>
              <p className="text-sm text-gray-500">Selecciona el país donde realizas tu actividad.</p>
            </div>
            <div className="text-left bg-gray-50 p-6 rounded-[32px] border border-gray-100">
              <CountrySelector variant="cards" />
            </div>
          </div>
        )}

        {/* Step 3: Connect Services */}
        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Conecta tu Ecosistema</h2>
              <p className="text-sm text-gray-500">Selecciona las apps que usas para sincronización automática.</p>
            </div>
            
            {/* Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-5xl mx-auto">
              
              {/* Delivery Platforms */}
              <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-white rounded-xl shadow-sm text-orange-500">
                     <Bike size={18} />
                   </div>
                   <div>
                     <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Plataformas</h3>
                     <p className="text-[10px] text-gray-400 font-bold">Apps de reparto</p>
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {platforms.map((p) => (
                    <ServiceCard 
                      key={p.id} 
                      service={p} 
                      isSelected={selectedPlatforms.includes(p.id)} 
                      onToggle={togglePlatform}
                      category="platform"
                    />
                  ))}
                </div>
              </div>

              {/* Banks */}
              <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-white rounded-xl shadow-sm text-purple-500">
                     <Wallet size={18} />
                   </div>
                   <div>
                     <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Bancos</h3>
                     <p className="text-[10px] text-gray-400 font-bold">Conciliación bancaria</p>
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {banks.map((b) => (
                    <ServiceCard 
                      key={b.id} 
                      service={b} 
                      isSelected={selectedBanks.includes(b.id)} 
                      onToggle={toggleBank}
                      category="bank"
                    />
                  ))}
                </div>
              </div>

            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 bg-gray-50 py-2 px-4 rounded-full inline-flex mx-auto border border-gray-100">
              <ShieldCheck size={12} className="text-green-500" />
              <span>Conexión segura bajo normativa PSD2</span>
            </div>
          </div>
        )}

        {/* Step 4: AI Setup */}
        {step === 4 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 max-w-md mx-auto">
             <div className="relative w-28 h-28 mx-auto">
               <div className="absolute inset-0 border-4 border-t-[#7B3FE4] border-r-[#7B3FE4] border-b-transparent border-l-transparent rounded-full animate-spin"></div>
               <div className="absolute inset-2 bg-gray-50 rounded-full flex items-center justify-center shadow-inner">
                 <Smartphone size={32} className="text-[#7B3FE4]" />
               </div>
             </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Configurando IA...</h2>
              <p className="text-sm text-gray-500">Analizando tu perfil fiscal y preparando tu dashboard.</p>
            </div>
            <div className="bg-white border border-gray-100 p-5 rounded-2xl text-left space-y-3 shadow-lg transform rotate-1">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Check size={12} strokeWidth={3} /></div>
                <span className="text-xs font-bold text-gray-600">Sincronizando {selectedPlatforms.length + selectedBanks.length} servicios</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Check size={12} strokeWidth={3} /></div>
                <span className="text-xs font-bold text-gray-600">Detectando IAE y epígrafes</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Check size={12} strokeWidth={3} /></div>
                <span className="text-xs font-bold text-gray-600">Calculando IRPF inicial</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4">
          <button 
            onClick={handleNext}
            className="w-full md:w-auto md:min-w-[240px] bg-[#2D6CDF] text-white py-3.5 px-8 rounded-2xl font-black text-base shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto"
          >
            {step === 4 ? 'Ir al Dashboard' : 'Continuar'}
            <ArrowRight size={18} />
          </button>
          {step < 4 && (
             <p className="text-[10px] text-gray-400 font-bold mt-4 cursor-pointer hover:text-gray-600 uppercase tracking-widest" onClick={onFinish}>
               Saltar configuración
             </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Onboarding;
