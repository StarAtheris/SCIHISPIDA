import React, { useState } from 'react';
import Calculator from './components/Calculator';
import Fitter from './components/Fitter';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('calculator');

  return (
    <div>
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">Σ</div>
            <span>SciHispida</span>
          </div>
          <nav className="nav">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`nav-btn ${activeTab === 'calculator' ? 'active' : ''}`}
            >
              ⚙ Calculator
            </button>
            <button
              onClick={() => setActiveTab('fitter')}
              className={`nav-btn ${activeTab === 'fitter' ? 'active' : ''}`}
            >
              📈 Curve Fitting
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        {activeTab === 'calculator' ? <Calculator /> : <Fitter />}
      </main>
    </div>
  );
}

export default App;
