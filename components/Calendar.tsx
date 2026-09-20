
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useCountry } from '../contexts/CountryContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle, Clock, ArrowRight, HelpCircle, FileText, Bell, Plus, Save, X, Download, Printer, Share2 } from 'lucide-react';
import { Payment } from '../types';
import LogoResolver from './LogoResolver';
import { FieldLabel, FormError, fieldErrorA11y, formControlFocusClass } from './formA11y';

const Calendar: React.FC = () => {
  const { payments, markPaymentAsReceived, addPayment, currentUser } = useData();
  const { selectedCountry } = useCountry();
  const currencySymbol = selectedCountry.currency_symbol || '€';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Payment | null>(null);
  
  // Manual Entry State
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    platform: '',
    amount: ''
  });
  const [manualError, setManualError] = useState('');

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sun
  
  // Adjust for Monday start (EU standard)
  const startingSlot = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const weekDays = ["L", "M", "X", "J", "V", "S", "D"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Group payments by date
  const paymentsByDate = useMemo(() => {
    const map: Record<string, Payment[]> = {};
    payments.forEach(p => {
      if (!map[p.date]) map[p.date] = [];
      map[p.date].push(p);
    });
    return map;
  }, [payments]);

  // Derived selected payments based on selectedDate
  const selectedPayments = useMemo(() => {
    if (!selectedDate) return [];
    return paymentsByDate[selectedDate] || [];
  }, [selectedDate, paymentsByDate]);

  const handleDayClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setIsAddingManual(false);
    setManualError('');
  };

  const closeModal = () => {
    setSelectedDate(null);
    setIsAddingManual(false);
    setManualForm({ platform: '', amount: '' });
    setManualError('');
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    const platform = manualForm.platform.trim();
    const amountRaw = manualForm.amount.trim();
    const amount = parseFloat(amountRaw);
    if (!platform || !amountRaw || Number.isNaN(amount) || amount <= 0) {
      setManualError('Indica plataforma e importe válidos.');
      return;
    }

    addPayment({
      platform,
      amount,
      date: selectedDate,
      status: 'pending',
      estimated: true,
      domain: `${platform.toLowerCase().replace(/\s/g, '')}.com`
    });

    setIsAddingManual(false);
    setManualForm({ platform: '', amount: '' });
    setManualError('');
  };

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthPayments = payments.filter(p => p.date.startsWith(currentMonthStr));
    
    const received = monthPayments.filter(p => p.status === 'received').reduce((acc, curr) => acc + curr.amount, 0);
    const pending = monthPayments.filter(p => p.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
    
    return { received, pending };
  }, [payments, currentDate]);

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty slots for prev month
    for (let i = 0; i < startingSlot; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/30 border-b border-r border-gray-100"></div>);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayPayments = paymentsByDate[dateStr] || [];
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <div 
          key={d} 
          onClick={() => handleDayClick(d)}
          className={`h-24 border-b border-r border-gray-100 p-1 relative cursor-pointer hover:bg-blue-50 transition-colors ${isToday ? 'bg-blue-50/50' : 'bg-white'}`}
        >
          <span className={`text-sm font-medium p-1 rounded-full w-7 h-7 flex items-center justify-center ${isToday ? 'bg-[#2D6CDF] text-white shadow-md' : 'text-gray-500'}`}>
            {d}
          </span>
          
          {/* Payment Indicators */}
          <div className="flex flex-wrap gap-1 mt-1 content-start">
            {dayPayments.map((p, idx) => (
              <div key={idx} className="relative group/tooltip">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm border ${p.status === 'received' ? 'bg-green-100 border-green-200' : 'bg-yellow-100 border-yellow-200 dashed border-2'}`}>
                   <LogoResolver 
                     id={p.platform.toLowerCase().replace(/\s/g, '_')}
                     name={p.platform}
                     domain={p.domain}
                     category="delivery"
                     size="sm"
                     className="w-full h-full p-0.5 rounded-full"
                   />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-[#1A1A1A]">Calendario</h2>
          <p className="text-gray-500 mt-1">Controla tus fechas de cobro</p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-xs text-gray-400 font-bold uppercase">Total Pendiente (Mes)</p>
          <p className="text-xl font-bold text-[#F1C40F]">{monthlyStats.pending.toFixed(2)} {currencySymbol}</p>
        </div>
      </div>

      {/* Calendar Container */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header Controls */}
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 capitalize">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Vista Mensual</p>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Monthly Summary Mobile */}
      <div className="md:hidden grid grid-cols-2 gap-4">
         <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
            <p className="text-xs text-green-600 font-bold uppercase">Recibido</p>
            <p className="text-lg font-bold text-green-800">{monthlyStats.received.toFixed(0)} {currencySymbol}</p>
         </div>
         <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
            <p className="text-xs text-yellow-600 font-bold uppercase">Pendiente</p>
            <p className="text-lg font-bold text-yellow-800">{monthlyStats.pending.toFixed(0)} {currencySymbol}</p>
         </div>
      </div>

      {/* Detail Modal */}
      {selectedDate && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300" 
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#2D6CDF] p-6 text-white relative">
              <div className="flex items-center gap-3 mb-1">
                <CalendarIcon size={20} />
                <span className="font-bold text-lg">{selectedDate}</span>
              </div>
              <p className="text-blue-100 text-sm">Detalles del día</p>
              <button onClick={closeModal} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {selectedPayments.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {selectedPayments.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8">
                           <LogoResolver 
                             id={p.platform.toLowerCase().replace(/\s/g, '_')}
                             name={p.platform}
                             domain={p.domain}
                             category="delivery"
                             size="sm"
                           />
                         </div>
                         <div>
                           <p className="font-bold text-gray-800">{p.platform}</p>
                           <p className="text-xs text-gray-500 capitalize">{p.status === 'received' ? 'Cobrado' : 'Pendiente'}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="font-bold text-gray-900">{p.amount.toFixed(2)}{currencySymbol}</p>
                         {p.status === 'pending' && (
                           <button onClick={() => markPaymentAsReceived(p.id)} className="text-[10px] text-blue-600 font-bold hover:underline">
                             Marcar cobrado
                           </button>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400" role="status" aria-live="polite">
                  <p>No hay pagos registrados.</p>
                </div>
              )}

              {!isAddingManual ? (
                <button
                  type="button"
                  onClick={() => { setManualError(''); setIsAddingManual(true); }}
                  className={`w-full py-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:border-[#2D6CDF] hover:text-[#2D6CDF] hover:bg-blue-50 transition-all ${formControlFocusClass}`}
                >
                  <Plus size={18} aria-hidden /> Añadir Pago Manual
                </button>
              ) : (
                <form onSubmit={handleSaveManual} className="space-y-4 animate-in fade-in">
                  <div>
                    <FieldLabel htmlFor="labora-cal-platform" className="text-xs font-bold text-gray-400 uppercase">Plataforma</FieldLabel>
                    <input
                      id="labora-cal-platform"
                      type="text"
                      placeholder="Ej. Uber Eats"
                      className={`w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-[#2D6CDF] ${formControlFocusClass}`}
                      value={manualForm.platform}
                      onChange={e => {
                        setManualForm({ ...manualForm, platform: e.target.value });
                        if (manualError) setManualError('');
                      }}
                      autoFocus
                      {...fieldErrorA11y('labora-cal-form-error', Boolean(manualError))}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="labora-cal-amount" className="text-xs font-bold text-gray-400 uppercase">Importe ({currencySymbol})</FieldLabel>
                    <input
                      id="labora-cal-amount"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={`w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-[#2D6CDF] ${formControlFocusClass}`}
                      value={manualForm.amount}
                      onChange={e => {
                        setManualForm({ ...manualForm, amount: e.target.value });
                        if (manualError) setManualError('');
                      }}
                      {...fieldErrorA11y('labora-cal-form-error', Boolean(manualError))}
                    />
                  </div>
                  <FormError id="labora-cal-form-error">{manualError}</FormError>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setIsAddingManual(false); setManualError(''); }} className={`flex-1 py-3 text-gray-500 font-bold text-sm ${formControlFocusClass}`}>Cancelar</button>
                    <button type="submit" className={`flex-1 py-3 bg-[#2D6CDF] text-white rounded-xl font-bold text-sm shadow-md ${formControlFocusClass}`}>Guardar</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
