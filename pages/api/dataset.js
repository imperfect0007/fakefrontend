// API route to serve dataset samples - proxies to Python backend (production: Render, development: localhost)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fakenews-oz9j.onrender.com';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${API_URL}/dataset`);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `Backend returned ${response.status}` };
      }
      
      return res.status(response.status).json({
        error: 'Failed to fetch dataset',
        ...errorData,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Dataset error:', error);
    return res.status(500).json({ 
      error: 'Failed to connect to backend',
      message: error.message || 'Make sure the backend server is running on http://localhost:8000',
      apiUrl: API_URL
    });
  }
}


