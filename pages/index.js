import { useState, useEffect } from 'react';
//import '../styles/styles.css';

export default function Home() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProfileBuilder, setShowProfileBuilder] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    summary: '',
    experiences: [{ company: '', position: '', startDate: '', endDate: '', description: '' }],
    education: [{ school: '', degree: '', field: '', startDate: '', endDate: '' }],
    skills: []
  });

  // Load profile from localStorage on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('cvProfile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    }
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cvProfile', JSON.stringify(profile));
    }
  }, [profile]);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          location,
          profile // Send the complete profile to the backend
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

  // Experience handlers
  const addExperience = () => {
    setProfile({
      ...profile,
      experiences: [...profile.experiences, { company: '', position: '', startDate: '', endDate: '', description: '' }]
    });
  };

  const updateExperience = (index, field, value) => {
    const updatedExperiences = [...profile.experiences];
    updatedExperiences[index][field] = value;
    setProfile({ ...profile, experiences: updatedExperiences });
  };

  const removeExperience = (index) => {
    const updatedExperiences = profile.experiences.filter((_, i) => i !== index);
    setProfile({ ...profile, experiences: updatedExperiences });
  };

  // Education handlers
  const addEducation = () => {
    setProfile({
      ...profile,
      education: [...profile.education, { school: '', degree: '', field: '', startDate: '', endDate: '' }]
    });
  };

  const updateEducation = (index, field, value) => {
    const updatedEducation = [...profile.education];
    updatedEducation[index][field] = value;
    setProfile({ ...profile, education: updatedEducation });
  };

  const removeEducation = (index) => {
    const updatedEducation = profile.education.filter((_, i) => i !== index);
    setProfile({ ...profile, education: updatedEducation });
  };

  // Skills handlers
  const addSkill = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      setProfile({
        ...profile,
        skills: [...profile.skills, e.target.value.trim()]
      });
      e.target.value = '';
    }
  };

  const removeSkill = (index) => {
    const updatedSkills = profile.skills.filter((_, i) => i !== index);
    setProfile({ ...profile, skills: updatedSkills });
  };

  return (
  <div className="app-container">
    <h1 className="app-title">CV Generator</h1>

    <button 
      onClick={() => setShowProfileBuilder(!showProfileBuilder)}
      className="toggle-button"
    >
      {showProfileBuilder ? 'Hide Profile Builder' : 'Build Your Profile'}
    </button>

    {showProfileBuilder && (
      <div className="profile-builder">
        <h2 className="section-title">Your Professional Profile</h2>
        
        {/* Personal Information */}
        <div className="section">
          <h3>Personal Information</h3>
          <div className="two-col-grid">
            <div>
              <label>Full Name</label>
              <input 
                value={profile.name} 
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                className="input"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label>Email</label>
              <input 
                value={profile.email} 
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                className="input"
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div>
            <label>Phone</label>
            <input 
              value={profile.phone} 
              onChange={(e) => setProfile({...profile, phone: e.target.value})}
              className="input"
              placeholder="+1 234 567 890"
            />
          </div>
          <div>
            <label>Professional Summary</label>
            <textarea 
              value={profile.summary} 
              onChange={(e) => setProfile({...profile, summary: e.target.value})}
              className="textarea"
              placeholder="Experienced software developer with 5+ years in web development..."
            />
          </div>
        </div>

        {/* Work Experience */}
        <div className="section">
          <h3>Work Experience</h3>
          {profile.experiences.map((exp, index) => (
            <div key={index} className="card">
              <div className="two-col-grid">
                <div>
                  <label>Company</label>
                  <input 
                    value={exp.company} 
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    className="input"
                    placeholder="Google"
                  />
                </div>
                <div>
                  <label>Position</label>
                  <input 
                    value={exp.position} 
                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                    className="input"
                    placeholder="Senior Developer"
                  />
                </div>
              </div>
              <div className="two-col-grid">
                <div>
                  <label>Start Date</label>
                  <input 
                    type="date"
                    value={exp.startDate} 
                    onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label>End Date</label>
                  <input 
                    type="date"
                    value={exp.endDate} 
                    onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label>Description</label>
                <textarea 
                  value={exp.description} 
                  onChange={(e) => updateExperience(index, 'description', e.target.value)}
                  className="textarea"
                  placeholder="Responsibilities and achievements in this role..."
                />
              </div>
              <button 
                onClick={() => removeExperience(index)}
                className="remove-button"
              >
                Remove
              </button>
            </div>
          ))}
          <button onClick={addExperience} className="secondary-button">
            + Add Experience
          </button>
        </div>

        {/* Education */}
        <div className="section">
          <h3>Education</h3>
          {profile.education.map((edu, index) => (
            <div key={index} className="card">
              <div>
                <label>School/University</label>
                <input 
                  value={edu.school} 
                  onChange={(e) => updateEducation(index, 'school', e.target.value)}
                  className="input"
                  placeholder="Stanford University"
                />
              </div>
              <div className="two-col-grid">
                <div>
                  <label>Degree</label>
                  <input 
                    value={edu.degree} 
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    className="input"
                    placeholder="Bachelor's"
                  />
                </div>
                <div>
                  <label>Field of Study</label>
                  <input 
                    value={edu.field} 
                    onChange={(e) => updateEducation(index, 'field', e.target.value)}
                    className="input"
                    placeholder="Computer Science"
                  />
                </div>
              </div>
              <div className="two-col-grid">
                <div>
                  <label>Start Date</label>
                  <input 
                    type="date"
                    value={edu.startDate} 
                    onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label>End Date</label>
                  <input 
                    type="date"
                    value={edu.endDate} 
                    onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <button 
                onClick={() => removeEducation(index)}
                className="remove-button"
              >
                Remove
              </button>
            </div>
          ))}
          <button onClick={addEducation} className="secondary-button">
            + Add Education
          </button>
        </div>

        {/* Skills */}
        <div className="section">
          <h3>Skills</h3>
          <div>
            <label>Add Skill (Press Enter)</label>
            <input 
              onKeyPress={addSkill}
              className="input"
              placeholder="JavaScript, React, Node.js..."
            />
          </div>
          <div className="skills-list">
            {profile.skills.map((skill, index) => (
              <div key={index} className="skill-tag">
                {skill}
                <button 
                  onClick={() => removeSkill(index)}
                  className="remove-skill"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    <form onSubmit={handleSearch} className="search-form">
      <input 
        placeholder="Job title" 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
        className="input"
      />
      <input 
        placeholder="Location" 
        value={location} 
        onChange={(e) => setLocation(e.target.value)} 
        className="input"
      />
      <button 
        className="primary-button"
        disabled={loading || !profile.name}
      >
        {loading ? 'Generating CVs...' : 'Search & Generate CVs'}
      </button>
    </form>

    {!profile.name && (
      <div className="warning">
        Please build your profile first before generating CVs.
      </div>
    )}

    {error && <div className="error">{error}</div>}

    <div>
      <h3>Generated CVs ({results.length})</h3>
      <ul className="results-list">
        {results.map((job, i) => (
          <li key={i} className="result-card">
            <div><strong>{job.title}</strong> @ {job.company}</div>
            <div>{job.location}</div>
            <a 
              href={`/cvs/${job.cv_filename}`} 
              target="_blank" 
              rel="noreferrer" 
              className="download-link"
            >
              Download PDF
            </a>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

}