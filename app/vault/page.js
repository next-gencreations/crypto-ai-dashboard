// app/vault/page.js
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* =========================
   Helpers
   ========================= */

function bufferToBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  const b64 = btoa(str);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBuffer(b64url) {
  const b64 = (b64url || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const raw = atob(b64 + pad);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out.buffer;
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
    // ignore
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }
  return data;
}

async function getJson(url, token) {
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
    // ignore
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }
  return data;
}

/* =========================
   UI bits
   ========================= */

function SafeDoor({ stateLabel, statusText }) {
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
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            letterSpacing: 3,
            fontSize: 13,
            flexWrap: "wrap",
          }}
        >
          <span>VAULT SAFE</span>
          <span style={{ opacity: 0.85 }} className="wrap-anywhere">
            {stateLabel}
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
            overflow: "hidden",
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
              display: "grid",
              placeItems: "center",
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
              {stateLabel.includes("OPEN") ? "✅" : stateLabel.includes("DISABLED") ? "⛔" : "🔒"}
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
              letterSpacing: 1.1,
              opacity: 0.95,
              overflow: "hidden",
            }}
            className="wrap-anywhere"
          >
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
}

function PinPad({ onSubmit, disabled, title = "PIN" }) {
  const [pin, setPin] = useState("");

  function press(n) {
    if (disabled) return;
    if (pin.length >= 10) return;
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
    await onSubmit(pin);
    setPin("");
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="pip-muted" style={{ letterSpacing: "0.12em" }}>
        {title}
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
        <button className="pip-link" type="button" onClick={del} disabled={disabled}>
          ⌫
        </button>
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
        <button
          type="button"
          className="pip-link"
          onClick={() => press(0)}
          disabled={disabled}
          style={{ padding: "14px 0" }}
        >
          0
        </button>
        <button type="button" className="pip-link" onClick={submit} disabled={disabled} style={{ padding: "14px 0" }}>
          ENTER
        </button>
      </div>
    </div>
  );
}

/* =========================
   Page
   ========================= */

export default function VaultPage() {
  const [busy, setBusy] = useState(false);

  // server status
  const [vaultEnabled, setVaultEnabled] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [ttlSec, setTtlSec] = useState(0);

  // status line
  const [status, setStatus] = useState("Loading vault status…");

  // memory-only token (never localStorage)
  const [vaultToken, setVaultToken] = useState("");

  // UI toggles
  const [showPinUnlock, setShowPinUnlock] = useState(false);
  const [showPinSet, setShowPinSet] = useState(false);

  // key form
  const [exchange, setExchange] = useState("BINANCE");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [keysList, setKeysList] = useState([]);

  const locked = !unlocked;

  const subtitle = useMemo(() => {
    const parts = [];
    parts.push(`Vault · ${vaultEnabled ? "ENABLED" : "DISABLED"}`);
    parts.push(pinSet ? "PIN SET" : "PIN NOT SET");
    parts.push(unlocked ? "OPEN" : "LOCKED");
    if (ttlSec) parts.push(`TTL ${ttlSec}s`);
    return parts.join(" · ");
  }, [vaultEnabled, pinSet, unlocked, ttlSec]);

  const doorLabel = useMemo(() => {
    if (!vaultEnabled) return "DISABLED";
    return unlocked ? "OPEN" : "LOCKED";
  }, [vaultEnabled, unlocked]);

  async function refreshStatus() {
    setBusy(true);
    try {
      const out = await getJson("/api/proxy/vault/status", "");
      setVaultEnabled(!!out?.enabled);
      setPinSet(!!out?.pin_set);
      setUnlocked(!!out?.unlocked);
      setTtlSec(Number(out?.ttl_sec || 0));

      // show a friendly message based on actual backend truth
      if (!out?.enabled) {
        setStatus("Vault disabled on backend. Check Render env: VAULT_MASTER_KEY and restart service.");
      } else if (!out?.pin_set) {
        setStatus("Vault enabled. PIN is not set yet. Use SET PIN, then unlock.");
      } else if (!out?.unlocked) {
        setStatus("Vault enabled. Locked. Unlock with biometrics or PIN.");
      } else {
        setStatus("Vault open.");
      }
    } catch (e) {
      setStatus(`Status check failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function refreshKeys(token) {
    const t = token || vaultToken;
    if (!t) return;
    const out = await postJson("/api/proxy/vault/keys/list", {}, t);
    setKeysList(out?.keys || []);
  }

  useEffect(() => {
    // load status when entering page
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unlockWithPasskey() {
    setBusy(true);
    try {
      // first verify backend is enabled
      const st = await getJson("/api/proxy/vault/status", "");
      if (!st?.enabled) throw new Error("Vault disabled on backend (Render).");
      if (!window.PublicKeyCredential) {
        setStatus("Passkeys not supported here. Use PIN.");
        setShowPinUnlock(true);
        return;
      }

      const opts = await postJson("/api/proxy/vault/webauthn/login/options", {}, "");
      const pub = opts?.publicKey;
      if (!pub?.challenge) throw new Error("Missing WebAuthn challenge");

      const publicKey = {
        ...pub,
        challenge: base64UrlToBuffer(pub.challenge),
        allowCredentials: (pub.allowCredentials || []).map((c) => ({
          ...c,
          id: base64UrlToBuffer(c.id),
        })),
      };

      const cred = await navigator.credentials.get({ publicKey });
      if (!cred) throw new Error("No credential returned");

      const assertion = {
        id: cred.id,
        rawId: bufferToBase64Url(cred.rawId),
        type: cred.type,
        response: {
          clientDataJSON: bufferToBase64Url(cred.response.clientDataJSON),
          authenticatorData: bufferToBase64Url(cred.response.authenticatorData),
          signature: bufferToBase64Url(cred.response.signature),
          userHandle: cred.response.userHandle ? bufferToBase64Url(cred.response.userHandle) : null,
        },
      };

      const verify = await postJson("/api/proxy/vault/webauthn/login/verify", assertion, "");
      if (!verify?.ok || !verify?.vault_token) throw new Error("Unlock failed");

      setVaultToken(verify.vault_token);
      setUnlocked(true);
      setStatus("Vault unlocked via biometrics.");
      await refreshStatus();
      await refreshKeys(verify.vault_token);
    } catch (e) {
      setStatus(`Unlock failed: ${String(e?.message || e)}`);
      setShowPinUnlock(true);
    } finally {
      setBusy(false);
    }
  }

  async function unlockWithPin(pin) {
    setBusy(true);
    try {
      const st = await getJson("/api/proxy/vault/status", "");
      if (!st?.enabled) throw new Error("Vault disabled on backend (Render).");
      if (!st?.pin_set) throw new Error("PIN not set yet. Use SET PIN first.");

      const out = await postJson("/api/proxy/vault/pin/unlock", { pin }, "");
      if (!out?.ok || !out?.vault_token) throw new Error("PIN unlock failed");
      setVaultToken(out.vault_token);
      setUnlocked(true);
      setStatus("Vault unlocked via PIN.");
      await refreshStatus();
      await refreshKeys(out.vault_token);
    } catch (e) {
      setStatus(`PIN unlock failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function setPin(pin) {
    setBusy(true);
    try {
      const st = await getJson("/api/proxy/vault/status", "");
      if (!st?.enabled) throw new Error("Vault disabled on backend (Render).");

      const out = await postJson("/api/proxy/vault/pin/set", { pin }, "");
      if (!out?.ok) throw new Error(out?.message || "PIN set failed");

      setStatus(out?.message || "PIN set.");
      setShowPinSet(false);
      await refreshStatus();
    } catch (e) {
      setStatus(`Set PIN failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function lockNow() {
    setBusy(true);
    try {
      if (vaultToken) {
        await postJson("/api/proxy/vault/lock", {}, vaultToken).catch(() => {});
      }
      setVaultToken("");
      setUnlocked(false);
      setStatus("Vault locked.");
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  }

  async function saveKeys() {
    setBusy(true);
    try {
      if (!vaultToken) throw new Error("Vault locked. Unlock first.");
      if (!apiKey.trim() || !apiSecret.trim()) throw new Error("Key + secret required.");

      const out = await postJson(
        "/api/proxy/vault/keys/save",
        {
          exchange,
          api_key: apiKey.trim(),
          api_secret: apiSecret.trim(),
          passphrase: passphrase.trim(),
        },
        vaultToken
      );

      setStatus(out?.message || "Saved.");
      setApiKey("");
      setApiSecret("");
      setPassphrase("");
      await refreshKeys(vaultToken);
    } catch (e) {
      setStatus(`Save failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function testKey(id) {
    setBusy(true);
    try {
      const out = await postJson("/api/proxy/vault/keys/test", { id }, vaultToken);
      setStatus(out?.message || "Test OK");
    } catch (e) {
      setStatus(`Test failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteKey(id) {
    setBusy(true);
    try {
      const out = await postJson("/api/proxy/vault/keys/delete", { id }, vaultToken);
      setStatus(out?.message || "Deleted.");
      await refreshKeys(vaultToken);
    } catch (e) {
      setStatus(`Delete failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
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
            <div className="pip-badge">{doorLabel === "OPEN" ? "SAFE OPEN" : doorLabel}</div>
          </div>
        </div>

        <div className="pip-links">
          <Link className="pip-link" href="/">
            HOME
          </Link>
          <Link className="pip-link" href="/candles">
            CANDLES
          </Link>
          <Link className="pip-link" href="/crypto">
            CRYPTO
          </Link>
          <Link className="pip-link active" href="/vault">
            VAULT
          </Link>
        </div>

        <div className="pip-content">
          <div className="pip-panel">
            <div className="pip-heading">VAULT SAFE</div>

            <SafeDoor
              stateLabel={doorLabel}
              statusText={
                status +
                `  |  endpoint: /api/proxy/vault/status` // tiny debug, helps confirm you're reading the right thing
              }
            />

            <div className="pip-links" style={{ marginTop: 10 }}>
              <button className="pip-link" type="button" onClick={unlockWithPasskey} disabled={busy || !vaultEnabled}>
                UNLOCK (BIOMETRICS)
              </button>

              <button
                className="pip-link"
                type="button"
                onClick={() => setShowPinUnlock((s) => !s)}
                disabled={busy || !vaultEnabled}
              >
                {showPinUnlock ? "HIDE PIN" : "USE PIN"}
              </button>

              <button
                className="pip-link"
                type="button"
                onClick={() => setShowPinSet((s) => !s)}
                disabled={busy || !vaultEnabled}
              >
                {showPinSet ? "CANCEL SET PIN" : "SET PIN"}
              </button>

              <button className="pip-link" type="button" onClick={lockNow} disabled={busy}>
                LOCK
              </button>

              <button className="pip-link" type="button" onClick={refreshStatus} disabled={busy}>
                REFRESH
              </button>
            </div>

            {showPinSet && (
              <div style={{ marginTop: 14 }}>
                <PinPad onSubmit={setPin} disabled={busy} title="SET NEW PIN (numbers only)" />
                <div className="pip-muted pip-footnote">
                  After setting PIN, hit REFRESH then USE PIN to unlock.
                </div>
              </div>
            )}

            {showPinUnlock && (
              <div style={{ marginTop: 14 }}>
                <PinPad onSubmit={unlockWithPin} disabled={busy} title="ENTER PIN TO UNLOCK" />
              </div>
            )}

            <div className="pip-muted pip-footnote" style={{ marginTop: 12 }}>
              Keys are stored encrypted on the server. Do NOT enable withdrawal permissions. Withdrawals remain only
              inside the exchange app.
            </div>
          </div>

          <div className="pip-panel" style={{ marginTop: 14 }}>
            <div className="pip-heading">KEY VAULT</div>

            {!vaultEnabled ? (
              <div className="pip-muted">
                Vault is disabled on backend. Your Render `/vault/status` must show `"enabled": true`.
              </div>
            ) : locked ? (
              <div className="pip-muted">Unlock the safe to add/manage keys.</div>
            ) : (
              <>
                <div className="pip-row" style={{ borderBottom: "none" }}>
                  <div className="pip-k">EXCHANGE</div>
                  <select
                    value={exchange}
                    onChange={(e) => setExchange(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(120,255,170,0.25)",
                      background: "rgba(0,0,0,0.35)",
                      color: "rgba(180,255,210,0.95)",
                      outline: "none",
                    }}
                  >
                    <option value="BINANCE">BINANCE</option>
                    <option value="BYBIT">BYBIT</option>
                    <option value="KRAKEN">KRAKEN</option>
                  </select>
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  <input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="API KEY"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(120,255,170,0.25)",
                      background: "rgba(0,0,0,0.35)",
                      color: "rgba(180,255,210,0.95)",
                      outline: "none",
                    }}
                  />
                  <input
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="API SECRET"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(120,255,170,0.25)",
                      background: "rgba(0,0,0,0.35)",
                      color: "rgba(180,255,210,0.95)",
                      outline: "none",
                    }}
                  />
                  <input
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="PASSPHRASE (optional)"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(120,255,170,0.25)",
                      background: "rgba(0,0,0,0.35)",
                      color: "rgba(180,255,210,0.95)",
                      outline: "none",
                    }}
                  />

                  <button className="pip-link" type="button" onClick={saveKeys} disabled={busy}>
                    SAVE (ENCRYPT)
                  </button>
                </div>

                <div className="pip-heading" style={{ marginTop: 18 }}>
                  STORED KEYS (MASKED)
                </div>

                {keysList.length === 0 ? (
                  <div className="pip-muted">No keys stored yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {keysList.map((k) => (
                      <div
                        key={k.id}
                        style={{
                          borderRadius: 12,
                          border: "1px solid rgba(120,255,170,0.18)",
                          background: "rgba(0,0,0,0.25)",
                          padding: 10,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ fontWeight: 800, letterSpacing: 2 }} className="wrap-anywhere">
                            {k.exchange} • {k.key_hint}
                          </div>
                          <div className="pip-muted wrap-anywhere" style={{ fontSize: 12 }}>
                            {k.created_time_utc || ""}
                          </div>
                        </div>

                        <div className="pip-links" style={{ marginTop: 8 }}>
                          <button className="pip-link" type="button" onClick={() => testKey(k.id)} disabled={busy}>
                            TEST
                          </button>
                          <button className="pip-link" type="button" onClick={() => deleteKey(k.id)} disabled={busy}>
                            DELETE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
