import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/helpers';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { RefreshCw, Cpu } from 'lucide-react';

const SEVERITY_STYLES = {
  success: { bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)',  text: '#4ade80' },
  info:    { bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)', text: '#a78bfa' },
  warning: { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  text: '#fbbf24' },
  danger:  { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', text: '#f87171' },
};

function InsightCard({ insight, delay = 0 }) {
  const style = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.info;
  return (
    <div className="card p-5 animate-slide-up" style={{
      animationDelay: `${delay}ms`,
      background: style.bg,
      borderColor: style.border,
    }}>
      <div className="flex items-start gap-4">
        <div className="text-2xl flex-shrink-0 mt-0.5">{insight.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-semibold" style={{ color: style.text }}>{insight.title}</span>
            <span className="badge text-xs" style={{
              background: style.bg, color: style.text, border: `1px solid ${style.border}`
            }}>
              {insight.type.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {insight.message}
          </p>
          {insight.type === 'prediction' && (
            <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Cpu size={12} />
              <span>AI prediction based on last 3 months of data</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/insights');
      setData(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Cpu size={28} className="animate-pulse" style={{ color: 'var(--accent-violet)' }} />
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Analyzing your spending…</span>
      </div>
    </div>
  );

  const totalSpend = (data?.spendingByCategory || []).reduce((s, c) => s + c.total, 0);
  const radarData = (data?.spendingByCategory || []).slice(0, 7).map(c => ({
    category: c._id.split(' ')[0],
    amount: c.total,
    fullMark: totalSpend
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.15)' }}>
              <Cpu size={18} style={{ color: 'var(--accent-violet)' }} />
            </span>
            AI Insights
          </h1>
          <p className="text-sm mt-1 ml-12" style={{ color: 'var(--text-secondary)' }}>
            Personalized analysis of your financial habits
          </p>
        </div>
        <button onClick={fetch} className="btn-secondary flex items-center gap-2 !py-2 !px-4">
          <RefreshCw size={14} />
          <span className="hidden sm:inline text-xs">Re-analyze</span>
        </button>
      </div>

      {/* Insights grid */}
      {(data?.insights || []).length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="font-semibold mb-2">Not enough data yet</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Add some transactions to start receiving AI insights about your spending patterns.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} delay={i * 80} />
          ))}
        </div>
      )}

      {/* Spending breakdown */}
      {(data?.spendingByCategory || []).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Radar chart */}
          <div className="card p-6">
            <h3 className="font-semibold mb-5">Spending Radar</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#9191b8' }} />
                <Radar name="Spending" dataKey="amount" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Spent']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown list */}
          <div className="card p-6">
            <h3 className="font-semibold mb-5">Category Breakdown</h3>
            <div className="space-y-3">
              {(data.spendingByCategory || []).slice(0, 7).map(cat => {
                const pct = totalSpend > 0 ? (cat.total / totalSpend * 100).toFixed(1) : 0;
                const color = CATEGORY_COLORS[cat._id] || '#9ca3af';
                return (
                  <div key={cat._id}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2">
                        <span>{CATEGORY_ICONS[cat._id] || '📌'}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{cat._id}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="number-font text-xs" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                        <span className="number-font font-medium text-xs">₹{cat.total.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
