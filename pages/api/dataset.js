// API route to serve dataset samples - proxies to Python backend
const API_URL = process.env.API_URL || 'http://localhost:8000';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${API_URL}/dataset`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch dataset');
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Dataset error:', error);
    return res.status(500).json({ error: error.message });
  }
}


