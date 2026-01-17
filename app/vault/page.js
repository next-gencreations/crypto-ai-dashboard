// app/vault/page.js
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// ---------- helpers ----------
async function fetchJson(url, token) {
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      accept: "application/json",
      ...(token ? { "X-Vault-Token": token } : {}),
    },
  });

  const txt = await res.text().catch(() => "");
  let data = {};
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    // If we got HTML, show a better error
    throw new Error(`Non-JSON from ${url} (HTTP ${res.status})`);
  }
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

async function postJson(url, body, token) {
  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      ...(token ? { "X-Vault-Token": token } : {}),
    },
    body: JSON.stringify(body || {}),
  });

  const txt = await res.text().catch(() => "");
  let data = {};
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    // Common symptom when proxy POST isn't implemented (404 HTML)
    throw new Error(`Non-JSON from ${url} (HTTP ${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }
  return data;
}

function SafeDoor({ locked, statusText, enabled }) {
  return (
    <div style={{ display: "grid", placeItems: "center", padding: 10 }}>
      <div
        style={{
          width: "min(560px, 94vw)",
          borderRadius: 18,
          border: "1px solid rgba(120,255,170,0.22)",
          background:
            "radial-gradient(circle at 50% 35%, rgba(120,255,170,0.10), rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.65))",
          boxShadow: "0 0 28px rgba(0,0,0,.6), inset 0 0 40px rgba(0,0,0,.45)",
          padding: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            letterSpacing: 3,
            fontSize: 13,
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span>VAULT SAFE</span>
          <span style={{ opacity: 0.85 }}>
            {enabled ? (locked ? "LOCKED" : "OPEN") : "DISABLED"}
          </span>
        </div>

        <div
          style={{
            marginTop: 10,
            height: 230,
            borderRadius: 16,
            border: "1px solid rgba(120,255,170,0.18)",
            background: "rgba(0,0,0,0.35)",
            display: "grid",
            placeItems: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: "50%",
              border: "1px solid rgba(120,255,170,0.30)",
              background: "rgba(0,0,0,0.35)",
              boxShadow: "0 0 18px rgba(120,255,170,0.18)",
              transform: locked ? "rotate(0deg)" : "rotate(28deg)",
              transition: "transform 600ms ease",
              display: "grid",
              placeItems: "center",
              opacity: enabled ? 1 : 0.55,
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                border: "1px solid rgba(120,255,170,0.24)",
                background: "rgba(0,0,0,0.35)",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                letterSpacing: 2,
                fontSize: 18,
              }}
            >
              {!enabled ? "⛔" : locked ? "🔒" : "✅"}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 12,
              borderRadius: 12,
              border: "1px solid rgba(120,255,170,0.18)",
              background: "rgba(0,0,0,0.35)",
              padding: "10px 12px",
              fontSize: 13,
              letterSpacing: 1.3,
              opacity: 0.95,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
}

function PinPad({ onSubmit, disabled, label = "ENTER PIN" }) {
  const [pin, setPin] = useState("");

  function press(n) {
    if (disabled) return;
    if (pin.length >= 8) return;
    setPin((p) => p + String(n));
  }
  function del() {
    if (disabled) return;
    setPin((p) => p.slice(0, -1));
  }
  function clear() {
    if (disabled) return;
    setPin("");
  }
  async function submit() {
    if (disabled) return;
    if (!pin) return;
    await onSubmit(pin);
    setPin("");
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="pip-muted" style={{ letterSpacing: "0.12em" }}>
        {label}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: 12,
          border: "1px solid rgba(120,255,170,0.18)",
          background: "rgba(0,0,0,0.35)",
          padding: "10px 12px",
          letterSpacing: 6,
        }}
      >
        <span>{"•".repeat(pin.length)}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="pip-link" type="button" onClick={del} disabled={disabled}>
            ⌫
          </button>
          <button className="pip-link" type="button" onClick={submit} disabled={disabled}>
            ↵
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            className="pip-link"
            onClick={() => press(n)}
            disabled={disabled}
            style={{ padding: "14px 0" }}
          >
            {n}
          </button>
        ))}
        <button type="button" className="pip-link" onClick={clear} disabled={disabled} style={{ padding: "14px 0" }}>
          C
        </button>
        <button type="button" className="pip-link" onClick={() => press(0)} disabled={disabled} style={{ padding: "14px 0" }}>
          0
        </button>
        <button type="button" className="pip-link" onClick={submit} disabled={disabled} style={{ padding: "14px 0" }}>
          ENTER
        </button>
      </div>
    </div>
  );
}

export default function VaultPage() {
  const [statusText, setStatusText] = useState("Loading vault status…");
  const [busy, setBusy] = useState(false);

  // vault status from backend
  const [enabled, setEnabled] = useState(false);
  const [pinSet, setPinSet] = useState(false);

  // UI state
  const [locked, setLocked] = useState(true);
  const [showPinUnlock, setShowPinUnlock] = useState(false);
  const [showSetPin, setShowSetPin] = useState(false);
  const [setPinStep, setSetPinStep] = useState(1);
  const [pinFirst, setPinFirst] = useState("");

  // memory-only token (never localStorage)
  const [vaultToken, setVaultToken] = useState("");

  const subtitle = useMemo(() => {
    const bits = [
      "Vault",
      enabled ? (locked ? "LOCKED" : "OPEN") : "DISABLED",
      pinSet ? "PIN SET" : "PIN NOT SET",
    ];
    return bits.join(" · ");
  }, [enabled, locked, pinSet]);

  async function refreshStatus() {
    setBusy(true);
    try {
      const s = await fetchJson("/api/proxy/vault/status");
      setEnabled(!!s?.enabled);
      setPinSet(!!s?.pin_set);

      // If backend says unlocked but we don't have token, still show locked
      setLocked(true);

      if (!s?.enabled) {
        setStatusText("Vault not configured on backend. Set VAULT_MASTER_KEY on Render and restart service.");
      } else if (!s?.pin_set) {
        setStatusText("Vault online. PIN not set yet — set PIN to enable quick unlock.");
      } else {
        setStatusText("Vault online. Ready to unlock.");
      }
    } catch (e) {
      setStatusText(`Status error: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unlockWithPin(pin) {
    setBusy(true);
    try {
      const out = await postJson("/api/proxy/vault/pin/unlock", { pin });
      if (!out?.ok || !out?.vault_token) throw new Error("PIN unlock failed");
      setVaultToken(out.vault_token);
      setLocked(false);
      setStatusText("Vault unlocked via PIN.");
    } catch (e) {
      setStatusText(`PIN unlock failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function lockNow() {
    setBusy(true);
    try {
      // best-effort lock on backend, then clear local session
      if (vaultToken) {
        await postJson("/api/proxy/vault/lock", {}, vaultToken).catch(() => {});
      }
      setVaultToken("");
      setLocked(true);
      setStatusText("Vault locked.");
    } finally {
      setBusy(false);
    }
  }

  async function setPinFlow(pin) {
    // two-step confirm
    if (setPinStep === 1) {
      setPinFirst(pin);
      setSetPinStep(2);
      setStatusText("Confirm your new PIN.");
      return;
    }
    if (pin !== pinFirst) {
      setPinFirst("");
      setSetPinStep(1);
      setStatusText("PIN mismatch. Try again.");
      return;
    }

    setBusy(true);
    try {
      // backend allows first-time setup without token (as per your backend logic)
      const out = await postJson("/api/proxy/vault/pin/set", { pin });
      setStatusText(out?.message || "PIN set.");
      setShowSetPin(false);
      setSetPinStep(1);
      setPinFirst("");
      await refreshStatus();
    } catch (e) {
      setStatusText(`Set PIN failed: ${String(e?.message || e)}`);
      setPinFirst("");
      setSetPinStep(1);
    } finally {
      setBusy(false);
    }
  }

  // Passkeys button kept but disabled until your backend implements it fully
  async function unlockWithBiometrics() {
    setStatusText("Biometrics depends on WebAuthn endpoints. If not enabled on backend, use PIN.");
    setShowPinUnlock(true);
  }

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        <div className="pip-topbar">
          <div className="pip-topbar-left">
            <div className="pip-title">PIP-TRADE 3000</div>
            <div className="pip-sub wrap-anywhere" title={subtitle}>
              {subtitle}
            </div>
          </div>
          <div className="pip-topbar-right">
            <div className="pip-badge">{locked ? "SAFE LOCKED" : "SAFE OPEN"}</div>
          </div>
        </div>

        <div className="pip-links">
          <Link className="pip-link" href="/">HOME</Link>
          <Link className="pip-link" href="/candles">CANDLES</Link>
          <Link className="pip-link" href="/crypto">CRYPTO</Link>
          <Link className="pip-link active" href="/vault">VAULT</Link>
        </div>

        <div className="pip-content">
          <div className="pip-panel">
            <div className="pip-heading">VAULT SAFE</div>

            <SafeDoor locked={locked} statusText={statusText} enabled={enabled} />

            <div className="pip-links" style={{ marginTop: 10 }}>
              <button className="pip-link" type="button" onClick={unlockWithBiometrics} disabled={busy || !enabled || !locked}>
                UNLOCK (BIOMETRICS)
              </button>

              <button
                className="pip-link"
                type="button"
                onClick={() => setShowPinUnlock((s) => !s)}
                disabled={busy || !enabled}
              >
                {showPinUnlock ? "HIDE PIN" : "USE PIN"}
              </button>

              <button
                className="pip-link"
                type="button"
                onClick={() => {
                  setShowSetPin((s) => !s);
                  setSetPinStep(1);
                  setPinFirst("");
                  setStatusText(!pinSet ? "Enter a new PIN." : "Change PIN (requires backend rules).");
                }}
                disabled={busy || !enabled}
              >
                SET PIN
              </button>

              <button className="pip-link" type="button" onClick={lockNow} disabled={busy}>
                LOCK
              </button>

              <button className="pip-link" type="button" onClick={refreshStatus} disabled={busy}>
                REFRESH
              </button>
            </div>

            {!enabled && (
              <div className="pip-muted pip-footnote" style={{ marginTop: 12 }}>
                Vault is disabled on backend. Confirm <b>VAULT_MASTER_KEY</b> is set on Render and restart the Render service.
              </div>
            )}

            {enabled && showSetPin && (
              <div style={{ marginTop: 14 }}>
                <PinPad
                  onSubmit={setPinFlow}
                  disabled={busy}
                  label={setPinStep === 1 ? "SET NEW PIN" : "CONFIRM PIN"}
                />
              </div>
            )}

            {enabled && showPinUnlock && (
              <div style={{ marginTop: 14 }}>
                <PinPad onSubmit={unlockWithPin} disabled={busy} label="UNLOCK WITH PIN" />
              </div>
            )}

            <div className="pip-muted pip-footnote" style={{ marginTop: 12 }}>
              Keys are stored encrypted on the server. Do NOT enable withdrawal permissions.
              Withdrawals remain only inside the exchange app.
            </div>
          </div>

          <div className="pip-panel" style={{ marginTop: 14 }}>
            <div className="pip-heading">KEY VAULT</div>
            {locked ? (
              <div className="pip-muted">Unlock the safe to add/manage keys.</div>
            ) : (
              <div className="pip-muted">
                Safe is open. (Key management UI can sit here — once vault endpoints are confirmed working.)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
