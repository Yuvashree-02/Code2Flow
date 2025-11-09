import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const languages = [
    { name: "Python", value: "python", color: "#4B8BBE" },
    { name: "JavaScript", value: "javascript", color: "#F7DF1E" },
    { name: "Java", value: "java", color: "#007396" },
    { name: "C", value: "c", color: "#A8B9CC" },
    { name: "C++", value: "cpp", color: "#00599C" },
    { name: "HTML/CSS", value: "html", color: "#E34F26" },
    { name: "SQL", value: "sql", color: "#336791" }
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        Welcome to Code2Flow <span role="img" aria-label="rocket">🚀</span>
      </h1>
      <div style={styles.grid}>
        {languages.map(lang => (
          <Link 
            key={lang.value}
            to={`/editor?lang=${lang.value}`}
            style={{
              ...styles.card,
              borderColor: lang.color
            }}
          >
            <h2 style={styles.langTitle}>{lang.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 1200,
    margin: '40px auto',
    padding: '0 20px'
  },
  title: {
    textAlign: 'center',
    fontSize: '2.5rem',
    color: '#111827',
    marginBottom: 40
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    padding: '20px'
  },
  card: {
    background: '#fff',
    padding: '30px',
    borderRadius: '12px',
    textDecoration: 'none',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    border: '2px solid transparent',
    minHeight: '150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 15px rgba(0,0,0,0.1)'
    }
  },
  langTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#4B0082'
  }
};

export default Home;