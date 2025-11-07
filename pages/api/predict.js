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
    console.log(`[API] Sending request to ${API_URL}/predict`);
    console.log(`[API] Request text length: ${text.length}`);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`[API] Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API] Backend error: ${errorText}`);
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
      console.log(`[API] Successfully received prediction data`);
      return res.status(200).json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[API] Request timeout after 60 seconds');
        return res.status(504).json({ 
          error: 'Request timeout',
          message: 'Backend request took too long. The server may be overloaded or the model is taking too long to process.',
          apiUrl: API_URL
        });
      }
      throw fetchError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('[API] Prediction error:', error);
    const errorMessage = error.message || 'Unknown error occurred';
    const isLocalhost = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');
    return res.status(500).json({ 
      error: 'Failed to connect to backend',
      message: isLocalhost 
        ? 'Make sure the backend server is running on http://localhost:8000'
        : `Failed to connect to backend at ${API_URL}. Please check your deployment configuration.`,
      apiUrl: API_URL,
      details: errorMessage
    });
  }
}

