"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Vault Safe Page (Option A)
 * - Passkeys (WebAuthn) unlock + PIN fallback
 * - Shows Add/Rotate Keys form only when unlocked
 *
 * Backend endpoints expected (we will add these to Flask next):
 *  POST  /vault/status
 *  POST  /vault/webauthn/login/options
 *  POST  /vault/webauthn/login/verify
 *  POST  /vault/pin/unlock
 *  POST  /vault/keys/save
 *  POST  /vault/keys/list
 *  POST  /vault/keys/delete
 *  POST  /vault/keys/test
 *
 * Auth model (simple v1):
 * - backend issues a short-lived vault_unlock_token
 * - frontend stores it in memory only (not localStorage)
 */

function apiBase() {
  // Set NEXT_PUBLIC_API_BASE in Vercel if you want, otherwise hardcode your Render URL here.
  return (
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    ""
  ).replace(/\/$/, "");
}

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

async function postJSON(path, body, token) {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Vault-Token": token } : {}),
    },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function TopTabs({ current = "VAULT" }) {
  const tabs = [
    ["HOME", "/"],
    ["CANDLES", "/candles"],
    ["CRYPTO", "/crypto"],
    ["STATUS", "/status"],
    ["DATA", "/data"],
    ["LOG", "/log"],
    ["VAULT", "/vault"],
  ];
  return (
    <div style={{ display: "flex", gap: 10, padding: 14, flexWrap: "wrap" }}>
      {tabs.map(([label, href]) => {
        const active = label === current;
        return (
          <a
            key={label}
            href={href}
            style={{
              padding: "10px 16px",
              borderRadius: 14,
              textDecoration: "none",
              color: "#77ff9a",
              border: active ? "1px solid #77ff9a" : "1px solid rgba(119,255,154,.25)",
              background: active ? "rgba(119,255,154,.08)" : "rgba(0,0,0,.15)",
              boxShadow: active ? "0 0 12px rgba(119,255,154,.25)" : "none",
              letterSpacing: 1.5,
              fontWeight: 700,
            }}
          >
            {label}
          </a>
        );
      })}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div
      style={{
        margin: "0 14px 14px",
        borderRadius: 18,
        border: "1px solid rgba(119,255,154,.18)",
        background: "rgba(0,0,0,.25)",
        padding: 16,
        boxShadow: "inset 0 0 24px rgba(0,0,0,.35)",
      }}
    >
      <div
        style={{
          fontSize: 22,
          letterSpacing: 4,
          fontWeight: 800,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function SafeDoor({ locked, statusText }) {
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
    >
      <div
        style={{
          width: "min(520px, 92vw)",
          borderRadius: 22,
          border: "1px solid rgba(119,255,154,.22)",
          background:
            "radial-gradient(circle at 50% 35%, rgba(119,255,154,.10), rgba(0,0,0,.45) 60%, rgba(0,0,0,.65))",
          boxShadow:
            "0 0 28px rgba(0,0,0,.6), inset 0 0 40px rgba(0,0,0,.45)",
          padding: 18,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontSize: 14,
            opacity: 0.9,
            letterSpacing: 3,
            marginBottom: 10,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>VAULT COMPANION • SAFE</span>
          <span style={{ opacity: 0.8 }}>{locked ? "LOCKED" : "OPEN"}</span>
        </div>

        <div
          style={{
            height: 240,
            borderRadius: 18,
            border: "1px solid rgba(119,255,154,.18)",
            background: "rgba(0,0,0,.35)",
            display: "grid",
            placeItems: "center",
            position: "relative",
          }}
        >
          {/* Dial */}
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              border: "1px solid rgba(119,255,154,.30)",
              background: "rgba(0,0,0,.35)",
              boxShadow: "0 0 18px rgba(119,255,154,.18)",
              transform: locked ? "rotate(0deg)" : "rotate(28deg)",
              transition: "transform 600ms ease",
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                border: "1px solid rgba(119,255,154,.25)",
                background: "rgba(0,0,0,.35)",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                letterSpacing: 2,
              }}
            >
              {locked ? "🔒" : "✅"}
            </div>
          </div>

          {/* Status */}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              right: 16,
              borderRadius: 12,
              border: "1px solid rgba(119,255,154,.18)",
              background: "rgba(0,0,0,.35)",
              padding: "10px 12px",
              fontSize: 13,
              letterSpacing: 1.5,
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

  const dots = useMemo(() => "•".repeat(pin.length), [pin]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          border: "1px solid rgba(119,255,154,.18)",
          background: "rgba(0,0,0,.25)",
          borderRadius: 14,
          padding: "12px 14px",
          letterSpacing: 6,
          fontSize: 18,
          minHeight: 46,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>{dots}</span>
        <button
          onClick={del}
          style={btnSmall}
          type="button"
          aria-label="Delete"
        >
          ⌫
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[1,2,3,4,5,6,7,8,9].map((n) => (
          <button key={n} onClick={() => press(n)} style={btnKey} type="button">
            {n}
          </button>
        ))}
        <button onClick={clear} style={btnKey} type="button">C</button>
        <button onClick={() => press(0)} style={btnKey} type="button">0</button>
        <button onClick={submit} style={btnKey} type="button">↵</button>
      </div>
    </div>
  );
}

const btnKey = {
  padding: "14px 0",
  borderRadius: 14,
  border: "1px solid rgba(119,255,154,.22)",
  background: "rgba(0,0,0,.25)",
  color: "#77ff9a",
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: 2,
};

const btnSmall = {
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid rgba(119,255,154,.22)",
  background: "rgba(0,0,0,.25)",
  color: "#77ff9a",
  fontSize: 14,
};

const btnMain = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(119,255,154,.28)",
  background: "rgba(119,255,154,.08)",
  color: "#77ff9a",
  fontWeight: 800,
  letterSpacing: 2,
  cursor: "pointer",
};

export default function VaultPage() {
  const [status, setStatus] = useState("Checking vault status…");
  const [locked, setLocked] = useState(true);
  const [vaultToken, setVaultToken] = useState(""); // memory only
  const [showPin, setShowPin] = useState(false);
  const [busy, setBusy] = useState(false);

  // key form
  const [exchange, setExchange] = useState("BINANCE");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [keysList, setKeysList] = useState([]);

  async function refreshStatus(token) {
    const data = await postJSON("/vault/status", {}, token || vaultToken || "");
    setLocked(!data?.unlocked);
    setStatus(data?.message || (data?.unlocked ? "Vault unlocked." : "Vault locked."));
    if (data?.unlocked && data?.vault_token) {
      setVaultToken(data.vault_token);
    }
  }

  async function refreshKeys(token) {
    const t = token || vaultToken;
    if (!t) return;
    const data = await postJSON("/vault/keys/list", {}, t);
    setKeysList(data?.keys || []);
  }

  useEffect(() => {
    // initial
    (async () => {
      try {
        await refreshStatus("");
      } catch (e) {
        setStatus(`Vault offline / API not reachable: ${e.message}`);
        setLocked(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unlockWithPasskey() {
    setBusy(true);
    try {
      if (!window.PublicKeyCredential) {
        setStatus("Passkeys not supported on this device/browser. Use PIN.");
        setShowPin(true);
        return;
      }

      // 1) get options from backend
      const opts = await postJSON("/vault/webauthn/login/options", {}, "");
      const pub = opts?.publicKey;
      if (!pub?.challenge) throw new Error("Missing WebAuthn challenge");

      // 2) convert fields to ArrayBuffer
      const publicKey = {
        ...pub,
        challenge: base64UrlToBuffer(pub.challenge),
        allowCredentials: (pub.allowCredentials || []).map((c) => ({
          ...c,
          id: base64UrlToBuffer(c.id),
        })),
      };

      // 3) browser prompt (FaceID/Fingerprint)
      const cred = await navigator.credentials.get({ publicKey });
      if (!cred) throw new Error("No credential returned");

      // 4) send assertion to backend
      const assertion = {
        id: cred.id,
        rawId: bufferToBase64Url(cred.rawId),
        type: cred.type,
        response: {
          clientDataJSON: bufferToBase64Url(cred.response.clientDataJSON),
          authenticatorData: bufferToBase64Url(cred.response.authenticatorData),
          signature: bufferToBase64Url(cred.response.signature),
          userHandle: cred.response.userHandle
            ? bufferToBase64Url(cred.response.userHandle)
            : null,
        },
      };

      const verify = await postJSON("/vault/webauthn/login/verify", assertion, "");
      if (!verify?.ok || !verify?.vault_token) throw new Error("Unlock failed");

      setVaultToken(verify.vault_token);
      setLocked(false);
      setStatus("Vault unlocked via Passkey.");
      await refreshKeys(verify.vault_token);
    } catch (e) {
      setStatus(`Unlock failed: ${e.message}`);
      setShowPin(true);
    } finally {
      setBusy(false);
    }
  }

  async function unlockWithPin(pin) {
    setBusy(true);
    try {
      const out = await postJSON("/vault/pin/unlock", { pin }, "");
      if (!out?.ok || !out?.vault_token) throw new Error("PIN unlock failed");
      setVaultToken(out.vault_token);
      setLocked(false);
      setStatus("Vault unlocked via PIN.");
      await refreshKeys(out.vault_token);
    } catch (e) {
      setStatus(`PIN unlock failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function saveKeys() {
    setBusy(true);
    try {
      if (!vaultToken) throw new Error("Vault locked.");
      if (!apiKey.trim() || !apiSecret.trim()) throw new Error("Key + secret required.");

      const payload = {
        exchange,
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        passphrase: passphrase.trim(),
      };

      const out = await postJSON("/vault/keys/save", payload, vaultToken);
      setStatus(out?.message || "Saved.");
      setApiKey("");
      setApiSecret("");
      setPassphrase("");
      await refreshKeys(vaultToken);
    } catch (e) {
      setStatus(`Save failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function testKey(id) {
    setBusy(true);
    try {
      const out = await postJSON("/vault/keys/test", { id }, vaultToken);
      setStatus(out?.message || "Test OK");
    } catch (e) {
      setStatus(`Test failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteKey(id) {
    setBusy(true);
    try {
      const out = await postJSON("/vault/keys/delete", { id }, vaultToken);
      setStatus(out?.message || "Deleted.");
      await refreshKeys(vaultToken);
    } catch (e) {
      setStatus(`Delete failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function lockNow() {
    setBusy(true);
    try {
      if (vaultToken) {
        await postJSON("/vault/lock", {}, vaultToken).catch(() => {});
      }
      setVaultToken("");
      setLocked(true);
      setStatus("Vault locked.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <TopTabs current="VAULT" />

      <SafeDoor locked={locked} statusText={status} />

      <Panel title="VAULT ACCESS">
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={unlockWithPasskey} style={btnMain} disabled={busy || !locked} type="button">
              UNLOCK WITH BIOMETRICS
            </button>
            <button
              onClick={() => setShowPin((s) => !s)}
              style={{ ...btnMain, background: "rgba(0,0,0,.25)" }}
              disabled={busy}
              type="button"
            >
              {showPin ? "HIDE PIN" : "USE PIN"}
            </button>
            <button
              onClick={lockNow}
              style={{ ...btnMain, background: "rgba(0,0,0,.25)" }}
              disabled={busy}
              type="button"
            >
              LOCK
            </button>
          </div>

          {showPin && (
            <div>
              <div style={{ opacity: 0.9, marginBottom: 8, letterSpacing: 2 }}>
                PIN FALLBACK
              </div>
              <PinPad onSubmit={unlockWithPin} disabled={busy} />
            </div>
          )}

          <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
            <div>• Keys are encrypted on the server (never stored in the browser).</div>
            <div>• Withdrawals are not supported by this system; withdraw via the exchange app only.</div>
            <div>• Trading mode stays PAPER by default (live remains locked).</div>
          </div>
        </div>
      </Panel>

      <Panel title="KEYS VAULT">
        {locked ? (
          <div style={{ opacity: 0.9, letterSpacing: 1.5 }}>
            Vault is locked. Unlock to add or manage keys.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                display: "grid",
                gap: 10,
                borderRadius: 14,
                border: "1px solid rgba(119,255,154,.18)",
                background: "rgba(0,0,0,.20)",
                padding: 12,
              }}
            >
              <div style={{ letterSpacing: 2, fontWeight: 800 }}>ADD / ROTATE EXCHANGE KEYS</div>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ opacity: 0.9 }}>Exchange</span>
                <select
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  style={input}
                >
                  <option value="BINANCE">BINANCE</option>
                  <option value="BYBIT">BYBIT</option>
                  <option value="KRAKEN">KRAKEN</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ opacity: 0.9 }}>API Key</span>
                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={input}
                  placeholder="Paste API key"
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ opacity: 0.9 }}>API Secret</span>
                <input
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  style={input}
                  placeholder="Paste API secret"
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ opacity: 0.9 }}>Passphrase (if exchange requires)</span>
                <input
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  style={input}
                  placeholder="Optional"
                />
              </label>

              <button onClick={saveKeys} style={btnMain} disabled={busy} type="button">
                SAVE (ENCRYPT & STORE)
              </button>

              <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>
                Use keys with <b>Trade + Read only</b>. Do <b>NOT</b> enable withdrawals.
              </div>
            </div>

            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(119,255,154,.18)",
                background: "rgba(0,0,0,.20)",
                padding: 12,
              }}
            >
              <div style={{ letterSpacing: 2, fontWeight: 800, marginBottom: 10 }}>
                STORED KEYS (MASKED)
              </div>

              {keysList.length === 0 ? (
                <div style={{ opacity: 0.9 }}>No keys stored yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {keysList.map((k) => (
                    <div
                      key={k.id}
                      style={{
                        display: "grid",
                        gap: 8,
                        borderRadius: 12,
                        border: "1px solid rgba(119,255,154,.14)",
                        background: "rgba(0,0,0,.25)",
                        padding: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 800, letterSpacing: 2 }}>
                          {k.exchange} • {k.key_hint}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.85 }}>
                          added {k.created_time_utc || ""}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          onClick={() => testKey(k.id)}
                          style={{ ...btnSmall, padding: "10px 12px" }}
                          disabled={busy}
                          type="button"
                        >
                          TEST
                        </button>
                        <button
                          onClick={() => deleteKey(k.id)}
                          style={{ ...btnSmall, padding: "10px 12px" }}
                          disabled={busy}
                          type="button"
                        >
                          DELETE
                        </button>
                      </div>

                      {k.note ? (
                        <div style={{ fontSize: 12, opacity: 0.85 }}>{k.note}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

const input = {
  padding: "12px 12px",
  borderRadius: 14,
  border: "1px solid rgba(119,255,154,.20)",
  background: "rgba(0,0,0,.25)",
  color: "#77ff9a",
  outline: "none",
};
