"use client";

import React, { useEffect, useMemo, useState } from "react";

const API = "/api/proxy"; // your Next proxy (forwards to Render backend)

async function readJson(res) {
  const txt = await res.text();
  let data = null;
  try {
    data = txt ? JSON.parse(txt) : null;
  } catch {
    data = { _raw: txt };
  }
  return data || {};
}

function friendlyVaultError(code) {
  if (!code) return "";
  const c = String(code);

  const map = {
    vault_not_configured: "Vault is not configured on the backend (missing VAULT_MASTER_KEY).",
    pin_not_set: "PIN not set yet. Use SET PIN first.",
    bad_pin: "Incorrect PIN.",
    vault_locked: "Vault is locked. Unlock it first before changing the PIN.",
    pin_must_be_4_to_12_digits: "PIN must be 4–12 digits.",
  };

  return map[c] || c;
}

async function getJson(url) {
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  const data = await readJson(res);
  if (!res.ok) {
    const msg = data?.error || data?.detail || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data || {};
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) {
    const msg = data?.error || data?.detail || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data || {};
}

function fmtSecs(n) {
  const s = Math.max(0, Number(n || 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

export default function VaultPage() {
  const [vaultEnabled, setVaultEnabled] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [ttlSec, setTtlSec] = useState(0);

  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [last, setLast] = useState("");

  const doorLabel = useMemo(() => {
    if (!vaultEnabled) return "DISABLED";
    if (unlocked) return "UNLOCKED";
    if (pinSet) return "LOCKED";
    return "PIN NOT SET";
  }, [vaultEnabled, unlocked, pinSet]);

  function normalizeVaultStatus(out) {
    const o = out && typeof out === "object" ? out : {};
    const enabled = typeof o.enabled === "boolean" ? o.enabled : !!o.vault_enabled;
    const unlockedVal = typeof o.unlocked === "boolean" ? o.unlocked : !!o.vault_unlocked;
    const pinSetVal =
      typeof o.pin_set === "boolean" ? o.pin_set : typeof o.pinSet === "boolean" ? o.pinSet : false;
    const ttl = Number(o.ttl_sec ?? o.ttl ?? 0) || 0;
    return { enabled, unlocked: unlockedVal, pin_set: pinSetVal, ttl_sec: ttl, raw: o };
  }

  async function refreshStatus() {
    setBusy(true);
    try {
      const out = await getJson(`${API}/vault/status`);
      const norm = normalizeVaultStatus(out);

      setVaultEnabled(!!norm.enabled);
      setPinSet(!!norm.pin_set);
      setUnlocked(!!norm.unlocked);
      setTtlSec(Number(norm.ttl_sec || 0));

      if (!norm.enabled) {
        setMsg("Vault disabled on backend. Check Render env: VAULT_MASTER_KEY then restart the API.");
      } else if (!norm.pin_set) {
        setMsg("Vault enabled. PIN not set yet. Use SET PIN.");
      } else if (!norm.unlocked) {
        setMsg("Vault enabled. Locked. Unlock with PIN.");
      } else {
        setMsg(`Vault unlocked. TTL: ${fmtSecs(norm.ttl_sec)}.`);
      }

      setLast(new Date().toLocaleTimeString());
    } catch (e) {
      const raw = String(e?.message || e);
      setMsg(friendlyVaultError(raw) || raw);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function usePinUnlock() {
    setBusy(true);
    try {
      const out = await postJson(`${API}/vault/unlock`, { pin });
      setMsg(out?.ok ? "Unlocked." : "Unlock attempted.");
      await refreshStatus();
    } catch (e) {
      const raw = String(e?.message || e);
      setMsg(friendlyVaultError(raw) || raw);
    } finally {
      setBusy(false);
    }
  }

  async function setPinOnBackend() {
    setBusy(true);
    try {
      // ✅ Correct backend route: /vault/pin/set
      const out = await postJson(`${API}/vault/pin/set`, { pin: newPin });
      setMsg(out?.ok ? "PIN set + vault unlocked." : "PIN set.");
      setNewPin("");
      await refreshStatus();
    } catch (e) {
      const raw = String(e?.message || e);
      setMsg(friendlyVaultError(raw) || raw);
    } finally {
      setBusy(false);
    }
  }

  async function lockVault() {
    setBusy(true);
    try {
      const out = await postJson(`${API}/vault/lock`, {});
      setMsg(out?.ok ? "Locked." : "Lock attempted.");
      await refreshStatus();
    } catch (e) {
      const raw = String(e?.message || e);
      setMsg(friendlyVaultError(raw) || raw);
    } finally {
      setBusy(false);
    }
  }

  function unlockWithPasskey() {
    // Your backend currently DOES NOT implement WebAuthn endpoints.
    setMsg("Biometrics not implemented on backend yet. Use PIN.");
  }

  return (
    <main style={{ padding: 20, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, letterSpacing: 2, margin: "6px 0 10px" }}>VAULT SAFE</h1>

      <div
        style={{
          border: "1px solid rgba(119,255,154,0.25)",
          borderRadius: 14,
          padding: 16,
          boxShadow: "0 0 40px rgba(119,255,154,0.08) inset",
          background: "rgba(0, 27, 13, 0.55)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            <b>Vault</b> · {vaultEnabled ? "ENABLED" : "DISABLED"} · {pinSet ? "PIN SET" : "PIN NOT SET"} ·{" "}
            {unlocked ? "UNLOCKED" : "LOCKED"}
          </div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Last: {last || "—"}</div>
        </div>

        <div style={{ marginTop: 14, padding: 14, borderRadius: 14, border: "1px solid rgba(119,255,154,0.18)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 16, letterSpacing: 2 }}>
              <b>VAULT SAFE</b>
            </div>
            <div style={{ fontSize: 14, letterSpacing: 2, opacity: 0.9 }}>{doorLabel}</div>
          </div>

          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              background: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(119,255,154,0.12)",
              fontSize: 13,
              whiteSpace: "pre-wrap",
            }}
          >
            {msg || "—"}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <button className="btn" disabled={busy} onClick={unlockWithPasskey}>
              UNLOCK (BIOMETRICS)
            </button>
            <button className="btn" disabled={busy || !pin} onClick={usePinUnlock}>
              USE PIN
            </button>
            <button className="btn" disabled={busy || !newPin} onClick={setPinOnBackend}>
              SET PIN
            </button>
            <button className="btn" disabled={busy} onClick={lockVault}>
              LOCK
            </button>
            <button className="btn" disabled={busy} onClick={refreshStatus}>
              REFRESH
            </button>
          </div>

          <div style={{ marginTop: 14, fontSize: 12, opacity: 0.85 }}>
            Keys are stored encrypted on the server. Do <b>NOT</b> enable withdrawal permissions. Withdrawals remain only
            inside the exchange app.
          </div>
        </div>

        <div style={{ marginTop: 14, padding: 14, borderRadius: 14, border: "1px solid rgba(119,255,154,0.18)" }}>
          <div style={{ fontSize: 16, letterSpacing: 2 }}>
            <b>KEY VAULT</b>
          </div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>
            {vaultEnabled ? "Unlock the safe to add/manage keys." : "Vault is disabled on backend."}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 12 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>PIN</div>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="enter PIN"
                inputMode="numeric"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(119,255,154,0.25)",
                  background: "rgba(0,0,0,0.25)",
                  color: "#77ff9a",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>New PIN</div>
              <input
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="set a new PIN (4–12 digits)"
                inputMode="numeric"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(119,255,154,0.25)",
                  background: "rgba(0,0,0,0.25)",
                  color: "#77ff9a",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.85 }}>
            Session TTL: <b>{fmtSecs(ttlSec)}</b>
          </div>
        </div>
      </div>

      <style jsx>{`
        .btn {
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid rgba(119, 255, 154, 0.28);
          background: rgba(0, 0, 0, 0.22);
          color: #77ff9a;
          letter-spacing: 1px;
          cursor: pointer;
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </main>
  );
}
