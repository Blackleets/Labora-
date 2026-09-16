import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Scale, ShieldAlert, X } from 'lucide-react';
import { Expense, UserRole } from '../types';
import { useData } from '../contexts/DataContext';
import { getSupabase } from '../services/supabaseClient';

interface ExpenseDeductibilityControlProps {
  expense: Expense;
  clientCountryCode?: string;
}

export const ExpenseDeductibilityControl: React.FC<ExpenseDeductibilityControlProps> = ({
  expense,
  clientCountryCode,
}) => {
  const { currentUser, refreshData, showNotification } = useData();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [assessed, setAssessed] = useState(false);
  const [percentage, setPercentage] = useState('');
  const [basis, setBasis] = useState('');

  const enabled = currentUser?.role === UserRole.MANAGER
    && clientCountryCode === 'ES'
    && expense.status === 'approved';

  useEffect(() => {
    let active = true;
    if (!enabled || !currentUser) {
      setLoading(false);
      return () => { active = false; };
    }

    void (async () => {
      setLoading(true);
      const { data, error } = await getSupabase()
        .from('expense_reviews')
        .select('deductibility_assessed,deductible_percent,deductibility_basis')
        .eq('expense_id', expense.id)
        .eq('manager_user_id', currentUser.id)
        .maybeSingle();

      if (!active) return;
      if (error) {
        console.error('Labora+ deductibility review load failed:', error);
        showNotification('error', 'No se pudo cargar el criterio fiscal de este gasto.');
      } else {
        const isAssessed = Boolean(data?.deductibility_assessed);
        setAssessed(isAssessed);
        setPercentage(isAssessed ? String(Number(data?.deductible_percent ?? 0)) : '');
        setBasis(isAssessed ? String(data?.deductibility_basis || '') : '');
      }
      setLoading(false);
    })();

    return () => { active = false; };
  }, [currentUser, enabled, expense.id, showNotification]);

  if (!enabled) return null;

  const save = async () => {
    if (!currentUser) return;
    const numeric = Number(percentage);
    if (percentage.trim() === '' || !Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
      showNotification('error', 'Introduce un porcentaje explícito entre 0 y 100.');
      return;
    }
    if (!basis.trim()) {
      showNotification('error', 'Explica el fundamento usado para evaluar la deducibilidad.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await getSupabase()
        .from('expense_reviews')
        .update({
          deductibility_assessed: true,
          deductible_percent: numeric,
          deductibility_basis: basis.trim(),
        })
        .eq('expense_id', expense.id)
        .eq('manager_user_id', currentUser.id);
      if (error) throw error;

      setAssessed(true);
      setEditing(false);
      await refreshData();
      showNotification('success', 'Criterio de deducibilidad guardado con trazabilidad.');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo guardar la evaluación fiscal.');
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const { error } = await getSupabase()
        .from('expense_reviews')
        .update({
          deductibility_assessed: false,
          deductible_percent: 0,
          deductibility_basis: null,
        })
        .eq('expense_id', expense.id)
        .eq('manager_user_id', currentUser.id);
      if (error) throw error;

      setAssessed(false);
      setPercentage('');
      setBasis('');
      setEditing(false);
      await refreshData();
      showNotification('info', 'La deducibilidad vuelve a quedar como no evaluada.');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo retirar la evaluación fiscal.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#F7F3EC] px-3 py-2 text-[11px] text-stone-500"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Comprobando criterio fiscal…</div>;
  }

  if (editing) {
    return (
      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-900"><Scale className="h-4 w-4" /> Evaluación explícita del asesor</p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-800">Labora+ no propone este porcentaje. Registra únicamente el criterio que hayas revisado para este caso concreto.</p>
          </div>
          <button type="button" onClick={() => setEditing(false)} className="rounded-lg p-1 text-amber-700" aria-label="Cerrar"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr]">
          <label className="text-[11px] font-bold text-stone-700">Porcentaje<input type="number" min="0" max="100" step="0.01" value={percentage} onChange={(event) => setPercentage(event.target.value)} placeholder="0–100" className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm" /></label>
          <label className="text-[11px] font-bold text-stone-700">Fundamento<textarea value={basis} onChange={(event) => setBasis(event.target.value)} rows={2} placeholder="Motivo y criterio revisado por el asesor" className="mt-1 w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm" /></label>
        </div>
        <button type="button" disabled={saving} onClick={() => void save()} className="mt-3 flex items-center gap-1.5 rounded-xl bg-[#2E5A44] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Guardar criterio revisado</button>
      </div>
    );
  }

  return (
    <div className={`mt-3 rounded-xl border px-3 py-2.5 ${assessed ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
      {assessed ? (
        <>
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" /> Deducibilidad evaluada por el asesor: {percentage}%</p>
          <p className="mt-1 text-[11px] leading-relaxed text-emerald-800">{basis}</p>
          <div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => setEditing(true)} className="text-[11px] font-bold text-[#2E5A44]">Editar criterio</button><button type="button" disabled={saving} onClick={() => void clear()} className="text-[11px] font-bold text-stone-500">Marcar como no evaluada</button></div>
        </>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900"><ShieldAlert className="h-3.5 w-3.5" /> Deducibilidad fiscal: no evaluada</p><p className="mt-1 text-[10px] leading-relaxed text-amber-800">La evidencia está revisada, pero eso no convierte el gasto en deducible.</p></div>
          <button type="button" onClick={() => setEditing(true)} className="shrink-0 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-amber-900">Evaluar criterio fiscal</button>
        </div>
      )}
    </div>
  );
};

export default ExpenseDeductibilityControl;
