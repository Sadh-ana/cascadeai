export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { analysis } = req.body;
  if (!analysis) return res.status(400).json({ error: 'Analysis data required' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are an autonomous food rescue coordinator. Create a rescue plan for this surplus food and return ONLY valid JSON — no markdown, no explanation.

Food surplus data:
${JSON.stringify(analysis, null, 2)}

Available recipients in priority order:
1. type "family"  — "The Johnson Family Network", 124 Oak Street (2 registered families, accepts any food)
2. type "fridge"  — "FreshStop Community Fridge", Lincoln Park North Entrance (24/7, sealed items + non-perishables)
3. type "shelter" — "St. Mary's Emergency Shelter", 45 Main Avenue (kitchen open until 9pm, bulk quantities welcome)
4. type "compost" — "GreenRoots Urban Farm", Eastside Community Garden (compost pickup any time, feeds school garden)

Return this exact structure:
{
  "cascade": [
    {
      "priority": 1,
      "type": "family",
      "recipient": "The Johnson Family Network",
      "address": "124 Oak Street",
      "quantity": "clear description of what they receive",
      "reason": "why this assignment",
      "contact": "families@cascadeai.local"
    }
  ],
  "pickup_window": "e.g. Within 30 minutes",
  "estimated_impact": {
    "meals": 20,
    "co2_kg": 10.0,
    "families": 2
  },
  "notes": "any special handling instructions"
}

Rules:
- Assign ALL food. Use multiple cascade entries if splitting
- Always try families first, then fridge, then shelter, then compost
- CO₂ calculation: each meal diverted from landfill saves ~0.5kg CO₂
- Return ONLY the JSON object`
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: 'Anthropic error', details: err });
    }

    const data = await response.json();
    const text = data.content[0]?.text || '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return res.json(JSON.parse(cleaned));

  } catch (err) {
    console.error('rescue error:', err);
    return res.status(500).json({ error: err.message });
  }
}