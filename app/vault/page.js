// app/vault/page.js
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/**
 * This Vault page matches the Flask backend routes:
 * GET    /vault/status
 * POST   /vault/pin/set
 * POST   /vault/unlock
 * POST   /vault/lock
 * GET    /vault/keys
 * POST   /vault/keys/add
 * DELETE /vault/keys/delete/<id>
 *
 * Via Vercel proxy:
 * /api/proxy/<path...>
 */

// --------------------- helpers ---------------------
async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    cache: "no-store",
    ...opts,
    headers: {
      accept: "application/json",
      ...(opts.headers || {}),
    },
  });

  const txt = await res.text().catch(() => "");
  let data = {};
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    data = { raw: txt };
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

async function postJson(url, body) {
  return fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
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
              letterSpacing: 1.2,
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

function PinPad({ label, onSubmit, disabled }) {
  const [pin, setPin] = useState("");

  function press(n) {
    if (disabled) return;
    if (pin.length >= 12) return;
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

  // Enter key support (for desktops)
  useEffect(() => {
    function onKey(e) {
      if (disabled) return;
      if (e.key === "Enter") submit();
      if (e.key === "Backspace") del();
      if (/^\d$/.test(e.key)) press(e.key);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, disabled]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="pip-muted" style={{ marginBottom: 2 }}>
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
          ↵
        </button>
      </div>
    </div>
  );
}

export default function VaultPage() {
  const [statusText, setStatusText] = useState("Vault ready.");
  const [busy, setBusy] = useState(false);

  // backend status
  const [enabled, setEnabled] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [expires, setExpires] = useState(0);
  const [ttlSec, setTtlSec] = useState(300);

  // ui mode
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
    const pinTxt = pinSet ? "PIN SET" : "PIN NOT SET";
    const mode = "PAPER (live locked)";
    return `Vault · ${mode} · ${locked ? "LOCKED" : "OPEN"} · ${pinTxt}`;
  }, [locked, pinSet]);

  async function refreshStatus() {
    try {
      const s = await fetchJson("/api/proxy/vault/status");
      setEnabled(!!s.enabled);
      setPinSet(!!s.pin_set);
      setUnlocked(!!s.unlocked);
      setExpires(Number(s.expires || 0));
      setTtlSec(Number(s.ttl_sec || 300));

      if (!s.enabled) {
        setStatusText("Vault not configured. Set VAULT_MASTER_KEY on Render.");
      } else if (!s.pin_set) {
        setStatusText("Vault ready. Set a PIN to enable unlock.");
      } else if (!s.unlocked) {
        setStatusText("Safe locked. Enter PIN to unlock.");
      } else {
        setStatusText("Safe unlocked.");
      }
    } catch (e) {
      setStatusText(`Status error: ${String(e?.message || e)}`);
    }
  }

  async function refreshKeys() {
    try {
      const out = await fetchJson("/api/proxy/vault/keys");
      setKeysList(out?.keys || []);
    } catch (e) {
      // if locked, backend returns 401 vault_locked
      const msg = String(e?.message || e);
      if (msg.includes("vault_locked")) {
        setKeysList([]);
      } else {
        setStatusText(`Keys error: ${msg}`);
      }
    }
  }

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When unlocked changes, refresh keys
  useEffect(() => {
    if (unlocked) refreshKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  async function setPin(pin) {
    setBusy(true);
    try {
      const out = await postJson("/api/proxy/vault/pin/set", { pin });
      if (!out?.ok) throw new Error("Set PIN failed");
      setStatusText("PIN set. Safe unlocked.");
      await refreshStatus();
      setShowPinSet(false);
      setShowPinUnlock(false);
      await refreshKeys();
    } catch (e) {
      setStatusText(`Set PIN failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function unlockWithPin(pin) {
    setBusy(true);
    try {
      const out = await postJson("/api/proxy/vault/unlock", { pin });
      if (!out?.ok) throw new Error("Unlock failed");
      setStatusText("Safe unlocked via PIN.");
      await refreshStatus();
      setShowPinUnlock(false);
      await refreshKeys();
    } catch (e) {
      setStatusText(`PIN unlock failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function lockNow() {
    setBusy(true);
    try {
      await postJson("/api/proxy/vault/lock", {});
      setStatusText("Safe locked.");
      await refreshStatus();
      setKeysList([]);
    } catch (e) {
      setStatusText(`Lock failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function saveKeys() {
    setBusy(true);
    try {
      if (!unlocked) throw new Error("Vault locked.");
      if (!apiKey.trim() || !apiSecret.trim()) throw new Error("API key + secret required.");

      const out = await postJson("/api/proxy/vault/keys/add", {
        exchange,
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        passphrase: passphrase.trim(),
      });

      if (!out?.ok) throw new Error("Save failed");
      setStatusText("Saved encrypted key.");
      setApiKey("");
      setApiSecret("");
      setPassphrase("");
      await refreshKeys();
    } catch (e) {
      setStatusText(`Save failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteKey(id) {
    setBusy(true);
    try {
      if (!unlocked) throw new Error("Vault locked.");
      const out = await fetchJson(`/api/proxy/vault/keys/delete/${id}`, { method: "DELETE" });
      if (!out?.ok) throw new Error("Delete failed");
      setStatusText("Deleted.");
      await refreshKeys();
    } catch (e) {
      setStatusText(`Delete failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  const expiresText = useMemo(() => {
    if (!expires) return "";
    const now = Math.floor(Date.now() / 1000);
    const left = expires - now;
    if (left <= 0) return "Session expired.";
    return `Session TTL: ~${left}s (max ${ttlSec}s)`;
  }, [expires, ttlSec]);

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
          {/* SAFE PANEL */}
          <div className="pip-panel">
            <div className="pip-heading">VAULT SAFE</div>

            <SafeDoor locked={locked} statusText={statusText} />

            <div className="pip-links" style={{ marginTop: 10 }}>
              <button
                className="pip-link"
                type="button"
                onClick={() => {
                  setShowPinUnlock((s) => !s);
                  setShowPinSet(false);
                }}
                disabled={busy || !enabled || !pinSet}
                title={!pinSet ? "Set a PIN first" : ""}
              >
                {showPinUnlock ? "HIDE PIN" : "USE PIN"}
              </button>

              <button
                className="pip-link"
                type="button"
                onClick={() => {
                  setShowPinSet((s) => !s);
                  setShowPinUnlock(false);
                }}
                disabled={busy || !enabled}
              >
                {showPinSet ? "HIDE SET PIN" : "SET PIN"}
              </button>

              <button className="pip-link" type="button" onClick={lockNow} disabled={busy || !enabled}>
                LOCK
              </button>

              <button className="pip-link" type="button" onClick={() => refreshStatus()} disabled={busy}>
                REFRESH
              </button>
            </div>

            {expiresText ? (
              <div className="pip-muted" style={{ marginTop: 10 }}>
                {expiresText}
              </div>
            ) : null}

            {!enabled ? (
              <div className="pip-muted pip-footnote" style={{ marginTop: 12 }}>
                Vault is disabled because <b>VAULT_MASTER_KEY</b> is not set (or Vercel proxy is not pointing to the
                correct Render service).
              </div>
            ) : (
              <div className="pip-muted pip-footnote" style={{ marginTop: 12 }}>
                Keys are stored encrypted on the server. Do NOT enable withdrawal permissions. Withdrawals remain only
                inside the exchange app.
              </div>
            )}

            {showPinSet && enabled && (
              <div style={{ marginTop: 14 }}>
                <PinPad label="SET PIN (4–12 digits)" onSubmit={setPin} disabled={busy} />
              </div>
            )}

            {showPinUnlock && enabled && pinSet && (
              <div style={{ marginTop: 14 }}>
                <PinPad label="UNLOCK WITH PIN" onSubmit={unlockWithPin} disabled={busy} />
              </div>
            )}
          </div>

          {/* KEY VAULT PANEL */}
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
                      maxWidth: "100%",
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

                  <button className="pip-link" type="button" onClick={refreshKeys} disabled={busy}>
                    REFRESH KEYS
                  </button>
                </div>

                <div className="pip-heading" style={{ marginTop: 18 }}>
                  STORED KEYS (MASKED)
                </div>

                {keysList.length === 0 ? (
                  <div className="pip-muted">No keys stored yet (or you are locked).</div>
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
                          <div style={{ fontWeight: 900, letterSpacing: 2, overflowWrap: "anywhere" }}>
                            {k.exchange} • {k.api_key_masked}
                          </div>
                          <div className="pip-muted" style={{ fontSize: 12, overflowWrap: "anywhere" }}>
                            {k.created || ""}
                          </div>
                        </div>

                        <div className="pip-muted" style={{ fontSize: 12, marginTop: 6 }}>
                          secret: {k.has_secret ? "yes" : "no"} • passphrase: {k.has_passphrase ? "yes" : "no"}
                        </div>

                        <div className="pip-links" style={{ marginTop: 8 }}>
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
