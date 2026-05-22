import React from 'react'
import { Link, useNavigate } from 'react-router-dom'


export default function Topbar({user,setUser}){
const navigate = useNavigate()
function logout(){
setUser(null)
localStorage.removeItem('fl_user')
navigate('/login')
}


return (
<div className="topbar">
<div className="flex items-center gap-4">
<h2 className="big">Finlance</h2>
</div>
<div className="flex items-center gap-4">
<div className="small">{user?.name}</div>
<button className="btn" onClick={logout}>Logout</button>
</div>
</div>
)
}