"use client";
import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: { preventDefault: () => void; }) => {
    e.preventDefault(); 
    setLoading(true);
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });
    setLoading(false);
    if (res.ok) {
      window.location.href = "/";
    } else {
      alert("Login failed");
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="p-6 max-w-sm mx-auto flex flex-col gap-3 mt-20 shadow rounded-xl border bg-white"
    >
      <h1 className="text-xl font-bold mb-2 text-center">Login</h1>
      <input
        placeholder="Email"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="border p-2 rounded w-full mb-2"
        autoFocus
        autoComplete="username"
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border p-2 rounded w-full mb-2"
        autoComplete="current-password"
      />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
        disabled={loading || !username || !password}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
