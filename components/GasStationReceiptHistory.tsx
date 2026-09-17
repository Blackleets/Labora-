import React, { useState, useMemo } from 'react';
import { 
  Fuel, Calendar, Camera, ExternalLink, ShieldCheck, 
  Clock, AlertCircle, Eye, Download, ZoomIn, ZoomOut, 
  RotateCcw, X, ChevronRight, CheckCircle2, Sparkles,
  Layers, Filter, Plus, FileText
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useCountry } from '../contexts/CountryContext';
import { useGhibliAtmosphere } from '../contexts/GhibliAtmosphereContext';
import { Expense, ExpenseCategory } from '../types';
import { GAS_STATION_PRESETS } from '../modules/delivery/data/platforms';

interface GasStationReceiptHistoryProps {
  onOpenCaptureModal?: () => void;
  limit?: number;
  showAllInitially?: boolean;
}

export const GasStationReceiptHistory: React.FC<GasStationReceiptHistoryProps> = ({
  onOpenCaptureModal,
  limit = 6,
  showAllInitially = false
}) => {
  const { expenses, currentUser, privacyMode, showNotification } = useData();
  const { selectedCountry } = useCountry();
  const { palette } = useGhibliAtmosphere();

  const [selectedTicket, setSelectedTicket] = useState<Expense | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'with_photo' | 'approved' | 'pending'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAll, setShowAll] = useState(showAllInitially);

  // Modal zoom and rotation controls
  const [modalZoom, setModalZoom] = useState(1);
  const [modalRotate, setModalRotate] = useState(0);

  // Filter fuel/gas expenses for current user
  const fuelExpenses = useMemo(() => {
    return expenses
      .filter(exp => {
        const isUserMatch = !currentUser || exp.userId === currentUser.id;
        const isFuel = 
          exp.category === ExpenseCategory.GASOLINA ||
          exp.category === 'Gasolina' ||
          exp.fuelLitres !== undefined ||
          exp.fuelType !== undefined;
        return isUserMatch && isFuel;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, currentUser]);

  // Filtered by selected tab
  const displayedExpenses = useMemo(() => {
    let list = fuelExpenses;
    if (filterStatus === 'with_photo') {
      list = list.filter(e => !!e.receiptUrl);
    } else if (filterStatus === 'approved') {
      list = list.filter(e => e.status === 'approved');
    } else if (filterStatus === 'pending') {
      list = list.filter(e => e.status === 'pending_review' || !e.status);
    }

    if (!showAll && limit) {
      return list.slice(0, limit);
    }
    return list;
  }, [fuelExpenses, filterStatus, showAll, limit]);

  // Aggregate stats
  const totalAmount = useMemo(() => {
    return fuelExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [fuelExpenses]);

  const totalLitres = useMemo(() => {
    return fuelExpenses.reduce((acc, curr) => acc + (curr.fuelLitres || 0), 0);
  }, [fuelExpenses]);

  const withPhotoCount = useMemo(() => {
    return fuelExpenses.filter(e => !!e.receiptUrl).length;
  }, [fuelExpenses]);

  const formatCurrency = (amount: number) => {
    if (privacyMode) return '•••• €';
    return amount.toLocaleString('es-ES', { 
      style: 'currency', 
      currency: selectedCountry?.currency || 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDateDisplay = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStationColor = (merchant?: string) => {
    if (!merchant) return '#C96846';
    const match = GAS_STATION_PRESETS.find(p => 
      merchant.toLowerCase().includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(merchant.toLowerCase())
    );
    return match ? match.logoColor : '#C96846';
  };

  const openTicketViewer = (expense: Expense) => {
    setSelectedTicket(expense);
    setModalZoom(1);
    setModalRotate(0);
  };

  const closeTicketViewer = () => {
    setSelectedTicket(null);
  };

  const handleDownloadReceipt = (ticket: Expense) => {
    if (!ticket.receiptUrl) return;
    const link = document.createElement('a');
    link.href = ticket.receiptUrl;
    link.download = `ticket_gasolina_${ticket.date}_${ticket.merchant || 'estacion'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification?.('success', 'Copia de resguardo descargada con éxito');
  };

  return (
    <div 
      id="gas-station-receipt-history" 
      className="bg-[#FAF7F2] rounded-3xl border border-[#E8DFC8] shadow-[0_4px_20px_-4px_rgba(70,55,40,0.05)] overflow-hidden transition-all duration-300"
    >
      {/* 1. COMPONENT HEADER */}
      <div className="p-5 md:p-6 border-b border-[#E8DFC8] bg-gradient-to-r from-[#FCFAF7] to-[#FAF7F2]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Title and Icon */}
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FAF3EE] text-[#C96846] border border-[#EAD6C9] flex items-center justify-center shrink-0 shadow-xs">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-serif font-bold text-stone-900 tracking-tight">
                  Historial de Tickets de Gasolinera
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-serif font-semibold bg-[#FAF3EE] text-[#C96846] border border-[#EAD6C9]">
                  <ShieldCheck size={11} />
                  Respaldo Fiscal AEAT
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5 font-sans">
                Últimas cargas capturadas con fotografía para blindar el 100% de la deducción en IRPF e IVA.
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center flex-wrap gap-2.5 self-start md:self-auto">
            {/* Aggregate Badges */}
            <div className="hidden sm:flex items-center space-x-2 bg-white/80 px-3 py-1.5 rounded-xl border border-[#E3DBD0] text-xs">
              <span className="text-stone-500 font-sans">Gasto Combustible:</span>
              <strong className="font-serif text-[#C96846] font-bold">
                {formatCurrency(totalAmount)}
              </strong>
              {totalLitres > 0 && (
                <>
                  <span className="text-stone-300">•</span>
                  <span className="text-stone-700 font-medium">{totalLitres.toFixed(1)} L</span>
                </>
              )}
            </div>

            {/* Add Receipt Button */}
            {onOpenCaptureModal && (
              <button
                type="button"
                onClick={onOpenCaptureModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#C96846] hover:bg-[#A84A2A] text-white rounded-xl text-xs font-serif font-semibold shadow-xs transition-all active:scale-95"
              >
                <Plus size={14} />
                <span>Capturar Ticket</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. SUB-BAR: Filters & Layout Switcher */}
        <div className="mt-4 pt-3 border-t border-[#EAE3D6] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Status Filter Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg font-serif font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-stone-800 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-[#F2EDE4] border border-[#E3DBD0]'
              }`}
            >
              Todas ({fuelExpenses.length})
            </button>
            <button
              onClick={() => setFilterStatus('with_photo')}
              className={`px-3 py-1 rounded-lg font-serif font-medium transition-colors flex items-center gap-1.5 ${
                filterStatus === 'with_photo'
                  ? 'bg-[#2E5A44] text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-[#F2EDE4] border border-[#E3DBD0]'
              }`}
            >
              <Camera size={12} />
              <span>Con Foto ({withPhotoCount})</span>
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-3 py-1 rounded-lg font-serif font-medium transition-colors flex items-center gap-1.5 ${
                filterStatus === 'approved'
                  ? 'bg-[#245338] text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-[#F2EDE4] border border-[#E3DBD0]'
              }`}
            >
              <ShieldCheck size={12} />
              <span>Validados</span>
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 rounded-lg font-serif font-medium transition-colors flex items-center gap-1.5 ${
                filterStatus === 'pending'
                  ? 'bg-[#D97706] text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-[#F2EDE4] border border-[#E3DBD0]'
              }`}
            >
              <Clock size={12} />
              <span>En revisión</span>
            </button>
          </div>

          {/* Layout Toggle (Grid vs List) */}
          <div className="flex items-center space-x-2 text-stone-500">
            <span className="text-[11px] font-sans">Vista:</span>
            <div className="inline-flex rounded-lg bg-[#EAE3D6] p-0.5 border border-[#DFD5C6]">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                  viewMode === 'grid' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Vista cuadrícula"
              >
                Tarjetas
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                  viewMode === 'list' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Vista compacta"
              >
                Lista
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TICKET LIST / GRID CONTENT */}
      <div className="p-5 md:p-6">
        {displayedExpenses.length === 0 ? (
          /* Empty State */
          <div className="text-center py-10 px-4">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[#FAF3EE] border border-[#EAD6C9] text-[#C96846] flex items-center justify-center shadow-xs">
              <Fuel className="w-8 h-8 opacity-80" />
            </div>
            <h4 className="font-serif font-bold text-base text-stone-900">
              No hay tickets de gasolinera que coincidan
            </h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 leading-relaxed">
              {fuelExpenses.length === 0 
                ? 'Registra tus cargas de combustible sacando una foto al ticket antes de que se borre la tinta térmica.'
                : 'No se encontraron tickets con el filtro seleccionado.'}
            </p>
            {onOpenCaptureModal && (
              <button
                onClick={onOpenCaptureModal}
                className="mt-4 px-4 py-2 bg-[#C96846] hover:bg-[#A84A2A] text-white rounded-xl text-xs font-serif font-semibold shadow-sm inline-flex items-center gap-1.5 transition-all"
              >
                <Camera size={14} />
                <span>Capturar mi primer ticket</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedExpenses.map((ticket) => {
              const brandColor = getStationColor(ticket.merchant);
              const baseAmount = ticket.vatAmount 
                ? ticket.amount - ticket.vatAmount 
                : Number((ticket.amount / 1.21).toFixed(2));
              const vatAmount = ticket.vatAmount 
                ? ticket.vatAmount 
                : Number((ticket.amount - baseAmount).toFixed(2));

              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl border border-[#E8DFC8] hover:border-[#D0C4B0] shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
                >
                  {/* Card Top: Photo Thumbnail Container */}
                  <div 
                    onClick={() => openTicketViewer(ticket)}
                    className="relative h-44 bg-[#F5EFE6] border-b border-[#EAE3D6] overflow-hidden cursor-pointer group-hover:brightness-98 transition-all flex items-center justify-center"
                  >
                    {ticket.receiptUrl ? (
                      <img 
                        src={ticket.receiptUrl} 
                        alt={`Ticket ${ticket.merchant || 'Gasolinera'} - ${ticket.date}`} 
                        className="w-full h-full object-contain p-2 bg-white/40 group-hover:scale-102 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      /* Placeholder if no photo */
                      <div className="flex flex-col items-center justify-center text-stone-400 p-4">
                        <Camera className="w-8 h-8 mb-1 text-stone-300" />
                        <span className="text-[11px] font-serif">Sin fotografía</span>
                      </div>
                    )}

                    {/* Overlay badge: Gas Station Brand */}
                    <div className="absolute top-2.5 left-2.5">
                      <span 
                        className="px-2.5 py-1 rounded-lg text-[11px] font-serif font-bold text-white shadow-xs backdrop-blur-md flex items-center gap-1.5"
                        style={{ backgroundColor: brandColor }}
                      >
                        <Fuel size={11} />
                        <span>{ticket.merchant || 'Gasolinera'}</span>
                      </span>
                    </div>

                    {/* Overlay badge: Status */}
                    <div className="absolute top-2.5 right-2.5">
                      {ticket.status === 'approved' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-serif font-semibold bg-[#EBF3ED] text-[#245338] border border-[#D0E5D7] shadow-2xs flex items-center gap-1">
                          <CheckCircle2 size={10} /> Validado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-serif font-semibold bg-[#FEF7EB] text-[#85531B] border border-[#FDE3B8] shadow-2xs flex items-center gap-1">
                          <Clock size={10} /> Revisión
                        </span>
                      )}
                    </div>

                    {/* Hover Zoom Prompt */}
                    <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                      <span className="px-3 py-1.5 bg-white text-stone-900 rounded-xl text-xs font-serif font-bold shadow-md flex items-center gap-1.5">
                        <Eye size={13} className="text-[#C96846]" />
                        <span>Ver Respaldo</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Content: Details & Amount */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Date & Invoice */}
                      <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                        <span className="flex items-center gap-1 font-sans">
                          <Calendar size={12} className="text-stone-400" />
                          <span>{formatDateDisplay(ticket.date)}</span>
                        </span>
                        {ticket.invoiceNumber && (
                          <span className="font-mono text-[10px] text-stone-400">
                            #{ticket.invoiceNumber}
                          </span>
                        )}
                      </div>

                      {/* Main Amount */}
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
                          {formatCurrency(ticket.amount)}
                        </span>
                        <span className="text-[11px] font-serif font-medium text-[#2E5A44] bg-[#EBF3ED] px-2 py-0.5 rounded-md border border-[#D0E5D7]">
                          100% Deducible
                        </span>
                      </div>

                      {/* Fuel details & VAT Breakdown */}
                      <div className="mt-2 pt-2 border-t border-[#F2EDE4] space-y-1 text-xs">
                        <div className="flex items-center justify-between text-stone-600">
                          <span className="font-sans text-[11px]">Combustible:</span>
                          <span className="font-serif font-semibold text-stone-800 text-[11px]">
                            {ticket.fuelLitres ? `${ticket.fuelLitres} L` : ''} 
                            {ticket.fuelType ? ` • ${ticket.fuelType}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-stone-500 text-[10px]">
                          <span>Base: {formatCurrency(baseAmount)}</span>
                          <span>IVA (21%): {formatCurrency(vatAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Button: Expand Ticket */}
                    <button
                      type="button"
                      onClick={() => openTicketViewer(ticket)}
                      className="w-full py-2 bg-[#FAF7F2] hover:bg-[#F2EDE4] text-stone-700 hover:text-stone-900 rounded-xl text-xs font-serif font-semibold border border-[#E3DBD0] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye size={13} className="text-[#C96846]" />
                      <span>Ver detalles & ticket</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="divide-y divide-[#EAE3D6] border border-[#E8DFC8] rounded-2xl bg-white overflow-hidden">
            {displayedExpenses.map((ticket) => {
              const brandColor = getStationColor(ticket.merchant);
              const baseAmount = ticket.vatAmount 
                ? ticket.amount - ticket.vatAmount 
                : Number((ticket.amount / 1.21).toFixed(2));
              const vatAmount = ticket.vatAmount 
                ? ticket.vatAmount 
                : Number((ticket.amount - baseAmount).toFixed(2));

              return (
                <div
                  key={ticket.id}
                  className="p-3.5 sm:p-4 hover:bg-[#FCFAF7] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center space-x-3 min-w-0 w-full sm:w-auto">
                    {/* Thumbnail */}
                    <div 
                      onClick={() => openTicketViewer(ticket)}
                      className="relative w-16 h-16 rounded-xl bg-[#FAF6EE] border border-[#E3DBD0] overflow-hidden shrink-0 cursor-pointer shadow-2xs group-hover:border-[#C96846] transition-colors flex items-center justify-center"
                    >
                      {ticket.receiptUrl ? (
                        <img 
                          src={ticket.receiptUrl} 
                          alt="Ticket" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Fuel className="w-6 h-6 text-stone-300" />
                      )}
                      <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye size={14} className="text-white" />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: brandColor }}
                        />
                        <h5 className="font-serif font-bold text-sm text-stone-900 truncate">
                          {ticket.merchant || 'Gasolinera'}
                        </h5>
                        <span className="text-[10px] font-serif px-2 py-0.2 rounded-full bg-[#FAF3EE] text-[#C96846] border border-[#EAD6C9]">
                          {ticket.fuelType || 'Gasolina 95'}
                        </span>
                      </div>

                      <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2 flex-wrap font-sans">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {formatDateDisplay(ticket.date)}
                        </span>
                        {ticket.fuelLitres && (
                          <span>• {ticket.fuelLitres} Litros</span>
                        )}
                        <span className="text-stone-400">
                          (Base: {formatCurrency(baseAmount)} + IVA: {formatCurrency(vatAmount)})
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#F2EDE4]">
                    <div className="text-left sm:text-right">
                      <span className="text-lg font-serif font-bold text-stone-900">
                        {formatCurrency(ticket.amount)}
                      </span>
                      <div className="flex items-center gap-1.5 sm:justify-end">
                        {ticket.status === 'approved' ? (
                          <span className="text-[10px] font-serif font-medium text-[#245338] flex items-center gap-0.5">
                            <CheckCircle2 size={10} /> Validado
                          </span>
                        ) : (
                          <span className="text-[10px] font-serif font-medium text-[#85531B] flex items-center gap-0.5">
                            <Clock size={10} /> En revisión
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openTicketViewer(ticket)}
                      className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE3D6] text-stone-600 hover:text-stone-900 border border-[#E3DBD0] transition-colors"
                      title="Ver ticket ampliado"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer: Expand or collapse if more than limit */}
        {fuelExpenses.length > limit && (
          <div className="mt-5 text-center pt-3 border-t border-[#EAE3D6]">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-serif font-semibold text-[#C96846] hover:text-[#A84A2A] hover:underline inline-flex items-center gap-1"
            >
              <span>{showAll ? 'Mostrar menos cargas' : `Ver todas las cargas de gasolina (${fuelExpenses.length})`}</span>
              <ChevronRight size={14} className={`transform transition-transform ${showAll ? '-rotate-90' : 'rotate-90'}`} />
            </button>
          </div>
        )}
      </div>

      {/* 4. MODAL: DETAILED TICKET & PHOTO VIEWER */}
      {selectedTicket && (
        <div 
          id="ticket-photo-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/65 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-[#FAF7F2] rounded-3xl shadow-2xl max-w-2xl w-full border border-[#E8DFC8] overflow-hidden my-6">
            
            {/* Modal Header */}
            <div className="bg-[#C96846] p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl">
                  <Fuel className="w-5 h-5 text-[#FED7AA]" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-white leading-tight">
                    Respaldo Fotográfico de Combustible
                  </h3>
                  <p className="text-xs text-orange-100/90 font-sans">
                    {selectedTicket.merchant || 'Gasolinera'} • {formatDateDisplay(selectedTicket.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={closeTicketViewer}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Cerrar visor"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5">
              
              {/* Photo View Box with Zoom / Rotate Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-600 font-serif">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Camera size={13} className="text-[#C96846]" />
                    <span>Copia digital del comprobante</span>
                  </span>
                  
                  {/* Photo Toolbar */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setModalZoom(prev => Math.min(prev + 0.25, 2.5))}
                      className="p-1.5 rounded-lg bg-[#FAF3EE] hover:bg-[#F2EDE4] border border-[#EAD6C9] text-stone-700"
                      title="Acercar"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalZoom(prev => Math.max(prev - 0.25, 0.75))}
                      className="p-1.5 rounded-lg bg-[#FAF3EE] hover:bg-[#F2EDE4] border border-[#EAD6C9] text-stone-700"
                      title="Alejar"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalRotate(prev => (prev + 90) % 360)}
                      className="p-1.5 rounded-lg bg-[#FAF3EE] hover:bg-[#F2EDE4] border border-[#EAD6C9] text-stone-700"
                      title="Girar 90°"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>

                <div className="relative h-80 sm:h-96 bg-[#F5EFE6] rounded-2xl border border-[#DFD5C6] overflow-hidden flex items-center justify-center p-3 shadow-inner">
                  {selectedTicket.receiptUrl ? (
                    <div 
                      className="transition-transform duration-200 w-full h-full flex items-center justify-center"
                      style={{ 
                        transform: `scale(${modalZoom}) rotate(${modalRotate}deg)` 
                      }}
                    >
                      <img 
                        src={selectedTicket.receiptUrl} 
                        alt="Comprobante fiscal" 
                        className="max-h-full max-w-full object-contain drop-shadow-md rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="text-center text-stone-400 p-6 space-y-2">
                      <Camera className="w-12 h-12 mx-auto text-stone-300" />
                      <p className="font-serif text-sm text-stone-600">No se adjuntó foto con este repostaje.</p>
                      <p className="text-xs text-stone-400 max-w-xs mx-auto">
                        Puedes añadir la foto la próxima vez usando el capturador con OCR.
                      </p>
                    </div>
                  )}

                  {/* Anti-fraud audit banner */}
                  <div className="absolute bottom-2 left-2 right-2 bg-stone-900/80 backdrop-blur-md text-stone-200 text-[11px] px-3 py-1.5 rounded-xl flex items-center justify-between font-serif">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-[#A3D9B5]" />
                      <span>Comprobante inalterable • Conservación tributaria 4 años</span>
                    </span>
                    {selectedTicket.invoiceNumber && (
                      <span className="font-mono text-stone-300 font-normal">
                        {selectedTicket.invoiceNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Fiscal Breakdown Grid */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8DFC8] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#F2EDE4]">
                  <span className="font-serif font-bold text-xs uppercase tracking-wider text-stone-700">
                    Desglose Tributario Oficial
                  </span>
                  <span className="text-xs font-serif font-semibold text-[#2E5A44] bg-[#EBF3ED] px-2.5 py-0.5 rounded-full border border-[#D0E5D7]">
                    100% deducible IRPF e IVA
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#EBE3D5]">
                    <span className="text-[10px] text-stone-500 uppercase font-sans">Total Pagado</span>
                    <p className="font-serif font-bold text-sm text-stone-900 mt-0.5">
                      {formatCurrency(selectedTicket.amount)}
                    </p>
                  </div>
                  <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#EBE3D5]">
                    <span className="text-[10px] text-stone-500 uppercase font-sans">Base Imponible</span>
                    <p className="font-serif font-semibold text-sm text-stone-800 mt-0.5">
                      {formatCurrency(selectedTicket.amount / 1.21)}
                    </p>
                  </div>
                  <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#EBE3D5]">
                    <span className="text-[10px] text-stone-500 uppercase font-sans">IVA Soportado (21%)</span>
                    <p className="font-serif font-semibold text-sm text-[#2E5A44] mt-0.5">
                      {formatCurrency(selectedTicket.amount - (selectedTicket.amount / 1.21))}
                    </p>
                  </div>
                  <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#EBE3D5]">
                    <span className="text-[10px] text-stone-500 uppercase font-sans">Combustible</span>
                    <p className="font-serif font-semibold text-sm text-stone-800 mt-0.5">
                      {selectedTicket.fuelLitres ? `${selectedTicket.fuelLitres} L` : 'N/D'}
                    </p>
                  </div>
                </div>

                {/* Additional Notes or Gestor Audit */}
                {selectedTicket.notes && (
                  <div className="text-xs text-stone-600 bg-[#FAF9F6] p-2.5 rounded-xl border border-[#EBE3D5]">
                    <strong className="text-stone-800 font-serif">Anotación:</strong> {selectedTicket.notes}
                  </div>
                )}
                {selectedTicket.gestorNotes && (
                  <div className="text-xs text-[#245338] bg-[#EBF3ED] p-2.5 rounded-xl border border-[#D0E5D7]">
                    <strong className="font-serif">Nota del Gestor:</strong> {selectedTicket.gestorNotes}
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                {selectedTicket.receiptUrl ? (
                  <button
                    type="button"
                    onClick={() => handleDownloadReceipt(selectedTicket)}
                    className="px-4 py-2 bg-[#FAF7F2] hover:bg-[#F2EDE4] text-stone-700 hover:text-stone-900 border border-[#E3DBD0] rounded-xl text-xs font-serif font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download size={14} className="text-[#C96846]" />
                    <span>Descargar Comprobante</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <button
                  type="button"
                  onClick={closeTicketViewer}
                  className="px-5 py-2 bg-[#2E5A44] hover:bg-[#213B2F] text-white rounded-xl text-xs font-serif font-semibold shadow-xs transition-colors"
                >
                  Cerrar
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default GasStationReceiptHistory;
