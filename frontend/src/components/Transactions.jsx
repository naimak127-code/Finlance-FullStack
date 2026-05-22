import React, { useState } from 'react';


export default function Transactions({ data, setData ,user}) {
  const [filter, setFilter] = useState('');
  const [editIndex, setEditIndex] = useState(null);

  const [form, setForm] = useState({
    date: '',
    type: 'expense',
    desc: '',
    amount: '',
    category: data.categories?.[0]?.name || "",
    account: data.accounts?.[0]?.name || ""
  });

  // ✅ Filtered transactions
  const list = data.transactions.filter(
    (t) =>
      !filter ||
      (t.category || '')
        .toLowerCase()
        .includes(filter.toLowerCase()) ||
      (t.desc || '')
        .toLowerCase()
        .includes(filter.toLowerCase())
  );

  // ✅ ADD or UPDATE transaction
  async function add(e) {
    e.preventDefault();
  
    // 1. Prepare the data to send (matching your Pydantic model in Python)
    const transactionData = {
      date: form.date,
      type: form.type,
      desc: form.desc,
      amount: Number(form.amount),
      category: form.category,
      account: form.account,
      user_id: user.id
    };
  
    // 2. Send it to the Backend
    try {

      console.log(transactionData);
      console.log(user);

      if (editIndex !== null) {

        // UPDATE EXISTING
        const transactionId = data.transactions[editIndex].id;
      
        const response = await fetch(
          `http://127.0.0.1:8000/transactions/${transactionId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
          }
        );
      
        if (response.ok) {
      
          const updatedTransactions = [...data.transactions];
      
          updatedTransactions[editIndex] = {
            ...transactionData,
            id: transactionId
          };
      
          setData(prev => ({
            ...prev,
            transactions: updatedTransactions
          }));
      
          alert("Transaction Updated!");
      
          setEditIndex(null);
        }
      
      } else {
      
        // CREATE NEW
        const response = await fetch(
          'http://127.0.0.1:8000/transactions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
          }
        );
      
        const result = await response.json();
      
        if (response.ok) {
      
          setData(prev => ({
            ...prev,
            transactions: [
              ...prev.transactions,
              result.transaction
            ]
          }));
      
          alert("Saved");
        }
      }
      
      // RESET FORM
      setForm({
        date: "",
        type: "expense",
        desc: "",
        amount: "",
        category: data.categories?.[0]?.name || '',
        account: data.accounts?.[0]?.name || ''
      });
}

    catch (error) {
      console.error("The system isn't responding!", error);
    }
  }
  

  // ✅ DELETE
  async function remove(index) {

    if (!window.confirm('Delete this transaction?')) return;
  
    try {
  
      const transactionId = data.transactions[index].id;
  
      const response = await fetch(
        `http://127.0.0.1:8000/transactions/${transactionId}`,
        {
          method: 'DELETE'
        }
      );
  
      if (response.ok) {
  
        const updated = data.transactions.filter(
          (_, i) => i !== index
        );
  
        setData(prev => ({
          ...prev,
          transactions: updated
        }));
  
        alert("Transaction Deleted!");
      }
  
    } catch (error) {
  
      console.error("Delete failed", error);
  
    }
  }

  // ✅ EDIT
  function editTransaction(index) {
    const t = data.transactions[index];

    setForm({
      date: t.date,
      type: t.type,
      desc: t.desc,
      amount: t.amount,
      category: t.category,
      account: t.account,
    });

    setEditIndex(index);
    document.getElementById('addForm')?.classList.remove('hidden');
  }

  console.log(data.categories);

  return (
    <div>
      <div className="card">

        {/* ✅ HEADER */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="small">All Transactions</div>
            <div className="big">Transaction Log</div>
          </div>

          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Search or filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <button
              className="btn"
              onClick={() =>
                document.getElementById('addForm')?.classList.toggle('hidden')
              }
            >
              Add
            </button>
          </div>
        </div>

        {/* ✅ ADD / EDIT FORM */}
        <form id="addForm" className="hidden mb-4" onSubmit={add}>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />

            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <input
              className="input"
              placeholder="Description"
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              required
            />

            <input
              className="input"
              placeholder="Amount (PKR)"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />

           <select
              className="input"
              value={form.category}
              onChange={(e) =>
             setForm({ ...form, category: e.target.value })
            }
               >
             {data.categories.map((c, i) => (

             <option
             key={typeof c === "string" ? i : c.id}
             value={typeof c === "string" ? c : c.name}
              >
               {typeof c === "string" ? c : c.name}
               </option>

               ))}
             </select>

             <select
             className="input"
             value={form.account}
              onChange={(e) =>
                setForm({ ...form, account: e.target.value })
               }
>
              {data.accounts.map((a, i) => (

              <option
               key={a.id || i}
                value={a.name}
                >
               {a.name}
              </option>

                ))}
             </select>
             </div>
             
          <div className="mt-3">
            <button className="btn" type="submit">
              {editIndex !== null ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>

        {/* ✅ TRANSACTIONS TABLE */}
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Account</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {list.map((t, i) => (
              <tr key={t.id || i} className="text-gray-700">
                <td className="small">{t.date}</td>
                <td>{t.desc}</td>
                <td className="small">{t.category}</td>
                <td className="font-medium">PKR {t.amount.toLocaleString()}</td>
                <td className="small">{t.account}</td>

                <td className="flex gap-2">
                  <button
                    className="text-blue-600 text-sm hover:underline"
                    onClick={() => editTransaction(i)}
                  >
                    Edit
                  </button>

                  <button
                    className="text-red-600 text-sm hover:underline"
                    onClick={() => remove(i)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}
