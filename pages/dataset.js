import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Dataset.module.css';

export default function Dataset() {
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedSample, setSelectedSample] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDataset();
  }, []);

  const fetchDataset = async () => {
    try {
      const response = await fetch('/api/dataset');
      if (!response.ok) throw new Error('Failed to fetch dataset');
      const data = await response.json();
      setDataset(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async (text) => {
    setSelectedSample({ text, loading: true });
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const result = await response.json();
      setSelectedSample({ text, result, loading: false });
    } catch (err) {
      setSelectedSample({ text, error: err.message, loading: false });
    }
  };

  if (loading) return <div className={styles.container}><div className={styles.loading}>Loading dataset...</div></div>;
  if (error) return <div className={styles.container}><div className={styles.error}>Error: {error}</div></div>;

  const startIdx = (page - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentPageData = dataset.samples.slice(startIdx, endIdx);
  const totalPages = Math.ceil(dataset.samples.length / itemsPerPage);

  return (
    <div className={styles.container}>
      <Head>
        <title>Dataset Viewer - DeBERTa Fake Review Detection</title>
      </Head>

      <nav className={styles.nav}>
        <Link href="/" className={styles.navLink}>← Back to Predictor</Link>
      </nav>

      <main className={styles.main}>
        <h1 className={styles.title}>Dataset Viewer</h1>
        
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <h3>Total Reviews</h3>
            <p>{dataset.stats.total}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Genuine (Label 1)</h3>
            <p>{dataset.stats.genuine} ({((dataset.stats.genuine / dataset.stats.total) * 100).toFixed(1)}%)</p>
          </div>
          <div className={styles.statCard}>
            <h3>Fake (Label 0)</h3>
            <p>{dataset.stats.fake} ({((dataset.stats.fake / dataset.stats.total) * 100).toFixed(1)}%)</p>
          </div>
          <div className={styles.statCard}>
            <h3>Categories</h3>
            <p>{dataset.stats.categories}</p>
          </div>
        </div>

        <div className={styles.samples}>
          <h2>Sample Reviews</h2>
          <div className={styles.pagination}>
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
              Next
            </button>
          </div>

          <div className={styles.sampleList}>
            {currentPageData.map((sample, idx) => (
              <div key={startIdx + idx} className={styles.sampleCard}>
                <div className={styles.sampleHeader}>
                  <span className={sample.label === 1 ? styles.genuine : styles.fake}>
                    {sample.label === 1 ? 'Genuine' : 'Fake'}
                  </span>
                  <span className={styles.category}>{sample.category}</span>
                  <span className={styles.rating}>⭐ {sample.rating}</span>
                </div>
                <p className={styles.sampleText}>{sample.text}</p>
                <button 
                  className={styles.predictBtn}
                  onClick={() => handlePredict(sample.text)}
                >
                  Test with DeBERTa
                </button>
              </div>
            ))}
          </div>
        </div>

        {selectedSample && (
          <div className={styles.predictionModal}>
            <div className={styles.modalContent}>
              <h3>Prediction Result</h3>
              <p className={styles.modalText}>{selectedSample.text}</p>
              {selectedSample.loading ? (
                <div className={styles.loading}>Analyzing...</div>
              ) : selectedSample.error ? (
                <div className={styles.error}>{selectedSample.error}</div>
              ) : selectedSample.result ? (
                <div className={styles.result}>
                  {/* Handle both single result and comparison format */}
                  {(selectedSample.result.bert && selectedSample.result.bert.prediction !== undefined) || 
                   (selectedSample.result.deberta && selectedSample.result.deberta.prediction !== undefined) ? (
                    // Comparison format (both models)
                    <div>
                      {selectedSample.result.bert && selectedSample.result.bert.prediction !== undefined && (
                        <div style={{ marginBottom: '1rem' }}>
                          <h4>BERT</h4>
                          <div className={styles.label}>
                            Prediction: <span className={selectedSample.result.bert.prediction === 0 ? styles.fake : styles.genuine}>
                              {selectedSample.result.bert.prediction === 0 ? 'Fake Review' : 'Genuine Review'}
                            </span>
                          </div>
                          <div className={styles.confidence}>
                            Confidence: {selectedSample.result.bert.confidence ? (selectedSample.result.bert.confidence * 100).toFixed(2) : '0.00'}%
                          </div>
                        </div>
                      )}
                      {selectedSample.result.deberta && selectedSample.result.deberta.prediction !== undefined && (
                        <div>
                          <h4>DeBERTa</h4>
                          <div className={styles.label}>
                            Prediction: <span className={selectedSample.result.deberta.prediction === 0 ? styles.fake : styles.genuine}>
                              {selectedSample.result.deberta.prediction === 0 ? 'Fake Review' : 'Genuine Review'}
                            </span>
                          </div>
                          <div className={styles.confidence}>
                            Confidence: {selectedSample.result.deberta.confidence ? (selectedSample.result.deberta.confidence * 100).toFixed(2) : '0.00'}%
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Single result format
                    <div>
                      <div className={styles.label}>
                        Prediction: <span className={selectedSample.result.prediction === 0 ? styles.fake : styles.genuine}>
                          {selectedSample.result.prediction === 0 ? 'Fake Review' : 'Genuine Review'}
                        </span>
                      </div>
                      <div className={styles.confidence}>
                        Confidence: {(selectedSample.result.confidence * 100).toFixed(2)}%
                      </div>
                      <div className={styles.probabilities}>
                        <div>Fake: {(selectedSample.result.probabilities[0] * 100).toFixed(2)}%</div>
                        <div>Genuine: {(selectedSample.result.probabilities[1] * 100).toFixed(2)}%</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.error}>No result data available</div>
              )}
              <button className={styles.closeBtn} onClick={() => setSelectedSample(null)}>Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


