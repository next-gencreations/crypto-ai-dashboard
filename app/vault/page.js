"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = "/api/proxy"; // <-- Vercel proxy base

function mask(s = "", keepStart = 4, keepEnd = 4) {
  if (!s) return "";
  if (s.length <= keepStart + keepEnd) return s;
  return `${s.slice(0, keepStart)}…${s.slice(-keepEnd)}`;
}

async function apiGet(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: token ? { "X-Vault-Token": token } : {},
    cache: "no-store",
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { ok: false, error: text || "non_json_response" }; }
  if (!res.ok) return { ...json, ok: false, status: res.status };
  return json;
}

async function apiPost(path, body, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Vault-Token": token } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { ok: false, error: text || "non_json_response" }; }
  if (!res.ok) return { ...json, ok: false, status: res.status };
  return json;
}

async function apiDelete(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: token ? { "X-Vault-Token": token } : {},
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { ok: false, error: text || "non_json_response" }; }
  if (!res.ok) return { ...json, ok: false, status: res.status };
  return json;
}

export default function VaultPage() {
  const [status, setStatus] = useState(null);
  const [token, setToken] = useState("");
  const [ttl, setTtl] = useState(0);

  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");

  const [keys, setKeys] = useState([]);
  const [keyName, setKeyName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const unlocked = useMemo(() => !!status?.unlocked, [status]);

  // Load saved token from browser storage
  useEffect(() => {
    const saved = localStorage.getItem("vault_token") || "";
    if (saved) setToken(saved);
  }, []);

  // Countdown TTL display
  useEffect(() => {
    const t = setInterval(() => setTtl((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  async function refreshStatus() {
    const s = await apiGet("/vault/status");
    setStatus(s);
    if (s?.ttl_sec != null) setTtl(Number(s.ttl_sec) || 0);
    return s;
  }

  async function refreshKeys(currToken) {
    const t = currToken || token;
    if (!t) {
      setKeys([]);
      return;
    }
    const k = await apiGet("/vault/keys", t);
    if (!k.ok) {
      setKeys([]);
      setMsg(`Keys: ${k.error || "failed"}${k.status ? ` (HTTP ${k.status})` : ""}`);
      return;
    }
    setKeys(Array.isArray(k.keys) ? k.keys : []);
  }

  useEffect(() => {
    // initial refresh
    refreshStatus();
  }, []);

  useEffect(() => {
    // if we already have a token, try load keys (won’t hurt if token expired)
    if (token) refreshKeys(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function doSetPin() {
    setMsg("");
    setBusy(true);
    try {
      const r = await apiPost("/vault/pin/set", { pin: newPin || pin });
      if (!r.ok) return setMsg(`Set PIN failed: ${r.error || "unknown"}${r.status ? ` (HTTP ${r.status})` : ""}`);
      setMsg("✅ PIN set");
      setPin("");
      setNewPin("");
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  }

  async function doUnlock() {
    setMsg("");
    setBusy(true);
    try {
      const r = await apiPost("/vault/unlock", { pin });
      if (!r.ok) return setMsg(`Unlock failed: ${r.error || "unknown"}${r.status ? ` (HTTP ${r.status})` : ""}`);
      const t = r.token || "";
      if (t) {
        setToken(t);
        localStorage.setItem("vault_token", t);
      }
      setTtl(Number(r.ttl_sec) || 0);
      setMsg("✅ Vault unlocked");
      setPin("");
      await refreshStatus();
      await refreshKeys(t);
    } finally {
      setBusy(false);
    }
  }

  async function doLock() {
    setMsg("");
    setBusy(true);
    try {
      const r = await apiPost("/vault/lock", {});
      if (!r.ok) return setMsg(`Lock failed: ${r.error || "unknown"}${r.status ? ` (HTTP ${r.status})` : ""}`);
      setMsg("🔒 Vault locked");
      setKeys([]);
      setTtl(0);
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  }

  async function doForgetToken() {
    setToken("");
    localStorage.removeItem("vault_token");
    setKeys([]);
    setTtl(0);
    setMsg("Token cleared from browser.");
    await refreshStatus();
  }

  async function doAddKey() {
    setMsg("");
    setBusy(true);
    try {
      if (!token) return setMsg("No token. Unlock first.");
      const r = await apiPost(
        "/vault/keys",
        { name: keyName, api_key: apiKey, api_secret: apiSecret },
        token
      );
      if (!r.ok) return setMsg(`Add key failed: ${r.error || "unknown"}${r.status ? ` (HTTP ${r.status})` : ""}`);
      setMsg("✅ Key saved");
      setKeyName("");
      setApiKey("");
      setApiSecret("");
      await refreshKeys(token);
    } finally {
      setBusy(false);
    }
  }

  async function doDeleteKey(id) {
    setMsg("");
    setBusy(true);
    try {
      if (!token) return setMsg("No token. Unlock first.");
      const r = await apiDelete(`/vault/keys/${encodeURIComponent(id)}`, token);
      if (!r.ok) return setMsg(`Delete failed: ${r.error || "unknown"}${r.status ? ` (HTTP ${r.status})` : ""}`);
      setMsg("🗑️ Key deleted");
      await refreshKeys(token);
    } finally {
      setBusy(false);
    }
  }

  const statusLine = status
    ? `Vault: ${status.enabled ? "ENABLED" : "DISABLED"} · PIN ${status.pin_set ? "SET" : "NOT SET"} · ${status.unlocked ? "UNLOCKED" : "LOCKED"}`
    : "Vault: loading…";

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <h1 style={{ letterSpacing: 2 }}>VAULT SAFE</h1>

      <div style={{ opacity: 0.9, marginBottom: 12 }}>
        <div>{statusLine}</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Session TTL: <b>{ttl}s</b>
        </div>
      </div>

      {msg ? (
        <div style={{ padding: 10, border: "1px solid rgba(0,255,160,0.25)", borderRadius: 10, marginBottom: 12 }}>
          {msg}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {/* Controls */}
        <div style={{ padding: 14, border: "1px solid rgba(0,255,160,0.25)", borderRadius: 14 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <button disabled={busy} onClick={refreshStatus}>REFRESH</button>
            <button disabled={busy} onClick={doLock}>LOCK</button>
            <button disabled={busy} onClick={doForgetToken}>FORGET TOKEN</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Unlock */}
            <div style={{ padding: 12, border: "1px solid rgba(0,255,160,0.18)", borderRadius: 12 }}>
              <h3 style={{ marginTop: 0 }}>Unlock</h3>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN"
                inputMode="numeric"
                style={{ width: "100%", padding: 10 }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button disabled={busy || !pin} onClick={doUnlock}>UNLOCK</button>
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                Token in browser: <b>{token ? mask(token, 6, 6) : "none"}</b>
              </div>
            </div>

            {/* Set PIN */}
            <div style={{ padding: 12, border: "1px solid rgba(0,255,160,0.18)", borderRadius: 12 }}>
              <h3 style={{ marginTop: 0 }}>Set / Change PIN</h3>
              <input
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="New PIN (4–8 digits)"
                inputMode="numeric"
                style={{ width: "100%", padding: 10 }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button disabled={busy || !newPin} onClick={doSetPin}>SET PIN</button>
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                (If PIN already set, this will overwrite it.)
              </div>
            </div>
          </div>
        </div>

        {/* Key Vault */}
        <div style={{ padding: 14, border: "1px solid rgba(0,255,160,0.25)", borderRadius: 14 }}>
          <h2 style={{ marginTop: 0 }}>KEY VAULT</h2>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
            Unlock the safe to add/manage keys. Keys are stored encrypted on the server. Do NOT enable withdrawal permissions.
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <button disabled={busy || !token} onClick={() => refreshKeys(token)}>LIST KEYS</button>
          </div>

          {/* Add Key */}
          <div style={{ padding: 12, border: "1px solid rgba(0,255,160,0.18)", borderRadius: 12, marginBottom: 12 }}>
            <h3 style={{ marginTop: 0 }}>Add / Update Key</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="name (e.g. binance)"
                style={{ padding: 10 }}
              />
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="api_key"
                style={{ padding: 10 }}
              />
            </div>

            <input
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="api_secret"
              style={{ width: "100%", padding: 10, marginTop: 10 }}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button disabled={busy || !token || !keyName || !apiKey || !apiSecret} onClick={doAddKey}>
                SAVE KEY
              </button>
            </div>
          </div>

          {/* Keys List */}
          <div style={{ padding: 12, border: "1px solid rgba(0,255,160,0.18)", borderRadius: 12 }}>
            <h3 style={{ marginTop: 0 }}>Saved Keys</h3>

            {!token ? (
              <div style={{ opacity: 0.85 }}>Unlock first to list keys.</div>
            ) : keys.length === 0 ? (
              <div style={{ opacity: 0.85 }}>No keys (or token expired). Click “LIST KEYS”.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {keys.map((k) => (
                  <div
                    key={k.id || k.name}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid rgba(0,255,160,0.18)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>
                        {k.name}{" "}
                        <span style={{ fontSize: 12, opacity: 0.75 }}>
                          {k.id ? `(id: ${k.id})` : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.85 }}>
                        api_key: <b>{mask(k.api_key_masked || k.api_key || "")}</b>
                        {k.updated_utc ? ` · updated: ${k.updated_utc}` : ""}
                      </div>
                    </div>

                    <button
                      disabled={busy}
                      onClick={() => doDeleteKey(k.id || k.name)}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      DELETE
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 10 }}>
            If “LIST KEYS” returns 404, tell me — it means your backend doesn’t have /vault/keys yet and I’ll give you the exact server.js patch.
          </div>
        </div>
      </div>
    </div>
  );
}
