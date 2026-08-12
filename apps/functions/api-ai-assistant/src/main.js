import { Client, Databases, Query } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const clean = (value) => String(value ?? '').trim();
const normalize = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
const normalizeRole = (value) => clean(value).toUpperCase().replace(/[ -]+/g, '_');

function bodyOf(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.bodyText || req.bodyRaw || req.payload || '{}'); } catch { return {}; }
}

function userIdOf(req) {
  const headers = req.headers || {};
  return headers['x-appwrite-user-id'] || headers['X-Appwrite-User-Id'] || '';
}

function sameEvent(item, events) {
  const itemEvent = normalize(item.eventId || item.event || item.campaign || item.sourceTab);
  return events.some((event) => {
    const key = normalize(event);
    return key && (itemEvent === key || itemEvent.includes(key) || key.includes(itemEvent));
  });
}

function isAssigned(task, profile) {
  const assignee = clean(task.currentAssigneeId || task.assigneeId);
  return assignee === profile.$id || assignee === profile.authUserId || normalize(assignee) === normalize(profile.name);
}

function scopeWorkspace(profile, tasks, plans, users) {
  const roles = (profile.roles || []).map(normalizeRole);
  const events = profile.events || [];
  const isAdmin = roles.includes('ADMIN');
  const isChief = roles.includes('CHIEF_COORDINATOR');
  const isMarketing = roles.includes('MARKETING_COORDINATOR');
  const isDirector = roles.includes('MEDIA_DIRECTOR');
  const isProduction = roles.some((role) => ['DESIGNER', 'VIDEO_EDITOR', 'CONTENT_WRITER'].includes(role));

  let scopedTasks = [];
  let scopedPlans = [];
  let scopedUsers = [];

  if (isAdmin) {
    scopedTasks = tasks;
    scopedPlans = plans;
    scopedUsers = users;
  } else {
    if (isChief || isMarketing || isDirector) {
      scopedTasks = tasks.filter((task) => sameEvent(task, events));
      scopedPlans = plans.filter((plan) => sameEvent(plan, events));
    }
    if (isProduction) {
      scopedTasks = [...scopedTasks, ...tasks.filter((task) => isAssigned(task, profile))];
      scopedPlans = [...scopedPlans, ...plans.filter((plan) => {
        const person = normalize(profile.name);
        return [plan.designer, plan.contentWriter, plan.videoEditor].some((value) => normalize(value) === person);
      })];
    }
  }

  return {
    roles,
    events,
    tasks: [...new Map(scopedTasks.map((item) => [item.$id, item])).values()],
    plans: [...new Map(scopedPlans.map((item) => [item.$id, item])).values()],
    users: scopedUsers,
  };
}

function compactTask(task) {
  return {
    title: task.title,
    event: task.eventId || task.event,
    workType: task.workType,
    priority: task.priority,
    status: task.status,
    deadline: task.deadline,
    assignee: task.currentAssigneeId,
  };
}

function compactPlan(plan) {
  return {
    title: plan.title || plan.description,
    event: plan.eventId || plan.campaign || plan.sourceTab,
    platform: plan.platform,
    dateToShare: plan.dateToShare,
    designStatus: plan.designStatus,
    captionStatus: plan.captionStatus,
    finalStatus: plan.finalStatus,
  };
}

function fallbackReply(message, profile, scope) {
  const now = Date.now();
  const finished = new Set(['done', 'completed', 'posted', 'cancelled']);
  const open = scope.tasks.filter((task) => !finished.has(clean(task.status).toLowerCase()));
  const overdue = open.filter((task) => task.deadline && new Date(task.deadline).getTime() < now);
  const dueSoon = open.filter((task) => {
    const deadline = task.deadline ? new Date(task.deadline).getTime() : 0;
    return deadline >= now && deadline <= now + 7 * 86400000;
  });
  const waiting = scope.plans.filter((plan) => {
    const statuses = [plan.designStatus, plan.captionStatus, plan.finalStatus].map((value) => clean(value).toLowerCase());
    return !statuses.every((status) => ['done', 'completed', 'posted', 'approved'].includes(status));
  });
  const requested = normalize(message);
  const lines = [`Here is your permitted workspace summary, ${profile.name}:`];
  if (requested.includes('overdue')) {
    if (!overdue.length) return `Good news, ${profile.name} — you have no overdue tasks in your permitted workspace.`;
    lines.push(`${overdue.length} overdue task${overdue.length === 1 ? '' : 's'}:`);
    overdue.slice(0, 8).forEach((task) => lines.push(`• ${task.title} (${task.eventId || 'No event'}) — ${new Date(task.deadline).toLocaleDateString('en-GB')}`));
    return lines.join('\n');
  }
  if (requested.includes('week') || requested.includes('next') || requested.includes('priority')) {
    lines.push(`${dueSoon.length} task${dueSoon.length === 1 ? '' : 's'} due in the next 7 days.`);
    dueSoon.slice(0, 8).forEach((task) => lines.push(`• ${task.title} — ${new Date(task.deadline).toLocaleDateString('en-GB')} (${task.status || 'Pending'})`));
    if (!dueSoon.length) lines.push('Nothing is currently due in the next 7 days.');
    return lines.join('\n');
  }
  if (requested.includes('post') || requested.includes('caption') || requested.includes('design') || requested.includes('ready')) {
    lines.push(`${waiting.length} marketing item${waiting.length === 1 ? '' : 's'} still need work.`);
    waiting.slice(0, 8).forEach((plan) => lines.push(`• ${plan.title || plan.description || 'Untitled item'} — Design: ${plan.designStatus || 'Not set'}, Caption: ${plan.captionStatus || 'Not set'}, Final: ${plan.finalStatus || 'Not set'}`));
    return lines.join('\n');
  }
  lines.push(`${open.length} open task${open.length === 1 ? '' : 's'}, ${overdue.length} overdue, ${dueSoon.length} due this week, and ${waiting.length} marketing item${waiting.length === 1 ? '' : 's'} still in progress.`);
  lines.push('Ask me about overdue work, this week, priorities, captions, designs, or posts.');
  return lines.join('\n');
}

async function geminiReply(message, history, profile, scope) {
  if (process.env.AI_PROVIDER_ENABLED !== 'true') return null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.AI_MODEL || 'gemini-1.5-flash';
  const workspace = {
    user: { name: profile.name, roles: scope.roles, assignedEvents: scope.events },
    tasks: scope.tasks.slice(0, 200).map(compactTask),
    marketingPlans: scope.plans.slice(0, 200).map(compactPlan),
    users: scope.users.slice(0, 100).map((user) => ({ name: user.name, roles: user.roles, events: user.events })),
  };
  const system = `You are the IMSSA Media workspace assistant. Be concise, friendly and operational. Only use the supplied permitted workspace data; never infer or reveal other events or users. You are read-only: never claim you created, edited, assigned or deleted anything. If asked to change data, explain where the user can do it in the site. Clearly say when data is unavailable. Today is ${new Date().toISOString().slice(0, 10)}. Permitted data: ${JSON.stringify(workspace)}`;
  const contents = [
    { role: 'user', parts: [{ text: system }] },
    ...history.slice(-8).map((entry) => ({ role: entry.role === 'assistant' ? 'model' : 'user', parts: [{ text: clean(entry.content).slice(0, 1500) }] })),
    { role: 'user', parts: [{ text: message }] },
  ];
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents, generationConfig: { temperature: 0.2, maxOutputTokens: 700 } }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `AI provider returned HTTP ${response.status}`);
  return clean(payload?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n')) || null;
}

export default async ({ req, res, log, error }) => {
  if (clean(req.method || 'POST').toUpperCase() !== 'POST') return res.json({ success: false, error: 'Method not allowed.' }, 405);
  const userId = userIdOf(req);
  if (!userId) return res.json({ success: false, error: 'Please sign in to use the assistant.' }, 401);
  const body = bodyOf(req);
  const message = clean(body.message).slice(0, 1200);
  if (!message) return res.json({ success: false, error: 'Please enter a message.' }, 400);

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY);
  const databases = new Databases(client);

  try {
    const profiles = await databases.listDocuments(DATABASE_ID, 'users', [Query.equal('authUserId', userId), Query.limit(1)]);
    if (!profiles.total) return res.json({ success: false, error: 'Your workspace profile could not be found.' }, 403);
    const profile = profiles.documents[0];
    const [taskResult, planResult, userResult] = await Promise.all([
      databases.listDocuments(DATABASE_ID, 'tasks', [Query.limit(500)]),
      databases.listDocuments(DATABASE_ID, 'marketing_plan_items', [Query.limit(500)]),
      databases.listDocuments(DATABASE_ID, 'users', [Query.limit(500)]),
    ]);
    const scope = scopeWorkspace(profile, taskResult.documents, planResult.documents, userResult.documents);
    let reply;
    let mode = 'workspace-summary';
    try {
      reply = await geminiReply(message, Array.isArray(body.history) ? body.history : [], profile, scope);
      if (reply) mode = 'ai';
    } catch (providerError) {
      error(`AI provider unavailable: ${providerError.message}`);
    }
    reply ||= fallbackReply(message, profile, scope);
    log(JSON.stringify({ userId, mode, tasks: scope.tasks.length, plans: scope.plans.length }));
    return res.json({ success: true, reply, mode });
  } catch (exception) {
    error(exception?.message || String(exception));
    return res.json({ success: false, error: 'The assistant could not read your workspace right now.' }, 500);
  }
};
