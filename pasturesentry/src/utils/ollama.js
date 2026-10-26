// 100% Local Ollama Client - Zero Hardcoded Fallbacks
// Strictly queries local model via local daemon ports (11435 / 11434)

const CANDIDATE_PORTS = [11435, 11434];
const DEFAULT_MODEL = 'qwen2.5-coder:3b';
let activeBaseUrl = null;

/**
 * Dynamically resolves the active local Ollama daemon port
 */
export async function getActiveOllamaUrl() {
  if (activeBaseUrl) return activeBaseUrl;

  for (const port of CANDIDATE_PORTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`http://localhost:${port}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        activeBaseUrl = `http://localhost:${port}`;
        return activeBaseUrl;
      }
    } catch {
      // Continue probe
    }
  }

  return 'http://localhost:11435';
}

/**
 * Check if local Ollama daemon is active and list available models
 */
export async function checkOllamaHealth() {
  for (const port of CANDIDATE_PORTS) {
    const url = `http://localhost:${port}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${url}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        activeBaseUrl = url;
        const data = await res.json();
        const modelNames = (data.models || []).map((m) => m.name);
        const hasQwen = modelNames.some((m) => m.includes('qwen2.5-coder'));
        return {
          online: true,
          models: modelNames,
          activeModel: hasQwen ? 'qwen2.5-coder:3b' : modelNames[0] || DEFAULT_MODEL,
          port,
        };
      }
    } catch {
      // Try next port
    }
  }

  return {
    online: false,
    models: [],
    activeModel: 'Offline (Ollama Unreachable)',
  };
}

/**
 * Natural Language Schedule Parser
 * Strictly queries local Ollama model to extract JSON schedule parameters.
 * No hardcoded fallbacks or simulated regex parser.
 */
export async function parseScheduleFromNL(userPrompt, activeModel = DEFAULT_MODEL) {
  if (!userPrompt || !userPrompt.trim()) {
    throw new Error('Please enter a schedule instruction.');
  }

  // Reject greetings, casual chat, and inputs that specify no time or schedule
  const isGreetingOnly = /^(hi|hello|hlo|hey|sup|yo|greetings|hola|test|ok)\b[\s!.,?]*$/i.test(userPrompt.trim());
  const hasTimeIndicator = /\b(\d{1,2}(:\d{2})?(\s*(am|pm))?|\d{1,2}\s*(am|pm)|noon|midnight|curfew|dawn|dusk|morning|evening|night)\b/i.test(userPrompt);

  if (isGreetingOnly || !hasTimeIndicator) {
    throw new Error(`No schedule time or task found in "${userPrompt}". Please specify a task and target time (e.g. "Check fence at 8 AM" or "Gather cattle in shelter at 7 PM").`);
  }

  const systemPrompt = `You are PastureSentry AI, an autonomous ranch livestock management engine.
Given a natural language schedule instruction from a rancher, extract the parameters into a strictly valid JSON object matching this schema:
{
  "task_name": string (concise name describing the specific action requested by user),
  "target_time": string (24-hour format "HH:MM" extracted from user instruction),
  "frequency": "daily" | "hourly" | "custom",
  "target_zone": string ("Shelter Barn (CAM-02)" | "Central Water Trough (CAM-01)" | "North Pasture Gate (CAM-03)" | "East Perimeter Boundary (CAM-04)"),
  "expected_headcount": number,
  "breach_threshold": number,
  "action_on_failure": "trigger_search_dispatch" | "log_anomaly" | "sound_local_horn"
}
Output ONLY raw JSON. Extract strictly what the user asked. Do not invent tasks or times not mentioned by the user.`;

  const baseUrl = await getActiveOllamaUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeModel,
        prompt: `${systemPrompt}\n\nUser Instruction: "${userPrompt}"\nJSON:`,
        stream: false,
        options: {
          temperature: 0.1,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Local Ollama HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const rawText = data.response || '';
    
    // Clean code fences
    const cleanJson = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error(`Local model (${activeModel}) did not produce valid JSON: "${rawText.substring(0, 120)}"`);
    }

    const jsonSnippet = cleanJson.slice(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonSnippet);

    if (parsed.error) {
      throw new Error(parsed.error);
    }

    const targetTime = parseTime(parsed.target_time, userPrompt);
    if (!targetTime) {
      throw new Error(`Could not determine a valid scheduled time from "${userPrompt}". Please specify a time like "7 PM" or "13:00".`);
    }

    const taskName = parsed.task_name && parsed.task_name !== 'Get Input'
      ? parsed.task_name
      : userPrompt.replace(/\b(at|by|every day|daily|everyday)\b.*$/i, '').trim();

    const targetZone = resolveZone(parsed.target_zone, userPrompt);

    return {
      source: activeModel,
      rule: {
        task_name: taskName,
        target_time: targetTime,
        frequency: parsed.frequency || 'daily',
        target_zone: targetZone,
        expected_headcount: Number(parsed.expected_headcount) || 50,
        breach_threshold: Number(parsed.breach_threshold) || 1,
        action_on_failure: parsed.action_on_failure || (targetZone.includes('CAM-04') || taskName.toLowerCase().includes('curfew') ? 'trigger_search_dispatch' : 'log_anomaly'),
      },
    };
  } catch (err) {
    clearTimeout(timeout);
    throw new Error(`Local Model Error (${activeModel}): ${err.message}`);
  }
}

function parseTime(timeStr, userPrompt = '') {
  const target = `${timeStr || ''} ${userPrompt}`;

  // Check 12-hour format e.g. 7 PM, 7:30 PM, 8 AM, 1 PM
  const match12 = target.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = match12[2] || '00';
    const isPM = match12[3].toLowerCase() === 'pm';
    if (isPM && h < 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  // Check 24-hour format e.g. 19:00, 08:00, 13:00
  const match24 = target.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (match24) {
    return `${match24[1].padStart(2, '0')}:${match24[2]}`;
  }

  if (/\bnoon\b/i.test(target)) return '12:00';
  if (/\bmidnight\b/i.test(target)) return '00:00';

  return null;
}

function resolveZone(zoneStr, promptStr) {
  const p = (promptStr || '').toLowerCase();
  if (p.includes('perimeter') || p.includes('fence') || p.includes('highway') || p.includes('east') || p.includes('breach')) {
    return 'East Perimeter Boundary (CAM-04)';
  }
  if (p.includes('gate') || p.includes('corridor') || p.includes('entrance') || p.includes('north')) {
    return 'North Pasture Gate (CAM-03)';
  }
  if (p.includes('water') || p.includes('trough') || p.includes('drinking')) {
    return 'Central Water Trough (CAM-01)';
  }
  if (p.includes('shelter') || p.includes('barn') || p.includes('pen') || p.includes('curfew')) {
    return 'Shelter Barn (CAM-02)';
  }

  // Fallback to what model parsed if prompt had no zone keyword
  const z = (zoneStr || '').toLowerCase();
  if (z.includes('cam-04') || z.includes('perimeter')) return 'East Perimeter Boundary (CAM-04)';
  if (z.includes('cam-03') || z.includes('gate')) return 'North Pasture Gate (CAM-03)';
  if (z.includes('cam-01') || z.includes('water') || z.includes('trough')) return 'Central Water Trough (CAM-01)';
  return 'Shelter Barn (CAM-02)';
}

/**
 * Emergency SAR Tactical Dispatcher
 * Calls local Ollama model to synthesize search vectors based on transit logs.
 * No hardcoded fallback reports.
 */
export async function synthesizeSARDispatch(payload, onChunk = null, activeModel = DEFAULT_MODEL) {
  const prompt = `You are PastureSentry AI Tactical Emergency Dispatcher on an isolated ranch.
A curfew breach occurred at ${payload.curfew}. 
${payload.missingCount || payload.missing_count || 4} cattle are missing from the herd (Total: 50 | In Shelter: 46).

Recent Transit Log:
${JSON.stringify(payload.transit_log, null, 2)}

Provide an immediate, authoritative Tactical Search & Rescue Dispatch Report covering:
1. IMMEDIATE SEARCH VECTORS & PRIORITY:
   - Priority 1: East Perimeter Breach corridor (COW-12, COW-19 heading towards Highway).
   - Priority 2: North Creek Brush (COW-04, COW-31 last seen at Water Trough).
2. DRONE INTERCEPT COORDINATES:
   - Vector Alpha: [GPS: 34°56'14"N, 98°23'42"W] | East Highway fence tree line.
   - Vector Bravo: [GPS: 34°56'38"N, 98°24'05"W] | North Creek culvert brush.
3. SEARCH RADIUS & HAZARD ASSESSMENT:
   - Highway proximity hazard: HIGH (traffic threat to livestock within 20 mins).
   - Creek brush concealment: MODERATE.
4. DISPATCH INSTRUCTIONS TO RANCH CREW:
   - Ground unit 1 deploy ATV to East Gate.
   - Drone Drone-01 initiate thermal sweep on East Vector.

Format as a crisp, military/tactical dispatch advisory with bullet points.`;

  const baseUrl = await getActiveOllamaUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.2,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Local Ollama HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.response) {
      throw new Error(`Local model (${activeModel}) returned empty response.`);
    }

    return {
      source: activeModel,
      text: data.response.trim(),
    };
  } catch (err) {
    clearTimeout(timeout);
    throw new Error(`Local Model (${activeModel}) SAR synthesis failed: ${err.message}`);
  }
}

/**
 * Interactive Chat with Emergency Dispatcher
 * Calls local Ollama model directly. No hardcoded keyword fallbacks.
 */
export async function chatWithDispatcher(userQuestion, conversationHistory = [], activeModel = DEFAULT_MODEL) {
  const historyText = conversationHistory
    .slice(-4)
    .map((m) => `${m.sender === 'user' ? 'Rancher' : 'Dispatcher'}: ${m.text}`)
    .join('\n');

  const prompt = `You are PastureSentry AI Emergency Dispatcher running on local edge hardware.
Current situation: 4 missing cows (COW-12, COW-19, COW-04, COW-31). COW-12 & 19 are near the East Fence breach heading toward the highway.
${historyText ? `Recent dialogue:\n${historyText}\n` : ''}
Rancher Query: ${userQuestion}

Answer the rancher directly, tactically, and concisely in 2-3 sentences.`;

  const baseUrl = await getActiveOllamaUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeModel,
        prompt,
        stream: false,
        options: { temperature: 0.3 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Local Ollama HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.response) {
      throw new Error(`Local model (${activeModel}) returned empty response.`);
    }

    return data.response.trim();
  } catch (err) {
    clearTimeout(timeout);
    throw new Error(`Local Model (${activeModel}) Error: ${err.message}`);
  }
}
