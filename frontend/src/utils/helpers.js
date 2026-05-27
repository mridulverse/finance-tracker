import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const formatCurrency = (amount, currency = '₹') => {
  const num = Number(amount) || 0;
  if (num >= 100000) return `${currency}${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${currency}${(num / 1000).toFixed(1)}K`;
  return `${currency}${num.toFixed(0)}`;
};

export const formatCurrencyFull = (amount, currency = '₹') => {
  return `${currency}${Number(amount || 0).toLocaleString('en-IN')}`;
};

export const formatDate = (date) => format(new Date(date), 'MMM dd, yyyy');
export const formatDateShort = (date) => format(new Date(date), 'dd MMM');
export const formatMonthYear = (date) => format(new Date(date), 'MMMM yyyy');

export const getMonthRange = (date = new Date()) => ({
  start: startOfMonth(date).toISOString(),
  end: endOfMonth(date).toISOString()
});

export const getLast6MonthLabels = () => {
  return Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return format(d, 'MMM');
  });
};

export const CATEGORIES = {
  expense: [
    'Food & Dining', 'Travel & Transport', 'Bills & Utilities',
    'Shopping', 'Entertainment', 'Healthcare', 'Education',
    'Personal Care', 'Housing', 'Other'
  ],
  income: ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other']
};

export const CATEGORY_COLORS = {
  'Food & Dining':     '#f87171',
  'Travel & Transport':'#fb923c',
  'Bills & Utilities': '#fbbf24',
  'Shopping':          '#a78bfa',
  'Entertainment':     '#38bdf8',
  'Healthcare':        '#4ade80',
  'Education':         '#f472b6',
  'Personal Care':     '#e879f9',
  'Housing':           '#818cf8',
  'Salary':            '#34d399',
  'Freelance':         '#6ee7b7',
  'Business':          '#7dd3fc',
  'Investment':        '#fde68a',
  'Gift':              '#fbcfe8',
  'Other':             '#9ca3af',
};

export const CATEGORY_ICONS = {
  'Food & Dining':     '🍽️',
  'Travel & Transport':'✈️',
  'Bills & Utilities': '⚡',
  'Shopping':          '🛍️',
  'Entertainment':     '🎬',
  'Healthcare':        '💊',
  'Education':         '📚',
  'Personal Care':     '💄',
  'Housing':           '🏠',
  'Salary':            '💼',
  'Freelance':         '💻',
  'Business':          '📈',
  'Investment':        '💰',
  'Gift':              '🎁',
  'Other':             '📌',
};
