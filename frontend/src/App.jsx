import React, { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { sampleData } from './data/sampleData'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Budgets from './components/Budgets'
import Reports from './components/Reports'
import Settings from './components/Settings'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'

export default function App() {
  // 1. Define 'user' first so the rest of the app can use it
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('fl_user')) || null)
  
  // 2. Define 'data' only ONCE
  const [data, setData] = useState({
    ...sampleData,
    transactions: []
  })
  
  const navigate = useNavigate()

  // 3. The "Morning Routine" - Get data from Database
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/transactions?user_id=${user.id}`
        );
        const savedData = await response.json();

        const budgetResponse = await fetch(
          `http://127.0.0.1:8000/budgets?user_id=${user.id}`
        );
        
        const savedBudgets = await budgetResponse.json();

        const categoryResponse = await fetch(
          `http://127.0.0.1:8000/categories?user_id=${user.id}`
        );
        
        const categories = await categoryResponse.json();
        
        const accountResponse = await fetch(
          `http://127.0.0.1:8000/accounts?user_id=${user.id}`
        );
        
        const accounts = await accountResponse.json();

        setData(prev => ({
          ...prev,
          transactions: savedData,
          budgets: savedBudgets,
          categories: categories.map(c => c.name),
          accounts: accounts
        }));
      } 
      catch (err) {
        console.error("Could not connect to the database Librarian.");
      }
    };
  
    if (user) {
      fetchHistory();
    }
  }, [user]); // Runs when a user logs in

  // 4. Handle Login/Logout redirects
  useEffect(() => {
    localStorage.setItem('fl_user', JSON.stringify(user))
  }, [user])
  
  return (
    <div className="app-root font-sans text-gray-800">
      <Routes>
        {/* 1. THE "FREE ZONES" - These are checked FIRST */}
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register setUser={setUser} />} />

        {/* 2. THE "LOCKED ZONES" - Only checked if the URL isn't /login or /register */}
        <Route
          path="/*"
          element={
            user ? (
              <div className="layout flex h-screen">
                <Sidebar />
                <div className="main flex-1 flex flex-col">
                  <Topbar user={user} setUser={setUser} />
                  <div className="content p-6 overflow-auto">
                    <Routes>
                      <Route index element={<Dashboard data={data} />} />
                      <Route path="transactions" element={ <Transactions  data={data} setData={setData} user={user} />}/>
                      <Route path="budgets" element={ <Budgets  data={data}  setData={setData}  user={user} />}/>
                      <Route path="reports" element={<Reports data={data} />} />
                      <Route path="settings" element={<Settings data={data} setData={setData} user={user} setUser={setUser} />}/>
                    </Routes>
                  </div>
                </div>
              </div>
            ) : (
              /* 3. If they try to access a protected page without a user, 
                 SEND them to login instead of just showing the component. */
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  )       }