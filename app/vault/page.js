"use client";

import React, { useEffect, useMemo, useState } from "react";

async function getJson(url, token) {
  const res = await fetch(url, {
    method: "GET",
    headers: token ? { "X-Vault-Token": token } : {},
    cache: "no-store",
  });

  const txt = await res.text();
  const data = txt ? JSON.parse(txt) : {};
  if (!res.ok) throw new Error(data?.error || data?.message || res.statusText);
  return data;
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

  const txt = await res.text();
  const data = txt ? JSON.parse(txt) : {};
  if (!res.ok) throw new Error(data?.error || data?.message || res.statusText);
  return data;
}

function fmtSecs(n) {
  const s = Math.max(0, Number(n || 0));
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function VaultPage() {
  const [vaultEnabled, setVaultEnabled] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [ttl, setTtl] = useState(0);

  const [token, setToken] = useState("");
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

  async function refresh() {
    setBusy(true);
    try {
      const s = await getJson("/api/proxy/vault/status");
      setVaultEnabled(!!s.enabled);
      setPinSet(!!s.pin_set);
      setUnlocked(!!s.unlocked);
      setTtl(Number(s.ttl_sec || 0));
      setMsg(
        !s.enabled
          ? "Vault disabled on backend"
          : !s.pin_set
          ? "Vault enabled. PIN not set."
          : s.unlocked
          ? `Unlocked. TTL ${fmtSecs(s.ttl_sec)}`
          : "Vault locked."
      );
      setLast(new Date().toLocaleTimeString());
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function setPinBackend() {
    setBusy(true);
    try {
      const r = await postJson("/api/proxy/vault/pin/set", token, { pin: newPin });
      setMsg(r.message || "PIN set");
      setNewPin("");
      refresh();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function unlockPin() {
    setBusy(true);
    try {
      const r = await postJson("/api/proxy/vault/unlock", token, { pin });
      setToken(r.token || token);
      setMsg(r.message || "Unlocked");
      refresh();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function lock() {
    setBusy(true);
    try {
      const r = await postJson("/api/proxy/vault/lock", token, {});
      setMsg(r.message || "Locked");
      refresh();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1>VAULT SAFE</h1>

      <pre>{msg}</pre>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button disabled={busy || !newPin} onClick={setPinBackend}>SET PIN</button>
        <button disabled={busy || !pin} onClick={unlockPin}>USE PIN</button>
        <button disabled={busy} onClick={lock}>LOCK</button>
        <button disabled={busy} onClick={refresh}>REFRESH</button>
      </div>

      <hr />

      <input placeholder="Vault token (optional)" value={token} onChange={e => setToken(e.target.value)} />
      <input placeholder="PIN" value={pin} onChange={e => setPin(e.target.value)} />
      <input placeholder="New PIN" value={newPin} onChange={e => setNewPin(e.target.value)} />

      <div>TTL: {fmtSecs(ttl)}</div>
      <div>Status: {doorLabel}</div>
      <div>Last: {last}</div>
    </main>
  );
}
