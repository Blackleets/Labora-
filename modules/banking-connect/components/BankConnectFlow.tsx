
import React, { useState } from 'react';
import { SUPPORTED_PROVIDERS } from '../services/bankAdapter';
import { bankApi } from '../services/bankApi';
import { BankConnection } from '../types';
import { ShieldCheck, Lock, X, ChevronRight, Loader2, CheckCircle, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';

interface BankConnectFlowProps {
  userId: string;
  onClose: () => void;
  onSuccess: (connection: BankConnection) => void;
}

export const BankConnectFlow: React.FC<BankConnectFlowProps> = ({ userId, onClose, onSuccess }) => {
  const [step, setStep] = useState<'select' | 'consent' | 'authorizing' | 'success' | 'error'>('select');
  const [selectedProvider, setSelectedProvider] = useState<typeof SUPPORTED_PROVIDERS[0] | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Iniciar Flujo
  const handleProviderSelect = (provider: typeof SUPPORTED_PROVIDERS[0]) => {
    setSelectedProvider(provider);
    setStep('consent');
  };

  // 2. Simular Popup de OAuth y Catch de Errores
  const handleAuth = async () => {
    if (!selectedProvider) return;
    try {
      setStep('authorizing');
      
      // Obtener URL de autorización (Fake)
      await bankApi.initiateConnection(userId, selectedProvider.id);
      
      // Simulamos la interacción del usuario en la ventana emergente
      // En producción, esto sería manejado por callbacks de URL
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular callback exitoso con código
      // NOTA: Para probar el error, puedes descomentar la línea de abajo o confiar en el random del adapter
      const mockAuthParams = { code: 'fake_auth_code_123' }; 
      // const mockAuthParams = { code: 'force_error' }; // Descomentar para forzar error

      // Finalizar conexión
      const connection = await bankApi.finalizeConnection(userId, selectedProvider.id, mockAuthParams);
      
      setStep('success');
      
      // Esperar un momento para que el usuario vea el éxito antes de cerrar
      setTimeout(() => {
        onSuccess(connection);
      }, 1500);

    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Error de conexión');
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 relative">
        
        {/* Header Común */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-[#2D6CDF]" />
            <span className="font-bold text-gray-700 text-sm">BankConnect Secure</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          
          {/* STEP 1: SELECT PROVIDER */}
          {step === 'select' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 text-center">Selecciona tu banco</h3>
              <p className="text-sm text-gray-500 text-center mb-4">Conecta tu cuenta para sincronizar gastos e ingresos automáticamente.</p>
              
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                {SUPPORTED_PROVIDERS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleProviderSelect(p)}
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-100 rounded-2xl hover:border-[#2D6CDF] hover:bg-blue-50 transition-all group"
                  >
                    <img 
                      src={`https://logo.clearbit.com/${p.domain}`} 
                      className="w-8 h-8 object-contain rounded-full bg-white shadow-sm p-0.5"
                      alt={p.name}
                      onError={(e) => {
                         const target = e.target as HTMLImageElement;
                         target.style.display = 'none';
                      }}
                    />
                    <span className="text-xs font-bold text-gray-700 group-hover:text-[#2D6CDF] text-center">{p.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
                <ShieldCheck size={12} /> Powered by PSD2 Open Banking
              </p>
            </div>
          )}

          {/* STEP 2: CONSENT */}
          {step === 'consent' && selectedProvider && (
            <div className="space-y-6">
               <div className="flex flex-col items-center">
                 <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                    <img src={`https://logo.clearbit.com/${selectedProvider.domain}`} className="w-10 h-10 object-contain" alt={selectedProvider.name} />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900">Conectar con {selectedProvider.name}</h3>
               </div>

               <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 space-y-2">
                 <p className="flex items-start gap-2">
                   <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                   Lectura de saldo y transacciones
                 </p>
                 <p className="flex items-start gap-2">
                   <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                   Detalles de cuenta (IBAN)
                 </p>
                 <p className="flex items-start gap-2 opacity-50">
                   <X size={16} className="mt-0.5 flex-shrink-0" />
                   No podemos realizar pagos
                 </p>
               </div>

               <button 
                 onClick={handleAuth}
                 className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
               >
                 Ir a {selectedProvider.name} <ExternalLink size={16} />
               </button>
               <button onClick={() => setStep('select')} className="w-full py-2 text-gray-500 font-bold text-xs hover:underline">
                 Volver
               </button>
            </div>
          )}

          {/* STEP 3: AUTHORIZING (Simulated Popup) */}
          {step === 'authorizing' && selectedProvider && (
            <div className="py-10 flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-gray-100 animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <img src={`https://logo.clearbit.com/${selectedProvider.domain}`} className="w-10 h-10 object-contain" alt="" />
                </div>
                <div className="absolute bottom-0 right-0 bg-[#2D6CDF] text-white p-1.5 rounded-full animate-bounce">
                   <Lock size={12} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Autenticando...</h3>
                <p className="text-sm text-gray-500">Estamos conectando de forma segura con tu banco.</p>
              </div>
              <Loader2 className="animate-spin text-[#2D6CDF]" size={32} />
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="py-10 flex flex-col items-center text-center space-y-4 animate-in zoom-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">¡Conexión Exitosa!</h3>
              <p className="text-sm text-gray-500">Tus cuentas se han sincronizado correctamente.</p>
            </div>
          )}

          {/* STEP 5: ERROR */}
          {step === 'error' && (
            <div className="py-8 flex flex-col items-center text-center space-y-4 animate-in shake">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Error de Conexión</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">{errorMessage}</p>
              </div>
              
              <div className="flex gap-3 w-full pt-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAuth}
                  className="flex-1 py-3 bg-[#1A1A1A] text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} /> Reintentar
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
