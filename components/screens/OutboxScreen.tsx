"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, TextInput } from "@/components/ds";
import { api } from "@/lib/client/api";

interface Entry {
  at: string;
  channel: string;
  event: string;
  payload: unknown;
}

export function OutboxScreen({ entries, state }: { entries: Entry[]; state: { disconnected: string[]; failNext: string[]; noTeamsLink: boolean } }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const change = async (body: object) => {
    await api("/api/app/public/dev-stub", body);
    router.refresh();
  };
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ font: "var(--type-h1)" }}>Dev outbox</h1>
      <p style={{ color: "var(--text-secondary)" }}>Stub only. Everything the app would send to n8n, Airtable or by email lands here.</p>
      <Card padding="md">
        <div dir="ltr" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 240px" }}>
            <TextInput label="Agent email" dir="ltr" value={email} onChange={(event: { target: { value: string } }) => setEmail(event.target.value)} />
          </div>
          <Button variant="outline" size="md" onClick={() => change({ disconnect: email })}>Disconnect calendar</Button>
          <Button variant="outline" size="md" onClick={() => change({ reconnect: email })}>Reconnect</Button>
          <Button variant="outline" size="md" onClick={() => change({ failNext: "booking.created" })}>Fail next booking</Button>
          <Button variant="outline" size="md" onClick={() => change({ noTeamsLink: !state.noTeamsLink })}>{state.noTeamsLink ? "Teams links on" : "Teams links off"}</Button>
        </div>
        <pre dir="ltr" style={{ font: "var(--type-caption)", marginTop: 8 }}>{JSON.stringify(state, null, 1)}</pre>
      </Card>
      {entries.map((entry, index) => (
        <Card key={index} padding="md">
          <div dir="ltr" style={{ font: "var(--type-label)" }}>{entry.channel} · {entry.event}</div>
          <div dir="ltr" style={{ font: "var(--type-caption)", color: "var(--text-tertiary)" }}>{entry.at}</div>
          <pre dir="ltr" style={{ font: "var(--type-caption)", whiteSpace: "pre-wrap", overflowWrap: "anywhere", marginTop: 8 }}>{JSON.stringify(entry.payload, null, 1)}</pre>
        </Card>
      ))}
    </div>
  );
}
