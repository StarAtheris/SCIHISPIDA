import React, { useState } from 'react';
import axios from 'axios';

const operations = [
    { id: 'suma', name: 'Suma (x + y)', params: ['x', 'dx', 'y', 'dy'], formula: 'z = x + y' },
    { id: 'resta', name: 'Resta (x − y)', params: ['x', 'dx', 'y', 'dy'], formula: 'z = x - y' },
    { id: 'producto', name: 'Producto (x · y)', params: ['x', 'dx', 'y', 'dy'], formula: 'z = x · y' },
    { id: 'division', name: 'División (x / y)', params: ['x', 'dx', 'y', 'dy'], formula: 'z = x / y' },
    { id: 'potencia', name: 'Potencia (xⁿ)', params: ['n', 'x', 'dx'], formula: 'z = xⁿ' },
    { id: 'constante', name: 'Constante (a · x)', params: ['a', 'x', 'dx'], formula: 'z = a · x' },
    { id: 'exponente', name: 'Exponente (eˣ)', params: ['x', 'dx'], formula: 'z = eˣ' },
    { id: 'cos', name: 'Coseno cos(x)', params: ['x', 'dx'], formula: 'z = cos(x)' },
    { id: 'sin', name: 'Seno sin(x)', params: ['x', 'dx'], formula: 'z = sin(x)' },
    { id: 'ln', name: 'Log Natural ln(x)', params: ['x', 'dx'], formula: 'z = ln(x)' },
    {
        id: 'error_porcentual',
        name: 'Error Porcentual (%)',
        params: ['x', 'dx', 'y', 'dy'],
        labels: { x: 'Teórico (T)', dx: 'ΔT', y: 'Experimental (E)', dy: 'ΔE' },
        formula: '%Error = |T - E| / |T| * 100'
    }
];

const Calculator = () => {
    const [selectedOp, setSelectedOp] = useState(operations[0]);
    const [inputs, setInputs] = useState({ x: '', dx: '', y: '', dy: '', n: '', a: '' });
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    const handleInputChange = (e) => {
        setInputs({ ...inputs, [e.target.name]: e.target.value });
    };

    const handleCalculate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const payload = {
                operation: selectedOp.id,
                x: parseFloat(inputs.x) || 0,
                dx: parseFloat(inputs.dx) || 0,
                y: parseFloat(inputs.y) || 0,
                dy: parseFloat(inputs.dy) || 0,
                n: parseFloat(inputs.n) || 0,
                a: parseFloat(inputs.a) || 0,
            };

            const opName = selectedOp.id === 'error_porcentual' ? 'api/calculate' : 'api/calculate'; // Same endpoint
            // Actually we need to pass operation name in payload

            const response = await axios.post('/api/calculate', payload);
            setResult(response.data);

            // Add to history
            if (response.data.value !== undefined) {
                setHistory(prev => [{
                    op: selectedOp.name,
                    value: response.data.value,
                    uncertainty: response.data.uncertainty,
                    isPercent: selectedOp.id === 'error_porcentual',
                    timestamp: new Date().toLocaleTimeString(),
                }, ...prev].slice(0, 20));
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al calcular');
        } finally {
            setLoading(false);
        }
    };

    const getLabel = (param) => {
        if (selectedOp.labels && selectedOp.labels[param]) return selectedOp.labels[param];
        if (param === 'x') return 'x';
        if (param === 'dx') return 'Δx (Error)';
        if (param === 'y') return 'y';
        if (param === 'dy') return 'Δy (Error)';
        if (param === 'n') return 'n (Exponente)';
        if (param === 'a') return 'a (Constante)';
        return param;
    };

    return (
        <div className="card">
            <h2 className="card-title">
                <div className="card-title-icon">📐</div>
                Propagación de Errores
            </h2>

            <div className="grid-2-unequal">
                {/* Left: Operation selector */}
                <div>
                    <div className="input-label" style={{ marginBottom: 10 }}>Operación</div>
                    <div className="ops-grid">
                        {operations.map(op => (
                            <button
                                key={op.id}
                                onClick={() => { setSelectedOp(op); setResult(null); setError(null); }}
                                className={`op-btn ${selectedOp.id === op.id ? 'active' : ''}`}
                                style={op.id === 'error_porcentual' ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
                            >
                                {op.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Input form */}
                <div className="form-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 className="section-title" style={{ marginBottom: 0, border: 'none' }}>{selectedOp.name}</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', background: 'var(--bg)', padding: '4px 8px', borderRadius: 6 }}>
                            {selectedOp.formula}
                        </span>
                    </div>

                    <div className="grid-2" style={{ marginBottom: 20 }}>
                        {selectedOp.params.includes('x') && (
                            <div className="input-group">
                                <label className="input-label">{getLabel('x')}</label>
                                <input name="x" type="number" step="any" className="input-field" placeholder="0" value={inputs.x} onChange={handleInputChange} />
                            </div>
                        )}
                        {selectedOp.params.includes('dx') && (
                            <div className="input-group">
                                <label className="input-label">{getLabel('dx')}</label>
                                <input name="dx" type="number" step="any" className="input-field" placeholder="0" value={inputs.dx} onChange={handleInputChange} />
                            </div>
                        )}
                        {selectedOp.params.includes('y') && (
                            <div className="input-group">
                                <label className="input-label">{getLabel('y')}</label>
                                <input name="y" type="number" step="any" className="input-field" placeholder="0" value={inputs.y} onChange={handleInputChange} />
                            </div>
                        )}
                        {selectedOp.params.includes('dy') && (
                            <div className="input-group">
                                <label className="input-label">{getLabel('dy')}</label>
                                <input name="dy" type="number" step="any" className="input-field" placeholder="0" value={inputs.dy} onChange={handleInputChange} />
                            </div>
                        )}
                        {selectedOp.params.includes('n') && (
                            <div className="input-group">
                                <label className="input-label">{getLabel('n')}</label>
                                <input name="n" type="number" step="any" className="input-field" placeholder="0" value={inputs.n} onChange={handleInputChange} />
                            </div>
                        )}
                        {selectedOp.params.includes('a') && (
                            <div className="input-group">
                                <label className="input-label">{getLabel('a')}</label>
                                <input name="a" type="number" step="any" className="input-field" placeholder="0" value={inputs.a} onChange={handleInputChange} />
                            </div>
                        )}
                    </div>

                    <button onClick={handleCalculate} disabled={loading} className="btn-primary">
                        {loading ? 'Calculando...' : 'Calcular'}
                    </button>

                    {error && <div className="error-text">{error}</div>}

                    {result && (
                        <div className="result-box">
                            <div className="result-label">Resultado</div>
                            <div className="result-value">
                                {result.value?.toExponential(4)}
                                {selectedOp.id === 'error_porcentual' ? '%' : ''}
                                <span className="pm">±</span>
                                {result.uncertainty?.toExponential(4)}
                                {selectedOp.id === 'error_porcentual' ? '%' : ''}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Calculation History */}
            {history.length > 0 && (
                <div className="history-panel">
                    <div className="history-title">
                        <span>🕐 Historial ({history.length})</span>
                        <button className="btn-secondary" onClick={() => setHistory([])}>Limpiar</button>
                    </div>
                    <div className="history-list">
                        {history.map((h, i) => (
                            <div key={i} className="history-item">
                                <div>
                                    <span className="history-op">{h.op}</span>
                                    <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', marginLeft: 8 }}>{h.timestamp}</span>
                                </div>
                                <span className="history-result">
                                    {h.value?.toExponential(3)}{h.isPercent ? '%' : ''} ± {h.uncertainty?.toExponential(3)}{h.isPercent ? '%' : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calculator;
