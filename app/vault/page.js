"use client";

import { useEffect, useMemo, useState } from "react";

export default function VaultPage() {
  const API_BASE = useMemo(() => {
    // Preferred: NEXT_PUBLIC_API_URL="/api/proxy" (your Vercel setup)
    // Fallback: "/api/proxy"
    const v = (process.env.NEXT_PUBLIC_API_URL || "/api/proxy").trim();
    return v.endsWith("/") ? v.slice(0, -1) : v;
  }, []);

  const [loading, setLoading] = useState(true);
  const [lastUrl, setLastUrl] = useState("");
  const [lastStatus, setLastStatus] = useState(null);

  const [status, setStatus] = useState({
    ok: false,
    enabled: false,
    unlocked: false,
    pin_set: false,
    ttl_sec: 0,
    expires: 0,
  });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [pin, setPin] = useState("");
  const [keysLoading, setKeysLoading] = useState(false);
  const [keys, setKeys] = useState([]);

  const [newExchange, setNewExchange] = useState("BINANCE");
  const [newApiKey, setNewApiKey] = useState("");
  const [newApiSecret, setNewApiSecret] = useState("");
  const [newPassphrase, setNewPassphrase] = useState("");

  // ---------- helpers ----------
  async function fetchJson(path, opts = {}) {
    const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
    setLastUrl(url);

    const res = await fetch(url, {
      cache: "no-store",
      ...opts,
      headers: {
        ...(opts.headers || {}),
        // send JSON by default
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
        Accept: "application/json",
      },
    });

    setLastStatus(res.status);

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    let dataText = "";
    let data = null;

    try {
      if (ct.includes("application/json")) {
        data = await res.json();
      } else {
        dataText = await res.text();
      }
    } catch (e) {
      // ignore parse errors; we’ll show diagnostics
    }

    if (!res.ok) {
      const detail =
        (data && (data.error || data.message)) ||
        (dataText ? dataText.slice(0, 200) : "") ||
        `HTTP ${res.status}`;
      throw new Error(detail);
    }

    if (data == null) {
      // Not JSON but ok — still return something helpful
      return { ok: true, raw: dataText };
    }

    return data;
  }

  function clearNotices() {
    setMsg("");
    setErr("");
  }

  // ---------- core actions ----------
  async function loadStatus() {
    clearNotices();
    setLoading(true);
    try {
      const s = await fetchJson("/vault/status");
      setStatus({
        ok: !!s.ok,
        enabled: !!s.enabled,
        unlocked: !!s.unlocked,
        pin_set: !!s.pin_set,
        ttl_sec: Number(s.ttl_sec || 0),
        expires: Number(s.expires || 0),
      });

      // If unlocked, load keys
      if (s.enabled && s.unlocked) {
        await loadKeys();
      } else {
        setKeys([]);
      }
    } catch (e) {
      setErr(
        `Vault status check failed. This usually means /api/proxy is not forwarding correctly.\n\n` +
          `Tried: ${API_BASE}/vault/status\n` +
          `HTTP: ${lastStatus ?? "?"}\n` +
          `Error: ${String(e?.message || e)}`
      );
      // pessimistic state
      setStatus((prev) => ({ ...prev, ok: false, enabled: false, unlocked: false }));
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadKeys() {
    setKeysLoading(true);
    try {
      const r = await fetchJson("/vault/keys");
      setKeys(Array.isArray(r.keys) ? r.keys : []);
    } catch (e) {
      setErr(`Could not load keys: ${String(e?.message || e)}`);
      setKeys([]);
    } finally {
      setKeysLoading(false);
    }
  }

  async function onSetPin() {
    clearNotices();
    try {
      if (!pin || pin.length < 4) throw new Error("PIN must be 4–12 digits.");
      if (!/^\d{4,12}$/.test(pin)) throw new Error("PIN must be digits only (4–12).");

      const r = await fetchJson("/vault/pin/set", {
        method: "POST",
        body: JSON.stringify({ pin }),
      });

      setMsg("PIN set ✅ Vault is now unlocked (session started).");
      setPin("");
      setStatus((s) => ({ ...s, pin_set: true, unlocked: true, enabled: true, ok: true, ttl_sec: r.ttl_sec || s.ttl_sec }));
      await loadKeys();
    } catch (e) {
      setErr(`Set PIN failed: ${String(e?.message || e)}`);
    }
  }

  async function onUnlock() {
    clearNotices();
    try {
      if (!pin || pin.length < 4) throw new Error("Enter your PIN to unlock.");
      const r = await fetchJson("/vault/unlock", {
        method: "POST",
        body: JSON.stringify({ pin }),
      });
      setMsg("Unlocked ✅");
      setPin("");
      setStatus((s) => ({ ...s, unlocked: true, enabled: true, ok: true, expires: r.expires || s.expires, ttl_sec: r.ttl_sec || s.ttl_sec }));
      await loadKeys();
    } catch (e) {
      setErr(`Unlock failed: ${String(e?.message || e)}`);
    }
  }

  async function onLock() {
    clearNotices();
    try {
      await fetchJson("/vault/lock", { method: "POST", body: JSON.stringify({}) });
      setMsg("Locked ✅");
      setStatus((s) => ({ ...s, unlocked: false }));
      setKeys([]);
    } catch (e) {
      setErr(`Lock failed: ${String(e?.message || e)}`);
    }
  }

  async function onAddKey() {
    clearNotices();
    try {
      if (!status.unlocked) throw new Error("Unlock the vault first.");
      if (!newExchange.trim()) throw new Error("Exchange is required.");
      if (!newApiKey.trim() || !newApiSecret.trim()) throw new Error("API key + secret are required.");

      await fetchJson("/vault/keys/add", {
        method: "POST",
        body: JSON.stringify({
          exchange: newExchange.trim().toUpperCase(),
          api_key: newApiKey.trim(),
          api_secret: newApiSecret.trim(),
          passphrase: newPassphrase.trim(),
        }),
      });

      setMsg("Key saved ✅");
      setNewApiKey("");
      setNewApiSecret("");
      setNewPassphrase("");
      await loadKeys();
    } catch (e) {
      setErr(`Add key failed: ${String(e?.message || e)}`);
    }
  }

  async function onDeleteKey(id) {
    clearNotices();
    try {
      if (!status.unlocked) throw new Error("Unlock the vault first.");
      await fetchJson(`/vault/keys/delete/${id}`, { method: "DELETE" });
      setMsg("Key deleted ✅");
      await loadKeys();
    } catch (e) {
      setErr(`Delete failed: ${String(e?.message || e)}`);
    }
  }

  // ---------- lifecycle ----------
  useEffect(() => {
    loadStatus();
    // mild poll so the UI updates if session expires
    const t = setInterval(loadStatus, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- UI ----------
  const card = {
    border: "1px solid rgba(119,255,154,0.18)",
    borderRadius: 18,
    padding: 16,
    background: "rgba(0,0,0,0.22)",
    boxShadow: "0 0 40px rgba(0,255,120,0.08)",
  };

  const btn = (onClick, disabled = false) => ({
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(119,255,154,0.35)",
    background: disabled ? "rgba(0,0,0,0.3)" : "rgba(0,50,20,0.35)",
    color: "#77ff9a",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
    letterSpacing: 1,
  });

  const input = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(119,255,154,0.25)",
    background: "rgba(0,0,0,0.25)",
    color: "#77ff9a",
    outline: "none",
  };

  const pill = (text, good) => ({
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${good ? "rgba(119,255,154,0.5)" : "rgba(255,140,140,0.5)"}`,
    background: good ? "rgba(0,90,30,0.25)" : "rgba(90,0,0,0.25)",
    color: good ? "#77ff9a" : "#ff9a9a",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: 1,
  });

  const statusLine = `API_BASE: ${API_BASE}  |  last: ${lastUrl || "—"}  |  HTTP: ${lastStatus ?? "—"}`;

  return (
    <div style={{ padding: 18, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 3 }}>VAULT SAFE</div>
          <div style={{ opacity: 0.75, fontSize: 12, marginTop: 4 }}>{statusLine}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span style={pill(`ENABLED: ${status.enabled ? "YES" : "NO"}`, status.enabled)} />
          <span style={pill(`UNLOCKED: ${status.unlocked ? "YES" : "NO"}`, status.unlocked)} />
          <span style={pill(`PIN: ${status.pin_set ? "SET" : "NOT SET"}`, status.pin_set)} />
          <button style={btn(loadStatus, loading)} onClick={loadStatus} disabled={loading}>
            {loading ? "LOADING…" : "REFRESH"}
          </button>
        </div>
      </div>

      {(msg || err) && (
        <div style={{ ...card, marginBottom: 14, whiteSpace: "pre-wrap" }}>
          {msg && <div style={{ color: "#77ff9a", fontWeight: 800 }}>{msg}</div>}
          {err && <div style={{ color: "#ff9a9a", fontWeight: 800 }}>{err}</div>}
        </div>
      )}

      <div style={{ ...card, marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 2, marginBottom: 10 }}>CONTROLS</div>

        {!status.enabled && (
          <div style={{ opacity: 0.9, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
            Vault is reporting disabled **from the frontend’s point of view**.
            {"\n\n"}
            If your Render URL shows `"enabled": true` but this page says disabled, it means the proxy route is not forwarding.
            {"\n\n"}
            Try opening: <b>{API_BASE}/vault/status</b> (must return JSON).
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 12 }}>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>PIN (4–12 digits)</div>
            <input
              style={input}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              placeholder="Enter PIN"
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={btn(onSetPin, !status.enabled)} onClick={onSetPin} disabled={!status.enabled}>
              SET PIN
            </button>
            <button style={btn(onUnlock, !status.enabled)} onClick={onUnlock} disabled={!status.enabled}>
              UNLOCK (PIN)
            </button>
            <button style={btn(onLock, !status.enabled)} onClick={onLock} disabled={!status.enabled}>
              LOCK
            </button>
          </div>

          <div style={{ opacity: 0.8, fontSize: 12, lineHeight: 1.5 }}>
            Keys are stored encrypted on the server. Do NOT enable withdrawal permissions on exchange API keys.
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 2 }}>KEY VAULT</div>
          <div style={{ opacity: 0.75, fontSize: 12 }}>
            {status.unlocked ? "Unlocked — you can add/manage keys." : "Locked — unlock to view keys."}
          </div>
        </div>

        {!status.unlocked ? (
          <div style={{ opacity: 0.85, lineHeight: 1.6 }}>
            Unlock the safe to add/manage keys.
            <div style={{ marginTop: 8, opacity: 0.8, fontSize: 12 }}>
              Tip: If you *know* Render vault is enabled, but this UI says disabled, your proxy route is not reachable.
              The URL that must work is: <b>{API_BASE}/vault/status</b>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Exchange</div>
                <input style={input} value={newExchange} onChange={(e) => setNewExchange(e.target.value)} placeholder="BINANCE" />
              </div>
              <div>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Passphrase (optional)</div>
                <input style={input} value={newPassphrase} onChange={(e) => setNewPassphrase(e.target.value)} placeholder="optional" />
              </div>
              <div>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>API Key</div>
                <input style={input} value={newApiKey} onChange={(e) => setNewApiKey(e.target.value)} placeholder="api key" />
              </div>
              <div>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>API Secret</div>
                <input style={input} value={newApiSecret} onChange={(e) => setNewApiSecret(e.target.value)} placeholder="api secret" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              <button style={btn(onAddKey, keysLoading)} onClick={onAddKey} disabled={keysLoading}>
                ADD KEY
              </button>
              <button style={btn(loadKeys, keysLoading)} onClick={loadKeys} disabled={keysLoading}>
                {keysLoading ? "LOADING…" : "RELOAD KEYS"}
              </button>
            </div>

            <div style={{ borderTop: "1px dashed rgba(119,255,154,0.2)", paddingTop: 12 }}>
              {keys.length === 0 ? (
                <div style={{ opacity: 0.8 }}>No keys stored yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {keys.map((k) => (
                    <div key={k.id} style={{ ...card, padding: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 900, letterSpacing: 1 }}>{k.exchange || "UNKNOWN"}</div>
                          <div style={{ opacity: 0.8, fontSize: 12 }}>ID: {k.id} • Created: {k.created || "—"}</div>
                          <div style={{ marginTop: 6, fontSize: 13 }}>
                            API Key: <span style={{ opacity: 0.85 }}>{k.api_key_masked || "****"}</span>
                          </div>
                          {k.error && <div style={{ color: "#ff9a9a", fontWeight: 800, marginTop: 6 }}>Error: {k.error}</div>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <button style={btn(() => onDeleteKey(k.id), false)} onClick={() => onDeleteKey(k.id)}>
                            DELETE
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
