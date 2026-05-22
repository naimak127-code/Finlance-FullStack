import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const status = queryParams.get('status');

  async function submit(e) {
    e.preventDefault();
    setErr(''); // Clear old errors
  
    try {
      // Call the FastAPI Login Route
      const response = await fetch(`http://127.0.0.1:8000/login?email=${email}&password=${password}`, {
        method: 'POST',
        
      });
  
      const result = await response.json();
  
      if (result.status === "fail") {
        setErr(result.message); 
        return;
      }
  
      // 2. Check if the login was successful
      if (result.status === "success") {

        const loggedInUser = {
          id: result.id,
          email: result.email,
          name: result.username
        };
      
        // Save user in App state
        setUser(loggedInUser);
      
        // Save in browser storage
        localStorage.setItem(
          'fl_user',
          JSON.stringify(loggedInUser)
        );
      
        // Go to dashboard
        navigate('/');
      
      } else {
        // Show "Wrong email or password"
        setErr(result.detail || "Login failed");      }
    } catch (error) {
      setErr("We're having trouble connecting to our servers. Please try again in a moment.");
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>

      {/* LEFT – DESIGNED BLUE SECTION */}
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
            Smart finance management made simple.<br />
            Track expenses, control budgets,<br />
            and grow with confidence.
          </p>
        </div>
      </div>

      {/* RIGHT – LOGIN FORM */}
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
          <h3 className="big">Welcome back</h3>
          <p className="small">Login to access your dashboard</p>

{/* --- SUCCESS MESSAGE --- */}
{status === 'verified' && (
    <div style={{
      padding: '10px',
      backgroundColor: '#dcfce7',
      borderLeft: '4px solid #22c55e',
      color: '#15803d',
      fontSize: '0.875rem',
      borderRadius: '4px',
      marginBottom: '16px'
    }}>
      <strong>Success!</strong> Your email is verified. You can now login.
    </div>
  )}

  {/* --- ERROR MESSAGE --- */}
  {err && (
    <div style={{
      padding: '10px',
      backgroundColor: '#fee2e2',
      borderLeft: '4px solid #ef4444',
      color: '#b91c1c',
      fontSize: '0.875rem',
      borderRadius: '4px',
      marginBottom: '16px'
    }}>
      {err}
    </div>
  )}
          {err && (
            <div style={{ color: 'red', marginTop: 8 }}>
              {err}
            </div>
          )}


          <form onSubmit={submit} style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <input
                className="input"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <input
                className="input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="btn" style={{ width: '100%' }} type="submit">
              Login
            </button>
          </form>

          <div style={{ marginTop: 12 }} className="small">
            Don't have an account? <Link to="/register">Sign up</Link>
          </div>
        </div>
      </div>

    </div>
  )
}
