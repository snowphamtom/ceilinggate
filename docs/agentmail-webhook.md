# AgentMail webhook → CeilingGate

**Primary inbox (only):** `ceilinggate-claims@agentmail.to` (display: CeilingGate Claims Ingress)

Legacy (not primary): `ceilinggate@agentmail.to`

HTTP route already mounted:

`POST /agentmail/webhook` → `agentmail.handleWebhook` → `pipeline.onMessageReceived`

## After Convex deploy

1. Site URL form: `https://<deployment>.convex.site/agentmail/webhook`
2. Register that URL with AgentMail for inbox `ceilinggate-claims@agentmail.to` (event: message.received).
3. Set Convex env:
   - `AGENTMAIL_WEBHOOK_SECRET` (Svix secret from AgentMail)
   - `AGENTMAIL_API_KEY`
   - `AGENTMAIL_INBOX_ID=ceilinggate-claims@agentmail.to`
   - `AGENTMAIL_INBOX_EMAIL=ceilinggate-claims@agentmail.to`
4. Call mutation `inboxes.seedPrimary` once.

Do **not** dual-wire the legacy `ceilinggate@agentmail.to` as primary.
