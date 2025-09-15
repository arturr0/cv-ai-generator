import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [tech, setTech] = useState('Node.js');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `${query} ${tech}`, location })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setResults(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>CV Generator</h1>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input placeholder="Job title" value={query} onChange={(e) => setQuery(e.target.value)} style={{ padding: 8 }} />
        <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} style={{ padding: 8 }} />
        <select value={tech} onChange={(e) => setTech(e.target.value)} style={{ padding: 8 }}>
          <option>Node.js</option>
          <option>React</option>
          <option>Python</option>
          <option>C++</option>
        </select>
        <button style={{ padding: '8px 12px' }}>{loading ? 'Working...' : 'Search & Generate'}</button>
      </form>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <ul>
        {results.map((job, i) => (
          <li key={i} style={{ marginBottom: 12 }}>
            <div><strong>{job.title}</strong> @ {job.company}</div>
            <div>{job.location}</div>
            <a href={`/cvs/${job.cv_filename}`} target="_blank" rel="noreferrer">Download PDF</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
