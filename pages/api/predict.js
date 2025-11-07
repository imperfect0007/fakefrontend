// API route to call Python backend (production: Render, development: localhost)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fakenews-oz9j.onrender.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `Backend returned ${response.status}` };
      }
      
      return res.status(response.status).json({
        error: 'Backend request failed',
        ...errorData,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Prediction error:', error);
    const errorMessage = error.message || 'Unknown error occurred';
    const isLocalhost = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');
    return res.status(500).json({ 
      error: 'Failed to connect to backend',
      message: isLocalhost 
        ? 'Make sure the backend server is running on http://localhost:8000'
        : `Failed to connect to backend at ${API_URL}. Please check your deployment configuration.`,
      apiUrl: API_URL
    });
  }
}

