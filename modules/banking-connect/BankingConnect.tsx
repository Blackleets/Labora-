
import React, { useState, useEffect, useMemo } from 'react';
import { useCountry } from '../../contexts/CountryContext';
import { useData } from '../../contexts/DataContext';
import { Wallet, Building, Plus, ArrowUpRight, ArrowDownRight, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { BankConnectFlow } from './components/BankConnectFlow';
import { bankApi } from './services/bankApi';
import { BankConnection } from './types';
import LogoResolver from '../../components/LogoResolver';

export const BankingConnect: React.FC = () => {
  const { selectedCountry } = useCountry();
  const { currentUser, showNotification } = useData();
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load connections on mount
  useEffect(() => {
    if (currentUser) {
      loadConnections();
    }
  }, [currentUser]);

  const loadConnections = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const data = await bankApi.getUserConnections(currentUser.id);
      setConnections(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if(confirm('¿Estás seguro de desconectar este banco? Se perderá el historial de transacciones.')) {
      await bankApi.removeConnection(connectionId);
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      showNotification('info', 'Banco desconectado correctamente');
    }
  };

  const handleSuccess = (newConnection: BankConnection) => {
    setConnections(prev => [...prev, newConnection]);
    setIsFlowOpen(false);
    showNotification('success', `Cuentas de ${newConnection.provider_id} sincronizadas`);
  };

  // Calculate totals
  const totalBalance = useMemo(() => {
    return connections.reduce((acc, conn) => {
      return acc + conn.accounts.reduce((sum, account) => sum + account.balance, 0);
    }, 0);
  }, [connections]);

  const accountCount = connections.reduce((acc, conn) => acc + conn.accounts.length, 0);

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-[#1A1A1A] rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
         
         <div className="relative z-10">
           <div className="flex justify-between items-start mb-2">
             <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Balance Total</p>
             <button onClick={loadConnections} className="p-1 hover:bg-white/10 rounded-full transition-colors" title="Refrescar">
               <RefreshCw size={14} className={`text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
             </button>
           </div>
           
           <h2 className="text-4xl font-bold mb-4 flex items-baseline gap-2">
             {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
             <span className="text-lg text-gray-400 font-normal">{selectedCountry.currency}</span>
           </h2>
           
           <div className="flex gap-4 mt-6">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                   <ArrowUpRight size={18} />
                 </div>
                 <div>
                   <p className="text-xs text-gray-400">Cuentas</p>
                   <p className="font-bold">{accountCount} activas</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                   <Building size={18} />
                 </div>
                 <div>
                   <p className="text-xs text-gray-400">Bancos</p>
                   <p className="font-bold">{connections.length} conectados</p>
                 </div>
              </div>
           </div>
         </div>
      </div>

      {/* Connection List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 text-lg">Mis Bancos</h3>
          <button 
            onClick={() => setIsFlowOpen(true)}
            className="text-xs font-bold text-[#2D6CDF] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
          >
            <Plus size={14} /> Añadir Cuenta
          </button>
        </div>

        {connections.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
             <Wallet className="mx-auto text-gray-300 mb-2" size={32} />
             <p className="text-gray-500 text-sm font-medium">No hay cuentas conectadas.</p>
             <button onClick={() => setIsFlowOpen(true)} className="mt-2 text-blue-600 font-bold text-sm hover:underline">
               Conectar ahora
             </button>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <div key={conn.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all bg-white group">
                 <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                       <LogoResolver 
                         id={conn.provider_id} 
                         name={conn.provider_id.toUpperCase()} 
                         domain={`${conn.provider_id}.com`} 
                         category="banking" 
                         size="md"
                       />
                       <div>
                          <h4 className="font-bold text-gray-900 capitalize">{conn.provider_id}</h4>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <CheckCircle2 size={10} className="text-green-500" /> Sincronizado hace 1m
                          </p>
                       </div>
                    </div>
                    <button 
                      onClick={() => handleDisconnect(conn.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Desconectar"
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>
                 
                 <div className="space-y-2">
                    {conn.accounts.map(acc => (
                      <div key={acc.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-sm">
                         <div>
                            <p className="font-medium text-gray-700">{acc.name}</p>
                            <p className="text-xs text-gray-400">{acc.account_number_masked}</p>
                         </div>
                         <span className="font-bold text-gray-900">{acc.balance.toLocaleString()} {acc.currency}</span>
                      </div>
                    ))}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Flow */}
      {isFlowOpen && currentUser && (
        <BankConnectFlow 
          userId={currentUser.id}
          onClose={() => setIsFlowOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
