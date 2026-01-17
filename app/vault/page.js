// app/vault/page.js
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

// ---------- helpers ----------
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

function SafeDoor({ locked, statusText }) {
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
        <div style={{ display: "flex", justifyContent: "space-between", letterSpacing: 3, fontSize: 13 }}>
          <span>VAULT SAFE</span>
          <span style={{ opacity: 0.85 }}>{locked ? "LOCKED" : "OPEN"}</span>
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
              {locked ? "🔒" : "✅"}
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
            }}
          >
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
}

function PinPad({ onSubmit, disabled }) {
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
    await onSubmit(pin);
    setPin("");
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
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
        {[1,2,3,4,5,6,7,8,9].map((n) => (
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
          ↵
        </button>
      </div>
    </div>
  );
}

export default function VaultPage() {
  const [status, setStatus] = useState("Vault ready.");
  const [locked, setLocked] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // memory-only token (never localStorage)
  const [vaultToken, setVaultToken] = useState("");

  // key form
  const [exchange, setExchange] = useState("BINANCE");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [keysList, setKeysList] = useState([]);

  const subtitle = useMemo(() => {
    return `Vault · Mode: PAPER (live locked) · ${locked ? "LOCKED" : "OPEN"}`;
  }, [locked]);

  async function refreshKeys(token) {
    const t = token || vaultToken;
    if (!t) return;
    const out = await postJson("/api/proxy/vault/keys/list", {}, t);
    setKeysList(out?.keys || []);
  }

  async function unlockWithPasskey() {
    setBusy(true);
    try {
      if (!window.PublicKeyCredential) {
        setStatus("Passkeys not supported here. Use PIN.");
        setShowPin(true);
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
      setLocked(false);
      setStatus("Vault unlocked via biometrics.");
      await refreshKeys(verify.vault_token);
    } catch (e) {
      setStatus(`Unlock failed: ${String(e?.message || e)}`);
      setShowPin(true);
    } finally {
      setBusy(false);
    }
  }

  async function unlockWithPin(pin) {
    setBusy(true);
    try {
      const out = await postJson("/api/proxy/vault/pin/unlock", { pin }, "");
      if (!out?.ok || !out?.vault_token) throw new Error("PIN unlock failed");
      setVaultToken(out.vault_token);
      setLocked(false);
      setStatus("Vault unlocked via PIN.");
      await refreshKeys(out.vault_token);
    } catch (e) {
      setStatus(`PIN unlock failed: ${String(e?.message || e)}`);
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
      setLocked(true);
      setStatus("Vault locked.");
    } finally {
      setBusy(false);
    }
  }

  async function saveKeys() {
    setBusy(true);
    try {
      if (!vaultToken) throw new Error("Vault locked.");
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
            <SafeDoor locked={locked} statusText={status} />

            <div className="pip-links" style={{ marginTop: 10 }}>
              <button className="pip-link" type="button" onClick={unlockWithPasskey} disabled={busy || !locked}>
                UNLOCK (BIOMETRICS)
              </button>
              <button className="pip-link" type="button" onClick={() => setShowPin((s) => !s)} disabled={busy}>
                {showPin ? "HIDE PIN" : "USE PIN"}
              </button>
              <button className="pip-link" type="button" onClick={lockNow} disabled={busy}>
                LOCK
              </button>
            </div>

            {showPin && (
              <div style={{ marginTop: 14 }}>
                <div className="pip-muted" style={{ marginBottom: 8 }}>
                  PIN FALLBACK
                </div>
                <PinPad onSubmit={unlockWithPin} disabled={busy} />
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
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ fontWeight: 800, letterSpacing: 2 }}>
                            {k.exchange} • {k.key_hint}
                          </div>
                          <div className="pip-muted" style={{ fontSize: 12 }}>
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
