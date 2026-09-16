import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileBarChart,
  FileText,
  Folder,
  Fuel,
  Hash,
  Loader2,
  Printer,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { deleteRemoteDocument } from '../services/remoteOperational';
import { Document as UserDocument, UserRole } from '../types';

type DisplayItem = {
  id: string;
  source: 'document' | 'expense' | 'tax';
  sourceUserId: string;
  ownerName: string;
  name: string;
  category: 'Factura' | 'Trimestre' | 'Alta' | 'Gasolina' | 'Otro';
  date: string;
  fileType: 'PDF' | 'IMG' | 'FILE';
  mimeType?: string;
  sizeBytes?: number;
  content?: string;
  badge?: { label: string; tone: 'green' | 'amber' | 'stone' };
};

type PendingUpload = {
  name: string;
  dataUrl: string;
  mimeType: string;
  sizeBytes: number;
  contentHash: string;
};

const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const bytesLabel = (value?: number) => {
  if (value == null) return 'Tamaño no disponible';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const hashBuffer = async (buffer: ArrayBuffer) => {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('No se pudo leer el archivo.'));
  reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo.'));
  reader.readAsDataURL(file);
});

const fileTypeFor = (mimeType?: string, name?: string): DisplayItem['fileType'] => {
  if (mimeType === 'application/pdf' || name?.toLowerCase().endsWith('.pdf')) return 'PDF';
  if (mimeType?.startsWith('image/')) return 'IMG';
  return 'FILE';
};

export const Documents: React.FC = () => {
  const {
    documents,
    expenses,
    declarations,
    currentUser,
    users,
    getFiscalSummary,
    addDocument,
    showNotification
  } = useData();

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'receipts' | 'taxes' | 'legal'>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<UserDocument['type']>('Factura');
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [preview, setPreview] = useState<DisplayItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;
  const linkedIds = useMemo(() => new Set(
    users.filter((user) => user.role === UserRole.RIDER && user.managerId === currentUser?.id).map((user) => user.id)
  ), [users, currentUser?.id]);
  const userName = useMemo(() => new Map(users.map((user) => [user.id, user.name])), [users]);

  const canSeeUser = (userId: string) => Boolean(
    currentUser && (userId === currentUser.id || (isManager && linkedIds.has(userId)))
  );

  const visibleDocuments = documents.filter((item) => canSeeUser(item.userId));
  const visibleExpenses = expenses.filter((item) => canSeeUser(item.userId) && item.receiptUrl);
  const visibleDeclarations = declarations.filter((item) => canSeeUser(item.userId) && item.status === 'filed_with_tax_agency');

  const allItems = useMemo<DisplayItem[]>(() => {
    const list: DisplayItem[] = [];

    visibleDocuments.forEach((document) => {
      list.push({
        id: document.id,
        source: 'document',
        sourceUserId: document.userId,
        ownerName: userName.get(document.userId) || currentUser?.name || 'Usuario',
        name: document.name,
        category: document.type,
        date: document.date,
        fileType: fileTypeFor(document.mimeType, document.name),
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        content: document.content,
        badge: document.contentHash ? { label: 'Hash SHA-256 guardado', tone: 'stone' } : undefined
      });
    });

    visibleExpenses.forEach((expense) => {
      list.push({
        id: expense.id,
        source: 'expense',
        sourceUserId: expense.userId,
        ownerName: userName.get(expense.userId) || currentUser?.name || 'Usuario',
        name: `Ticket_${expense.merchant || expense.category}_${expense.date}.jpg`,
        category: expense.category === 'Gasolina' ? 'Gasolina' : 'Factura',
        date: expense.date,
        fileType: 'IMG',
        mimeType: 'image/jpeg',
        content: expense.receiptUrl,
        badge: expense.status === 'approved'
          ? { label: 'Validado por gestoría', tone: 'green' }
          : { label: 'Pendiente de revisión', tone: 'amber' }
      });
    });

    visibleDeclarations.forEach((declaration) => {
      list.push({
        id: declaration.id,
        source: 'tax',
        sourceUserId: declaration.userId,
        ownerName: userName.get(declaration.userId) || currentUser?.name || 'Usuario',
        name: `Modelo_${declaration.modelType}_${declaration.quarter}`,
        category: 'Trimestre',
        date: declaration.filedAt || `${declaration.year}-01-01`,
        fileType: 'FILE',
        badge: declaration.filingReference
          ? { label: 'Referencia AEAT registrada', tone: 'green' }
          : { label: 'Marcado como presentado', tone: 'stone' }
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visibleDocuments, visibleExpenses, visibleDeclarations, userName, currentUser?.name]);

  const filteredItems = useMemo(() => {
    if (selectedFilter === 'all') return allItems;
    if (selectedFilter === 'receipts') return allItems.filter((item) => item.category === 'Gasolina' || item.category === 'Factura');
    if (selectedFilter === 'taxes') return allItems.filter((item) => item.category === 'Trimestre');
    return allItems.filter((item) => item.category === 'Alta' || item.category === 'Otro');
  }, [allItems, selectedFilter]);

  const summary = useMemo(() => currentUser && !isManager
    ? getFiscalSummary(currentUser.id)
    : null, [currentUser, isManager, getFiscalSummary]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      showNotification('error', 'Formato no admitido. Usa PDF, JPG, PNG o WebP.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      showNotification('error', 'El archivo supera el límite de 15 MB.');
      event.target.value = '';
      return;
    }

    setIsReadingFile(true);
    try {
      const buffer = await file.arrayBuffer();
      const contentHash = await hashBuffer(buffer);
      const duplicate = documents.some((document) => document.userId === currentUser.id && document.contentHash === contentHash);
      if (duplicate) {
        setPendingUpload(null);
        showNotification('error', 'Este archivo ya existe en tu expediente.');
        return;
      }

      const dataUrl = await readFileAsDataUrl(file);
      setPendingUpload({
        name: file.name,
        dataUrl,
        mimeType: file.type,
        sizeBytes: file.size,
        contentHash
      });
      if (!docName.trim()) setDocName(file.name);
      showNotification('success', file.type === 'application/pdf' ? 'PDF cargado. Se conservarán todas sus páginas.' : 'Archivo cargado.');
    } catch (error) {
      console.error(error);
      showNotification('error', 'No se pudo preparar el archivo.');
    } finally {
      setIsReadingFile(false);
      event.target.value = '';
    }
  };

  const handleSaveDocument = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser || isManager) return;
    if (!docName.trim() || !pendingUpload) {
      showNotification('error', 'Selecciona un archivo y confirma su nombre.');
      return;
    }

    const duplicate = documents.some((document) =>
      document.userId === currentUser.id && document.contentHash === pendingUpload.contentHash
    );
    if (duplicate) {
      showNotification('error', 'Este archivo ya existe en tu expediente.');
      return;
    }

    addDocument({
      name: docName.trim(),
      type: docType,
      date: new Date().toISOString().split('T')[0],
      content: pendingUpload.dataUrl,
      mimeType: pendingUpload.mimeType,
      sizeBytes: pendingUpload.sizeBytes,
      contentHash: pendingUpload.contentHash
    });

    setDocName('');
    setPendingUpload(null);
    setIsUploadOpen(false);
  };

  const handleDownload = (item: DisplayItem) => {
    if (!item.content) {
      showNotification('info', 'No hay un archivo adjunto descargable para este registro.');
      return;
    }
    const anchor = window.document.createElement('a');
    anchor.href = item.content;
    anchor.download = item.name;
    anchor.target = '_blank';
    anchor.rel = 'noopener';
    anchor.click();
  };

  const handleDelete = async (item: DisplayItem) => {
    if (!currentUser || item.source !== 'document' || item.sourceUserId !== currentUser.id || isManager) return;
    if (!window.confirm(`¿Eliminar “${item.name}” del expediente?`)) return;

    setDeletingId(item.id);
    try {
      await deleteRemoteDocument(item.id);
      const remaining = documents.filter((document) => document.id !== item.id);
      localStorage.setItem('labora_docs', JSON.stringify(remaining));
      showNotification('success', 'Documento eliminado del expediente y del almacenamiento privado.');
      window.setTimeout(() => window.location.reload(), 250);
    } catch (error) {
      console.error(error);
      showNotification('error', 'No se pudo eliminar el documento.');
    } finally {
      setDeletingId(null);
    }
  };

  const badgeClass = (tone: DisplayItem['badge'] extends { tone: infer T } ? T : never) => {
    if (tone === 'green') return 'border-[#CFE7D7] bg-[#ECF7F0] text-[#24613F]';
    if (tone === 'amber') return 'border-[#ECD9A8] bg-[#FFF8E8] text-[#855D1E]';
    return 'border-[#E3DDD4] bg-[#F5F2ED] text-stone-600';
  };

  const filters = [
    ['all', 'Todos', allItems.length],
    ['receipts', 'Tickets y facturas', allItems.filter((item) => item.category === 'Gasolina' || item.category === 'Factura').length],
    ['taxes', 'Fiscal', allItems.filter((item) => item.category === 'Trimestre').length],
    ['legal', 'Legal y censal', allItems.filter((item) => item.category === 'Alta' || item.category === 'Otro').length]
  ] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-20 lg:pb-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Documentación</p>
          <h1 className="mt-1 text-2xl font-bold text-stone-900">Expediente fiscal</h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">Documentos y justificantes almacenados en el espacio privado de Labora+. La app distingue revisión de gestoría de presentación oficial.</p>
        </div>
        <div className="flex gap-2">
          {!isManager && (
            <button onClick={() => setIsReportOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-[#DDD6CC] bg-white px-3.5 py-2.5 text-xs font-bold text-stone-600 hover:bg-[#F7F4EF]"><FileBarChart size={15} /> Resumen</button>
          )}
          {!isManager && (
            <button onClick={() => setIsUploadOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#2E5A44] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[#244936]"><Upload size={15} /> Subir documento</button>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {filters.map(([id, label, count]) => (
          <button key={id} onClick={() => setSelectedFilter(id)} className={`rounded-xl border p-3 text-left transition ${selectedFilter === id ? 'border-[#9DB5A6] bg-[#EEF4F0]' : 'border-[#E4DDD3] bg-white hover:bg-[#FAF8F4]'}`}>
            <p className="text-xs font-bold text-stone-800">{label}</p>
            <p className="mt-1 text-[11px] text-stone-400">{count} registros</p>
          </button>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#E3DCD2] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#EEE7DD] px-4 py-3.5">
          <div className="flex items-center gap-2"><Folder size={17} className="text-[#2E5A44]" /><h2 className="text-sm font-bold text-stone-900">Archivos y justificantes</h2></div>
          <span className="hidden text-[11px] text-stone-400 sm:inline">Bucket privado + RLS</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="px-4 py-14 text-center"><Folder size={30} className="mx-auto text-stone-300" /><p className="mt-3 text-sm font-semibold text-stone-600">No hay documentos en esta categoría.</p></div>
        ) : (
          <div className="divide-y divide-[#EEE7DD]">
            {filteredItems.map((item) => (
              <article key={`${item.source}-${item.id}`} className="flex items-center gap-3 p-4 hover:bg-[#FCFAF7]">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.category === 'Gasolina' ? 'bg-[#FFF4E7] text-[#A65E2E]' : item.fileType === 'PDF' ? 'bg-[#FDEEEB] text-[#A54B40]' : 'bg-[#EEF4F0] text-[#2E5A44]'}`}>
                  {item.category === 'Gasolina' ? <Fuel size={18} /> : <FileText size={18} />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="max-w-full truncate text-sm font-bold text-stone-900">{item.name}</p>
                    {item.badge && <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${badgeClass(item.badge.tone)}`}><CheckCircle2 size={10} />{item.badge.label}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-stone-400">
                    <span className="inline-flex items-center gap-1"><Calendar size={11} />{item.date}</span>
                    <span>{item.fileType}</span>
                    {item.sizeBytes != null && <span>{bytesLabel(item.sizeBytes)}</span>}
                    {isManager && <span className="inline-flex items-center gap-1"><UserRound size={11} />{item.ownerName}</span>}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => setPreview(item)} className="rounded-lg p-2 text-stone-400 hover:bg-[#F2EFE9] hover:text-[#2E5A44]" title="Previsualizar"><Eye size={16} /></button>
                  <button onClick={() => handleDownload(item)} disabled={!item.content} className="rounded-lg p-2 text-stone-400 hover:bg-[#F2EFE9] hover:text-[#2E5A44] disabled:cursor-not-allowed disabled:opacity-30" title="Descargar"><Download size={16} /></button>
                  {!isManager && item.source === 'document' && item.sourceUserId === currentUser?.id && (
                    <button onClick={() => void handleDelete(item)} disabled={deletingId === item.id} className="rounded-lg p-2 text-stone-300 hover:bg-[#FFF0EC] hover:text-[#A34F42] disabled:opacity-40" title="Eliminar">{deletingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {!isManager && (
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E3DCD2] bg-white p-3.5"><div className="flex items-center gap-2 text-xs font-bold text-stone-700"><ShieldCheck size={15} className="text-[#2E5A44]" /> Privado</div><p className="mt-1 text-[11px] leading-relaxed text-stone-500">Los archivos se guardan en un bucket privado y el acceso se controla con RLS.</p></div>
          <div className="rounded-xl border border-[#E3DCD2] bg-white p-3.5"><div className="flex items-center gap-2 text-xs font-bold text-stone-700"><Hash size={15} className="text-[#2E5A44]" /> Anti-duplicados</div><p className="mt-1 text-[11px] leading-relaxed text-stone-500">Los archivos nuevos se identifican con SHA-256 para bloquear copias idénticas.</p></div>
          <div className="rounded-xl border border-[#E3DCD2] bg-white p-3.5"><div className="flex items-center gap-2 text-xs font-bold text-stone-700"><FileText size={15} className="text-[#2E5A44]" /> PDF multipágina</div><p className="mt-1 text-[11px] leading-relaxed text-stone-500">Un PDF se conserva completo; la previsualización permite recorrer todas sus páginas.</p></div>
        </section>
      )}

      {isUploadOpen && !isManager && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/55 p-3 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-t-3xl border border-[#E2DAD0] bg-[#FCFAF7] p-5 shadow-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-stone-900">Subir documento</h3><p className="mt-1 text-xs text-stone-500">PDF, JPG, PNG o WebP · máximo 15 MB.</p></div><button onClick={() => setIsUploadOpen(false)} className="rounded-xl border border-[#E4DDD3] bg-white p-2 text-stone-400"><X size={17} /></button></div>

            <form onSubmit={handleSaveDocument} className="mt-5 space-y-4">
              <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => void handleFileSelect(event)} />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isReadingFile} className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D9D1C6] bg-white px-4 py-7 text-center hover:border-[#91AA9A] disabled:opacity-60">
                {isReadingFile ? <Loader2 size={24} className="animate-spin text-[#2E5A44]" /> : <Upload size={24} className="text-[#2E5A44]" />}
                <p className="mt-2 text-sm font-bold text-stone-800">{pendingUpload ? pendingUpload.name : 'Seleccionar archivo'}</p>
                <p className="mt-1 text-[11px] text-stone-400">{pendingUpload ? `${bytesLabel(pendingUpload.sizeBytes)} · SHA-256 calculado` : 'Los PDF multipágina se conservan completos.'}</p>
              </button>

              <div className="grid gap-3 sm:grid-cols-2">
                <label><span className="mb-1.5 block text-[11px] font-bold text-stone-500">Nombre</span><input value={docName} onChange={(event) => setDocName(event.target.value)} className="w-full rounded-xl border border-[#DED7CC] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8EA796]" /></label>
                <label><span className="mb-1.5 block text-[11px] font-bold text-stone-500">Tipo</span><select value={docType} onChange={(event) => setDocType(event.target.value as UserDocument['type'])} className="w-full rounded-xl border border-[#DED7CC] bg-white px-3 py-2.5 text-sm outline-none"><option value="Factura">Factura</option><option value="Trimestre">Fiscal / trimestre</option><option value="Alta">Alta / censal</option><option value="Otro">Otro</option></select></label>
              </div>

              <div className="flex gap-2 pt-1"><button type="button" onClick={() => setIsUploadOpen(false)} className="flex-1 rounded-xl border border-[#DDD4C8] bg-white py-2.5 text-xs font-bold text-stone-600">Cancelar</button><button type="submit" disabled={!pendingUpload || !docName.trim()} className="flex-1 rounded-xl bg-[#2E5A44] py-2.5 text-xs font-bold text-white disabled:opacity-40">Guardar</button></div>
            </form>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/70 p-3 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-[#E8E1D7] px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-stone-900">{preview.name}</p><p className="mt-0.5 text-[10px] text-stone-400">{preview.date} · {preview.ownerName}</p></div><button onClick={() => setPreview(null)} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100"><X size={17} /></button></div>
            <div className="min-h-[420px] flex-1 bg-[#F4F1EC] p-3">
              {!preview.content ? (
                <div className="flex h-[420px] flex-col items-center justify-center text-center"><AlertTriangle size={28} className="text-stone-300" /><p className="mt-3 text-sm font-semibold text-stone-600">Este registro no incluye un archivo adjunto.</p><p className="mt-1 text-xs text-stone-400">Conservamos únicamente sus datos y, cuando existe, la referencia de presentación.</p></div>
              ) : preview.fileType === 'PDF' ? (
                <iframe src={preview.content} title={preview.name} className="h-[70vh] w-full rounded-xl bg-white" />
              ) : (
                <div className="flex h-[70vh] items-center justify-center"><img src={preview.content} alt={preview.name} className="max-h-full max-w-full rounded-xl object-contain" /></div>
              )}
            </div>
          </div>
        </div>
      )}

      {isReportOpen && summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-3 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">Resumen informativo</p><h3 className="mt-1 text-lg font-bold text-stone-900">Situación fiscal estimada</h3></div><button onClick={() => setIsReportOpen(false)} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100"><X size={17} /></button></div>
            <div className="mt-5 grid grid-cols-2 gap-2"><Metric label="Ingresos registrados" value={summary.totalIncome} /><Metric label="Gastos computados" value={summary.totalExpenses} /><Metric label="Neto estimado" value={summary.netProfit} /><Metric label="Reserva IRPF orientativa" value={summary.estimatedIRPF} /></div>
            <div className="mt-4 rounded-xl border border-[#F0DFC1] bg-[#FFF8EC] p-3 text-[11px] leading-relaxed text-[#805F2B]">Este resumen es orientativo. No equivale a una autoliquidación presentada ni sustituye la revisión de la gestoría o de la AEAT.</div>
            <div className="mt-4 flex items-center justify-between gap-3"><div className="text-[10px] text-stone-400">NIF: {currentUser?.nif || 'No informado'} · IAE: {currentUser?.iaeCode || 'No informado'}</div><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-[#DDD5CA] bg-white px-3 py-2 text-xs font-bold text-stone-600"><Printer size={14} /> Imprimir</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl border border-[#E7E0D6] bg-[#FAF8F4] p-3"><p className="text-[10px] font-semibold text-stone-400">{label}</p><p className="mt-1 text-base font-bold text-stone-900">{value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p></div>
);

export default Documents;
