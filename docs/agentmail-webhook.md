# AgentMail webhook → CeilingGate

**Primary inbox (only):** `ceilinggate@agentmail.to` (display: CeilingGate Claims)

HTTP route already mounted:

`POST /agentmail/webhook` → `agentmail.handleWebhook` → `pipeline.onMessageReceived`

## After Convex deploy

1. Site URL form: `https://<deployment>.convex.site/agentmail/webhook`
2. Register that URL with AgentMail for inbox `ceilinggate@agentmail.to` (event: message.received).
3. Set Convex env:
   - `AGENTMAIL_WEBHOOK_SECRET` (Svix secret from AgentMail)
   - `AGENTMAIL_API_KEY`
   - `AGENTMAIL_INBOX_ID=ceilinggate@agentmail.to`
   - `AGENTMAIL_INBOX_EMAIL=ceilinggate@agentmail.to`
4. Call mutation `inboxes.syncFromEnv` once.

Do **not** point the webhook at `ceilinggate-claims@agentmail.to`.
