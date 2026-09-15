
import React, { useState } from 'react';
import { Cpu, Shield, CheckCircle, MessageSquare } from 'lucide-react';
import { PolicyManager } from '../../policy-engine/components/PolicyManager';
import { ApprovalInbox } from '../approvals/components/ApprovalInbox';
import FiscalChat from '../../../components/FiscalChat';

export const AutomationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'policies' | 'approvals' | 'ai'>('policies');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Cpu className="text-[#7B3FE4]" /> Automation & AI
          </h2>
          <p className="text-gray-500">Reglas de negocio, aprobaciones y asistentes inteligentes.</p>
        </div>

        <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab('policies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'policies' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Shield size={16} /> Policy Engine
          </button>
          <button 
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'approvals' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <CheckCircle size={16} /> Aprobaciones
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'ai' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <MessageSquare size={16} /> Fiscal AI
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'policies' && <PolicyManager />}
        {activeTab === 'approvals' && <ApprovalInbox />}
        {activeTab === 'ai' && <FiscalChat />}
      </div>
    </div>
  );
};
