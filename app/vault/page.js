"use client";

import React, { useEffect, useMemo, useState } from "react";

async function readJson(res) {
  const txt = await res.text();
  let data = null;
  try {
    data = txt ? JSON.parse(txt) : null;
  } catch {
    data = { _raw: txt };
  }
  return { ok: res.ok, status: res.status, data: data || {} };
}

async function getJson(url, token) {
  const res = await fetch(url, {
    method: "GET",
    headers: token ? { "X-Vault-Token": token } : {},
    cache: "no-store",
  });

  const out = await readJson(res);
  if (!out.ok) {
    const msg =
      (out.data && (out.data.error || out.data.detail || out.data.message)) || `HTTP ${out.status}`;
    throw new Error(msg);
  }
  return out.data || {};
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

  const out = await readJson(res);
  if (!out.ok) {
    const msg =
      (out.data && (out.data.error || out.data.detail || out.data.message)) || `HTTP ${out.status}`;
    const err = new Error(msg);
    err.status = out.status;
    err.payload = out.data;
    throw err;
  }
  return out.data || {};
}

function fmtSecs(n) {
  const s = Math.max(0, Number(n || 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

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

  // some backends might return ttl_sec, ttl, expires, etc
  const ttl = Number(o.ttl_sec ?? o.ttl ?? o.expires ?? 0) || 0;

  return { enabled, unlocked: unlockedVal, pin_set: pinSetVal, ttl_sec: ttl, raw: o };
}

/**
 * Try multiple backend endpoints (through /api/proxy) until one works.
 * This avoids guessing exact backend route names.
 */
async function postWithFallback(paths, token, body) {
  let lastErr = null;
  for (const p of paths) {
    try {
      const out = await postJson(p, token, body);
      return { out, used: p };
    } catch (e) {
      lastErr = e;
      // If it's 404, try next candidate
      if (Number(e?.status) === 404) continue;
      // For other errors (401/400/500), stop and show it.
      throw e;
    }
  }
  // All candidates 404
  throw lastErr || new Error("No endpoint matched");
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
  const [lastEndpoint, setLastEndpoint] = useState("");

  const doorLabel = useMemo(() => {
    if (!vaultEnabled) return "DISABLED";
    if (unlocked) return "UNLOCKED";
    if (pinSet) return "LOCKED";
    return "PIN NOT SET";
  }, [vaultEnabled, unlocked, pinSet]);

  async function refreshStatus() {
    setBusy(true);
    try {
      const out = await getJson("/api/proxy/vault/status", token || "");
      const norm = normalizeVaultStatus(out);

      setVaultEnabled(!!norm.enabled);
      setPinSet(!!norm.pin_set);
      setUnlocked(!!norm.unlocked);
      setTtlSec(Number(norm.ttl_sec || 0));

      if (!norm.enabled) {
        setMsg("Vault disabled on backend. Set VAULT_MASTER_KEY on Render and redeploy.");
      } else if (!norm.pin_set) {
        setMsg("pin_not_set");
      } else if (!norm.unlocked) {
        setMsg("Vault locked. Use PIN to unlock.");
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
      const candidates = [
        "/api/proxy/vault/unlock",
        "/api/proxy/vault/pin/unlock",
        "/api/proxy/vault/unlock/pin",
        "/api/proxy/vault/pin_unlock",
        "/api/proxy/vault/pin-unlock",
      ];

      const { out, used } = await postWithFallback(candidates, token, { pin });
      setLastEndpoint(used);

      if (out?.token) setToken(out.token);
      setMsg(out?.message || "Unlocked.");
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
      const candidates = [
        "/api/proxy/vault/set-pin",
        "/api/proxy/vault/pin/set",
        "/api/proxy/vault/pin",
        "/api/proxy/vault/set_pin",
        "/api/proxy/vault/pin-set",
      ];

      const { out, used } = await postWithFallback(candidates, token, { pin: newPin });
      setLastEndpoint(used);

      setMsg(out?.message || `PIN set (via ${used}).`);
      setNewPin("");
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
      const candidates = [
        "/api/proxy/vault/lock",
        "/api/proxy/vault/lockdown",
        "/api/proxy/vault/pin/lock",
        "/api/proxy/vault/close",
      ];

      const { out, used } = await postWithFallback(candidates, token, {});
      setLastEndpoint(used);

      setMsg(out?.message || "Locked.");
      await refreshStatus();
    } catch (e) {
      setMsg(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function unlockWithPasskey() {
    setBusy(true);
    try {
      const candidates = [
        "/api/proxy/vault/webauthn/begin",
        "/api/proxy/vault/passkey/begin",
        "/api/proxy/vault/biometric",
      ];
      const { out, used } = await postWithFallback(candidates, token, {});
      setLastEndpoint(used);

      setMsg(out?.message || "Biometrics not configured on this device.");
      await refreshStatus();
    } catch (e) {
      setMsg(String(e?.message || e));
    } finally {
      setBusy(false);
    }
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
            {lastEndpoint ? `\n(last endpoint used: ${lastEndpoint})` : ""}
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
            {vaultEnabled
              ? "Unlock the safe to add/manage keys."
              : 'Vault is disabled on backend. Your Render "/vault/status" must show "enabled": true.'}
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
                placeholder="set a new PIN"
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
