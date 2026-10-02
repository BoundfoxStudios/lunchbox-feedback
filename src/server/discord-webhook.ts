const webhookPathPattern = /^\/api\/(?:v\d+\/)?webhooks\/(\d+)\/([\w-]+)\/?$/;

// No retries: a retry after a timeout could post the report card twice, and the teacher can
// resubmit.
export async function postToDiscord(message: FormData): Promise<void> {
  const response = await fetch(readWebhookUrl(), {
    method: 'POST',
    body: message,
    headers: {
      'User-Agent': 'DiscordBot (https://github.com/BoundfoxStudios/lunchbox-feedback, 1.0.0)',
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Discord answered with status ${response.status}: ${await response.text()}`);
  }
}

// Rebuilt from id and token: the URL Discord copies has no version, which hits the deprecated
// API v6, and wait=true makes Discord answer with the message or an error instead of a
// fire-and-forget 204.
function readWebhookUrl(): string {
  const configuredUrl = process.env['DISCORD_WEBHOOK_URL'];
  if (!configuredUrl) {
    throw new Error('DISCORD_WEBHOOK_URL is not set');
  }
  const match = URL.parse(configuredUrl)?.pathname.match(webhookPathPattern);
  if (!match) {
    throw new Error('DISCORD_WEBHOOK_URL is not a Discord webhook URL');
  }
  const [, webhookId, webhookToken] = match;
  return `https://discord.com/api/v10/webhooks/${webhookId}/${webhookToken}?wait=true`;
}
