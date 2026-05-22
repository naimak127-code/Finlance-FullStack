import React, { useState} from "react";
import { useNavigate } from "react-router-dom";

/* ✅ WORKING DONUT CHART (Accounts - UNCHANGED) */
function DonutChart({ data }) {
  const values = Object.values(data);
  const total = values.reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
        No Data
      </div>
    );
  }

  let offset = 0;

  return (
    <svg viewBox="0 0 36 36" className="w-24 h-24 mx-auto mt-3">
      {values.map((val, i) => {
        const pct = (val / total) * 100;
        const dash = `${pct} ${100 - pct}`;
        const circle = (
          <circle
          key={i}
            cx="18"
            cy="18"
            r="16"
            fill="transparent"
            strokeWidth="4"
            strokeDasharray={dash}
            strokeDashoffset={100 - offset}
            transform="rotate(-90 18 18)"
            className={[
              "text-green-500",
              "text-blue-500",
              "text-yellow-500",
              "text-red-500"
            ][i % 4]}
            stroke="currentColor"
          />
        );
        offset += pct;
        return circle;
      })}
    </svg>
  );
}

/* ✅ EXPENSE DONUT WITH LEGEND + HOVER */
function ExpenseDonut({ expenseByCat, onClick }) {
  const total = Object.values(expenseByCat).reduce((s, v) => s + v, 0);
  let startAngle = 0;

  const colors = [
    "#6366f1", "#22c55e", "#f97316", "#ef4444",
    "#06b6d4", "#eab308", "#a855f7"
  ];

  const slices = Object.entries(expenseByCat).map(([cat, val], i) => {
    const angle = (val / total) * 360;
    const slice = {
      cat,
      val,
      start: startAngle,
      end: startAngle + angle,
      color: colors[i % colors.length]
    };
    startAngle += angle;
    return slice;
  });

  return (
    <div onClick={onClick} className="flex gap-6 cursor-pointer justify-center">
      {/* Donut */}
      <svg width="120" height="120" viewBox="0 0 42 42">
        {slices.map((s, i) => {
          const dash = (s.val / total) * 100;
          return (
            <circle
            // around line 82
            key={s.cat || i}
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={s.color}
              strokeWidth="6"
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={
                25 -
                slices
                  .slice(0, i)
                  .reduce((a, b) => a + (b.val / total) * 100, 0)
              }
            >
              <title>
                {s.cat} — PKR {s.val.toLocaleString()}
              </title>
            </circle>
          );
        })}
      </svg>

      {/* ✅ LEGEND */}
      <div className="space-y-2 text-left">
        {slices.map((s, i) => (
          <div key={s.cat || i} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: s.color }}
            ></span>
            <span className="text-gray-600">
              {s.cat} — PKR {s.val.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ data }) {
  const navigate = useNavigate();

const [showAccounts, setShowAccounts] = useState(false);


const currentDate = new Date();

const currentMonth = currentDate.getMonth();
const currentYear = currentDate.getFullYear();

const thisMonthTransactions = data.transactions.filter(t => {

  const txDate = new Date(t.date);

  return (
    txDate.getMonth() === currentMonth &&
    txDate.getFullYear() === currentYear
  );
});


  /* ✅ INCOME / EXPENSE / BALANCE */
  const incomeThisMonth = thisMonthTransactions
     .filter(t => t.type === "income")
     .reduce((s, t) => s + t.amount, 0);

  const expenseThisMonth = thisMonthTransactions
     .filter(t => t.type === "expense")
     .reduce((s, t) => s + t.amount, 0);

     const overallIncome = data.transactions
     .filter(t => t.type === "income")
     .reduce((s, t) => s + t.amount, 0);
   
   const overallExpense = data.transactions
     .filter(t => t.type === "expense")
     .reduce((s, t) => s + t.amount, 0);
   
   const balanceOverall = overallIncome - overallExpense;

  /* ✅ DONUT DATA */
  const accountDonutData = data.transactions.reduce((acc, t) => {

    if (!acc[t.account]) {
      acc[t.account] = 0;
    }
  
    if (t.type === "income") {
      acc[t.account] += t.amount;
    } else {
      acc[t.account] -= t.amount;
    }
  
    return acc;
  
  }, {});

  const expenseDonutData = thisMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const spentFor = (cat) =>
    data.transactions
      .filter(t => t.category === cat && t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 space-y-6">

      {/* ✅ TOP 3 SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="small">Total Income</div>
          <div className="small">This Month</div>
          <div className="big">PKR {incomeThisMonth}</div>
        </div>

        <div className="card">
          <div className="small">Total Expense</div>
          <div className="small">This Month</div>
          <div className="big">PKR {expenseThisMonth}</div>
        </div>

        <div className="card">
          <div className="small">Balance</div>
          <div className="small">Overall</div>
          <div className="big">PKR {balanceOverall}</div>
        </div>
      </div>

      {/* ✅ DONUT SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ✅ ACCOUNTS OVERVIEW (UNCHANGED) */}
        <div
  className="card text-center cursor-pointer hover:shadow-lg transition relative"
  onMouseEnter={() => setShowAccounts(true)}
  onMouseLeave={() => setShowAccounts(false)}
  onClick={() => navigate("/transactions")}
>

          <div className="small">Accounts Overview</div>

          <DonutChart data={accountDonutData} />
          {showAccounts && (
  <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-lg p-3 w-56 z-50 border">
    <div className="text-sm font-semibold mb-2">Accounts</div>

    {data.accounts.map((a, i) => (
      <div // around line 236
        key={a.id || i} className="flex justify-between text-sm text-gray-700">
        <span>{a.name}</span>
        <span>PKR {a.balance.toLocaleString()}</span>
      </div>
    ))}
  </div>
)}


          <div className="small mt-2">Total Balance</div>
          <div className="big">PKR {balanceOverall}</div>
        </div>

        {/* ✅ ✅ ✅ EXPENSE TRACKER — FIXED WITH LEGEND + CLICK TO TRANSACTIONS */}
        <div
          className="card text-center cursor-pointer hover:shadow-lg transition"
          onClick={() => navigate("/transactions")}
        >
          <div className="small">Expense Tracker</div>

          <ExpenseDonut
            expenseByCat={expenseDonutData}
            onClick={() => navigate("/transactions")}
          />

          <div className="small mt-2">This Month</div>
          <div className="big">PKR {expenseThisMonth}</div>
        </div>
      </div>

      {/* ✅ BOTTOM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ✅ TRANSACTIONS */}
        <div className="lg:col-span-2 card">
          <div className="small mb-3">Recent Transactions</div>

          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Account</th>
              </tr>
            </thead>
            <tbody>
                {[...data.transactions]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 5)
                   .map((t, i) => (
                     <tr // around line 288
                     key={t.id || i}>
                     <td>{t.date}</td>
                     <td>{t.desc}</td>
                     <td>{t.category}</td>
                     <td>PKR {t.amount}</td>
                     <td>{t.account}</td>
               </tr>
               ))}
           </tbody>
          </table>
        </div>

        {/* ✅ BUDGETS (UNCHANGED) */}
        <div className="card">
          <div className="small mb-2">Budgets</div>

          {data.budgets.map((b, i) => {
            const spent = spentFor(b.category);
            const pct = Math.min(100, (spent / b.limit) * 100);

            return (
              <div key={b.id || i} className="mt-4">
                <div className="small">
                  {b.category} • {spent} / {b.limit}
                </div>
                <div className="progress">
  <i
    style={{
      width: pct + "%",
      backgroundColor: spent > b.limit ? "#ef4444" : "#22c55e"
    }}
  />
</div>

              </div>
            );
          })}

        <button
           className="btn"
           onClick={() => navigate("/budgets")}
        >
           Create New Budget
        </button>
        </div>
      </div>
    </div>
  );
        }
