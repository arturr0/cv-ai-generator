import { useState, useEffect } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [tech, setTech] = useState('Node.js');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [customTemplate, setCustomTemplate] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [savedTemplates, setSavedTemplates] = useState({});

  // Load templates from localStorage on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const templates = JSON.parse(localStorage.getItem('cvTemplates') || '{}');
      setSavedTemplates(templates);
    }
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `${query} ${tech}`, 
          location,
          customTemplate: customTemplate || null,
          templateName: templateName || null
        })
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

  function handleSaveTemplate() {
    if (!customTemplate.trim() || !templateName.trim()) {
      setError('Template name and content are required');
      return;
    }
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      const templates = JSON.parse(localStorage.getItem('cvTemplates') || '{}');
      templates[templateName] = customTemplate;
      localStorage.setItem('cvTemplates', JSON.stringify(templates));
      setSavedTemplates(templates);
    }
    
    setError('Template saved successfully!');
    setTimeout(() => setError(null), 2000);
  }

  function handleLoadTemplate(name) {
    if (savedTemplates[name]) {
      setCustomTemplate(savedTemplates[name]);
      setTemplateName(name);
    }
  }

  function handleDeleteTemplate(name) {
    if (typeof window !== 'undefined') {
      const templates = {...savedTemplates};
      delete templates[name];
      localStorage.setItem('cvTemplates', JSON.stringify(templates));
      setSavedTemplates(templates);
      
      if (templateName === name) {
        setCustomTemplate('');
        setTemplateName('');
      }
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>CV Generator</h1>
      
      <button 
        onClick={() => setShowTemplateBuilder(!showTemplateBuilder)}
        style={{ marginBottom: 16, padding: '8px 12px', background: '#f0f0f0', border: '1px solid #ccc' }}
      >
        {showTemplateBuilder ? 'Hide Template Builder' : 'Build Custom Template'}
      </button>

      {showTemplateBuilder && (
        <div style={{ marginBottom: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
          <h3 style={{ marginBottom: 12 }}>Custom Template Builder</h3>
          
          <div style={{ marginBottom: 12 }}>
            <input 
              placeholder="Template Name" 
              value={templateName} 
              onChange={(e) => setTemplateName(e.target.value)}
              style={{ padding: 8, width: '100%', marginBottom: 8 }}
            />
            <textarea 
              placeholder="Enter your custom CV template here. Use placeholders like {name}, {experience}, etc."
              value={customTemplate} 
              onChange={(e) => setCustomTemplate(e.target.value)}
              rows={10}
              style={{ padding: 8, width: '100%', fontFamily: 'monospace' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={handleSaveTemplate} style={{ padding: '8px 12px' }}>
              Save Template
            </button>
          </div>
          
          {Object.keys(savedTemplates).length > 0 && (
            <div>
              <h4>Saved Templates:</h4>
              {Object.entries(savedTemplates).map(([name, content]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span>{name}</span>
                  <button onClick={() => handleLoadTemplate(name)} style={{ padding: '4px 8px', fontSize: 12 }}>
                    Load
                  </button>
                  <button onClick={() => handleDeleteTemplate(name)} style={{ padding: '4px 8px', fontSize: 12, background: '#ffcccc' }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
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

      {error && <div style={{ color: error.includes('successfully') ? 'green' : 'red', marginBottom: 16 }}>{error}</div>}

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