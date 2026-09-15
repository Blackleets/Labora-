
import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, CheckCheck, Clock, Mail, MessageCircle, Send } from 'lucide-react';
import { messageRepository } from '../repositories/messageRepository';
import { Message } from '../types';

export const MessagesHub: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load messages
    setMessages(messageRepository.getAll());
  }, []);

  const filteredMessages = messages.filter(m => 
    m.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'email': return <Mail size={16} />;
      case 'sms': return <MessageCircle size={16} />;
      default: return <Send size={16} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <MessageSquare className="text-[#2D6CDF]" /> Bandeja de Salida
          </h2>
          <p className="text-gray-500 mt-1">Historial de comunicaciones con usuarios.</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar mensaje o destinatario..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6CDF] text-sm font-medium"
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        {filteredMessages.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">No hay mensajes enviados</p>
            <p className="text-sm">Utiliza el botón "Contactar" en la sección de Personas.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredMessages.map(msg => (
              <div key={msg.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${msg.type === 'email' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {getTypeIcon(msg.type)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-900">{msg.personName}</h4>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
                    "{msg.message}"
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 flex items-center gap-1">
                      <CheckCheck size={12} /> {msg.status === 'sent' ? 'Enviado' : msg.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">ID: {msg.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
