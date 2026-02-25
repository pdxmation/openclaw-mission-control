// Mission Control → Discord Webhook Integration
// Sends rich embeds to configured Discord channels

interface TaskUpdate {
  action: 'created' | 'completed' | 'blocked' | 'updated';
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    assignee?: string;
    outcome?: string;
    blocker?: string;
  };
  url: string;
}

interface AlertMessage {
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

interface StatusUpdate {
  event: 'deploy' | 'health-check' | 'backup' | 'sync';
  status: 'success' | 'failure' | 'in-progress';
  details: string;
  metadata?: Record<string, any>;
}

const WEBHOOKS = {
  tasks: process.env.DISCORD_WEBHOOK_MISSION_CONTROL,
  alerts: process.env.DISCORD_WEBHOOK_ALERTS,
  status: process.env.DISCORD_WEBHOOK_STATUS,
};

const COLORS = {
  created: 0x3498db,    // Blue
  completed: 0x2ecc71,  // Green
  blocked: 0xe74c3c,    // Red
  updated: 0xf39c12,    // Orange
  info: 0x95a5a6,       // Gray
  warning: 0xf1c40f,    // Yellow
  critical: 0xe74c3c,   // Red
  success: 0x2ecc71,    // Green
  failure: 0xe74c3c,    // Red
};

async function sendWebhook(webhookUrl: string | undefined, payload: any) {
  if (!webhookUrl) {
    console.warn('[Discord Webhook] No URL configured, skipping');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.error('[Discord Webhook] Failed to send:', error);
  }
}

export async function sendTaskUpdate(data: TaskUpdate) {
  const { action, task, url } = data;
  
  const emoji = {
    created: '📝',
    completed: '✅',
    blocked: '🚫',
    updated: '🔄',
  }[action];

  const fields = [
    { name: 'Status', value: task.status, inline: true },
    { name: 'Priority', value: task.priority, inline: true },
  ];

  if (task.assignee) {
    fields.push({ name: 'Assignee', value: task.assignee, inline: true });
  }

  if (task.outcome && action === 'completed') {
    fields.push({ name: 'Outcome', value: task.outcome });
  }

  if (task.blocker && action === 'blocked') {
    fields.push({ name: 'Blocker', value: task.blocker });
  }

  const payload = {
    username: 'Mission Control',
    avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
    embeds: [{
      title: `${emoji} Task ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      description: `[${task.title}](${url})`,
      color: COLORS[action as keyof typeof COLORS],
      fields,
      timestamp: new Date().toISOString(),
      footer: { text: `Task #${task.id}` },
    }],
  };

  await sendWebhook(WEBHOOKS.tasks, payload);
}

export async function sendAlert(data: AlertMessage) {
  const { level, title, message, metadata } = data;

  const emoji = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨',
  }[level];

  const fields = Object.entries(metadata || {}).map(([key, value]) => ({
    name: key,
    value: String(value).slice(0, 1000),
    inline: true,
  }));

  const payload = {
    username: 'Mission Control Alerts',
    avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png',
    content: level === 'critical' ? '@here Critical alert!' : undefined,
    embeds: [{
      title: `${emoji} ${title}`,
      description: message,
      color: COLORS[level],
      fields: fields.length > 0 ? fields : undefined,
      timestamp: new Date().toISOString(),
    }],
  };

  await sendWebhook(WEBHOOKS.alerts, payload);
}

export async function sendStatus(data: StatusUpdate) {
  const { event, status, details, metadata } = data;

  const emoji = {
    'deploy': '🚀',
    'health-check': '💓',
    'backup': '💾',
    'sync': '🔄',
  }[event];

  const statusEmoji = {
    'success': '✅',
    'failure': '❌',
    'in-progress': '⏳',
  }[status];

  const fields = Object.entries(metadata || {}).map(([key, value]) => ({
    name: key,
    value: String(value).slice(0, 1000),
    inline: true,
  }));

  const payload = {
    username: 'Mission Control Status',
    avatar_url: 'https://cdn.discordapp.com/embed/avatars/2.png',
    embeds: [{
      title: `${emoji} ${event.charAt(0).toUpperCase() + event.slice(1).replace('-', ' ')}`,
      description: `${statusEmoji} ${details}`,
      color: COLORS[status as keyof typeof COLORS],
      fields: fields.length > 0 ? fields : undefined,
      timestamp: new Date().toISOString(),
    }],
  };

  await sendWebhook(WEBHOOKS.status, payload);
}

// Test function
export async function testWebhooks() {
  console.log('[Discord Webhook] Testing all webhooks...');
  
  await sendTaskUpdate({
    action: 'created',
    task: { id: 'test-123', title: 'Test Task', status: 'IN_PROGRESS', priority: 'HIGH' },
    url: 'https://moltmc.app/tasks/test-123',
  });

  await sendAlert({
    level: 'info',
    title: 'Webhook Test',
    message: 'Mission Control webhooks are configured correctly!',
  });

  await sendStatus({
    event: 'health-check',
    status: 'success',
    details: 'All systems operational',
  });

  console.log('[Discord Webhook] Tests sent');
}
