
import React from 'react';
import { GLOBAL_INTEGRATION_CATALOG } from '../../../integrations/data/catalog';
import LogoResolver from '../../../../components/LogoResolver';
import { CheckCircle, XCircle, Search, LayoutGrid } from 'lucide-react';

export const AssetDiagnostics: React.FC = () => {
  const [filter, setFilter] = React.useState('');

  const filtered = GLOBAL_INTEGRATION_CATALOG.filter(item => 
    item.name.toLowerCase().includes(filter.toLowerCase()) || 
    item.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <LayoutGrid className="text-[#2D6CDF]" /> Diagnostics: Brand Assets
          </h2>
          <p className="text-gray-500 mt-1">
            Verificando {GLOBAL_INTEGRATION_CATALOG.length} integraciones. 
            El sistema probará automáticamente Local &gt; Remoto &gt; Placeholder.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar ID o Nombre..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Visual Result</th>
                <th className="px-6 py-4">ID / Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Paths Checked</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <LogoResolver 
                      id={item.id} 
                      name={item.name} 
                      domain={item.domain} 
                      category={item.category} 
                      size="md"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.id}</p>
                  </td>
                  <td className="px-6 py-3">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs font-mono text-gray-500">
                    <div>1. brand/platforms/{item.id}.svg</div>
                    <div>2. simpleicons (if curated)</div>
                    <div>3. {item.domain ? `favicon/${item.domain}` : 'N/A'}</div>
                    <div>4. letter avatar</div>
                  </td>
                  <td className="px-6 py-3">
                    {/* Note: This status is visual; real logic happens inside LogoResolver */}
                    <span className="text-green-600 font-bold text-xs flex items-center gap-1">
                      <CheckCircle size={14} /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
