
import React, { useState } from 'react';
import { useCountry } from '../../../contexts/CountryContext';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { useData } from '../../../contexts/DataContext';
import { payrollEngine } from '../services/payrollEngine';
import { Employee, Payslip, Policy, UserRole } from '../../../types';
import { Users, Calculator, Download, DollarSign, FileText, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { eventBus } from '../../core/event-bus/EventBus';
import { policyEngine } from '../../policy-engine/PolicyEngine'; // Import Policy Engine
import { approvalService } from '../../core/approvals/ApprovalService'; // Import Approval Service

export const PayrollDashboard: React.FC = () => {
  const { selectedCountry } = useCountry();
  const { organization } = useOrganization();
  const { currentUser, showNotification } = useData();
  
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 'e1', name: 'Carlos Ruiz', role: 'Repartidor Senior', country_code: 'ES', base_salary: 1500, currency: 'EUR', status: 'active', start_date: '2023-01-10' },
    { id: 'e2', name: 'Ana Lopez', role: 'Soporte', country_code: 'ES', base_salary: 1800, currency: 'EUR', status: 'active', start_date: '2023-03-15' },
    { id: 'e3', name: 'Marcos Diaz', role: 'Fleet Manager', country_code: 'ES', base_salary: 2500, currency: 'EUR', status: 'active', start_date: '2022-08-01' },
    { id: 'e4', name: 'Sofia P.', role: 'Rider', country_code: 'ES', base_salary: 1300, currency: 'EUR', status: 'active', start_date: '2023-11-20' },
    { id: 'e5', name: 'Jorge M.', role: 'Rider', country_code: 'ES', base_salary: 1300, currency: 'EUR', status: 'active', start_date: '2023-12-05' },
  ]);
  const [generatedPayslips, setGeneratedPayslips] = useState<Payslip[]>([]);

  // Mock fetching policies locally for demo purposes
  // In a real app, these would come from useOrganization() or a dedicated hook
  const activePolicies: Policy[] = [
    {
      id: 'pol_high_payroll',
      organizationId: organization?.id || '',
      name: 'High Value Payroll',
      description: 'Payroll runs over 5,000 EUR require Manager approval.',
      enabled: organization?.feature_flags?.policy_engine || false,
      priority: 100,
      scope: { module: 'payroll', country_code: selectedCountry.country_code },
      rules: [{ id: 'r1', field: 'total_cost', operator: 'gt', value: 5000 }],
      actions: [{ type: 'require_approval', target_role: UserRole.MANAGER, message: 'Total cost exceeds safety limit.' }]
    }
  ];

  const handleRunPayroll = () => {
    // 1. Calculate
    const slips = employees.map(emp => payrollEngine.calculatePayslip(emp, selectedCountry));
    const totalCost = slips.reduce((acc, curr) => acc + curr.gross_pay + curr.employer_cost, 0);
    const requestId = `pay_run_${Date.now()}`;

    const payrollContext = {
      total_cost: totalCost,
      employee_count: employees.length,
      currency: selectedCountry.currency
    };

    // 2. Evaluate Policies
    const evaluation = policyEngine.evaluate(
      activePolicies, 
      payrollContext, 
      { country: selectedCountry.country_code, module: 'payroll' }
    );

    // 3. Handle Approval Requirement
    const requiresApproval = evaluation.actions.some(a => a.type === 'require_approval');
    
    if (requiresApproval) {
      const triggeringPolicy = evaluation.triggeredPolicies[0]; // Take the highest priority one
      
      approvalService.createRequest({
        organizationId: organization?.id || '',
        requesterId: currentUser?.id || '',
        requesterName: currentUser?.name || 'Unknown',
        entityType: 'payroll_run',
        payload: payrollContext,
        policyTriggered: triggeringPolicy.name
      });

      showNotification('info', `Nómina pausada: Requiere aprobación (${triggeringPolicy.name})`);
      
      // Emit event that it was paused
      eventBus.emit('payroll.approval_required', payrollContext, {
        user_id: currentUser?.id || 'unknown',
        organization_id: organization?.id,
        country_code: selectedCountry.country_code,
        module: 'payroll',
        request_id: requestId
      });
      
      return; // Stop execution
    }

    // 4. Success Path
    setGeneratedPayslips(slips);

    eventBus.emit('payroll.calculated', {
      ...payrollContext,
      payslips_id: slips.map(s => s.id)
    }, {
      user_id: currentUser?.id || 'unknown',
      organization_id: organization?.id,
      country_code: selectedCountry.country_code,
      module: 'payroll',
      request_id: requestId
    });

    showNotification('success', 'Nómina calculada y procesada correctamente');
  };

  const totalCost = generatedPayslips.reduce((acc, curr) => acc + curr.gross_pay + curr.employer_cost, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <DollarSign className="text-green-600" /> Payroll Suite
          </h2>
          <p className="text-gray-500 mt-1">Gestión de nóminas para {selectedCountry.display_name}.</p>
        </div>
        <button 
          onClick={handleRunPayroll}
          className="bg-[#1A1A1A] text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
        >
          <Calculator size={20} /> Calcular Nómina
        </button>
      </div>

      {/* Policy Active Badge */}
      {organization?.feature_flags?.policy_engine && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
           <div className="flex items-center gap-2 text-blue-800">
             <ShieldAlert size={18} />
             <span className="text-xs font-bold uppercase tracking-wider">Policy Engine Active</span>
           </div>
           <p className="text-xs text-blue-600">
             Rules: &gt;5,000 {selectedCountry.currency} requires Manager Approval
           </p>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Users size={24}/></div>
             <div>
               <p className="text-xs font-bold text-gray-400 uppercase">Empleados Activos</p>
               <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
             </div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-green-50 rounded-xl text-green-600"><DollarSign size={24}/></div>
             <div>
               <p className="text-xs font-bold text-gray-400 uppercase">Coste Total (Est.)</p>
               <p className="text-2xl font-bold text-gray-900">{totalCost > 0 ? totalCost.toLocaleString() : '-'} {selectedCountry.currency}</p>
             </div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><FileText size={24}/></div>
             <div>
               <p className="text-xs font-bold text-gray-400 uppercase">Recibos Generados</p>
               <p className="text-2xl font-bold text-gray-900">{generatedPayslips.length}</p>
             </div>
           </div>
        </div>
      </div>

      {/* Payslip List */}
      {generatedPayslips.length > 0 ? (
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Nóminas Generadas ({new Date().toLocaleDateString()})</h3>
            <button className="text-sm font-bold text-blue-600 hover:underline">Descargar Todo (PDF)</button>
          </div>
          <div className="divide-y divide-gray-50">
            {generatedPayslips.map((slip) => {
              const emp = employees.find(e => e.id === slip.employee_id);
              return (
                <div key={slip.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                        {emp?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{emp?.name}</p>
                        <p className="text-xs text-gray-500">{emp?.role}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{slip.net_pay.toLocaleString()} {selectedCountry.currency} (Neto)</p>
                      <p className="text-xs text-gray-400">Bruto: {slip.gross_pay.toLocaleString()}</p>
                   </div>
                   <button className="p-2 text-gray-400 hover:text-blue-600">
                     <Download size={20} />
                   </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-[24px] border-2 border-dashed border-gray-200">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-300">
             <Calculator size={32} />
           </div>
           <p className="text-gray-400 font-bold">Listos para procesar</p>
           <p className="text-sm text-gray-400 mt-1">Haz clic en Calcular para iniciar la simulación de {employees.length} empleados.</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3 text-sm text-yellow-800">
         <div className="mt-0.5"><CheckCircle size={16} /></div>
         <p>
           <strong>Cálculo Mock:</strong> Estos valores son estimaciones basadas en la normativa de {selectedCountry.display_name}. 
           No sustituyen una gestoría laboral legal.
         </p>
      </div>
    </div>
  );
};
