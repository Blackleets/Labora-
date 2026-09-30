import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, RefreshCw, ShieldCheck } from 'lucide-react';
import { loadAdminDocumentUrl, loadAdminUserDetail, type AdminUserDetail as Detail, type UserDetailSection } from '../services/adminUserDetail';
import { GLOBAL_COUNTRIES } from '../modules/country-config/catalog';

const labels: Record<UserDetailSection, string> = { profile: 'Perfil', incomes: 'Ingresos', expenses: 'Gastos', documents: 'Documentos', requirements: 'Peticiones', declarations: 'Fiscalidad', messages: 'Actividad', clients: 'Clientes vinculados' };
const statuses: Record<string, string> = { pending_review: 'Pendiente de revisión', needs_fix: 'Por corregir', approved: 'Aprobado', rejected: 'Rechazado', pending: 'Pendiente', submitted: 'Respuesta recibida', draft: 'Borrador', reviewed_by_gestor: 'Revisado por gestoría', filed_with_tax_agency: 'Presentación registrada', read: 'Leído', sent: 'Enviado' };
const roles = { rider: 'Trabajador', manager: 'Gestoría', admin: 'Administración' };
const dateLabel = (value: unknown) => {
  if (typeof value !== 'string' || !value) return 'Sin registro';
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : date.toLocaleString('es-ES', value.length === 10 ? { dateStyle: 'medium' } : { dateStyle: 'medium', timeStyle: 'short' });
};
const shown = (value: unknown) => Array.isArray(value) ? value.join(' · ') || 'No registrado' : value == null || value === '' ? 'No registrado' : String(value);
const focusClass = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]';

export const AdminUserDetail: React.FC<{ userId: string; actorId: string; privacyMode: boolean; onBack: () => void; onSelectUser: (id: string) => void }> = ({ userId, actorId, privacyMode, onBack, onSelectUser }) => {
  const [section, setSection] = useState<UserDetailSection>('profile');
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState<{ id: string; url?: string; error?: string } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const fileGeneration = useRef(0);
  const requestKey = `${actorId}:${userId}:${section}:${page}:${revision}`;
  const [loadedKey, setLoadedKey] = useState('');
  const visible = loadedKey === requestKey ? detail : null;

  useEffect(() => { heading.current?.focus(); }, [userId]);
  useEffect(() => {
    let current = true;
    fileGeneration.current += 1;
    setFile(null); setLoading(true); setError(''); setDetail(null);
    void loadAdminUserDetail(userId, section, page).then(value => {
      if (current) { setDetail(value); setLoadedKey(requestKey); }
    }).catch(reason => { if (current) setError(reason instanceof Error ? reason.message : 'No se pudo cargar la ficha.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; fileGeneration.current += 1; };
  }, [actorId, userId, section, page, revision]);

  const openFile = async (id: string) => {
    const generation = ++fileGeneration.current;
    setFile({ id });
    try { const url = await loadAdminDocumentUrl(userId, id); if (generation === fileGeneration.current) setFile({ id, url }); }
    catch (reason) { if (generation === fileGeneration.current) setFile({ id, error: reason instanceof Error ? reason.message : 'Archivo no disponible.' }); }
  };
  const country = GLOBAL_COUNTRIES.find(item => item.country_code === visible?.user.country_code);
  const money = (value: unknown) => privacyMode ? '••••' : value == null || !Number.isFinite(Number(value)) ? 'Sin importe' : country?.currency ? Number(value).toLocaleString('es-ES', { style: 'currency', currency: country.currency }) : `${Number(value).toLocaleString('es-ES')} (moneda sin confirmar)`;
  const sections: UserDetailSection[] = ['profile', 'incomes', 'expenses', 'documents', 'requirements', 'declarations', 'messages', 'clients'];

  return <div className="min-w-0 space-y-4" aria-busy={loading}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button type="button" onClick={onBack} className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-bold text-[var(--labora-primary)] ${focusClass}`}><ArrowLeft size={17} />Volver a usuarios</button>
      <button type="button" onClick={() => setRevision(value => value + 1)} disabled={loading} className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--labora-border)] px-3 text-xs font-bold disabled:opacity-50 ${focusClass}`}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Actualizar ficha</button>
    </div>
    <section className="labora-card min-w-0 p-5 sm:p-6">
      <p className="labora-kicker text-[var(--labora-muted)]">Usuarios / Ficha individual</p>
      <h2 ref={heading} tabIndex={-1} className="mt-2 break-words text-2xl font-extrabold text-[var(--labora-ink)] outline-none">{visible?.user.name || 'Ficha del usuario'}</h2>
      {visible && <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--labora-muted)]"><span className="break-all">{visible.user.email}</span><span className="rounded-full bg-[var(--labora-moss-soft)] px-3 py-1 text-xs font-bold text-[var(--labora-primary)]">{roles[visible.user.role]}</span><span>{country?.display_name || visible.user.country_code || 'País no registrado'}</span></div>}
    </section>
    <nav aria-label="Secciones de la ficha" className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex xl:flex-wrap">{sections.map(id => <button key={id} type="button" aria-pressed={section === id} onClick={() => { setPage(0); setSection(id); }} className={`min-h-[44px] rounded-xl px-3 py-2 text-xs font-bold ${focusClass} ${section === id ? 'bg-[var(--labora-primary)] text-white' : 'border border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-muted)]'}`}>{labels[id]}</button>)}</nav>
    {loading && <div role="status" className="labora-card p-8 text-center text-sm text-[var(--labora-muted)]">Consultando datos autorizados…</div>}
    {error && !loading && <div role="alert" className="labora-card space-y-3 p-6"><p className="text-sm text-[var(--labora-clay)]">{error}</p><button type="button" onClick={() => setRevision(value => value + 1)} className={`min-h-[44px] rounded-xl bg-[var(--labora-primary)] px-4 text-sm font-bold text-white ${focusClass}`}>Reintentar</button></div>}
    {visible && !loading && <>
      {section === 'profile' && <section className="labora-card p-5 sm:p-6"><h3 className="text-base font-extrabold">Perfil y vínculo profesional</h3><dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[
        ['Correo', visible.user.email], ['Teléfono', visible.user.phone], ['NIF', visible.user.nif], ['Empresa', visible.user.company_name], ['N.º colegiado', visible.user.collegiate_number], ['Régimen fiscal', visible.user.fiscal_regime], ['IAE', visible.user.iae_code], ['Seguridad Social', visible.user.social_security_type], ['Actividad', visible.user.work_modes], ['Lugares de trabajo', visible.user.workplaces], ['Plataformas elegidas', visible.user.platforms], ['Gestoría vinculada', visible.manager ? `${visible.manager.name} · ${visible.manager.email}` : visible.user.manager_id ? 'Vínculo sin perfil disponible' : 'Sin gestoría vinculada'], ['Correo confirmado', visible.user.email_confirmed ? 'Sí' : 'No confirmado'], ['Cuenta creada', dateLabel(visible.user.created_at)], ['Último acceso', dateLabel(visible.user.last_sign_in_at)], ['Perfil actualizado', dateLabel(visible.user.updated_at)]
      ].map(([label, value]) => <div key={String(label)} className="min-w-0"><dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--labora-muted)]">{String(label)}</dt><dd className="mt-1 break-words text-sm text-[var(--labora-ink)]">{shown(value)}</dd></div>)}</dl><p className="mt-6 text-xs text-[var(--labora-muted)]">Las plataformas elegidas son preferencias del perfil. La ficha muestra los registros existentes.</p></section>}
      {section === 'messages' && <section className="labora-card p-5"><h3 className="font-extrabold">Actividad registrada</h3><dl className="mt-4 grid gap-3 sm:grid-cols-2"><div><dt className="text-xs text-[var(--labora-muted)]">Creación de cuenta</dt><dd className="mt-1 text-sm">{dateLabel(visible.user.created_at)}</dd></div><div><dt className="text-xs text-[var(--labora-muted)]">Último acceso</dt><dd className="mt-1 text-sm">{dateLabel(visible.user.last_sign_in_at)}</dd></div></dl><p className="mt-4 text-xs text-[var(--labora-muted)]">Debajo aparecen únicamente las conversaciones en las que participa tu cuenta. Estos eventos no representan un historial completo de acciones.</p></section>}
      {section !== 'profile' && <section className="labora-card overflow-hidden">
        <header className="border-b border-[var(--labora-border)] p-5"><h3 className="font-extrabold">{section === 'messages' ? 'Mensajes accesibles' : labels[section]}</h3><p className="mt-1 text-xs text-[var(--labora-muted)]">{visible.total} registros · {visible.total ? `${page * visible.pageSize + 1}–${Math.min((page + 1) * visible.pageSize, visible.total)}` : 'sin resultados'}{section === 'declarations' ? ' · Estados registrados; no se calculan impuestos nuevos.' : ''}</p></header>
        {!visible.rows.length ? <p role="status" className="p-8 text-center text-sm text-[var(--labora-muted)]">{section === 'messages' ? 'No hay mensajes accesibles a tu cuenta en esta ficha.' : section === 'clients' ? 'Esta cuenta no tiene clientes vinculados en esta página.' : 'No hay registros en esta sección.'}</p> : <div className="divide-y divide-[var(--labora-border)]">{visible.rows.map(row => <article key={String(row.id)} className="min-w-0 space-y-2 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><h4 className="min-w-0 break-words text-sm font-extrabold">{shown(row.name || row.title || row.merchant || row.platform || row.category || (section === 'messages' ? 'Mensaje' : 'Registro'))}</h4>{(section === 'incomes' || section === 'expenses') && <p className="text-base font-extrabold text-[var(--labora-primary)]">{money(row.amount)}</p>}</div>
          <p className="break-words text-xs text-[var(--labora-muted)]">{section === 'clients' ? `${shown(row.email)} · ${shown(row.country_code)}` : [dateLabel(row.date || row.document_date || row.created_at), row.status ? statuses[String(row.status)] || row.status : null, row.type, row.quarter, row.model_type ? `Modelo ${row.model_type}` : null].filter(Boolean).join(' · ')}</p>
          {section === 'incomes' && <p className="text-xs">Retención: {money(row.retention)} · {row.needs_review == null ? 'Revisión sin informar' : row.needs_review ? 'Por revisar' : 'Sin revisión pendiente'}</p>}
          {section === 'clients' && <button type="button" onClick={() => onSelectUser(String(row.id))} className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--labora-border)] px-3 text-xs font-bold text-[var(--labora-primary)] ${focusClass}`}>Abrir ficha<ChevronRight size={14} /></button>}
          {section === 'expenses' && <p className="text-xs">Deducibilidad registrada: {row.deductible_percentage == null ? 'Sin decisión' : `${row.deductible_percentage}%`} · Categoría: {shown(row.category)}</p>}
          {section === 'declarations' && <p className="text-xs">Importe registrado: {money(row.tax_amount)} · Referencia: {shown(row.filing_reference)}</p>}
          {section === 'requirements' && <><p className="whitespace-pre-wrap break-words text-sm">{shown(row.description)}</p><p className="text-xs">Plazo: {dateLabel(row.deadline)}</p>{row.submission_notes && <p className="whitespace-pre-wrap break-words text-xs">Respuesta: {String(row.submission_notes)}</p>}{row.review_note && <p className="whitespace-pre-wrap break-words text-xs">Revisión: {String(row.review_note)}</p>}</>}
          {section === 'messages' && <p className="whitespace-pre-wrap break-words text-sm">{shown(row.message)}</p>}
          {section === 'documents' && <div className="space-y-2"><p className="text-xs text-[var(--labora-muted)]">{shown(row.mime_type)} · {row.size_bytes == null ? 'Tamaño no registrado' : `${(Number(row.size_bytes) / 1024).toLocaleString('es-ES', { maximumFractionDigits: 0 })} KB`}</p>{row.hasFile && <button type="button" onClick={() => void openFile(String(row.id))} disabled={file?.id === row.id && !file.url && !file.error} className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--labora-border)] px-3 text-xs font-bold ${focusClass}`}><FileText size={14} />Comprobar acceso al archivo</button>}{file?.id === row.id && file.url && <a href={file.url} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-[44px] items-center rounded-xl bg-[var(--labora-primary)] px-3 text-xs font-bold text-white ${focusClass}`}>Abrir archivo privado</a>}{file?.id === row.id && file.error && <p role="alert" className="text-xs text-[var(--labora-clay)]">{file.error}</p>}</div>}
        </article>)}</div>}
        {visible.total > visible.pageSize && <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--labora-border)] p-4"><button type="button" disabled={page === 0} onClick={() => setPage(value => value - 1)} className={`inline-flex min-h-[44px] items-center gap-1 rounded-xl px-3 text-xs font-bold disabled:opacity-40 ${focusClass}`}><ChevronLeft size={15} />Anterior</button><span className="text-xs text-[var(--labora-muted)]">Página {page + 1} de {Math.ceil(visible.total / visible.pageSize)}</span><button type="button" disabled={(page + 1) * visible.pageSize >= visible.total || page >= 2000} onClick={() => setPage(value => value + 1)} className={`inline-flex min-h-[44px] items-center gap-1 rounded-xl px-3 text-xs font-bold disabled:opacity-40 ${focusClass}`}>Siguiente<ChevronRight size={15} /></button></footer>}
      </section>}
      <p className="flex items-start gap-2 text-[11px] text-[var(--labora-muted)]"><ShieldCheck size={14} className="shrink-0" />Lectura de {dateLabel(visible.generatedAt)}. Los archivos privados y mensajes conservan sus permisos de acceso.</p>
    </>}
  </div>;
};
