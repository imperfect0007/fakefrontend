// API route to call Python backend
const API_URL = process.env.API_URL || 'https://fakenews-oz9j.onrender.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    // Call Python backend using native fetch (Node 18+)
    const backendUrl = `${API_URL}/predict`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Backend request failed',
        status: response.status,
        message: errorText
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Prediction error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Prediction failed',
      message: error.message || 'Unknown error',
      apiUrl: API_URL
    });
  }
}

