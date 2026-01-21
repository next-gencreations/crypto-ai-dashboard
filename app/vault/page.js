"use client"; 

import React, { useEffect, useMemo, useState } from "react";

/**
 * VaultPage (fixed endpoints)
 * Backend routes (from your crypto-ai-api):
 *   GET  /vault/status
 *   POST /vault/pin/set
 *   POST /vault/unlock
 *   POST /vault/lock
 */

async function readJsonResponse(res) {
  const txt = await res.text();
  let data = null;

  try {
    data = txt ? JSON.parse(txt) : null;
  } catch {
    data = { _raw: txt };
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.detail || data.message)) ||
      (typeof txt === "string" && txt.trim() ? txt.trim() : null) ||
      `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data || {};
}

async function getJson(url, token) {
  const res = await fetch(url, {
    method: "GET",
    headers: token ? { "X-Vault-Token": token } : {},
    cache: "no-store",
  });
  return readJsonResponse(res);
}

async function postJson(url, token, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Vault-Token": token } : {}),
    },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  return readJsonResponse(res);
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

  const [token, setToken] = useState("");
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [last, setLast] = useState("");

  // handy debug line so you can see exactly what the UI last called
  const [lastReq, setLastReq] = useState("");

  const doorLabel = useMemo(() => {
    if (!vaultEnabled) return "DISABLED";
    if (unlocked) return "UNLOCKED";
    if (pinSet) return "LOCKED";
    return "PIN NOT SET";
  }, [vaultEnabled, unlocked, pinSet]);

  function normalizeVaultStatus(out) {
    const o = out && typeof out === "object" ? out : {};

    const enabled =
      typeof o.enabled === "boolean"
        ? o.enabled
        : typeof o.vault_enabled === "boolean"
        ? o.vault_enabled
        : false;

    const unlockedVal =
      typeof o.unlocked === "boolean"
        ? o.unlocked
        : typeof o.vault_unlocked === "boolean"
        ? o.vault_unlocked
        : false;

    const pinSetVal =
      typeof o.pin_set === "boolean"
        ? o.pin_set
        : typeof o.pinSet === "boolean"
        ? o.pinSet
        : false;

    const ttl = Number(o.ttl_sec ?? o.ttl ?? 0) || 0;

    return { enabled, unlocked: unlockedVal, pin_set: pinSetVal, ttl_sec: ttl, raw: o };
  }

  async function refreshStatus() {
    setBusy(true);
    try {
      setLastReq(`GET /api/proxy/vault/status`);
      const out = await getJson("/api/proxy/vault/status", "");

      const norm = normalizeVaultStatus(out);

      setVaultEnabled(!!norm.enabled);
      setPinSet(!!norm.pin_set);
      setUnlocked(!!norm.unlocked);
      setTtlSec(Number(norm.ttl_sec || 0));

      if (!norm.enabled) {
        setMsg(
          'Vault disabled on backend. Render must return {"enabled": true} from /vault/status.'
        );
      } else if (!norm.pin_set) {
        setMsg("Vault enabled. PIN not set yet. Use SET PIN.");
      } else if (!norm.unlocked) {
        setMsg("Vault enabled. Locked. Unlock with PIN.");
      } else {
        setMsg(`Vault unlocked. TTL: ${fmtSecs(norm.ttl_sec)}.`);
      }

      setLast(new Date().toLocaleTimeString());
    } catch (e) {
      setMsg(String(e?.message || e));
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
      setLastReq(`POST /api/proxy/vault/unlock  body={pin}`);
      const out = await postJson("/api/proxy/vault/unlock", token, { pin });

      // backend may or may not return a token; keep what user typed if none returned
      if (out?.token) setToken(out.token);

      setMsg(out?.message || out?.status || "Unlocked.");
      await refreshStatus();
    } catch (e) {
      setMsg(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function setPinOnBackend() {
    setBusy(true);
    try {
      // ✅ FIX: correct backend route is /vault/pin/set
      setLastReq(`POST /api/proxy/vault/pin/set  body={pin:newPin}`);
      const out = await postJson("/api/proxy/vault/pin/set", token, { pin: newPin });

      setMsg(out?.message || out?.status || "PIN set.");
      setNewPin("");

      // after setting pin, backend usually leaves vault unlocked=false but pin_set=true
      await refreshStatus();
    } catch (e) {
      setMsg(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function lockVault() {
    setBusy(true);
    try {
      setLastReq(`POST /api/proxy/vault/lock  body={}`);
      const out = await postJson("/api/proxy/vault/lock", token, {});
      setMsg(out?.message || out?.status || "Locked.");
      await refreshStatus();
    } catch (e) {
      setMsg(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function unlockWithPasskey() {
    // Not implemented in your backend (so we don't call a missing endpoint)
    setMsg("Biometrics not implemented on backend yet. Use PIN.");
  }

  const canSetPin = !!newPin && newPin.length >= 4;
  const canUsePin = !!pin && pin.length >= 4;

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

        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
          Last request: <span style={{ opacity: 0.95 }}>{lastReq || "—"}</span>
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
            <button className="btn" disabled={busy || !canUsePin} onClick={usePinUnlock}>
              USE PIN
            </button>
            <button className="btn" disabled={busy || !canSetPin} onClick={setPinOnBackend}>
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
            {vaultEnabled
              ? "Unlock the safe to add/manage keys."
              : 'Vault is disabled on backend. Your API must show {"enabled": true} from /vault/status.'}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 12 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>X-Vault-Token (optional)</div>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="paste token here (if you have one)"
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
              <div style={{ fontSize: 12, opacity: 0.85 }}>PIN</div>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="enter PIN"
                inputMode="numeric"
                type="password"
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
                placeholder="set a new PIN (min 4 digits)"
                inputMode="numeric"
                type="password"
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
