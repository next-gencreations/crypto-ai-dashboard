// app/vault/page.js
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// ---------- helpers ----------
async function fetchJson(url) {
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  const txt = await res.text().catch(() => "");
  let data = {};
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    // ignore
  }
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
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
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

async function delJson(url) {
  const res = await fetch(url, {
    method: "DELETE",
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  const txt = await res.text().catch(() => "");
  let data = {};
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    // ignore
  }
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
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
        {/* header row - fixed wrapping so LOCKED never goes offscreen */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            letterSpacing: 3,
            fontSize: 13,
          }}
        >
          <span style={{ minWidth: 120 }}>VAULT SAFE</span>
          <span
            style={{
              opacity: 0.85,
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
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
              letterSpacing: 1.3,
              opacity: 0.95,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={statusText}
          >
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
}

function PinPad({ onSubmit, disabled, modeLabel = "ENTER PIN" }) {
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
    if (!pin || pin.length < 4) return;
    await onSubmit(pin);
    setPin("");
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="pip-muted" style={{ marginBottom: 2 }}>
        {modeLabel}
      </div>

      {/* also allow typing pin (mobile keyboard "Done" submits) */}
      <input
        value={pin}
        onChange={(e) => setPin(String(e.target.value || "").replace(/\D/g, "").slice(0, 12))}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="••••"
        style={{
          padding: "12px 12px",
          borderRadius: 12,
          border: "1px solid rgba(120,255,170,0.18)",
          background: "rgba(0,0,0,0.35)",
          color: "rgba(180,255,210,0.95)",
          outline: "none",
          letterSpacing: 10,
          fontSize: 16,
          textAlign: "center",
        }}
        disabled={disabled}
      />

      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
        <button className="pip-link" type="button" onClick={del} disabled={disabled}>
          ⌫ BACK
        </button>
        <button className="pip-link" type="button" onClick={clear} disabled={disabled}>
          CLEAR
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
        <button type="button" className="pip-link" onClick={() => press(0)} disabled={disabled} style={{ padding: "14px 0" }}>
          0
        </button>
        <button type="button" className="pip-link" onClick={submit} disabled={disabled} style={{ padding: "14px 0" }}>
          ↵
        </button>
      </div>

      {/* big obvious enter button */}
      <button
        className="pip-link"
        type="button"
        onClick={submit}
        disabled={disabled || pin.length < 4}
        style={{ padding: "14px 0", opacity: disabled || pin.length < 4 ? 0.6 : 1 }}
      >
        ENTER
      </button>

      <div className="pip-muted" style={{ fontSize: 12 }}>
        PIN must be 4–12 digits.
      </div>
    </div>
  );
}

export default function VaultPage() {
  const [status, setStatus] = useState("Vault ready.");
  const [locked, setLocked] = useState(true);
  const [busy, setBusy] = useState(false);

  const [pinSet, setPinSet] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [mode, setMode] = useState("unlock"); // "unlock" | "setpin"

  // key form
  const [exchange, setExchange] = useState("BINANCE");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [keysList, setKeysList] = useState([]);

  const subtitle = useMemo(() => {
    return `Vault · Mode: PAPER (live locked) · ${locked ? "LOCKED" : "OPEN"}`;
  }, [locked]);

  async function refreshStatus() {
    const s = await fetchJson("/api/proxy/vault/status");
    const isUnlocked = !!s?.unlocked;
    setLocked(!isUnlocked);
    setPinSet(!!s?.pin_set);
    setStatus(
      s?.enabled === false
        ? "Vault not configured (missing VAULT_MASTER_KEY)."
        : isUnlocked
        ? "Vault unlocked."
        : "Vault ready."
    );
    if (!s?.pin_set) {
      setShowPin(true);
      setMode("setpin");
    }
  }

  async function refreshKeys() {
    // backend requires unlocked session; if locked, don't fetch
    if (locked) return;
    const out = await fetchJson("/api/proxy/vault/keys");
    setKeysList(out?.keys || []);
  }

  useEffect(() => {
    const run = async () => {
      try {
        await refreshStatus();
        // if unlocked already (TTL), pull keys
        // (refreshStatus updates locked state)
        setTimeout(() => {
          // run after state settles
          refreshKeys().catch(() => {});
        }, 0);
      } catch (e) {
        setStatus(`Vault status failed: ${String(e?.message || e)}`);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unlockWithPin(pin) {
    setBusy(true);
    try {
      const out = await postJson("/api/proxy/vault/unlock", { pin });
      if (!out?.ok) throw new Error(out?.error || "Unlock failed");
      setLocked(false);
      setStatus("Vault unlocked via PIN.");
      setShowPin(false);
      await refreshKeys();
    } catch (e) {
      setStatus(`PIN unlock failed: ${String(e?.message || e)}`);
      setShowPin(true);
      setMode("unlock");
    } finally {
      setBusy(false);
    }
  }

  async function setPin(pin) {
    setBusy(true);
    try {
      const out = await postJson("/api/proxy/vault/pin/set", { pin });
      if (!out?.ok) throw new Error(out?.error || "Set PIN failed");
      setPinSet(true);
      setLocked(false); // backend sets unlocked_until on set
      setStatus("PIN set ✅ Vault unlocked.");
      setShowPin(false);
      await refreshKeys();
    } catch (e) {
      setStatus(`Set PIN failed: ${String(e?.message || e)}`);
      setShowPin(true);
      setMode("setpin");
    } finally {
      setBusy(false);
    }
  }

  async function lockNow() {
    setBusy(true);
    try {
      await postJson("/api/proxy/vault/lock", {}).catch(() => {});
      setLocked(true);
      setStatus("Vault locked.");
      setKeysList([]);
      setShowPin(true);
      setMode(pinSet ? "unlock" : "setpin");
    } finally {
      setBusy(false);
    }
  }

  async function saveKeys() {
    setBusy(true);
    try {
      if (locked) throw new Error("Vault locked.");
      if (!apiKey.trim() || !apiSecret.trim()) throw new Error("Key + secret required.");

      const out = await postJson("/api/proxy/vault/keys/add", {
        exchange,
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        passphrase: passphrase.trim(),
      });

      if (!out?.ok) throw new Error(out?.error || "Save failed");
      setStatus("Key saved (encrypted).");
      setApiKey("");
      setApiSecret("");
      setPassphrase("");
      await refreshKeys();
    } catch (e) {
      setStatus(`Save failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteKey(id) {
    setBusy(true);
    try {
      const out = await delJson(`/api/proxy/vault/keys/delete/${id}`);
      if (!out?.ok) throw new Error(out?.error || "Delete failed");
      setStatus("Deleted.");
      await refreshKeys();
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

            <div className="pip-links" style={{ marginTop: 10, flexWrap: "wrap" }}>
              <button
                className="pip-link"
                type="button"
                onClick={() => {
                  setShowPin(true);
                  setMode(pinSet ? "unlock" : "setpin");
                }}
                disabled={busy}
              >
                {pinSet ? "USE PIN" : "SET PIN"}
              </button>

              <button className="pip-link" type="button" onClick={lockNow} disabled={busy}>
                LOCK
              </button>

              <button className="pip-link" type="button" onClick={() => refreshStatus()} disabled={busy}>
                REFRESH
              </button>
            </div>

            {showPin && (
              <div style={{ marginTop: 14 }}>
                <PinPad
                  onSubmit={mode === "setpin" ? setPin : unlockWithPin}
                  disabled={busy}
                  modeLabel={mode === "setpin" ? "SET A NEW PIN" : "ENTER PIN TO UNLOCK"}
                />
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
                            {(k.exchange || "").toUpperCase()} • {k.api_key_masked || "****"}
                          </div>
                          <div className="pip-muted" style={{ fontSize: 12 }}>
                            {k.created || ""}
                          </div>
                        </div>

                        <div className="pip-muted" style={{ marginTop: 6, fontSize: 12 }}>
                          secret: {k.has_secret ? "YES" : "NO"} • passphrase: {k.has_passphrase ? "YES" : "NO"}
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
