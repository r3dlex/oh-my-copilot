---
name: notifications
description: Send and manage runtime notifications across Telegram, Discord, Slack, and Email channels
trigger: "notifications:, /notifications, /omp:notifications"
autoinvoke: false
---
# Skill: Notifications

## Metadata

| Field | Value |
|-------|-------|
| **ID** | `notifications` |
| **Keywords** | `notifications:`, `/notifications` |
| **Tier** | Developer Tool |
| **Source** | `src/skills/notifications.mts` |

## Description

Send and manage notification delivery across multiple channels (Telegram, Discord, Slack, Email). Handles immediate alerts, digests, and escalation patterns at runtime.

## Differentiation from configure-notifications

| Aspect | notifications | configure-notifications |
|--------|---------------|-------------------------|
| **Purpose** | Runtime notification delivery, channel management, testing, escalation | One-time setup of notification credentials and integrations |
| **Scope** | Send alerts, manage preferences, configure digest schedules, escalate | Configure webhook URLs and tokens |
| **Use when** | You need to act on notifications or manage delivery rules | You are setting up a new integration for the first time |

## Interface

```typescript
interface SkillInput {
  trigger: string;
  args: string[];
}

interface SkillOutput {
  status: "ok" | "error";
  message: string;
}

export async function activate(input: SkillInput): Promise<SkillOutput>
export function deactivate(): void
```

## Implementation

Spawns `bin/omp.mjs notifications [args]`. No persistent resources are maintained.

## When to Use

- Setting up alerts
- Configuring notification channels
- Managing notification preferences
- Troubleshooting missing alerts

## Notification Channels

### Telegram
- Fast delivery
- Supports markdown
- Group chats
- Bot integration

### Discord
- Webhook-based
- Rich embeds
- Channels and roles
- High volume

### Slack
- Channel-based
- App integration
- Threaded
- Enterprise friendly

### Email
- Universal
- SMTP based
- Digest options
- Fallback option

## Configuration

### Telegram Setup
```yaml
telegram:
  bot_token: {token}
  chat_id: {chat_id}
  parse_mode: markdown
```

### Discord Setup
```yaml
discord:
  webhook_url: {url}
  username: {bot_name}
  embed_color: {hex}
```

### Slack Setup
```yaml
slack:
  webhook_url: {url}
  channel: {channel}
  username: {bot_name}
```

## Notification Types

### Immediate
- Errors and failures
- Critical alerts
- Completion notifications
- Mentions and replies

### Digest
- Summary of activity
- Batch reports
- Periodic updates
- Non-urgent changes

### Escalation
- Alert escalation
- No response follow-up
- Priority boosts
- Emergency alerts

## Commands

### Configure Channel
```
/omp:notifications configure {channel}
```

### Test Notification
```
/omp:notifications test {channel}
```

### List Channels
```
/omp:notifications list
```

### Set Preferences
```
/omp:notifications set {type} {channel}
```

## Output Format

```
## Notifications: {project}

### Configured Channels
| Channel | Status | Last Test |
|---------|--------|-----------|
| Telegram | OK | {date} |
| Discord | OK | {date} |

### Notification Preferences

#### Immediate
| Event | Channel | Enabled |
|-------|---------|---------|
| Error | Telegram | yes |
| Complete | Discord | yes |

#### Digest
| Schedule | Channel | Enabled |
|---------|---------|---------|
| Daily | Email | yes |

### Recent Notifications
- **{time}** — {event} -> {channel}

### Configuration Files
- `.omp/notifications/config.yaml`
- `.omp/notifications/templates/`
```

## Constraints

- Test after configuration
- Don't over-notify
- Respect quiet hours
- Secure sensitive tokens
- Provide unsubscribe
