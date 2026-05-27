import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatCurrencyFull, formatCurrency, formatDate, CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/helpers';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card p-3 text-xs">
      <div className="font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span className="font-medium number-font">₹{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/dashboard');
      setData(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--accent-violet)' }} />
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading dashboard…</span>
      </div>
    </div>
  );

  // Build monthly trend chart data
  const trendMap = {};
  (data?.monthlyTrend || []).forEach(item => {
    const key = `${MONTH_NAMES[item._id.month - 1]} ${item._id.year}`;
    if (!trendMap[key]) trendMap[key] = { month: MONTH_NAMES[item._id.month - 1], income: 0, expense: 0 };
    trendMap[key][item._id.type] = item.total;
  });
  const trendData = Object.values(trendMap);

  const pieData = (data?.categoryBreakdown || []).slice(0, 6).map(c => ({
    name: c._id, value: c.total, color: CATEGORY_COLORS[c._id] || '#9ca3af'
  }));

  const stats = [
    {
      label: 'Total Balance',
      value: formatCurrencyFull(data?.totals?.balance),
      sub: 'All time',
      icon: Wallet,
      color: '#a78bfa',
      bg: 'rgba(139,92,246,0.12)',
    },
    {
      label: 'Monthly Income',
      value: formatCurrencyFull(data?.monthly?.income),
      sub: 'This month',
      icon: TrendingUp,
      color: '#4ade80',
      bg: 'rgba(74,222,128,0.12)',
    },
    {
      label: 'Monthly Expenses',
      value: formatCurrencyFull(data?.monthly?.expense),
      sub: 'This month',
      icon: TrendingDown,
      color: '#f87171',
      bg: 'rgba(248,113,113,0.12)',
    },
    {
      label: 'Monthly Savings',
      value: formatCurrencyFull(data?.monthly?.balance),
      sub: data?.monthly?.balance >= 0 ? 'Surplus' : 'Deficit',
      icon: data?.monthly?.balance >= 0 ? ArrowUpRight : ArrowDownRight,
      color: data?.monthly?.balance >= 0 ? '#4ade80' : '#f87171',
      bg: data?.monthly?.balance >= 0 ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Here's your financial overview
          </p>
        </div>
        <button onClick={fetchDashboard} className="btn-secondary flex items-center gap-2 !py-2 !px-4">
          <RefreshCw size={14} />
          <span className="hidden sm:inline text-xs">Refresh</span>
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card animate-slide-up">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <div className="number-font text-xl font-bold mb-1" style={{ color }}>{value}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area/Bar trend chart */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-semibold mb-5">Income vs Expenses (6 months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} barGap={4}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => formatCurrency(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" name="Income" fill="#4ade80" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Expense" fill="#f87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card p-6">
          <h3 className="font-semibold mb-5">Spending by Category</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                    dataKey="value" stroke="none">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {pieData.slice(0, 4).map(({ name, value, color }) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span style={{ color: 'var(--text-secondary)' }} className="truncate max-w-24">{name}</span>
                    </div>
                    <span className="number-font font-medium">₹{value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No expense data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold">Recent Transactions</h3>
          <a href="/transactions" className="text-xs font-medium" style={{ color: 'var(--accent-violet)' }}>
            View all →
          </a>
        </div>
        {(data?.recentTransactions || []).length > 0 ? (
          <div className="space-y-3">
            {data.recentTransactions.map(txn => (
              <div key={txn._id} className="flex items-center gap-4 p-3 rounded-xl transition-colors"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {CATEGORY_ICONS[txn.category] || '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{txn.description || txn.category}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {txn.category} · {formatDate(txn.date)}
                  </div>
                </div>
                <div className={`number-font font-semibold text-sm ${txn.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {txn.type === 'income' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>
            No transactions yet. Add your first one!
          </div>
        )}
      </div>
    </div>
  );
}
