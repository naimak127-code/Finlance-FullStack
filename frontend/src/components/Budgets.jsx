import React, { useState } from "react";

export default function Budgets({ data, setData, user }) {
  const [newBudget, setNewBudget] = useState({
    category: data.categories[0] || "",
    limit: 300
  });

  function spentFor(cat) {
    return data.transactions
      .filter(t => (t.category || '') === cat && t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
  }

  async function create() {

    const budgetData = {
      category: newBudget.category,
      limit: Number(newBudget.limit),
      user_id: user.id
    };
  
    const response = await fetch(
      'http://127.0.0.1:8000/budgets',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(budgetData)
      }
    );
  
    const result = await response.json();
  
    if (response.ok) {
  
      if (result.status === "updated") {
  
        setData(prev => ({
          ...prev,
          budgets: prev.budgets.map(b =>
            b.category === result.budget.category
              ? result.budget
              : b
          )
        }));
  
      } else {
  
        setData(prev => ({
          ...prev,
          budgets: [...prev.budgets, result.budget]
        }));
  
      }
  
      alert("Budget Saved!");
    }
  }

  async function remove(budgetId) {

    const response = await fetch(
      `http://127.0.0.1:8000/budgets/${budgetId}`,
      {
        method: 'DELETE'
      }
    );
  
    if (response.ok) {
  
      setData(prev => ({
        ...prev,
        budgets: prev.budgets.filter(
          b => b.id !== budgetId
        )
      }));
  
      alert("Budget Deleted!");
    }
  }

  async function edit(budget) {

    const value = prompt(
      "Enter new budget amount:",
      budget.limit
    );
  
    if (!value) return;
  
    const updatedBudget = {
      category: budget.category,
      limit: Number(value),
      user_id: user.id
    };
  
    const response = await fetch(
      `http://127.0.0.1:8000/budgets/${budget.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedBudget)
      }
    );
  
    if (response.ok) {
  
      setData(prev => ({
        ...prev,
        budgets: prev.budgets.map(b =>
          b.id === budget.id
            ? { ...b, limit: Number(value) }
            : b
        )
      }));
  
      alert("Budget Updated!");
    }
  }

  const totalBudget = data.budgets.reduce(
    (s, b) => s + b.limit,
    0
  );
  
  const totalSpent = data.budgets.reduce(
    (s, b) => s + spentFor(b.category),
    0
  );
  
  const totalPct = totalBudget
    ? Math.min(100, (totalSpent / totalBudget) * 100)
    : 0;

  return (
    <div className="space-y-6 text-black dark:text-white">

      <div className="text-xl font-bold">Budgets</div>

      {/* MAIN MONTHLY BUDGET CARD */}
      <div className="card bg-slate-100 dark:bg-slate-800 dark:text-white">
        <div className="text-lg font-bold mb-2">Monthly Budget Overview</div>

        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="transparent"
                strokeWidth="4"
                strokeDasharray={`${totalPct} ${100 - totalPct}`}
                strokeDashoffset="25"
                transform="rotate(-90 18 18)"
                className={
                  totalSpent > totalBudget ? "text-red-500" : "text-green-500"
                }
                stroke="currentColor"
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">
              {Math.round(totalPct)}%
            </div>
          </div>

          <div>
            <div className="text-lg font-semibold">
              PKR {totalSpent.toLocaleString()} / PKR {totalBudget.toLocaleString()}
            </div>

            <div className="flex items-center gap-2 mt-2 text-sm">
              <span
                className={`w-3 h-3 rounded-full ${
                  totalSpent > totalBudget ? "bg-red-500" : "bg-green-500"
                }`}
              ></span>
              {totalSpent > totalBudget ? "Exceeded" : "On Track"}
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.budgets.map((b, i) => {
          const spent = spentFor(b.category);
          const pct = Math.min(100, (spent / b.limit) * 100);
          const exceeded = spent > b.limit;

          return (
            <div
            key={b.id || i}
              className="card bg-slate-100 dark:bg-slate-800 dark:text-white relative"
              style={{ minWidth: "260px" }}
            >
              {/* TITLE */}
              <div className="absolute top-3 left-4 text-lg font-bold">
                {b.category}
              </div>

              <div className="text-center pt-8">

                {/* DONUT */}
                <div className="relative w-28 h-28 mx-auto">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="transparent"
                      strokeWidth="4"
                      strokeDasharray={`${pct} ${100 - pct}`}
                      strokeDashoffset="25"
                      transform="rotate(-90 18 18)"
                      className={exceeded ? "text-red-500" : "text-green-500"}
                      stroke="currentColor"
                    />
                  </svg>

                  <div className="absolute inset-0 flex items-center justify-center text-base font-bold">
                    {Math.round(pct)}%
                  </div>
                </div>

                {/* VALUES */}
                <div className="mt-2 text-sm">
                  PKR {spent.toLocaleString()} / PKR {b.limit.toLocaleString()}
                </div>

                <div className="flex items-center justify-center gap-2 mt-1 text-sm">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      exceeded ? "bg-red-500" : "bg-green-500"
                    }`}
                  ></span>
                  {exceeded ? "Exceeded" : "On Track"}
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex justify-center gap-4 mt-3 text-sm">
                  <button className="text-blue-500 dark:text-blue-400" onClick={() => remove(b.id)}>
                    Edit
                  </button>
                  <button className="text-red-500 dark:text-red-400" onClick={() => remove(b.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD BUDGET */}
      <div className="card bg-slate-100 dark:bg-slate-800 dark:text-white flex gap-3 items-center">
        <select
          className="input bg-gray-100 dark:bg-gray-700 dark:text-white"
          value={newBudget.category}
          onChange={e =>
            setNewBudget({ ...newBudget, category: e.target.value })
          }
        >
          {data.categories.map((c) => (
            <option key={c.id} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          className="input w-28 bg-gray-100 dark:bg-gray-700 dark:text-white"
          type="number"
          value={newBudget.limit}
          onChange={e =>
            setNewBudget({ ...newBudget, limit: e.target.value })
          }
        />

        <button className="btn dark:bg-blue-700 dark:hover:bg-blue-800" onClick={create}>
          + Add Budget
        </button>
      </div>
    </div>
  );
}
