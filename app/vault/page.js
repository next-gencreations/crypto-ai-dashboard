"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = "/api/proxy";

const VAULT_GIRL = {
  cryo: "/companion/vaultgirl/vaultgirl_cryo..png",
  idle: "/companion/vaultgirl/vaultgirl_idle..png",
  happy: "/companion/vaultgirl/vaultgirl_happy..png",
  sick: "/companion/vaultgirl/vaultgirl_sick..png",
  thriving: "/companion/vaultgirl/vaultgirl_thriving..png",
  weak: "/companion/vaultgirl/vaultgirl_weak..png",
  zombie: "/companion/vaultgirl/vaultgirl_zombie..png",
};

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
  try {
    json = JSON.parse(text);
  } catch {
    json = { ok: false, error: text || "non_json_response" };
  }

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
  try {
    json = JSON.parse(text);
  } catch {
    json = { ok: false, error: text || "non_json_response" };
  }

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
  try {
    json = JSON.parse(text);
  } catch {
    json = { ok: false, error: text || "non_json_response" };
  }

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

  const vaultGirlState = useMemo(() => {
    // Keep same nice dashboard image unless vault is actually open/profitable later.
    if (!status) return "idle";
    if (!status.enabled) return "idle";
    if (!status.pin_set) return "idle";
    if (unlocked && ttl > 60) return "happy";
    if (unlocked) return "idle";
    return "idle";
  }, [status, unlocked, ttl]);

  const vaultGirlSrc = VAULT_GIRL[vaultGirlState] || VAULT_GIRL.idle;

  useEffect(() => {
    const saved = localStorage.getItem("vault_token") || "";
    if (saved) setToken(saved);
  }, []);

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
    refreshStatus();
  }, []);

  useEffect(() => {
    if (token) refreshKeys(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function doSetPin() {
    setMsg("");
    setBusy(true);

    try {
      const r = await apiPost("/vault/pin/set", { pin: newPin || pin });

      if (!r.ok) {
        setMsg(`Set PIN failed: ${r.error || "unknown"}${r.status ? ` (HTTP ${r.status})` : ""}`);
        return;
      }

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

      if (!r.ok) {
        setMsg(`Unlock failed: ${r.error || "unknown"}${r.status ? ` (HTTP ${r.status})` : ""}`);
        return;
      }

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

      if (!r.ok) {
        setMsg(`Lock failed: ${r.error || "unknown"}${r.status ? ` (HTTP ${r.status})` : ""}`);
        return;
      }

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
      if (!token) {
        setMsg("No token. Unlock first.");
        return;
      }

      const r = await apiPost(
        "/vault/keys",
        { name: keyName, api_key: apiKey, api_secret: apiSecret },
        token
      );

      if (!r.ok) {
        setMsg(`Add key failed: ${r.error || "unknown"}${r.status ? ` (HTTP ${r.status})` : ""}`);
        return;
      }

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
      if (!token) {
        setMsg("No token. Unlock first.");
        return;
      }

      const r = await apiDelete(`/vault/keys/${encodeURIComponent(id)}`, token);

      if (!r.ok) {
        setMsg(`Delete failed: ${r.error || "unknown"}${r.status ? ` (HTTP ${r.status})` : ""}`);
        return;
      }

      setMsg("🗑️ Key deleted");
      await refreshKeys(token);
    } finally {
      setBusy(false);
    }
  }

  const statusLine = status
    ? `Vault: ${status.enabled ? "ENABLED" : "DISABLED"} · PIN ${
        status.pin_set ? "SET" : "NOT SET"
      } · ${status.unlocked ? "UNLOCKED" : "LOCKED"}`
    : "Vault: loading…";

  return (
    <main className="vaultPage">
      <style>{`
        .vaultPage {
          min-height: 100vh;
          background: radial-gradient(circle at top, #062b18 0%, #001207 45%, #000 100%);
          color: #67ff9a;
          font-family: "Courier New", monospace;
          padding: 16px;
        }

        .wrap {
          max-width: 980px;
          margin: 0 auto;
        }

        .title {
          font-size: 42px;
          line-height: 0.95;
          letter-spacing: 8px;
          margin: 8px 0 14px;
          text-shadow: 0 0 12px rgba(0,255,120,0.45);
        }

        .panel {
          border: 1px solid rgba(0,255,160,0.28);
          border-radius: 18px;
          padding: 14px;
          margin-bottom: 12px;
          background: rgba(0, 18, 8, 0.76);
          box-shadow: 0 0 18px rgba(0,255,120,0.08);
        }

        .vaultGirlBox {
          border: 3px solid #00ff88;
          background: #000;
          min-height: 390px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 16px;
        }

        .vaultGirlImg {
          max-width: 100%;
          width: 330px;
          max-height: 430px;
          object-fit: contain;
          filter: drop-shadow(0 0 16px rgba(0,255,120,0.55));
          margin: 8px 0 12px;
        }

        .grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .inner {
          border: 1px solid rgba(0,255,160,0.18);
          border-radius: 12px;
          padding: 12px;
        }

        input {
          width: 100%;
          box-sizing: border-box;
          background: #020702;
          color: #67ff9a;
          border: 1px solid rgba(0,255,160,0.35);
          border-radius: 8px;
          padding: 10px;
          font-family: inherit;
        }

        button {
          background: #001c0b;
          color: #67ff9a;
          border: 1px solid rgba(0,255,160,0.5);
          border-radius: 9px;
          padding: 9px 12px;
          font-family: inherit;
          font-weight: 700;
        }

        button:disabled {
          opacity: 0.45;
        }

        .row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .small {
          font-size: 12px;
          opacity: 0.78;
        }

        @media (max-width: 720px) {
          .title {
            font-size: 36px;
            letter-spacing: 5px;
          }

          .grid2 {
            grid-template-columns: 1fr;
          }

          .vaultGirlBox {
            min-height: 330px;
          }

          .vaultGirlImg {
            width: 280px;
          }
        }
      `}</style>

      <div className="wrap">
        <h1 className="title">VAULT SAFE</h1>

        <section className="panel">
          <div>{statusLine}</div>
          <div className="small">
            Session TTL: <b>{ttl}s</b> · Companion state: <b>{vaultGirlState.toUpperCase()}</b>
          </div>
        </section>

        <section className="panel">
          <h2>VAULT COMPANION</h2>

          <div className="vaultGirlBox">
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 3 }}>
              VAULT GIRL
            </div>

            <img
              className="vaultGirlImg"
              src={vaultGirlSrc}
              alt={`Vault Girl ${vaultGirlState}`}
              onError={(e) => {
                e.currentTarget.src = VAULT_GIRL.idle;
              }}
            />

            <div>
              STATE: <b>{vaultGirlState.toUpperCase()}</b>
            </div>
            <div>
              {unlocked ? "VAULT OPEN · MEMORY ONLINE" : "WAITING FOR CLEAN UNLOCK"}
            </div>
          </div>
        </section>

        {msg ? <section className="panel">{msg}</section> : null}

        <section className="panel">
          <div className="row" style={{ marginTop: 0, marginBottom: 10 }}>
            <button disabled={busy} onClick={refreshStatus}>REFRESH</button>
            <button disabled={busy} onClick={doLock}>LOCK</button>
            <button disabled={busy} onClick={doForgetToken}>FORGET TOKEN</button>
          </div>

          <div className="grid2">
            <div className="inner">
              <h3>Unlock</h3>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN"
                inputMode="numeric"
                type="password"
              />
              <div className="row">
                <button disabled={busy || !pin} onClick={doUnlock}>UNLOCK</button>
              </div>
              <div className="small" style={{ marginTop: 8 }}>
                Token in browser: <b>{token ? mask(token, 6, 6) : "none"}</b>
              </div>
            </div>

            <div className="inner">
              <h3>Set / Change PIN</h3>
              <input
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="New PIN"
                inputMode="numeric"
                type="password"
              />
              <div className="row">
                <button disabled={busy || !newPin} onClick={doSetPin}>SET PIN</button>
              </div>
              <div className="small" style={{ marginTop: 8 }}>
                If PIN already exists, this may overwrite it depending on backend rules.
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>KEY VAULT</h2>
          <div className="small" style={{ marginBottom: 10 }}>
            Unlock the safe to add/manage keys. Do NOT enable withdrawal permissions.
          </div>

          <div className="row" style={{ marginBottom: 12 }}>
            <button disabled={busy || !token} onClick={() => refreshKeys(token)}>LIST KEYS</button>
          </div>

          <div className="inner" style={{ marginBottom: 12 }}>
            <h3>Add / Update Key</h3>

            <div className="grid2">
              <input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="name e.g. binance"
              />
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="api_key"
              />
            </div>

            <input
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="api_secret"
              type="password"
              style={{ marginTop: 10 }}
            />

            <div className="row">
              <button
                disabled={busy || !token || !keyName || !apiKey || !apiSecret}
                onClick={doAddKey}
              >
                SAVE KEY
              </button>
            </div>
          </div>

          <div className="inner">
            <h3>Saved Keys</h3>

            {!token ? (
              <div>Unlock first to list keys.</div>
            ) : keys.length === 0 ? (
              <div>No keys, or token expired. Click LIST KEYS.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {keys.map((k) => (
                  <div
                    key={k.id || k.name}
                    className="inner"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <b>{k.name}</b>
                      <div className="small">
                        api_key: <b>{mask(k.api_key_masked || k.api_key || "")}</b>
                        {k.updated_utc ? ` · updated: ${k.updated_utc}` : ""}
                      </div>
                    </div>

                    <button disabled={busy} onClick={() => doDeleteKey(k.id || k.name)}>
                      DELETE
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
