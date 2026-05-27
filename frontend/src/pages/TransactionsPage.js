import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { formatDate, CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Filter, X, Search } from 'lucide-react';

const EMPTY_FORM = {
  type: 'expense', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0], notes: ''
};

function TransactionModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setForm(initial || EMPTY_FORM); }, [initial, open]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.category || !form.date) return toast.error('Fill all required fields');
    setLoading(true);
    try {
      if (initial?._id) {
        await api.put(`/transactions/${initial._id}`, form);
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', form);
        toast.success('Transaction added');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving transaction');
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-md animate-slide-up" style={{ zIndex: 51 }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-bold text-lg">{initial?._id ? 'Edit' : 'Add'} Transaction</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            {['expense', 'income'].map(t => (
              <button key={t} type="button"
                onClick={() => { set('type', t); set('category', ''); }}
                className="py-2.5 rounded-xl text-sm font-semibold capitalize transition-all"
                style={{
                  background: form.type === t ? (t === 'income' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)') : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${form.type === t ? (t === 'income' ? '#4ade8040' : '#f8717140') : 'var(--border)'}`,
                  color: form.type === t ? (t === 'income' ? '#4ade80' : '#f87171') : 'var(--text-secondary)'
                }}>
                {t === 'income' ? '+ Income' : '- Expense'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount *</label>
              <input type="number" className="input-field" placeholder="0.00"
                value={form.amount} onChange={e => set('amount', e.target.value)} min="0.01" step="0.01" required />
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input-field"
                value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="label">Category *</label>
            <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)} required>
              <option value="">Select category…</option>
              {CATEGORIES[form.type].map(c => (
                <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Description</label>
            <input type="text" className="input-field" placeholder="What was this for?"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input-field resize-none h-20" placeholder="Additional notes…"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : initial?._id ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filterType) params.append('type', filterType);
      const { data } = await api.get(`/transactions?${params}`);
      setTransactions(data.data);
      setPagination(data.pagination);
    } catch {}
    setLoading(false);
  }, [filterType, page]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Deleted');
      fetchTransactions();
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = transactions.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.category.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      String(t.amount).includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {pagination.total || 0} total records
          </p>
        </div>
        <button onClick={() => { setEditItem(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Add Transaction</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input-field pl-9 !py-2 text-sm" placeholder="Search transactions…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['', 'income', 'expense'].map(t => (
            <button key={t} onClick={() => { setFilterType(t); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${filterType === t ? 'btn-primary !py-2 !px-4' : 'btn-secondary !py-2 !px-4'}`}>
              {t || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="text-3xl">💸</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No transactions found</p>
            <button onClick={() => setModalOpen(true)} className="btn-primary !py-2">Add your first</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1" />
            </div>

            {filtered.map(txn => (
              <div key={txn._id}
                className="grid grid-cols-12 gap-3 px-5 py-4 items-center border-b transition-colors hover:bg-white/[0.02]"
                style={{ borderColor: 'var(--border)' }}>
                <div className="col-span-8 sm:col-span-5 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {CATEGORY_ICONS[txn.category] || '📌'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{txn.description || txn.category}</div>
                    <div className="text-xs sm:hidden mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {txn.category} · {formatDate(txn.date)}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block col-span-2">
                  <span className="text-xs px-2 py-1 rounded-lg" style={{
                    background: `${CATEGORY_COLORS[txn.category]}18`,
                    color: CATEGORY_COLORS[txn.category] || 'var(--text-secondary)'
                  }}>
                    {txn.category.split(' ')[0]}
                  </span>
                </div>

                <div className="hidden sm:block col-span-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {formatDate(txn.date)}
                </div>

                <div className="col-span-2 sm:col-span-2 text-right">
                  <span className={`number-font text-sm font-semibold ${txn.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {txn.type === 'income' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1 flex justify-end gap-1">
                  <button onClick={() => { setEditItem(txn); setModalOpen(true); }}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(txn._id)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: 'var(--text-muted)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary !py-1.5 !px-3 text-xs disabled:opacity-40">
                    ← Prev
                  </button>
                  <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary !py-1.5 !px-3 text-xs disabled:opacity-40">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSave={fetchTransactions}
        initial={editItem}
      />
    </div>
  );
}
