
import React from 'react'
import { NavLink } from 'react-router-dom'


export default function Sidebar(){
return (
<aside className="sidebar">
<div className="logo">Finlance</div>
<nav>
<NavLink to="/" className="menu-item">Dashboard</NavLink>
<NavLink to="/transactions" className="menu-item">Transactions</NavLink>
<NavLink to="/budgets" className="menu-item">Budgets</NavLink>
<NavLink to="/reports" className="menu-item">Reports</NavLink>
<NavLink to="/settings" className="menu-item">Settings</NavLink>
</nav>
<div style={{flex:1}} />
<div className="small">Finlance • Simple finance management</div>
</aside>
)
}
