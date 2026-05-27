import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Target, AlertTriangle, CheckCircle, Edit3, Save } from 'lucide-react';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function BudgetPage() {
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [totalBudget, setTotalBudget] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [saving, setSaving] = useState(false);

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/budgets?month=${month}&year=${year}`);
      setBudgetData(data.data);
      if (data.data.budget) {
        setTotalBudget(data.data.budget.totalBudget);
        setAlertThreshold(data.data.budget.alertThreshold || 80);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchBudget(); }, []);

  const handleSave = async () => {
    if (!totalBudget || totalBudget <= 0) return toast.error('Enter a valid budget amount');
    setSaving(true);
    try {
      await api.post('/budgets', { month, year, totalBudget: Number(totalBudget), alertThreshold: Number(alertThreshold) });
      toast.success('Budget saved!');
      setEditing(false);
      fetchBudget();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving budget');
    }
    setSaving(false);
  };

  const totalSpent = budgetData?.totalSpent || 0;
  const budget = budgetData?.budget?.totalBudget || 0;
  const usagePercent = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const isWarning = usagePercent >= (budgetData?.budget?.alertThreshold || 80);
  const isOver = totalSpent > budget && budget > 0;

  const spendingMap = {};
  (budgetData?.spending || []).forEach(s => { spendingMap[s._id] = s.total; });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading budget…</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(251,191,36,0.15)' }}>
              <Target size={18} style={{ color: '#fbbf24' }} />
            </span>
            Budget
          </h1>
          <p className="text-sm mt-1 ml-12" style={{ color: 'var(--text-secondary)' }}>
            {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>
        <button onClick={() => setEditing(!editing)}
          className={editing ? 'btn-secondary flex items-center gap-2' : 'btn-primary flex items-center gap-2'}>
          {editing ? <><Save size={15} /><span>Cancel</span></> : <><Edit3 size={15} /><span>Set Budget</span></>}
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card p-6 animate-slide-up" style={{ borderColor: 'rgba(251,191,36,0.2)' }}>
          <h3 className="font-semibold mb-5">Configure Monthly Budget</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="label">Total Monthly Budget (₹)</label>
              <input type="number" className="input-field"
                placeholder="e.g. 50000"
                value={totalBudget} onChange={e => setTotalBudget(e.target.value)} min="1" />
            </div>
            <div>
              <label className="label">Alert Threshold (%)</label>
              <input type="number" className="input-field"
                placeholder="80"
                value={alertThreshold} onChange={e => setAlertThreshold(e.target.value)} min="1" max="100" />
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                Get warned when you reach this % of your budget
              </p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save Budget'}
          </button>
        </div>
      )}

      {/* Budget overview */}
      {budget > 0 ? (
        <>
          {/* Main progress card */}
          <div className={`card p-6 ${isOver ? 'border-red-500/30' : isWarning ? 'border-yellow-500/30' : ''}`}
            style={isOver ? { background: 'rgba(248,113,113,0.05)' } : isWarning ? { background: 'rgba(251,191,36,0.05)' } : {}}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Total Budget Used
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="number-font text-3xl font-bold">₹{totalSpent.toLocaleString()}</span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/ ₹{budget.toLocaleString()}</span>
                </div>
              </div>
              <div>
                {isOver ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
                    <AlertTriangle size={14} />
                    <span className="text-xs font-semibold">Over Budget!</span>
                  </div>
                ) : isWarning ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                    <AlertTriangle size={14} />
                    <span className="text-xs font-semibold">Near Limit</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>
                    <CheckCircle size={14} />
                    <span className="text-xs font-semibold">On Track</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${usagePercent}%`,
                  background: isOver ? '#ef4444' : isWarning ? '#f59e0b' : 'linear-gradient(90deg, #8b5cf6, #4ade80)'
                }} />
            </div>

            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="number-font font-semibold" style={{ color: isOver ? '#f87171' : isWarning ? '#fbbf24' : '#4ade80' }}>
                {usagePercent.toFixed(1)}% used
              </span>
              <span>
                {isOver
                  ? `₹${(totalSpent - budget).toLocaleString()} over budget`
                  : `₹${(budget - totalSpent).toLocaleString()} remaining`}
              </span>
            </div>
          </div>

          {/* Category spending */}
          {Object.keys(spendingMap).length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold mb-5">Spending by Category</h3>
              <div className="space-y-4">
                {CATEGORIES.expense
                  .filter(cat => spendingMap[cat])
                  .sort((a, b) => spendingMap[b] - spendingMap[a])
                  .map(cat => {
                    const spent = spendingMap[cat] || 0;
                    const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
                    const color = CATEGORY_COLORS[cat] || '#9ca3af';
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            <span>{CATEGORY_ICONS[cat]}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="number-font" style={{ color: 'var(--text-muted)' }}>{pct.toFixed(1)}%</span>
                            <span className="number-font font-semibold">₹{spent.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="font-semibold mb-2 text-lg">No budget set</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Set a monthly budget to track your spending and get warnings when you're near the limit.
          </p>
          <button onClick={() => setEditing(true)} className="btn-primary">Set Monthly Budget</button>
        </div>
      )}
    </div>
  );
}
