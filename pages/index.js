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
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Prediction failed' }));
        throw new Error(errorData.message || errorData.error || 'Prediction failed');
      }

      const data = await response.json();
      console.log('Received prediction results:', data);
      
      // Ensure data is in expected format
      if (!data || (typeof data !== 'object')) {
        throw new Error('Invalid response format from backend');
      }
      
      setResults(data);
    } catch (err) {
      console.error('Prediction error:', err);
      const errorMessage = err.message || 'An error occurred';
      if (errorMessage.includes('localhost') || errorMessage.includes('connect')) {
        setError('Cannot connect to backend. Make sure the backend server is running on http://localhost:8000');
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
        <title>Fake News Using DeBERTa Model</title>
        <meta name="description" content="Fake news detection using DeBERTa model" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Fake News Using DeBERTa Model
        </h1>
        <p className={styles.description}>
          Detect fake news using advanced DeBERTa transformer model
        </p>

        <div className={styles.inputSection}>
          <textarea
            className={styles.textarea}
            placeholder="Enter news article or text to analyze..."
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
        <p>Fake News Detection Using DeBERTa Model</p>
      </footer>
    </div>
  );
}

