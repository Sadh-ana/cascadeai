export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, mimeType = 'image/jpeg' } = req.body;
  if (!image) return res.status(400).json({ error: 'Image required' });

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
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: image } },
            {
              type: 'text',
              text: `You are a food rescue AI. Analyze this cafeteria food photo and return ONLY valid JSON — no markdown, no explanation, nothing else.

Return this exact structure:
{
  "items": [
    {
      "name": "food name",
      "quantity": 10,
      "unit": "servings",
      "shelf_life_hours": 8,
      "condition": "good",
      "calories_per_serving": 300
    }
  ],
  "total_meals": 10,
  "urgent": false,
  "summary": "One-sentence description of the surplus food"
}

Rules:
- condition must be "good" (>12h), "fair" (4–12h), or "poor" (<4h)
- Be conservative with shelf_life_hours — err shorter
- urgent = true if any item has shelf_life_hours < 4
- If no food is visible: {"items":[],"total_meals":0,"urgent":false,"summary":"No food detected"}
- Return ONLY the JSON object`
            }
          ]
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
    console.error('analyze error:', err);
    return res.status(500).json({ error: err.message });
  }
}