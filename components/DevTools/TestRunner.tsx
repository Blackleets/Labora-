import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Terminal, RefreshCw } from 'lucide-react';
import { useCountry } from '../../contexts/CountryContext';
import { pricingEngine, PricingRequest } from '../../modules/country-config/services/pricingEngine';
import { MockBankAdapter, OpenBankingUnavailableError, SUPPORTED_PROVIDERS } from '../../modules/banking-connect/services/bankAdapter';
import { bankApi } from '../../modules/banking-connect/services/bankApi';
import { useI18n } from '../../modules/core/i18n';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  log: string;
  duration?: number;
}

export const TestRunner: React.FC = () => {
  const { selectedCountry } = useCountry();
  const { t } = useI18n();
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'pricing' | 'banking'>('pricing');

  const [pricingTests, setPricingTests] = useState<TestResult[]>([
    { id: 't1', name: 'Short Trip (Min Fare)', status: 'pending', log: 'Dist: 1km, Time: 5min' },
    { id: 't2', name: 'Long Trip (Standard)', status: 'pending', log: 'Dist: 15km, Time: 30min' },
    { id: 't3', name: 'High Surge (x2.0)', status: 'pending', log: 'Dist: 5km, Surge: 2.0' },
    { id: 't4', name: 'Tip Only', status: 'pending', log: 'Override Fare: 0, Tip: 5.00' },
    { id: 't5', name: 'Zero Tip', status: 'pending', log: 'Standard trip, 0 tip' },
  ]);

  const [bankTests, setBankTests] = useState<TestResult[]>([
    { id: 'b1', name: 'Refuse bank init (fail-closed)', status: 'pending', log: 'Must throw OpenBankingUnavailableError' },
    { id: 'b2', name: 'Refuse account fetch', status: 'pending', log: 'No invented balances' },
    { id: 'b3', name: 'Empty provider catalog + empty connections', status: 'pending', log: 'No fake PSD2 providers' },
  ]);

  const runPricingTest = async (test: TestResult): Promise<TestResult> => {
    const start = performance.now();
    try {
      let req: PricingRequest = {
        country_code: selectedCountry.country_code,
        distance_km: 0,
        duration_min: 0,
        user_type: 'rider',
        _user_id: 'test_user'
      };

      switch (test.id) {
        case 't1': req = { ...req, distance_km: 1, duration_min: 5 }; break;
        case 't2': req = { ...req, distance_km: 15, duration_min: 30 }; break;
        case 't3': req = { ...req, distance_km: 5, duration_min: 15, surge_multiplier: 2.0 }; break;
        case 't4': req = { ...req, distance_km: 2, duration_min: 5, base_fare_override: 0, tip_amount: 5.0 }; break;
        case 't5': req = { ...req, distance_km: 8, duration_min: 20, tip_amount: 0 }; break;
      }

      const result = await pricingEngine.calculatePrice(req);

      if (result.gross < 0) throw new Error('Gross negative');
      if (test.id === 't1' && result.gross < selectedCountry.min_fare) throw new Error('Min fare not respected');
      if (test.id === 't3' && result.gross < (result.payout * 1.2)) throw new Error('Surge logic suspicious');

      return {
        ...test,
        status: 'passed',
        log: `${test.log} => Gross: ${result.gross} ${result.currency}, Net: ${result.payout}`,
        duration: performance.now() - start
      };
    } catch (e: any) {
      return { ...test, status: 'failed', log: e.message, duration: performance.now() - start };
    }
  };

  const expectUnavailable = async (action: () => Promise<unknown>): Promise<string> => {
    try {
      await action();
      throw new Error('Expected Open Banking to be unavailable');
    } catch (error) {
      if (error instanceof OpenBankingUnavailableError) return error.message;
      throw error;
    }
  };

  const runBankTest = async (test: TestResult): Promise<TestResult> => {
    const start = performance.now();
    const adapter = new MockBankAdapter('unavailable', 'Open Banking');
    try {
      if (test.id === 'b1') {
        const message = await expectUnavailable(() => adapter.initConnection('test_user'));
        return { ...test, status: 'passed', log: message, duration: performance.now() - start };
      }
      if (test.id === 'b2') {
        const message = await expectUnavailable(() => adapter.getAccounts('conn_test'));
        return { ...test, status: 'passed', log: message, duration: performance.now() - start };
      }
      if (test.id === 'b3') {
        if (SUPPORTED_PROVIDERS.length !== 0) throw new Error('Provider catalog must stay empty until PSD2 exists');
        const connections = await bankApi.getUserConnections('test_user');
        if (connections.length !== 0) throw new Error('Must not invent stored bank connections');
        const message = await expectUnavailable(() => bankApi.initiateConnection('test_user', 'bbva'));
        return { ...test, status: 'passed', log: message, duration: performance.now() - start };
      }
      return { ...test, status: 'failed', log: 'Unknown banking test', duration: performance.now() - start };
    } catch (e: any) {
      return { ...test, status: 'failed', log: e.message, duration: performance.now() - start };
    }
  };

  const runSuite = async (type: 'pricing' | 'banking') => {
    setIsRunning(true);
    const tests = type === 'pricing' ? pricingTests : bankTests;
    const setTests = type === 'pricing' ? setPricingTests : setBankTests;
    const runner = type === 'pricing' ? runPricingTest : runBankTest;

    setTests((prev) => prev.map((t) => ({ ...t, status: 'pending', duration: undefined })));

    for (let i = 0; i < tests.length; i++) {
      setTests((prev) => {
        const copy = [...prev];
        copy[i].status = 'running';
        return copy;
      });

      await new Promise((r) => setTimeout(r, 300));

      const result = await runner(tests[i]);

      setTests((prev) => {
        const copy = [...prev];
        copy[i] = result;
        return copy;
      });
    }
    setIsRunning(false);
  };

  const renderList = (tests: TestResult[]) => (
    <div className="space-y-2">
      {tests.map((test) => (
        <div key={test.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            {test.status === 'pending' && <div className="w-4 h-4 rounded-full bg-gray-200" />}
            {test.status === 'running' && <RefreshCw size={16} className="text-blue-500 animate-spin" />}
            {test.status === 'passed' && <CheckCircle size={16} className="text-green-500" />}
            {test.status === 'failed' && <XCircle size={16} className="text-red-500" />}

            <div>
              <p className={`text-sm font-bold ${test.status === 'failed' ? 'text-red-600' : 'text-gray-800'}`}>{test.name}</p>
              <p className="text-xs text-gray-400 font-mono">{test.log}</p>
            </div>
          </div>
          {test.duration && <span className="text-xs font-mono text-gray-400">{test.duration.toFixed(0)}ms</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-gray-50 p-4 rounded-[24px] border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Terminal size={20} className="text-[#2D6CDF]" />
          {t('settings.devtools')}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${activeTab === 'pricing' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
          >
            Pricing
          </button>
          <button
            onClick={() => setActiveTab('banking')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${activeTab === 'banking' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400'}`}
          >
            Banking
          </button>
        </div>
      </div>

      <div className="mb-4">
        {activeTab === 'pricing' ? renderList(pricingTests) : renderList(bankTests)}
      </div>

      <button
        onClick={() => runSuite(activeTab)}
        disabled={isRunning}
        className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50"
      >
        {isRunning ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
        {t('test.run_suite')}
      </button>
    </div>
  );
};
