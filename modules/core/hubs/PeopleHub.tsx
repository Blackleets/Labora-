
import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Trash2, MessageSquare, Download, CheckCircle, AlertCircle, Plus, X, Save, Phone, Globe, Mail, CreditCard, Send, Printer } from 'lucide-react';
import { useCountry } from '../../../contexts/CountryContext';
import { Person } from '../../people/types';
import { peopleRepository } from '../../people/repositories/peopleRepository';
import { reportService } from '../../people/services/reportService';
import { messageRepository } from '../../messages/repositories/messageRepository';
import { useData } from '../../../contexts/DataContext';

export const PeopleHub: React.FC = () => {
  const { countries } = useCountry();
  const { showNotification } = useData();
  
  // State
  const [people, setPeople] = useState<Person[]>([]);
  const [filter, setFilter] = useState<'all' | 'risk'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State - Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Person>>({
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    pais: 'ES',
    tipo: 'cliente',
    estado: 'activo'
  });

  // Modal State - Report
  const [reportPerson, setReportPerson] = useState<Person | null>(null);

  // Modal State - Contact
  const [contactPerson, setContactPerson] = useState<Person | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactType, setContactType] = useState<'internal' | 'email'>('internal');

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const data = peopleRepository.getAll();
    setPeople(data);
  };

  // Filter Logic
  const filteredPeople = useMemo(() => {
    return people.filter(p => {
      // 1. Filter by Tab
      if (filter === 'risk' && p.estado !== 'en_riesgo') return false;

      // 2. Filter by Search (Name, DNI, Email)
      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        return (
          p.nombre.toLowerCase().includes(lowerTerm) ||
          p.dni.toLowerCase().includes(lowerTerm) ||
          p.email.toLowerCase().includes(lowerTerm)
        );
      }

      return true;
    });
  }, [people, filter, searchTerm]);

  // --- ACTIONS ---

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar a este usuario?')) {
      peopleRepository.delete(id);
      refreshData();
      showNotification('info', 'Usuario eliminado correctamente');
    }
  };

  const handleGenerateReport = () => {
    if (!reportPerson) return;
    reportService.generatePersonReport(reportPerson);
    showNotification('success', 'Informe generado correctamente');
    setReportPerson(null);
  };

  const handleSendMessage = () => {
    if (!contactPerson) return;

    if (contactType === 'email') {
      // Mock Email Action
      window.location.href = `mailto:${contactPerson.email}?subject=Contacto Labora+&body=${contactMessage}`;
      showNotification('success', `Email simulado enviado a ${contactPerson.email}`);
    } else {
      // Internal Message
      if (!contactMessage.trim()) return showNotification('error', 'El mensaje no puede estar vacío');
      
      messageRepository.sendMessage({
        personId: contactPerson.id,
        personName: contactPerson.nombre,
        message: contactMessage,
        type: 'internal'
      });
      showNotification('success', 'Mensaje interno guardado');
    }
    
    setContactPerson(null);
    setContactMessage('');
  };

  const handleCall = () => {
    if (contactPerson?.telefono) {
      window.location.href = `tel:${contactPerson.telefono}`;
    }
  };

  // --- FORM HANDLERS ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.nombre || !formData.dni || !formData.email) {
      showNotification('error', 'Nombre, DNI y Email son obligatorios');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showNotification('error', 'Formato de email inválido');
      return;
    }

    const newPerson: Person = {
      id: crypto.randomUUID(),
      nombre: formData.nombre,
      dni: formData.dni,
      email: formData.email,
      telefono: formData.telefono || '',
      pais: formData.pais || 'ES',
      tipo: formData.tipo as any,
      fechaCreacion: new Date().toISOString(),
      estado: formData.estado as any || 'activo'
    };

    peopleRepository.create(newPerson);
    refreshData();
    showNotification('success', 'Cliente añadido correctamente');
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      nombre: '',
      dni: '',
      email: '',
      telefono: '',
      pais: 'ES',
      tipo: 'cliente',
      estado: 'activo'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 relative pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Users className="text-[#2D6CDF]" /> People & Clients
          </h2>
          <p className="text-gray-500 mt-1">Gestión de {people.length} usuarios registrados.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#1A1A1A] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-black transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, DNI o email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6CDF] text-sm font-medium"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('risk')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filter === 'risk' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
          >
            En Riesgo
          </button>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPeople.map(person => (
          <div key={person.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-2 ${person.estado === 'en_riesgo' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-100 text-gray-500 border-white'}`}>
                  {person.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{person.nombre}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     {person.estado === 'activo' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle size={10} /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        <AlertCircle size={10} /> Riesgo
                      </span>
                    )}
                    <span className="text-xs text-gray-400 font-mono">DNI: {person.dni}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(person.id)}
                className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-300 transition-colors"
                title="Eliminar registro"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {/* Financial Summary Mock (Visual only to maintain design) */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">País</p>
                <p className="font-bold text-gray-900 flex items-center gap-1">
                   <Globe size={12} className="text-blue-500"/> {person.pais}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Contacto</p>
                <p className="font-bold text-gray-900 truncate text-xs" title={person.email}>{person.email}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Tipo</p>
                <p className="font-bold text-gray-900 capitalize">{person.tipo}</p>
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-100 pt-4">
              <button 
                onClick={() => setReportPerson(person)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#2D6CDF] text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors active:scale-95"
              >
                <Download size={16} /> Informe
              </button>
              <button 
                onClick={() => setContactPerson(person)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 text-gray-700 text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <MessageSquare size={16} /> Contactar
              </button>
            </div>
          </div>
        ))}
        
        {filteredPeople.length === 0 && (
           <div className="col-span-1 lg:col-span-2 py-16 text-center text-gray-400 bg-white rounded-[24px] border-2 border-dashed border-gray-200">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold">No se encontraron personas</p>
              <p className="text-sm">Intenta ajustar los filtros o añade un nuevo cliente.</p>
           </div>
        )}
      </div>

      {/* --- REPORT MODAL --- */}
      {reportPerson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-6 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <Printer size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Generar Informe</h3>
                      <p className="text-xs text-blue-600 font-medium">Vista previa del PDF</p>
                    </div>
                 </div>
                 <button onClick={() => setReportPerson(null)} className="p-2 hover:bg-blue-100 rounded-full text-blue-400 transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                       <span className="text-xs font-bold text-gray-500 uppercase">Nombre</span>
                       <span className="text-sm font-bold text-gray-900">{reportPerson.nombre}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                       <span className="text-xs font-bold text-gray-500 uppercase">DNI/NIF</span>
                       <span className="text-sm font-mono text-gray-700">{reportPerson.dni}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                       <span className="text-xs font-bold text-gray-500 uppercase">Email</span>
                       <span className="text-sm text-gray-700">{reportPerson.email}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-xs font-bold text-gray-500 uppercase">Estado</span>
                       <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${reportPerson.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {reportPerson.estado.toUpperCase()}
                       </span>
                    </div>
                 </div>
                 <button 
                   onClick={handleGenerateReport}
                   className="w-full py-3 bg-[#2D6CDF] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
                 >
                   <Download size={18} /> Descargar PDF
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- CONTACT MODAL --- */}
      {contactPerson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                 <div>
                   <h3 className="text-xl font-bold text-gray-900">Contactar a {contactPerson.nombre.split(' ')[0]}</h3>
                   <p className="text-xs text-gray-500">Selecciona el método de contacto</p>
                 </div>
                 <button onClick={() => setContactPerson(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={20} /></button>
              </div>
              
              <div className="p-6 space-y-6">
                 {/* Quick Actions */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col items-center text-center">
                       <Mail className="text-gray-400 mb-2" size={20} />
                       <span className="text-xs font-bold text-gray-500 uppercase mb-1">Email</span>
                       <p className="text-sm font-bold text-gray-900 truncate w-full mb-3">{contactPerson.email}</p>
                       <button 
                         onClick={() => { setContactType('email'); }}
                         className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${contactType === 'email' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-600 border-gray-200'}`}
                       >
                         Redactar
                       </button>
                    </div>
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col items-center text-center">
                       <Phone className="text-gray-400 mb-2" size={20} />
                       <span className="text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</span>
                       <p className="text-sm font-bold text-gray-900 truncate w-full mb-3">{contactPerson.telefono || 'Sin número'}</p>
                       <button 
                         onClick={handleCall}
                         disabled={!contactPerson.telefono}
                         className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors disabled:opacity-50"
                       >
                         Llamar
                       </button>
                    </div>
                 </div>

                 {/* Internal Message */}
                 <div>
                    <div className="flex items-center justify-between mb-2">
                       <label className="text-xs font-bold text-gray-500 uppercase">Mensaje {contactType === 'email' ? 'por Email' : 'Interno'}</label>
                       <div className="flex gap-2">
                          <button 
                            onClick={() => setContactType('internal')}
                            className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${contactType === 'internal' ? 'bg-[#2D6CDF] text-white' : 'bg-gray-100 text-gray-500'}`}
                          >
                            Interno
                          </button>
                          <button 
                            onClick={() => setContactType('email')}
                            className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${contactType === 'email' ? 'bg-[#2D6CDF] text-white' : 'bg-gray-100 text-gray-500'}`}
                          >
                            Email
                          </button>
                       </div>
                    </div>
                    <textarea 
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2D6CDF] min-h-[100px]"
                      placeholder={`Escribe tu mensaje ${contactType === 'internal' ? 'para el registro interno...' : 'para enviar por correo...'}`}
                    ></textarea>
                 </div>

                 <button 
                   onClick={handleSendMessage}
                   className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg"
                 >
                   <Send size={16} /> Enviar {contactType === 'email' ? 'Email' : 'Mensaje'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- ADD PERSON MODAL (EXISTING) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="text-xl font-bold text-gray-900">Nuevo Registro</h3>
                 <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                   <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo *</label>
                    <div className="relative">
                       <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                       <input 
                         name="nombre"
                         value={formData.nombre}
                         onChange={handleInputChange}
                         className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2D6CDF] outline-none"
                         placeholder="Ej. María García"
                         autoFocus
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">DNI / NIF *</label>
                       <div className="relative">
                          <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                            name="dni"
                            value={formData.dni}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2D6CDF] outline-none"
                            placeholder="12345678Z"
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">País</label>
                       <div className="relative">
                          <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <select 
                            name="pais"
                            value={formData.pais}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2D6CDF] outline-none appearance-none"
                          >
                             {countries.map(c => (
                               <option key={c.country_code} value={c.country_code}>{c.display_name}</option>
                             ))}
                          </select>
                       </div>
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email *</label>
                    <div className="relative">
                       <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                       <input 
                         name="email"
                         type="email"
                         value={formData.email}
                         onChange={handleInputChange}
                         className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2D6CDF] outline-none"
                         placeholder="correo@ejemplo.com"
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                    <div className="relative">
                       <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                       <input 
                         name="telefono"
                         value={formData.telefono}
                         onChange={handleInputChange}
                         className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2D6CDF] outline-none"
                         placeholder="+34 600 000 000"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                       <select 
                         name="tipo"
                         value={formData.tipo}
                         onChange={handleInputChange}
                         className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2D6CDF] outline-none"
                       >
                          <option value="cliente">Cliente</option>
                          <option value="repartidor">Repartidor</option>
                          <option value="empleado">Empleado</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado</label>
                       <select 
                         name="estado"
                         value={formData.estado}
                         onChange={handleInputChange}
                         className={`w-full px-4 py-3 border rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2D6CDF] outline-none ${formData.estado === 'en_riesgo' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`}
                       >
                          <option value="activo">Activo</option>
                          <option value="en_riesgo">En Riesgo</option>
                       </select>
                    </div>
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={closeModal}
                      className="flex-1 py-3 text-gray-500 font-bold text-sm hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-[#1A1A1A] text-white font-bold text-sm rounded-xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={18} /> Guardar
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
