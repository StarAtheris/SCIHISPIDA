import React, { useState } from 'react';
import axios from 'axios';

const Fitter = () => {
    const [points, setPoints] = useState([
        { x: '', y: '', dx: '', dy: '' },
        { x: '', y: '', dx: '', dy: '' },
        { x: '', y: '', dx: '', dy: '' },
    ]);
    const [meta, setMeta] = useState({ title: 'Experimento 1', xlabel: 'Voltaje (V)', ylabel: 'Corriente (A)' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const updatePoint = (index, field, value) => {
        const newPoints = [...points];
        newPoints[index] = { ...newPoints[index], [field]: value };
        setPoints(newPoints);
    };

    const addPoint = () => {
        setPoints([...points, { x: '', y: '', dx: '', dy: '' }]);
    };

    const removePoint = (index) => {
        if (points.length > 2) {
            setPoints(points.filter((_, i) => i !== index));
        }
    };

    const handleFit = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = {
                x: points.map(p => parseFloat(p.x) || 0),
                y: points.map(p => parseFloat(p.y) || 0),
                dx: points.map(p => parseFloat(p.dx) || 0),
                dy: points.map(p => parseFloat(p.dy) || 0),
                ...meta,
            };
            const response = await axios.post('/api/fit', data);
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error en el ajuste');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="two-col">
            {/* Left: Data entry */}
            <div className="card">
                <h2 className="card-title">
                    <div className="card-title-icon">📊</div>
                    Ajuste Lineal (χ²)
                </h2>

                <div className="meta-inputs">
                    <input
                        className="input-field"
                        placeholder="Título del gráfico"
                        value={meta.title}
                        onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                    />
                    <div className="meta-row">
                        <input
                            className="input-field"
                            placeholder="Eje X"
                            value={meta.xlabel}
                            onChange={(e) => setMeta({ ...meta, xlabel: e.target.value })}
                        />
                        <input
                            className="input-field"
                            placeholder="Eje Y"
                            value={meta.ylabel}
                            onChange={(e) => setMeta({ ...meta, ylabel: e.target.value })}
                        />
                    </div>
                </div>

                {/* Column headers */}
                <div className="data-row" style={{ marginBottom: 4 }}>
                    <span className="row-num">#</span>
                    <span className="input-label" style={{ flex: 1, textAlign: 'center' }}>x</span>
                    <span className="input-label" style={{ flex: 1, textAlign: 'center' }}>Δx</span>
                    <span className="input-label" style={{ flex: 1, textAlign: 'center' }}>y</span>
                    <span className="input-label" style={{ flex: 1, textAlign: 'center' }}>Δy</span>
                    <span style={{ width: 32 }}></span>
                </div>

                <div className="data-scroll">
                    {points.map((p, i) => (
                        <div key={i} className="data-row">
                            <span className="row-num">{i + 1}</span>
                            <input className="input-field" type="number" step="any" placeholder="x" value={p.x} onChange={(e) => updatePoint(i, 'x', e.target.value)} />
                            <input className="input-field" type="number" step="any" placeholder="Δx" value={p.dx} onChange={(e) => updatePoint(i, 'dx', e.target.value)} />
                            <input className="input-field" type="number" step="any" placeholder="y" value={p.y} onChange={(e) => updatePoint(i, 'y', e.target.value)} />
                            <input className="input-field" type="number" step="any" placeholder="Δy" value={p.dy} onChange={(e) => updatePoint(i, 'dy', e.target.value)} />
                            <button onClick={() => removePoint(i)} className="btn-danger-icon" title="Eliminar">✕</button>
                        </div>
                    ))}
                </div>

                <div className="actions-row">
                    <button onClick={addPoint} className="btn-outline">+ Agregar punto</button>
                    <button onClick={handleFit} disabled={loading} className="btn-primary" style={{ flex: 1 }}>
                        {loading ? 'Ajustando...' : 'Realizar Ajuste'}
                    </button>
                </div>

                {error && <div className="error-text">{error}</div>}
            </div>

            {/* Right: Results */}
            <div>
                {result ? (
                    <>
                        <div className="card" style={{ marginBottom: 20 }}>
                            <h3 className="section-title">Estadísticas del Ajuste</h3>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-label">χ² / NDOF</div>
                                    <div className="stat-value">{result.stats.chi2_ndof.toFixed(4)}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">χ²</div>
                                    <div className="stat-value">{result.stats.chi2.toFixed(4)}</div>
                                </div>
                                <div className="stat-card wide">
                                    <div className="stat-label">Pendiente (m)</div>
                                    <div className="stat-value">
                                        {result.stats.p1.toExponential(4)} ± {result.stats.p1_error.toExponential(4)}
                                    </div>
                                </div>
                                <div className="stat-card wide">
                                    <div className="stat-label">Intercepto (b)</div>
                                    <div className="stat-value">
                                        {result.stats.p0.toExponential(4)} ± {result.stats.p0_error.toExponential(4)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="plot-container">
                            <img src={`data:image/png;base64,${result.image}`} alt="Gráfico del Ajuste" />
                        </div>
                    </>
                ) : (
                    <div className="placeholder-box">
                        <div className="placeholder-icon">📈</div>
                        <p>Ingresa datos y presiona "Realizar Ajuste"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Fitter;
