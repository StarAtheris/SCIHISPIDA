import React, { useState } from 'react';
import axios from 'axios';

const operations = [
    { id: 'suma', name: 'Suma (x + y)', params: ['x', 'dx', 'y', 'dy'] },
    { id: 'resta', name: 'Resta (x − y)', params: ['x', 'dx', 'y', 'dy'] },
    { id: 'producto', name: 'Producto (x · y)', params: ['x', 'dx', 'y', 'dy'] },
    { id: 'division', name: 'División (x / y)', params: ['x', 'dx', 'y', 'dy'] },
    { id: 'potencia', name: 'Potencia (xⁿ)', params: ['n', 'x', 'dx'] },
    { id: 'constante', name: 'Constante (a · x)', params: ['a', 'x', 'dx'] },
    { id: 'exponente', name: 'Exponente (eˣ)', params: ['x', 'dx'] },
    { id: 'cos', name: 'Coseno cos(x)', params: ['x', 'dx'] },
    { id: 'sin', name: 'Seno sin(x)', params: ['x', 'dx'] },
    { id: 'ln', name: 'Log Natural ln(x)', params: ['x', 'dx'] },
];

const Calculator = () => {
    const [selectedOp, setSelectedOp] = useState(operations[0]);
    const [inputs, setInputs] = useState({ x: '', dx: '', y: '', dy: '', n: '', a: '' });
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

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
            const response = await axios.post('/api/calculate', payload);
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al calcular');
        } finally {
            setLoading(false);
        }
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
                            >
                                {op.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Input form */}
                <div className="form-panel">
                    <h3 className="section-title">{selectedOp.name}</h3>

                    <div className="grid-2" style={{ marginBottom: 20 }}>
                        {selectedOp.params.includes('x') && (
                            <div className="input-group">
                                <label className="input-label">x</label>
                                <input
                                    name="x"
                                    type="number"
                                    step="any"
                                    className="input-field"
                                    placeholder="0"
                                    value={inputs.x}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}
                        {selectedOp.params.includes('dx') && (
                            <div className="input-group">
                                <label className="input-label">Δx</label>
                                <input
                                    name="dx"
                                    type="number"
                                    step="any"
                                    className="input-field"
                                    placeholder="0"
                                    value={inputs.dx}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}
                        {selectedOp.params.includes('y') && (
                            <div className="input-group">
                                <label className="input-label">y</label>
                                <input
                                    name="y"
                                    type="number"
                                    step="any"
                                    className="input-field"
                                    placeholder="0"
                                    value={inputs.y}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}
                        {selectedOp.params.includes('dy') && (
                            <div className="input-group">
                                <label className="input-label">Δy</label>
                                <input
                                    name="dy"
                                    type="number"
                                    step="any"
                                    className="input-field"
                                    placeholder="0"
                                    value={inputs.dy}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}
                        {selectedOp.params.includes('n') && (
                            <div className="input-group">
                                <label className="input-label">n (exponente)</label>
                                <input
                                    name="n"
                                    type="number"
                                    step="any"
                                    className="input-field"
                                    placeholder="0"
                                    value={inputs.n}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}
                        {selectedOp.params.includes('a') && (
                            <div className="input-group">
                                <label className="input-label">a (constante)</label>
                                <input
                                    name="a"
                                    type="number"
                                    step="any"
                                    className="input-field"
                                    placeholder="0"
                                    value={inputs.a}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleCalculate}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Calculando...' : 'Calcular'}
                    </button>

                    {error && <div className="error-text">{error}</div>}

                    {result && (
                        <div className="result-box">
                            <div className="result-label">Resultado</div>
                            <div className="result-value">
                                {result.value?.toExponential(5)}
                                <span className="pm">±</span>
                                {result.uncertainty?.toExponential(5)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Calculator;
