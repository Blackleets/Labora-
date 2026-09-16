import React, { useMemo, useRef, useState } from 'react';
import { Download, Eye, FileText, Folder, Loader2, ShieldCheck, Upload, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Document as UserDoc } from '../types';
import { getMarketProfile } from '../modules/country-config/marketProfiles';

export const Documents: React.FC = () => {
  const { currentUser, documents, addDocument, showNotification } = useData();
  const market = getMarketProfile(currentUser?.countryCode);
  const [filter, setFilter] = useState<'all' | 'Factura' | 'Trimestre' | 'Alta' | 'Otro'>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [preview, setPreview] = useState<UserDoc | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<UserDoc['type']>('Factura');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [fileData, setFileData] = useState<string>('');
  const [filename, setFilename] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const visibleDocuments = useMemo(() => {
    const own = documents.filter((document) => document.userId === currentUser.id);
    return own
      .filter((document) => filter === 'all' || document.type === filter)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [currentUser.id, documents, filter]);

  const counts = useMemo(() => {
    const own = documents.filter((document) => document.userId === currentUser.id);
    return {
      all: own.length,
      Factura: own.filter((document) => document.type === 'Factura').length,
      Trimestre: own.filter((document) => document.type === 'Trimestre').length,
      Alta: own.filter((document) => document.type === 'Alta').length,
      Otro: own.filter((document) => document.type === 'Otro').length,
    };
  }, [currentUser.id, documents]);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showNotification('error', 'Usa PDF, JPG, PNG o WEBP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotification('error', 'El archivo supera 10 MB.');
      return;
    }
    setFilename(file.name);
    if (!name.trim()) setName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (loadEvent) => setFileData(String(loadEvent.target?.result || ''));
    reader.onerror = () => showNotification('error', 'No se pudo leer el archivo.');
    reader.readAsDataURL(file);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !fileData.startsWith('data:')) {
      showNotification('error', 'Añade un nombre y un archivo real.');
      return;
    }
    setSaving(true);
    try {
      await addDocument({
        name: filename || name.trim(),
        type,
        date,
        content: fileData,
      });
      setName('');
      setFilename('');
      setFileData('');
      setDate(new Date().toISOString().slice(0, 10));
      setType('Factura');
      setIsUploadOpen(false);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo guardar el documento.');
    } finally {
      setSaving(false);
    }
  };

  const openDocument = (document: UserDoc) => {
    if (!document.content) {
      showNotification('error', 'No hay una copia accesible de este documento. Labora+ no generará una sustituta.');
      return;
    }
    setPreview(document);
  };

  const download = (document: UserDoc) => {
    if (!document.content) {
      showNotification('error', 'No hay archivo real disponible para descargar.');
      return;
    }
    const anchor = window.document.createElement('a');
    anchor.href = document.content;
    anchor.download = document.name;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.click();
  };

  const isPdf = (document: UserDoc) => document.name.toLowerCase().endsWith('.pdf') || document.content?.startsWith('data:application/pdf');

  const filters: Array<{ id: typeof filter; label: string; count: number }> = [
    { id: 'all', label: 'Todos', count: counts.all },
    { id: 'Factura', label: 'Facturas / gastos', count: counts.Factura },
    ...(market.fiscalEngineStatus === 'verified' ? [{ id: 'Trimestre' as const, label: 'Fiscal', count: counts.Trimestre }] : []),
    { id: 'Alta', label: 'Registro / alta', count: counts.Alta },
    { id: 'Otro', label: 'Otros', count: counts.Otro },
  ];

  return (
    <div className="space-y-5 pb-12">
      <section className="rounded-3xl border border-[#345947] bg-[#213B2F] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#BFD5C6]"><ShieldCheck className="h-4 w-4" /> Almacenamiento privado de evidencia</div><h1 className="font-serif text-2xl font-bold sm:text-3xl">Mis documentos</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#D3E3D8]">Aquí solo aparecen archivos que existen realmente en tu espacio. Labora+ no fabrica copias “oficiales”, certificados ni justificantes si el archivo original no existe.</p></div>
          <button onClick={() => setIsUploadOpen(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[#F4EFE5] px-4 py-2.5 text-xs font-bold text-[#213B2F]"><Upload className="h-4 w-4" /> Subir documento</button>
        </div>
      </section>

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[#E8DFC8] bg-[#FCFAF7] p-2 shadow-sm">
        {filters.map((item) => <button key={item.id} onClick={() => setFilter(item.id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${filter === item.id ? 'bg-[#213B2F] text-white' : 'bg-white text-stone-600'}`}><Folder className="h-3.5 w-3.5" />{item.label}<span className={`rounded-full px-1.5 py-0.5 text-[9px] ${filter === item.id ? 'bg-white/15' : 'bg-stone-100'}`}>{item.count}</span></button>)}
      </nav>

      <section className="overflow-hidden rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] shadow-sm">
        {visibleDocuments.length === 0 ? (
          <div className="p-12 text-center"><FileText className="mx-auto h-9 w-9 text-stone-300" /><h2 className="mt-3 font-serif font-bold text-stone-800">No hay documentos en esta categoría</h2><p className="mt-1 text-xs text-stone-500">Sube el archivo original cuando lo tengas.</p></div>
        ) : (
          <div className="divide-y divide-[#EEE8DE]">
            {visibleDocuments.map((document) => <article key={document.id} className="flex flex-col gap-3 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4F7] text-[#3A7596]"><FileText className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-stone-900">{document.name}</p><p className="mt-1 text-[11px] text-stone-500">{document.date} · {document.type}</p></div></div><div className="flex gap-2"><button onClick={() => openDocument(document)} className="flex items-center gap-1.5 rounded-xl border border-[#E4DDD2] px-3 py-2 text-xs font-semibold text-stone-600"><Eye className="h-4 w-4" /> Ver</button><button onClick={() => download(document)} className="flex items-center gap-1.5 rounded-xl border border-[#E4DDD2] px-3 py-2 text-xs font-semibold text-stone-600"><Download className="h-4 w-4" /> Abrir / descargar</button></div></article>)}
          </div>
        )}
      </section>

      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="w-full max-w-lg space-y-4 rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><h2 className="font-serif text-xl font-bold text-stone-900">Subir documento real</h2><p className="mt-1 text-xs text-stone-500">PDF o imagen · máximo 10 MB.</p></div><button type="button" onClick={() => setIsUploadOpen(false)} className="rounded-xl p-2 text-stone-400"><X className="h-5 w-5" /></button></div>
            <label className="block text-xs font-semibold text-stone-700">Nombre<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm" placeholder="Ej. Extracto semanal Uber" /></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-stone-700">Tipo<select value={type} onChange={(event) => setType(event.target.value as UserDoc['type'])} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm"><option value="Factura">Factura / gasto</option>{market.fiscalEngineStatus === 'verified' && <option value="Trimestre">Documento fiscal</option>}<option value="Alta">Alta / registro</option><option value="Otro">Otro</option></select></label><label className="text-xs font-semibold text-stone-700">Fecha del documento<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm" /></label></div>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[#BFCDBF] bg-[#F5F8F4] p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#2E5A44]"><Upload className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-xs font-bold text-stone-800">{filename || 'Seleccionar archivo'}</p><p className="mt-0.5 text-[10px] text-stone-500">PDF, JPG, PNG o WEBP</p></div><input ref={fileInputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" /></label>
            <button disabled={saving || !fileData} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E5A44] px-4 py-3 text-sm font-bold text-white disabled:opacity-45">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{saving ? 'Guardando…' : 'Guardar en mi espacio'}</button>
          </form>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="w-full max-w-4xl rounded-3xl bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><div className="min-w-0"><p className="truncate text-sm font-bold text-stone-900">{preview.name}</p><p className="text-[11px] text-stone-500">{preview.date} · copia privada disponible durante esta sesión</p></div><button onClick={() => setPreview(null)} className="rounded-xl p-2 text-stone-400"><X className="h-5 w-5" /></button></div>
            <div className="h-[70vh] overflow-hidden rounded-2xl bg-stone-100">{preview.content ? (isPdf(preview) ? <iframe src={preview.content} title={preview.name} className="h-full w-full" /> : <img src={preview.content} alt={preview.name} className="h-full w-full object-contain" />) : <div className="flex h-full items-center justify-center text-sm text-stone-500">Archivo no disponible.</div>}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
