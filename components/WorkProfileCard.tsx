import React, { useEffect, useState } from 'react';
import { Bike, BriefcaseBusiness, Building2, Check, Loader2, Plus, Save, UserRound, X } from 'lucide-react';
import { updateRemoteProfile } from '../services/authWorkspace';
import { User, WorkMode } from '../types';

const MODES: Array<{
  id: WorkMode;
  label: string;
  helper: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: 'employee', label: 'Empleado/a', helper: 'Trabajo por cuenta ajena.', icon: Building2 },
  { id: 'rider', label: 'Rider / reparto', helper: 'Delivery, mensajería o reparto.', icon: Bike },
  { id: 'self_employed', label: 'Autónomo/a', helper: 'Actividad propia registrada.', icon: BriefcaseBusiness },
  { id: 'freelancer', label: 'Freelancer', helper: 'Servicios profesionales por proyecto.', icon: UserRound }
];

interface Props {
  user: User;
  onSaved: (patch: Partial<User>) => void;
  onError: (message: string) => void;
}

const WorkProfileCard: React.FC<Props> = ({ user, onSaved, onError }) => {
  const [modes, setModes] = useState<WorkMode[]>(user.workModes || []);
  const [workplaces, setWorkplaces] = useState<string[]>(user.workplaces || []);
  const [workplaceInput, setWorkplaceInput] = useState('');
  const [wantsManager, setWantsManager] = useState(Boolean(user.wantsManager));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setModes(user.workModes || []);
    setWorkplaces(user.workplaces || []);
    setWantsManager(Boolean(user.wantsManager));
  }, [user.id, user.workModes, user.workplaces, user.wantsManager]);

  const toggleMode = (mode: WorkMode) => {
    setModes((current) => current.includes(mode)
      ? current.filter((value) => value !== mode)
      : [...current, mode]);
  };

  const addWorkplace = () => {
    const value = workplaceInput.trim();
    if (!value) return;
    setWorkplaces((current) => Array.from(new Set([...current, value])).slice(0, 30));
    setWorkplaceInput('');
  };

  const save = async () => {
    if (modes.length === 0) {
      onError('Selecciona al menos una forma de trabajo.');
      return;
    }

    const patch: Partial<User> = {
      workModes: modes,
      workplaces,
      wantsManager
    };

    setSaving(true);
    try {
      await updateRemoteProfile(user.id, patch);
      onSaved(patch);
    } catch (error) {
      onError(error instanceof Error && error.message
        ? error.message
        : 'No se pudo guardar tu perfil laboral.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="labora-card p-4 sm:p-5">
      <div>
        <p className="labora-kicker text-[var(--labora-muted)]">Tu trabajo</p>
        <h2 className="mt-1 text-base font-extrabold text-[var(--labora-ink)]">Perfil laboral</h2>
        <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">
          Puedes combinar varias formas de trabajo. Esto organiza la app; no crea por sí solo una obligación fiscal.
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {MODES.map(({ id, label, helper, icon: Icon }) => {
          const active = modes.includes(id);
          return (
            <button
              type="button"
              key={id}
              onClick={() => toggleMode(id)}
              aria-pressed={active}
              className={`relative flex min-h-[76px] items-start gap-3 rounded-[14px] border p-3 pr-9 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)] ${
                active
                  ? 'border-[var(--labora-primary)] bg-[var(--labora-moss-soft)] shadow-[inset_0_0_0_1px_rgba(47,93,74,0.08)]'
                  : 'border-[var(--labora-border)] bg-[var(--labora-surface)] hover:bg-[var(--labora-surface-2)]'
              }`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] ${
                active ? 'bg-[var(--labora-primary)] text-white' : 'bg-[var(--labora-canvas)] text-[var(--labora-muted)]'
              }`}>
                <Icon size={16} />
              </span>
              <span>
                <span className="block text-xs font-extrabold text-[var(--labora-ink)]">{label}</span>
                <span className="mt-0.5 block text-[10px] leading-relaxed text-[var(--labora-muted)]">{helper}</span>
              </span>
              <span
                aria-hidden
                className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border transition ${
                  active
                    ? 'border-[var(--labora-primary)] bg-[var(--labora-primary)] text-white'
                    : 'border-[var(--labora-border)] bg-[var(--labora-surface)] text-transparent'
                }`}
              >
                <Check size={12} strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] p-3">
        <label htmlFor="labora-settings-workplace" className="text-[11px] font-extrabold text-[var(--labora-ink)]">
          Empresas, clientes o lugares de trabajo <span className="font-normal text-[var(--labora-muted)]">(opcional)</span>
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="labora-settings-workplace"
            value={workplaceInput}
            onChange={(event) => setWorkplaceInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addWorkplace();
              }
            }}
            className="min-w-0 flex-1 rounded-[12px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--labora-primary-2)]"
            placeholder="Empresa, cliente o centro de trabajo"
          />
          <button
            type="button"
            onClick={addWorkplace}
            className="inline-flex items-center gap-1 rounded-[12px] bg-[var(--labora-primary)] px-3 text-xs font-extrabold text-white"
          >
            <Plus size={14} /> Añadir
          </button>
        </div>
        {workplaces.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {workplaces.map((place) => (
              <span key={place} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--labora-border)] bg-[var(--labora-surface)] px-2.5 py-1 text-[10px] font-bold text-[var(--labora-ink-soft)]">
                {place}
                <button
                  type="button"
                  onClick={() => setWorkplaces((current) => current.filter((value) => value !== place))}
                  aria-label={`Quitar ${place}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={wantsManager}
        onClick={() => setWantsManager((value) => !value)}
        className="mt-3 flex w-full items-center gap-3 rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-surface)] p-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-extrabold text-[var(--labora-ink)]">Quiero apoyo de una gestoría o asesoría</span>
          <span className="mt-0.5 block text-[10px] leading-relaxed text-[var(--labora-muted)]">Es una preferencia; no vincula ninguna cuenta automáticamente.</span>
        </span>
        <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${wantsManager ? 'bg-[var(--labora-primary)]' : 'bg-[var(--labora-surface-2)]'}`}>
          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${wantsManager ? 'translate-x-6' : 'translate-x-1'}`} />
        </span>
      </button>

      <div className="mt-4 flex justify-end border-t border-[var(--labora-border)] pt-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-[12px] bg-[var(--labora-primary)] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Guardar perfil laboral
        </button>
      </div>
    </section>
  );
};

export default WorkProfileCard;
