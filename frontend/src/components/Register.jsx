import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Register({ setUser }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault();
  
    // 1. Keep your front-end check for matching passwords
    if (password !== confirm) {
      setErr('Passwords do not match');
      return;
    }
  
    try{ 
      // 2. Call your FastAPI Backend
      // Note: We use 'name' as the username to match our backend model
      const response = await fetch(`http://127.0.0.1:8000/register?username=${name}&email=${email}&password=${password}`, {
        method: 'POST'
      });
  
      const result = await response.json();

      console.log(result);

      if (result.error) {
        setErr(result.error);
        return;
      }
  
      if (result.status === "success" || result.status === "partial_success")  {
    
        
      alert("Registration successful! 🌿 Please check your email to verify your account before logging in.");

      // 5. Navigate to the login page instead of the dashboard
      navigate('/login');
     
      }
    } catch (error) {
      setErr("System is having issues. Please try again later.");
    }
  }
  
  return (
    <div style={{ display: 'flex', height: '100vh' }}>

      {/* LEFT – BLUE BRAND SECTION */}
      <div
        style={{
          width: '50%',
          position: 'relative',
          background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            top: -60,
            left: -60
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            bottom: 60,
            right: 80
          }}
        />

        {/* Content */}
        <div style={{ textAlign: 'center', zIndex: 2 }}>
          <div style={{ fontSize: 52, fontWeight: 700, marginBottom: 12 }}>
            Finlance
          </div>

          <p style={{ maxWidth: 340, lineHeight: 1.7, opacity: 0.9 }}>
            Build healthy financial habits.<br />
            Plan smarter, save more,<br />
            and stay financially confident.
          </p>
        </div>
      </div>

      {/* RIGHT – REGISTER FORM */}
      <div
        style={{
          width: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f6f8'
        }}
      >
        <div className="card" style={{ width: 420 }}>
          <h3 className="big">Create an account</h3>
          <p className="small">Sign up to start managing your finances</p>

          {err && (
            <div style={{ color: 'red', marginTop: 8 }}>
              {err}
            </div>
          )}

          <form onSubmit={submit} style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <input
                className="input"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <input
                className="input"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <input
                className="input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <input
                className="input"
                type="password"
                placeholder="Confirm Password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>

            <button className="btn" style={{ width: '100%' }} type="submit">
              Create Account
            </button>
          </form>

          <div style={{ marginTop: 12 }} className="small">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>
      </div>

    </div>
  )
}
