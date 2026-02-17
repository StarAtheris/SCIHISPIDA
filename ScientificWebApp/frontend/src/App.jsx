import React, { useState } from 'react';
import Calculator from './components/Calculator';
import Fitter from './components/Fitter';
import { LayoutDashboard, Activity, Calculator as CalcIcon } from 'lucide-react';
import clsx from 'clsx';

function App() {
  const [activeTab, setActiveTab] = useState('calculator');

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Activity className="w-6 h-6 text-primary" />
            <span>SciHispida</span>
          </div>

          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('calculator')}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                activeTab === 'calculator'
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <CalcIcon className="w-4 h-4" />
              Calculator
            </button>
            <button
              onClick={() => setActiveTab('fitter')}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                activeTab === 'fitter'
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Curve Fitting
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'calculator' ? <Calculator /> : <Fitter />}
        </div>
      </main>
    </div>
  );
}

export default App;
