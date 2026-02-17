import React, { useState, useEffect } from 'react';
import Calculator from './components/Calculator';
import Fitter from './components/Fitter';
import Gauss from './components/Gauss';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [theme, setTheme] = useState(() => localStorage.getItem('sci-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sci-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <div>
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">Σ</div>
            <span>SciHispida</span>
          </div>
          <div className="header-right">
            <nav className="nav">
              <button onClick={() => setActiveTab('calculator')} className={`nav-btn ${activeTab === 'calculator' ? 'active' : ''}`}>
                ⚙ Calculadora
              </button>
              <button onClick={() => setActiveTab('fitter')} className={`nav-btn ${activeTab === 'fitter' ? 'active' : ''}`}>
                📈 Ajuste
              </button>
              <button onClick={() => setActiveTab('gauss')} className={`nav-btn ${activeTab === 'gauss' ? 'active' : ''}`}>
                📊 Gauss
              </button>
            </nav>
            <button onClick={toggleTheme} className="theme-toggle" title="Cambiar tema">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {activeTab === 'calculator' && <Calculator />}
        {activeTab === 'fitter' && <Fitter />}
        {activeTab === 'gauss' && <Gauss />}
      </main>
      <footer style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '40px' }}>
        SciHispida &copy; 2026<br />
        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>by: StarAtheris</span>
      </footer>
    </div>
  );
}

export default App;
