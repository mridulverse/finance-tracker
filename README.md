# 💰 FinanceAI — AI-Powered Personal Finance Tracker

> A full-stack fintech application with AI-driven spending insights, budget tracking, and predictive analytics.

![FinanceAI Dashboard](https://via.placeholder.com/1200x600/0a0918/a78bfa?text=FinanceAI+Dashboard)

---

## ✨ Features

### 🔐 Authentication
- JWT-based signup/login
- bcrypt password hashing
- User-isolated data

### 💸 Transaction Management
- Add, edit, delete income & expense transactions
- 15+ categories (Food, Travel, Bills, Shopping, etc.)
- Search, filter by type, and paginate
- Date, description, and notes fields

### 📊 Dashboard
- Total balance, monthly income & expenses
- 6-month income vs expense bar chart
- Spending breakdown pie chart
- Recent transactions feed

### 🤖 AI Insights Engine
- **Top spending category** analysis with percentages
- **Month-over-month** expense comparison
- **Savings rate** calculation and advice
- **Savings opportunity tips** per high-spend category
- **Next-month spending prediction** (statistical trend model)
- **Spending spike detection** (anomaly alerts)
- Visual radar chart + category progress bars

### 🎯 Budget Tracker
- Set monthly budget with ₹ amount
- Configurable alert threshold (e.g. warn at 80%)
- Real-time progress bar
- Per-category spending breakdown
- Over-budget / on-track / near-limit status

---

## 🛠 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Tailwind CSS, Recharts  |
| Backend    | Node.js, Express.js               |
| Database   | MongoDB + Mongoose                |
| Auth       | JWT + bcryptjs                    |
| Deployment | Vercel (FE) + Render (BE)         |
| AI/Logic   | Rule-based statistical engine     |

---

## 📁 Project Structure

```
finance-tracker/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   └── Budget.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── budgets.js
│   │   ├── dashboard.js
│   │   └── insights.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── seed.js
│   ├── render.yaml
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── layout/Layout.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── DashboardPage.js
    │   │   ├── TransactionsPage.js
    │   │   ├── InsightsPage.js
    │   │   └── BudgetPage.js
    │   ├── utils/
    │   │   ├── api.js
    │   │   └── helpers.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    ├── tailwind.config.js
    └── vercel.json
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/finance-tracker.git
cd finance-tracker
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev   # Runs on http://localhost:5000
```

### 3. Seed demo data (optional)
```bash
cd backend
node seed.js
# Creates demo@financeai.com / demo123
```

### 4. Frontend setup
```bash
cd frontend
cp .env.example .env
# REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start     # Runs on http://localhost:3000
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List (filter, paginate) |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Stats, charts, recent txns |

### AI Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insights` | AI analysis + category breakdown |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets?month=&year=` | Get budget + actual spending |
| POST | `/api/budgets` | Create/update budget |

---

## ☁️ Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Connect GitHub repo to Vercel
# Set REACT_APP_API_URL = https://your-backend.onrender.com/api
```

### Backend → Render
1. Push to GitHub
2. Create new Web Service on render.com
3. Connect repo, set build command: `npm install`, start: `npm start`
4. Add env vars: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`

### Database → MongoDB Atlas
1. Create free cluster at mongodb.com/cloud/atlas
2. Add database user + whitelist `0.0.0.0/0`
3. Copy connection string to `MONGODB_URI`

---

## 🤖 AI Insights Logic

The insights engine (`routes/insights.js`) uses statistical rule-based analysis:

1. **Category analysis** — calculates what % of budget goes to each category
2. **MoM comparison** — compares current vs previous month totals
3. **Savings rate** — income minus expenses as % of income
4. **Savings tips** — identifies high-spend categories (>25%) and suggests 20% reduction
5. **Prediction** — averages growth rate over last 3 months, projects next month
6. **Anomaly detection** — flags categories with >50% month-over-month spike

---

## 📸 Screenshots

| Dashboard | Transactions | AI Insights | Budget |
|-----------|-------------|-------------|--------|
| Overview stats + charts | CRUD with search/filter | 6 insight cards + radar | Progress bars + warnings |

---

## 👨‍💻 Author

Built with ❤️ as a full-stack portfolio project.

- **Frontend**: React + Tailwind (dark fintech aesthetic)
- **Backend**: REST API with Express + MongoDB
- **AI**: Statistical insight engine in pure Node.js

---

## 📄 License

MIT License — free to use and modify.
