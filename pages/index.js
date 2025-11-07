import { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('[Frontend] Sending prediction request...');
      
      // Create AbortController for client-side timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 65000); // 65 second timeout (slightly longer than API timeout)
      
      let response;
      try {
        response = await fetch('/api/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - the request took too long. Please try again.');
        }
        throw fetchError;
      }

      console.log('[Frontend] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Prediction failed' }));
        console.error('[Frontend] Error response:', errorData);
        const errorMsg = errorData.message || errorData.error || errorData.details || 'Prediction failed';
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('[Frontend] Received prediction results:', data);
      
      // Ensure data is in expected format
      if (!data || (typeof data !== 'object')) {
        throw new Error('Invalid response format from backend');
      }
      
      setResults(data);
    } catch (err) {
      console.error('[Frontend] Prediction error:', err);
      const errorMessage = err.message || 'An error occurred';
      
      // Handle different error types
      if (errorMessage.includes('timeout') || errorMessage.includes('Request timeout')) {
        setError('Request timed out. The backend server may be overloaded. Please try again in a moment.');
      } else if (errorMessage.includes('localhost') || errorMessage.includes('connect') || errorMessage.includes('Failed to connect')) {
        setError('Cannot connect to backend. Make sure the backend server is running on https://fakenews-oz9j.onrender.com');
      } else if (errorMessage.includes('504')) {
        setError('Backend request timed out. Please try again.');
      } else {
        setError(errorMessage);
      }
      setResults(null); // Clear results on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Fake Review Detection Using DeBERTa</title>
        <meta name="description" content="Fake review detection using DeBERTa model" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Fake Review Detection Using DeBERTa
        </h1>
        <p className={styles.description}>
          Detect fake reviews using advanced DeBERTa transformer model
        </p>

        <div className={styles.inputSection}>
          <textarea
            className={styles.textarea}
            placeholder="Enter a review to analyze for authenticity..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
          />
          <button
            className={styles.button}
            onClick={handlePredict}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze Review'}
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {results && (
          <div className={styles.results}>
            <h2>Prediction Results</h2>
            
            <div className={styles.comparison}>
              {results.bert && results.bert.prediction !== undefined && (
                <div className={styles.modelCard}>
                  <h3>BERT</h3>
                  <div className={styles.prediction}>
                    <div className={styles.label}>
                      Prediction: <span className={results.bert.prediction === 0 ? styles.fake : styles.genuine}>
                        {results.bert.prediction === 0 ? 'Fake Review' : 'Genuine Review'}
                      </span>
                    </div>
                    <div className={styles.confidence}>
                      Confidence: {results.bert.confidence ? (results.bert.confidence * 100).toFixed(2) : '0.00'}%
                    </div>
                    <div className={styles.probabilities}>
                      <div>Fake: {results.bert.probabilities && results.bert.probabilities[0] ? (results.bert.probabilities[0] * 100).toFixed(2) : '0.00'}%</div>
                      <div>Genuine: {results.bert.probabilities && results.bert.probabilities[1] ? (results.bert.probabilities[1] * 100).toFixed(2) : '0.00'}%</div>
                    </div>
                  </div>
                </div>
              )}
              
              {results.deberta && results.deberta.prediction !== undefined && (
                <div className={styles.modelCard}>
                  <h3>DeBERTa</h3>
                  <div className={styles.prediction}>
                    <div className={styles.label}>
                      Prediction: <span className={results.deberta.prediction === 0 ? styles.fake : styles.genuine}>
                        {results.deberta.prediction === 0 ? 'Fake Review' : 'Genuine Review'}
                      </span>
                    </div>
                    <div className={styles.confidence}>
                      Confidence: {results.deberta.confidence ? (results.deberta.confidence * 100).toFixed(2) : '0.00'}%
                    </div>
                    <div className={styles.probabilities}>
                      <div>Fake: {results.deberta.probabilities && results.deberta.probabilities[0] ? (results.deberta.probabilities[0] * 100).toFixed(2) : '0.00'}%</div>
                      <div>Genuine: {results.deberta.probabilities && results.deberta.probabilities[1] ? (results.deberta.probabilities[1] * 100).toFixed(2) : '0.00'}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {results.bert && results.bert.prediction !== undefined && 
             results.deberta && results.deberta.prediction !== undefined && 
             results.bert.prediction !== results.deberta.prediction && (
              <div className={styles.disagreement}>
                ⚠️ Models disagree on this review!
              </div>
            )}
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>Fake Review Detection Using DeBERTa Model</p>
      </footer>
    </div>
  );
}

