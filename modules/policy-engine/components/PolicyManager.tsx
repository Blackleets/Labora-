
import React, { useState } from 'react';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { useCountry } from '../../../contexts/CountryContext';
import { Policy, PolicyRule, PolicyAction, UserRole } from '../../../types';
import { Shield, Plus, Trash2, Edit, AlertCircle, CheckCircle, Lock, Power, X, Save, Layers, GitBranch, Zap, Code } from 'lucide-react';

export const PolicyManager: React.FC = () => {
  const { organization } = useOrganization();
  const { countries } = useCountry();
  
  const [policies, setPolicies] = useState<Policy[]>([
    {
      id: 'pol_1',
      organizationId: organization?.id || '',
      name: 'High Payroll Approval',
      description: 'Require Admin approval for payroll runs over 10,000€',
      enabled: true,
      priority: 90,
      scope: { module: 'payroll', country_code: 'ES' },
      rules: [{ id: 'r1', field: 'total_cost', operator: 'gt', value: 10000 }],
      actions: [{ type: 'require_approval', target_role: UserRole.ADMIN, message: 'High value payroll detected.' }]
    },
    {
      id: 'pol_2',
      organizationId: organization?.id || '',
      name: 'Weekend Delivery Surcharge',
      description: 'Auto-apply surcharge if delivery is on Sunday',
      enabled: false,
      priority: 50,
      scope: { module: 'delivery' },
      rules: [{ id: 'r2', field: 'day_of_week', operator: 'eq', value: 'Sunday' }],
      actions: [{ type: 'notify', message: 'Weekend surcharge active' }]
    }
  ]);

  const [isEditing, setIsEditing] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState<Policy | null>(null);

  // --- CRUD Handlers ---

  const handleEdit = (policy: Policy) => {
    setCurrentPolicy({ ...policy });
    setIsEditing(true);
  };

  const handleCreate = () => {
    setCurrentPolicy({
      id: '',
      organizationId: organization?.id || '',
      name: '',
      description: '',
      enabled: true,
      priority: 50,
      scope: {},
      rules: [],
      actions: []
    });
    setIsEditing(true);
  };

  const togglePolicy = (id: string) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const deletePolicy = (id: string) => {
    if(confirm('Delete this policy?')) {
      setPolicies(prev => prev.filter(p => p.id !== id));
    }
  };

  const savePolicy = () => {
    if (!currentPolicy) return;
    
    // Basic validation
    if (!currentPolicy.name) return alert('Name is required');
    if (currentPolicy.rules.length === 0) return alert('At least one rule is required');

    setPolicies(prev => {
      if (currentPolicy.id) {
        // Update
        return prev.map(p => p.id === currentPolicy.id ? currentPolicy : p);
      } else {
        // Create
        return [...prev, { ...currentPolicy, id: `pol_${Date.now()}` }];
      }
    });
    setIsEditing(false);
    setCurrentPolicy(null);
  };

  // --- Form Handlers ---

  const addRule = () => {
    if (!currentPolicy) return;
    const newRule: PolicyRule = {
      id: `r_${Date.now()}`,
      field: '',
      operator: 'eq',
      value: ''
    };
    setCurrentPolicy({ ...currentPolicy, rules: [...currentPolicy.rules, newRule] });
  };

  const removeRule = (idx: number) => {
    if (!currentPolicy) return;
    const newRules = [...currentPolicy.rules];
    newRules.splice(idx, 1);
    setCurrentPolicy({ ...currentPolicy, rules: newRules });
  };

  const updateRule = (idx: number, field: keyof PolicyRule, value: any) => {
    if (!currentPolicy) return;
    const newRules = [...currentPolicy.rules];
    newRules[idx] = { ...newRules[idx], [field]: value };
    setCurrentPolicy({ ...currentPolicy, rules: newRules });
  };

  const addAction = () => {
    if (!currentPolicy) return;
    const newAction: PolicyAction = {
      type: 'notify',
      message: ''
    };
    setCurrentPolicy({ ...currentPolicy, actions: [...currentPolicy.actions, newAction] });
  };

  const removeAction = (idx: number) => {
    if (!currentPolicy) return;
    const newActions = [...currentPolicy.actions];
    newActions.splice(idx, 1);
    setCurrentPolicy({ ...currentPolicy, actions: newActions });
  };

  const updateAction = (idx: number, field: keyof PolicyAction, value: any) => {
    if (!currentPolicy) return;
    const newActions = [...currentPolicy.actions];
    newActions[idx] = { ...newActions[idx], [field]: value };
    setCurrentPolicy({ ...currentPolicy, actions: newActions });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Shield className="text-[#2D6CDF]" /> Policy Engine
          </h2>
          <p className="text-gray-500 text-sm mt-1">Reglas automáticas y compliance para {organization?.name || 'su organización'}.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-[#1A1A1A] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-black transition-colors"
        >
          <Plus size={16} /> Nueva Política
        </button>
      </div>

      <div className="grid gap-4">
        {policies.map(policy => (
          <div key={policy.id} className={`bg-white p-6 rounded-[24px] border transition-all ${policy.enabled ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-75'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${policy.enabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    {policy.name}
                    {!policy.enabled && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase font-black">Disabled</span>}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{policy.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {policy.scope.country_code ? (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-bold uppercase border border-gray-200">
                        {policy.scope.country_code}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-1 rounded-lg font-bold uppercase border border-gray-200">
                        Global
                      </span>
                    )}
                    {policy.scope.module ? (
                      <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded-lg font-bold uppercase border border-purple-100">
                        {policy.scope.module}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-purple-50 text-purple-400 px-2 py-1 rounded-lg font-bold uppercase border border-purple-100">
                        All Modules
                      </span>
                    )}
                    <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-1 rounded-lg font-bold uppercase border border-orange-100">
                      Priority: {policy.priority}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                <button 
                  onClick={() => togglePolicy(policy.id)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-colors ${policy.enabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <Power size={14} /> {policy.enabled ? 'Activa' : 'Inactiva'}
                </button>
                <button 
                  onClick={() => handleEdit(policy)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => deletePolicy(policy.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            {/* Rules Preview (Mock) */}
            {policy.rules.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400 font-mono flex flex-wrap gap-2">
                 <span className="font-bold text-gray-300 select-none">IF</span>
                 {policy.rules.map((r, i) => (
                   <span key={r.id} className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                     {r.field} {r.operator} {r.value} {i < policy.rules.length - 1 ? 'AND' : ''}
                   </span>
                 ))}
                 <span className="font-bold text-gray-300 select-none">THEN</span>
                 {policy.actions.map((a, i) => (
                   <span key={i} className={`px-2 py-0.5 rounded border ${a.type === 'block' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                     {a.type}
                   </span>
                 ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {isEditing && currentPolicy && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Shield size={20} className="text-[#2D6CDF]" />
                  {currentPolicy.id ? 'Editar Política' : 'Nueva Política'}
                </h3>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* General Settings */}
                <section className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Layers size={14} /> Configuración General
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Nombre Política</label>
                      <input 
                        type="text" 
                        value={currentPolicy.name} 
                        onChange={e => setCurrentPolicy({...currentPolicy, name: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2D6CDF] outline-none"
                        placeholder="Ej. Control de Gastos Mayores"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Descripción</label>
                      <input 
                        type="text" 
                        value={currentPolicy.description} 
                        onChange={e => setCurrentPolicy({...currentPolicy, description: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2D6CDF] outline-none"
                        placeholder="Explica qué hace esta regla..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Prioridad (1-100)</label>
                      <input 
                        type="number" 
                        value={currentPolicy.priority} 
                        onChange={e => setCurrentPolicy({...currentPolicy, priority: Number(e.target.value)})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2D6CDF] outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl w-full cursor-pointer hover:bg-gray-100 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={currentPolicy.enabled} 
                          onChange={e => setCurrentPolicy({...currentPolicy, enabled: e.target.checked})}
                          className="w-5 h-5 text-[#2D6CDF] rounded focus:ring-[#2D6CDF]"
                        />
                        <span className="text-sm font-bold text-gray-700">Política Activa</span>
                      </label>
                    </div>
                  </div>
                </section>

                {/* Scope */}
                <section className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <GitBranch size={14} /> Alcance (Scope)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">País</label>
                      <select 
                        value={currentPolicy.scope.country_code || ''}
                        onChange={e => setCurrentPolicy({...currentPolicy, scope: { ...currentPolicy.scope, country_code: e.target.value || undefined }})}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2D6CDF]"
                      >
                        <option value="">Global (Todos)</option>
                        {countries.map(c => (
                          <option key={c.country_code} value={c.country_code}>{c.display_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Módulo</label>
                      <select 
                        value={currentPolicy.scope.module || ''}
                        onChange={e => setCurrentPolicy({...currentPolicy, scope: { ...currentPolicy.scope, module: e.target.value || undefined }})}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2D6CDF]"
                      >
                        <option value="">Todos</option>
                        <option value="payroll">Nóminas (Payroll)</option>
                        <option value="delivery">Reparto (Delivery)</option>
                        <option value="finance">Finanzas</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Rules Engine */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Zap size={14} /> Reglas (Condiciones)
                    </h4>
                    <button onClick={addRule} className="text-xs font-bold text-[#2D6CDF] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                      + Añadir Regla
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {currentPolicy.rules.map((rule, idx) => (
                      <div key={rule.id} className="flex gap-2 items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder="Campo (ej. total_cost)" 
                            value={rule.field}
                            onChange={e => updateRule(idx, 'field', e.target.value)}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-600"
                          />
                        </div>
                        <div className="w-28">
                          <select 
                            value={rule.operator}
                            onChange={e => updateRule(idx, 'operator', e.target.value)}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold"
                          >
                            <option value="eq">Igual (=)</option>
                            <option value="neq">Diferente (!=)</option>
                            <option value="gt">Mayor (&gt;)</option>
                            <option value="lt">Menor (&lt;)</option>
                            <option value="contains">Contiene</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder="Valor" 
                            value={rule.value}
                            onChange={e => updateRule(idx, 'value', e.target.value)}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold"
                          />
                        </div>
                        <button onClick={() => removeRule(idx)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {currentPolicy.rules.length === 0 && (
                      <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs flex flex-col items-center gap-2">
                        <Code size={24} className="opacity-20" />
                        No hay reglas definidas. La política se aplicará siempre si está activa.
                      </div>
                    )}
                  </div>
                </section>

                {/* Actions */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle size={14} /> Acciones (Consecuencias)
                    </h4>
                    <button onClick={addAction} className="text-xs font-bold text-[#2D6CDF] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                      + Añadir Acción
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {currentPolicy.actions.map((action, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <div className="w-full md:w-40">
                          <select 
                            value={action.type}
                            onChange={e => updateAction(idx, 'type', e.target.value)}
                            className={`w-full p-2 border rounded-lg text-sm font-bold uppercase outline-none ${
                              action.type === 'block' ? 'bg-red-50 border-red-200 text-red-700' :
                              action.type === 'require_approval' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                              'bg-white border-gray-200 text-gray-700'
                            }`}
                          >
                            <option value="block">Bloquear</option>
                            <option value="require_approval">Pedir Aprobación</option>
                            <option value="notify">Notificar</option>
                            <option value="log">Log</option>
                          </select>
                        </div>
                        
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder="Mensaje o razón..." 
                            value={action.message || ''}
                            onChange={e => updateAction(idx, 'message', e.target.value)}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                          />
                        </div>

                        {(action.type === 'require_approval' || action.type === 'notify') && (
                          <div className="w-full md:w-32">
                            <select 
                              value={action.target_role || ''}
                              onChange={e => updateAction(idx, 'target_role', e.target.value)}
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                            >
                              <option value="">-- Rol --</option>
                              <option value={UserRole.ADMIN}>Admin</option>
                              <option value={UserRole.MANAGER}>Manager</option>
                              <option value={UserRole.RIDER}>Rider</option>
                            </select>
                          </div>
                        )}

                        <button onClick={() => removeAction(idx)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg self-center md:self-auto">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-[32px]">
                <button onClick={() => setIsEditing(false)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button 
                  onClick={savePolicy}
                  className="px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-black transition-all"
                >
                  <Save size={18} /> Guardar Política
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
