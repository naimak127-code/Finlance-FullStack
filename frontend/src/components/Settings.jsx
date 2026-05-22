import React, { useState, useEffect } from "react";

export default function Settings({ data, setData, user, setUser }) {
  
  const [active, setActive] = useState("profile"); // menu selection

  const [profile, setProfile] = useState({
    name: user.username,
    email: user.email,
  });

  const [passwords, setPasswords] = useState({
    old: "",
    new: "",
  });

  const [theme, setTheme] = useState(
    localStorage.getItem("fl_theme") || "light"
  );

  const [newCat, setNewCat] = useState("");

  const [accounts, setAccounts] = useState(
    data.accounts || [] // user-defined
  );

  const [newAcc, setNewAcc] = useState({ name: "" });

  // Persist
  useEffect(() => {
    localStorage.setItem(
      "fl_data",
      JSON.stringify({ ...data, accounts })
    );
  }, [data, accounts]);

 useEffect(() => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  localStorage.setItem("fl_theme", theme);
}, [theme]);


  // --------- SAVE PROFILE ----------
  async function saveProfile() {

    try {
  
      const response = await fetch(
        `http://127.0.0.1:8000/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username: profile.name,
            email: profile.email
          })
        }
      );
  
      const result = await response.json();
  
      if (response.ok) {
  
        setUser(result.user);
  
        localStorage.setItem(
          "fl_user",
          JSON.stringify(result.user)
        );
  
        alert("Profile updated!");
  
      }
  
    } catch (error) {
  
      console.error(error);
  
    }
  }

  // --------- CHANGE PASSWORD ----------
  function changePassword() {
    if (!passwords.old || !passwords.new)
      return alert("Fill all fields.");

    alert("Password updated");
    setPasswords({ old: "", new: "" });
  }

  // --------- CATEGORY ----------
  async function addCategory() {

    if (!newCat.trim()) return;
  
    // prevent duplicates
    const alreadyExists = data.categories.some(
      c => c.name.toLowerCase() === newCat.toLowerCase()
    );
  
    if (alreadyExists) {
      alert("Category already exists");
      return;
    }
  
    try {
  
      const response = await fetch(
        "http://127.0.0.1:8000/categories",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: newCat,
            user_id: user.id
          })
        }
      );
  
      const result = await response.json();
  
      if (response.ok) {
  
        setData(prev => ({
          ...prev,
          categories: [
            ...prev.categories,
            result
          ]
        }));
  
        setNewCat("");
  
      }
  
    } catch (error) {
  
      console.error(error);
  
    }
  }

  async function removeCategory(categoryId) {

    try {
  
      const response = await fetch(
        `http://127.0.0.1:8000/categories/${categoryId}`,
        {
          method: "DELETE"
        }
      );
  
      if (response.ok) {
  
        setData(prev => ({
          ...prev,
          categories: prev.categories.filter(
            c => c.id !== categoryId
          )
        }));
  
      }
  
    } catch (error) {
  
      console.error(error);
  
    }
  }

  // --------- ACCOUNTS ----------
  async function addAccount() {

    if (!newAcc.name) return;
  
    try {
  
      const response = await fetch(
        "http://127.0.0.1:8000/accounts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: newAcc.name,
            user_id: user.id
          })
        }
      );
  
      const result = await response.json();
  
      if (response.ok) {
  
        setData(prev => ({
          ...prev,
          accounts: [
            ...prev.accounts,
            result
          ]
        }));
  
        setNewAcc({ name: "" });
  
      }
  
    } catch (error) {
  
      console.error(error);
  
    }
  }

  async function deleteAccount(accountId) {

    try {
  
      const response = await fetch(
        `http://127.0.0.1:8000/accounts/${accountId}`,
        {
          method: "DELETE"
        }
      );
  
      if (response.ok) {
  
        setData(prev => ({
          ...prev,
          accounts: prev.accounts.filter(
            a => a.id !== accountId
          )
        }));
  
      }
  
    } catch (error) {
  
      console.error(error);
  
    }
  }
  
  // -----------------------------------------------------------
  // CARDS UI
  // -----------------------------------------------------------

  const menuButton = (id, label) => (
    <div
      onClick={() => setActive(id)}
      className={`p-3 rounded-lg cursor-pointer mb-1 ${
        active === id ? "bg-blue-600 text-white" : "bg-gray-100"
      }`}
    >
      {label}
    </div>
  );

  const Card = ({ title, children }) => (
    <div className="card bg-white p-6 shadow-md rounded-xl w-full">
      <div className="text-lg font-semibold mb-4">{title}</div>
      {children}
    </div>
  );

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "260px 1fr" }}>
      {/* ---------------- LEFT MENU ---------------- */}
      <div className="bg-white p-4 rounded-xl shadow-md h-fit">
        {menuButton("profile", "Account Info")}
        {menuButton("password", "Change Password")}
        {menuButton("categories", "Categories")}
        {menuButton("theme", "Appearance")}
        {menuButton("accounts", "Accounts")}
      </div>

      {/* ---------------- RIGHT CONTENT ---------------- */}
      <div>
        {/* ---------- PROFILE ---------- */}
        {active === "profile" && (
          <Card title="Update Profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="input"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                placeholder="Name"
              />
              <input
                className="input"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                placeholder="Email"
              />
            </div>

            <button className="btn mt-4" onClick={saveProfile}>
              Save Profile
            </button>
          </Card>
        )}

        {/* ---------- PASSWORD ---------- */}
        {active === "password" && (
          <Card title="Change Password">
            <input
              className="input mb-3"
              type="password"
              placeholder="Old Password"
              value={passwords.old}
              onChange={(e) =>
                setPasswords({ ...passwords, old: e.target.value })
              }
            />

            <input
              className="input mb-3"
              type="password"
              placeholder="New Password"
              value={passwords.new}
              onChange={(e) =>
                setPasswords({ ...passwords, new: e.target.value })
              }
            />

            <button className="btn" onClick={changePassword}>
              Update Password
            </button>
          </Card>
        )}

        {/* ---------- CATEGORIES ---------- */}
        {active === "categories" && (
          <Card title="Manage Categories">
            <div className="flex gap-3 mb-4">
              <input
                className="input"
                placeholder="New category"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
              />
              <button className="btn" onClick={addCategory}>
                Add
              </button>
            </div>

            {data.categories.map((c) => (
              <div
              key={c.id}
               className="flex justify-between items-center p-2 
           bg-white dark:bg-gray-700
           text-black dark:text-white
           rounded-lg mb-2 shadow"


              >
                <div>{c.name}</div>
                <button
                  className="btn bg-red-500"
                  onClick={() => removeCategory(c.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </Card>
        )}

        {/* ---------- THEME ---------- */}
        {active === "theme" && (
          <Card title="Appearance">
            <label className="small mb-1">Theme</label>

            <select
              className="input"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>

            <div className="mt-4 p-3 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white shadow">
              Current Theme: <b>{theme.toUpperCase()}</b>
            </div>
          </Card>
        )}

        {/* ---------- ACCOUNTS ---------- */}
        {active === "accounts" && (
          <Card title="Manage Accounts">
            {/* ADD NEW */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input
                className="input"
                placeholder="Account Name"
                value={newAcc.name}
                onChange={(e) =>
                  setNewAcc({ ...newAcc, name: e.target.value })
                }
              />
              <button className="btn" onClick={addAccount}>
                Add
              </button>
            </div>

            {/* LIST */}
            {data.accounts.map((acc) => (
              <div
               key={acc.id}
                className="flex justify-between items-center p-3 rounded-lg mb-2
             bg-white dark:bg-gray-700 text-black dark:text-white shadow"
              >
                <div>
                <b>{acc.name}</b>               
                </div>
                <button
                  className="btn bg-red-500"
                  onClick={() => deleteAccount(acc.id)}               >
                  Delete
                </button>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
