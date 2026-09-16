import React, { useMemo, useState } from 'react';
import {
  Bell,
  Mail,
  Phone,
  Search,
  UserRound,
  Users,
  Wallet
} from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { useCountry } from '../../../contexts/CountryContext';
import { UserRole } from '../../../types';

export const PeopleHub: React.FC = () => {
  const { currentUser, users, incomes, expenses, requirements, privacyMode } = useData();
  const { selectedCountry } = useCountry();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;

  const clients = useMemo(() => {
    if (!currentUser || !isManager) return [];
    return users.filter(
      (user) => user.role === UserRole.RIDER && user.managerId === currentUser.id
    );
  }, [users, currentUser, isManager]);

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((client) =>
      client.name.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term) ||
      (client.nif || '').toLowerCase().includes(term)
    );
  }, [clients, searchTerm]);

  const selectedClient = clients.find((client) => client.id === selectedId) || filteredClients[0] || clients[0];

  const clientStats = useMemo(() => {
    if (!selectedClient) return null;
    const clientIncomes = incomes.filter((income) => income.userId === selectedClient.id);
    const clientExpenses = expenses.filter((expense) => expense.userId === selectedClient.id);
    const clientRequirements = requirements.filter((requirement) => requirement.riderId === selectedClient.id);

    const totalIncome = clientIncomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = clientExpenses
      .filter((expense) => expense.status !== 'rejected')
      .reduce((sum, expense) => sum + expense.amount * ((expense.deductiblePercentage ?? 100) / 100), 0);

    return {
      totalIncome,
      totalExpenses,
      pendingExpenses: clientExpenses.filter(
        (expense) => expense.status === 'pending_review' || expense.status === 'needs_fix'
      ).length,
      pendingRequirements: clientRequirements.filter((requirement) => requirement.status === 'pending').length,
      platforms: selectedClient.platforms
    };
  }, [selectedClient, incomes, expenses, requirements]);

  const formatMoney = (amount: number) => {
    if (privacyMode) return '••••';
    return amount.toLocaleString('es-ES', {
      style: 'currency',
      currency: selectedCountry.currency || 'EUR',
      maximumFractionDigits: 0
    });
  };

  if (!isManager) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#E3DCD2] bg-white p-8 text-center">
        <Users size={28} className="mx-auto text-stone-300" />
        <p className="mt-3 text-sm font-semibold text-stone-600">Esta sección está disponible para cuentas de gestoría.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Gestoría</p>
        <h1 className="mt-1 text-2xl font-bold text-stone-900">Clientes</h1>
        <p className="mt-1 text-sm text-stone-500">Autónomos vinculados a esta cuenta.</p>
      </header>

      {clients.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[#DCD4C9] bg-white px-6 py-14 text-center">
          <UserRound size={30} className="mx-auto text-stone-300" />
          <h2 className="mt-3 text-sm font-bold text-stone-700">Aún no hay clientes vinculados</h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-stone-400">
            Cuando un autónomo quede asociado a esta gestoría aparecerá aquí con sus movimientos, tareas y datos de contacto.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[#E3DCD2] bg-white p-3">
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar cliente"
                className="w-full rounded-xl border border-[#E2DBD1] bg-[#FAF8F4] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#9BB3A4]"
              />
            </div>

            <div className="space-y-1.5">
              {filteredClients.map((client) => {
                const active = selectedClient?.id === client.id;
                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedId(client.id)}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                      active ? 'bg-[#EAF2ED]' : 'hover:bg-[#F7F4EF]'
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      active ? 'bg-[#2E5A44] text-white' : 'bg-[#F0ECE6] text-stone-500'
                    }`}>
                      {client.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-stone-900">{client.name}</p>
                      <p className="truncate text-[10px] text-stone-500">{client.nif || client.email}</p>
                    </div>
                  </button>
                );
              })}

              {filteredClients.length === 0 && (
                <p className="px-3 py-8 text-center text-xs text-stone-400">No hay coincidencias.</p>
              )}
            </div>
          </aside>

          {selectedClient && clientStats && (
            <div className="min-w-0 space-y-4">
              <section className="rounded-2xl border border-[#E3DCD2] bg-white p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">{selectedClient.name}</h2>
                    <p className="mt-1 text-xs text-stone-500">{selectedClient.nif || 'NIF no registrado'}</p>
                  </div>
                  <span className="w-fit rounded-full bg-[#EAF2ED] px-2.5 py-1 text-[10px] font-semibold text-[#2E5A44]">
                    Cliente vinculado
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <InfoCard label="Ingresos" value={formatMoney(clientStats.totalIncome)} icon={Wallet} />
                  <InfoCard label="Gastos" value={formatMoney(clientStats.totalExpenses)} icon={Wallet} />
                  <InfoCard label="Por revisar" value={String(clientStats.pendingExpenses)} icon={Bell} />
                  <InfoCard label="Peticiones" value={String(clientStats.pendingRequirements)} icon={Bell} />
                </div>
              </section>

              <section className="rounded-2xl border border-[#E3DCD2] bg-white p-5">
                <h3 className="text-sm font-bold text-stone-900">Contacto</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ContactRow icon={Mail} label="Correo" value={selectedClient.email} href={`mailto:${selectedClient.email}`} />
                  <ContactRow icon={Phone} label="Teléfono" value={selectedClient.phone || 'No registrado'} href={selectedClient.phone ? `tel:${selectedClient.phone}` : undefined} />
                </div>
              </section>

              <section className="rounded-2xl border border-[#E3DCD2] bg-white p-5">
                <h3 className="text-sm font-bold text-stone-900">Actividad</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Plataformas</p>
                    <p className="mt-1 text-sm text-stone-700">
                      {clientStats.platforms.length ? clientStats.platforms.join(' · ') : 'Sin plataformas registradas'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Vehículo</p>
                    <p className="mt-1 text-sm text-stone-700">
                      {[selectedClient.vehicleType, selectedClient.vehiclePlate].filter(Boolean).join(' · ') || 'No registrado'}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

const InfoCard = ({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) => (
  <div className="rounded-xl bg-[#F8F5F0] p-3">
    <Icon size={14} className="text-stone-400" />
    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-stone-400">{label}</p>
    <p className="mt-1 truncate text-sm font-bold text-stone-900">{value}</p>
  </div>
);

const ContactRow = ({
  icon: Icon,
  label,
  value,
  href
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  href?: string;
}) => {
  const content = (
    <div className="flex items-center gap-3 rounded-xl bg-[#F8F5F0] p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-stone-500">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">{label}</p>
        <p className="mt-0.5 truncate text-xs font-semibold text-stone-700">{value}</p>
      </div>
    </div>
  );

  return href ? <a href={href}>{content}</a> : content;
};