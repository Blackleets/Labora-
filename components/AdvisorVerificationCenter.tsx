import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Building2, FileCheck2, IdCard, Loader2, ShieldCheck, Upload } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { getSupabase } from '../services/supabaseClient';
import { getMarketProfile } from '../modules/country-config/marketProfiles';

interface VerificationRequest {
  id: string;
  verification_kind: 'identity' | 'business' | 'professional';
  state: 'pending' | 'verified' | 'rejected' | 'expired';
  declared_issuer: string | null;
  declared_identifier: string | null;
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

type VerificationKind = VerificationRequest['verification_kind'];

const KIND_META: Record<VerificationKind, { title: string; description: string; icon: React.ComponentType<{ className?: string }> }> = {
  identity: {
    title: 'Identidad',
    description: 'Documento que permita comprobar la identidad del profesional.',
    icon: IdCard,
  },
  business: {
    title: 'Actividad / despacho',
    description: 'Documento de alta, registro mercantil, empresa o actividad equivalente.',
    icon: Building2,
  },
  professional: {
    title: 'Acreditación profesional',
    description: 'Colegio, licencia, registro o certificación si existe en tu jurisdicción.',
    icon: BadgeCheck,
  },
};

const sha256 = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const safeExtension = (file: File) => {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
};

export const AdvisorVerificationCenter: React.FC = () => {
  const { currentUser, showNotification } = useData();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [kind, setKind] = useState<VerificationKind>('identity');
  const [issuer, setIssuer] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const market = getMarketProfile(currentUser?.countryCode);
  const latestByKind = useMemo(() => {
    const map = new Map<VerificationKind, VerificationRequest>();
    requests.forEach((request) => {
      if (!map.has(request.verification_kind)) map.set(request.verification_kind, request);
    });
    return map;
  }, [requests]);

  const loadRequests = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from('advisor_verification_requests')
        .select('id,verification_kind,state,declared_issuer,declared_identifier,reviewer_notes,created_at,reviewed_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests((data || []) as VerificationRequest[]);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo cargar el estado de verificación.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, [currentUser?.id]);

  if (!currentUser || !currentUser.organizationId) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      showNotification('error', 'Adjunta un documento real para enviar la solicitud.');
      return;
    }
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showNotification('error', 'Usa PDF, JPG, PNG o WEBP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotification('error', 'El archivo supera el límite de 10 MB.');
      return;
    }

    setSubmitting(true);
    const supabase = getSupabase();
    const storagePath = `${currentUser.organizationId}/${currentUser.id}/advisor-verification/${crypto.randomUUID()}.${safeExtension(file)}`;
    let documentId: string | null = null;

    try {
      const checksum = await sha256(file);
      const { error: uploadError } = await supabase.storage.from('fiscal-evidence').upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: documentRow, error: documentError } = await supabase.from('documents').insert({
        organization_id: currentUser.organizationId,
        user_id: currentUser.id,
        uploaded_by: currentUser.id,
        kind: `advisor_verification_${kind}`,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        sha256: checksum,
        extraction_status: 'manual_review',
      }).select('id').single();
      if (documentError) throw documentError;
      documentId = String(documentRow.id);

      const { error: requestError } = await supabase.from('advisor_verification_requests').insert({
        user_id: currentUser.id,
        country_code: market.countryCode,
        verification_kind: kind,
        state: 'pending',
        declared_issuer: issuer.trim() || null,
        declared_identifier: identifier.trim() || null,
        evidence_document_id: documentId,
      });
      if (requestError) throw requestError;

      setFile(null);
      setIssuer('');
      setIdentifier('');
      await loadRequests();
      showNotification('success', 'Solicitud enviada. Queda pendiente de revisión independiente.');
    } catch (error) {
      if (documentId) await supabase.from('documents').delete().eq('id', documentId);
      await supabase.storage.from('fiscal-evidence').remove([storagePath]);
      showNotification('error', error instanceof Error ? error.message : 'No se pudo enviar la verificación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-[1.75rem] border border-[#D8D0C1] bg-[#FCFAF7] p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE0D3] bg-[#EDF5EF] px-3 py-1 text-xs font-bold text-[#2E5A44]"><ShieldCheck className="h-3.5 w-3.5" /> Verificación del asesor</div>
          <h2 className="mt-3 font-serif text-xl font-bold text-stone-900">Demuestra cada nivel con evidencia</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-600">Tu solicitud queda privada y pendiente. El navegador no tiene permiso para aprobarla ni para elevar tu nivel de confianza.</p>
        </div>
        <div className="rounded-xl border border-[#E4DDD2] bg-white px-3 py-2 text-right text-[11px]"><p className="font-bold text-stone-700">País</p><p className="text-stone-500">{market.displayName}</p></div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {(Object.keys(KIND_META) as VerificationKind[]).map((itemKind) => {
          const meta = KIND_META[itemKind];
          const Icon = meta.icon;
          const latest = latestByKind.get(itemKind);
          const status = latest?.state || 'not_started';
          return (
            <button key={itemKind} onClick={() => setKind(itemKind)} className={`rounded-2xl border p-4 text-left transition ${kind === itemKind ? 'border-[#78A087] bg-[#EEF5F0]' : 'border-[#E4DDD2] bg-white hover:bg-[#FAF8F4]'}`}>
              <div className="flex items-start justify-between gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF2EE] text-[#2E5A44]"><Icon className="h-4 w-4" /></span><Status state={status} /></div>
              <p className="mt-3 text-sm font-black text-stone-800">{meta.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-stone-500">{meta.description}</p>
              {latest?.reviewer_notes && <p className="mt-2 rounded-lg bg-[#F7F3EC] px-2.5 py-2 text-[10px] leading-relaxed text-stone-600">{latest.reviewer_notes}</p>}
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="mt-5 rounded-2xl border border-[#E4DDD2] bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-[#2E5A44]" /><p className="text-sm font-black text-stone-800">Enviar evidencia · {KIND_META[kind].title}</p></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-stone-700">Emisor / entidad<input value={issuer} onChange={(event) => setIssuer(event.target.value)} placeholder={kind === 'professional' ? 'Ej. colegio o registro profesional' : 'Opcional'} className="mt-1 w-full rounded-xl border border-[#DED7CC] px-3 py-2.5 text-sm outline-none focus:border-[#6A917A]" /></label>
          <label className="text-xs font-semibold text-stone-700">Identificador declarado<input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={kind === 'professional' ? 'Nº colegiado / licencia' : 'Opcional'} className="mt-1 w-full rounded-xl border border-[#DED7CC] px-3 py-2.5 text-sm outline-none focus:border-[#6A917A]" /></label>
        </div>
        <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-[#BFCDBF] bg-[#F5F8F4] p-4">
          <div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#2E5A44]"><Upload className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-xs font-bold text-stone-800">{file?.name || 'Adjuntar documento'}</p><p className="mt-0.5 text-[10px] text-stone-500">PDF, JPG, PNG o WEBP · máximo 10 MB</p></div></div>
          <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <button disabled={submitting || loading || !file} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E5A44] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : 'Enviar para revisión'}</button>
      </form>
    </section>
  );
};

const Status: React.FC<{ state: string }> = ({ state }) => {
  const map: Record<string, { label: string; className: string }> = {
    not_started: { label: 'SIN ENVIAR', className: 'bg-stone-100 text-stone-500' },
    pending: { label: 'PENDIENTE', className: 'bg-amber-50 text-amber-700' },
    verified: { label: 'VERIFICADO', className: 'bg-emerald-50 text-emerald-700' },
    rejected: { label: 'RECHAZADO', className: 'bg-red-50 text-red-700' },
    expired: { label: 'CADUCADO', className: 'bg-stone-100 text-stone-600' },
  };
  const item = map[state] || map.not_started;
  return <span className={`rounded-full px-2 py-1 text-[9px] font-black tracking-wide ${item.className}`}>{item.label}</span>;
};
