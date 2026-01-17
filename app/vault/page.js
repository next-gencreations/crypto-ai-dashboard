// app/vault/page.js
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// ---------- helpers ----------
async function fetchJson(url, opts) {
  const res = await fetch(url, {
    cache: "no-store",
    ...opts,
    headers: {
      accept: "application/json",
      ...(opts?.headers || {}),
    },
  });

  const txt = await res.text().catch(() => "");
  let data = null;
  try {
    data = txt ? JSON.parse(txt) : null;
  } catch {
    data = { raw: txt };
  }

  if (!res.ok) {
    const errMsg = (data && (data.error || data.message)) ? (data.error || data.message) : `HTTP ${res.status}`;
    throw new Error(errMsg);
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
          overflow: "hidden",
        }}
      >
        {/* header row (fixes LOCKED clipping on mobile) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            letterSpacing: 2,
            fontSize: 12,
          }}
        >
          <span>VAULT SAFE</span>
          <span style={{ opacity: 0.85, whiteSpace: "nowrap" }}>
            {locked ? "LOCKED" : "OPEN"}
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

function PinPad({ onSubmit, disabled, submitLabel = "ENTER" }) {
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
        <div style={{ display: "flex", gap: 8 }}>
          <button className="pip-link" type="button" onClick={del} disabled={disabled}>
            ⌫
          </button>
          <button className="pip-link" type="button" onClick={clear} disabled={disabled}>
            C
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
        <button
          type="button"
          className="pip-link"
          onClick={() => press(0)}
          disabled={disabled}
          style={{ padding: "14px 0" }}
        >
          0
        </button>
        <button
          type="button"
          className="pip-link"
          onClick={submit}
          disabled={disabled}
          style={{ padding: "14px 0", gridColumn: "span 2" }}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

export default function VaultPage() {
  const [statusText, setStatusText] = useState("Vault ready.");
  const [busy, setBusy] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [locked, setLocked] = useState(true);

  const [mode, setMode] = useState("unlock"); // "unlock" | "setpin"

  // key form
  const [exchange, setExchange] = useState("BINANCE");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [keysList, setKeysList] = useState([]);

  const subtitle = useMemo(() => {
    return `Vault · ${locked ? "LOCKED" : "OPEN"} · ${pinSet ? "PIN SET" : "PIN NOT SET"}`;
  }, [locked, pinSet]);

  async function refreshStatus() {
    try {
      const s = await fetchJson("/api/proxy/vault/status", { method: "GET" });
      setEnabled(!!s?.enabled);
      setPinSet(!!s?.pin_set);
      setLocked(!s?.unlocked);

      if (!s?.enabled) {
        setStatusText("Vault not configured. Set VAULT_MASTER_KEY on Render.");
        setMode("unlock");
        return;
      }

      if (!s?.pin_set) {
        setStatusText("No PIN set yet. Create a PIN to arm the safe.");
        setMode("setpin");
      } else if (s?.unlocked) {
        setStatusText("Vault is open.");
        setMode("unlock");
      } else {
        setStatusText("Vault locked. Enter PIN to unlock.");
        setMode("unlock");
      }
    } catch (e) {
      setStatusText(`Status failed: ${String(e?.message || e)}`);
    }
  }

  async function refreshKeys() {
    if (locked) return;
    try {
      const out = await fetchJson("/api/proxy/vault/keys", { method: "GET" });
      setKeysList(out?.keys || []);
    } catch (e) {
      setStatusText(`Keys fetch failed: ${String(e?.message || e)}`);
    }
  }

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!locked) refreshKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  async function setPin(pin) {
    setBusy(true);
    try {
      const out = await fetchJson("/api/proxy/vault/pin/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      setStatusText(out?.ok ? "PIN set. Vault unlocked." : "PIN set.");
      await refreshStatus();
      await refreshKeys();
    } catch (e) {
      setStatusText(`Set PIN failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function unlock(pin) {
    setBusy(true);
    try {
      const out = await fetchJson("/api/proxy/vault/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      setStatusText(out?.ok ? "Vault unlocked." : "Unlocked.");
      await refreshStatus();
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
      await fetchJson("/api/proxy/vault/lock", { method: "POST" });
      setStatusText("Vault locked.");
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
      if (locked) throw new Error("Vault locked.");
      if (!apiKey.trim() || !apiSecret.trim()) throw new Error("API key + secret required.");

      const out = await fetchJson("/api/proxy/vault/keys/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange,
          api_key: apiKey.trim(),
          api_secret: apiSecret.trim(),
          passphrase: passphrase.trim(),
        }),
      });

      setStatusText(out?.ok ? "Key saved (encrypted)." : "Saved.");
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
      if (locked) throw new Error("Vault locked.");
      const out = await fetchJson(`/api/proxy/vault/keys/delete/${id}`, { method: "DELETE" });
      setStatusText(out?.ok ? "Key deleted." : "Deleted.");
      await refreshKeys();
    } catch (e) {
      setStatusText(`Delete failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  function biometricsClicked() {
    // Backend is PIN-only right now
    setStatusText("Biometrics not enabled on server. Use PIN.");
    setMode(pinSet ? "unlock" : "setpin");
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

            <SafeDoor locked={locked} statusText={statusText} />

            <div className="pip-links" style={{ marginTop: 10 }}>
              <button className="pip-link" type="button" onClick={biometricsClicked} disabled={busy}>
                UNLOCK (BIOMETRICS)
              </button>
              <button
                className="pip-link"
                type="button"
                onClick={() => setMode((m) => (m === "setpin" ? "unlock" : "setpin"))}
                disabled={busy || !enabled}
              >
                {mode === "setpin" ? "USE UNLOCK" : "SET PIN"}
              </button>
              <button className="pip-link" type="button" onClick={lockNow} disabled={busy || !enabled}>
                LOCK
              </button>
              <button className="pip-link" type="button" onClick={refreshStatus} disabled={busy}>
                REFRESH
              </button>
            </div>

            {!enabled ? (
              <div className="pip-muted" style={{ marginTop: 14 }}>
                Vault is disabled because <b>VAULT_MASTER_KEY</b> is not set on Render.
              </div>
            ) : (
              <div style={{ marginTop: 14 }}>
                {mode === "setpin" ? (
                  <>
                    <div className="pip-muted" style={{ marginBottom: 8 }}>
                      CREATE PIN (4–12 digits)
                    </div>
                    <PinPad onSubmit={setPin} disabled={busy} submitLabel="SET PIN" />
                  </>
                ) : (
                  <>
                    <div className="pip-muted" style={{ marginBottom: 8 }}>
                      ENTER PIN TO UNLOCK
                    </div>
                    <PinPad onSubmit={unlock} disabled={busy} submitLabel="UNLOCK" />
                  </>
                )}
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
                            {k.exchange} • {k.api_key_masked}
                          </div>
                          <div className="pip-muted" style={{ fontSize: 12 }}>
                            {k.created || ""}
                          </div>
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
