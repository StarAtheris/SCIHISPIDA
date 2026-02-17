import React, { useState, useRef } from 'react';
import axios from 'axios';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Legend, ErrorBar } from 'recharts';

const Fitter = () => {
    const [points, setPoints] = useState([
        { x: '', y: '', dx: '', dy: '' },
        { x: '', y: '', dx: '', dy: '' },
        { x: '', y: '', dx: '', dy: '' },
    ]);
    const [meta, setMeta] = useState({ title: 'Experimento 1', xlabel: 'Voltaje (V)', ylabel: 'Corriente (A)' });
    const [model, setModel] = useState('linear');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadMsg, setUploadMsg] = useState(null);
    const [predictX, setPredictX] = useState('');
    const [prediction, setPrediction] = useState(null);
    const fileRef = useRef(null);

    const updatePoint = (index, field, value) => {
        const newPoints = [...points];
        newPoints[index] = { ...newPoints[index], [field]: value };
        setPoints(newPoints);
    };

    const addPoint = () => setPoints([...points, { x: '', y: '', dx: '', dy: '' }]);

    const removePoint = (index) => {
        if (points.length > 2) setPoints(points.filter((_, i) => i !== index));
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadMsg(null);
        setError(null);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await axios.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const data = response.data;
            const newPoints = data.x.map((_, i) => ({
                x: String(data.x[i]),
                y: String(data.y[i]),
                dx: String(data.dx[i]),
                dy: String(data.dy[i]),
            }));
            setPoints(newPoints);
            setUploadMsg(`✅ ${data.n_rows} filas importadas`);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al importar archivo');
        }
        if (fileRef.current) fileRef.current.value = '';
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
                model,
                ...meta,
            };
            const response = await axios.post('/api/fit', data);
            setResult(response.data);
            setPrediction(null);
            setPredictX('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Error en el ajuste');
        } finally {
            setLoading(false);
        }
    };

    // Prediction Logic
    const handlePredict = () => {
        if (!result || !predictX) return;
        const x = parseFloat(predictX);
        if (isNaN(x)) return;

        const params = result.stats.params;
        let y = 0;

        // Simple prediction without full error propagation for now (as requested "calculate Y ... using fit params")
        // Full error propagation for prediction requires covariance matrix which we don't strictly have in simple output

        if (model === 'linear') {
            const a = params.a.value;
            const b = params.b.value;
            y = a * x + b;
        } else if (model === 'quadratic') {
            const a = params.a.value;
            const b = params.b.value;
            const c = params.c.value;
            y = a * x * x + b * x + c;
        } else if (model === 'exponential') {
            const a = params.a.value;
            const b = params.b.value;
            y = a * Math.exp(b * x);
        }

        setPrediction(y);
    };

    const generateChartData = () => {
        if (!result) return [];

        const dataPoints = points.map(p => ({
            x: parseFloat(p.x) || 0,
            y: parseFloat(p.y) || 0,
            dx: parseFloat(p.dx) || 0,
            dy: parseFloat(p.dy) || 0,
        }));

        // Generate fit line points
        const minX = Math.min(...dataPoints.map(p => p.x));
        const maxX = Math.max(...dataPoints.map(p => p.x));
        const range = maxX - minX || 1;
        const step = range / 50;
        const fitLine = [];

        for (let x = minX - range * 0.1; x <= maxX + range * 0.1; x += step) {
            let y = 0;
            const params = result.stats.params;
            if (model === 'linear') y = params.a.value * x + params.b.value;
            else if (model === 'quadratic') y = params.a.value * x * x + params.b.value * x + params.c.value;
            else if (model === 'exponential') y = params.a.value * Math.exp(params.b.value * x);
            fitLine.push({ x, y_fit: y });
        }

        return { dataPoints, fitLine };
    };

    const chartData = generateChartData();

    const modelOptions = [
        { value: 'linear', label: 'Lineal (ax + b)' },
        { value: 'quadratic', label: 'Cuadrático (ax² + bx + c)' },
        { value: 'exponential', label: 'Exponencial (a·eᵇˣ)' },
    ];

    return (
        <div className="two-col">
            {/* Left: Input */}
            <div className="card">
                <h2 className="card-title"><div className="card-title-icon">📈</div> Ajuste de Curva (χ²)</h2>

                <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)' }}>
                    <div className="input-label" style={{ marginBottom: 8 }}>📂 Importar datos (CSV / Excel)</div>
                    <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleFileUpload} style={{ fontSize: '0.85rem' }} />
                    {uploadMsg && <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--accent)' }}>{uploadMsg}</div>}
                </div>

                <div className="meta-inputs">
                    <input className="input-field" placeholder="Título" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
                    <div className="meta-row">
                        <input className="input-field" placeholder="Eje X" value={meta.xlabel} onChange={(e) => setMeta({ ...meta, xlabel: e.target.value })} />
                        <input className="input-field" placeholder="Eje Y" value={meta.ylabel} onChange={(e) => setMeta({ ...meta, ylabel: e.target.value })} />
                    </div>
                    <select className="select-field" value={model} onChange={(e) => setModel(e.target.value)}>
                        {modelOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>

                <div className="data-row" style={{ marginBottom: 4 }}>
                    <span className="row-num">#</span>
                    <span className="input-label" style={{ flex: 1, textAlign: 'center' }}>X</span>
                    <span className="input-label" style={{ flex: 1, textAlign: 'center' }}>Y</span>
                    <span className="input-label" style={{ flex: 1, textAlign: 'center' }}>ΔX</span>
                    <span className="input-label" style={{ flex: 1, textAlign: 'center' }}>ΔY</span>
                    <span style={{ width: 32 }}></span>
                </div>
                <div className="data-scroll">
                    {points.map((p, i) => (
                        <div key={i} className="data-row">
                            <span className="row-num">{i + 1}</span>
                            <input className="input-field" type="number" placeholder="X" value={p.x} onChange={(e) => updatePoint(i, 'x', e.target.value)} />
                            <input className="input-field" type="number" placeholder="Y" value={p.y} onChange={(e) => updatePoint(i, 'y', e.target.value)} />
                            <input className="input-field" type="number" placeholder="ΔX" value={p.dx} onChange={(e) => updatePoint(i, 'dx', e.target.value)} />
                            <input className="input-field" type="number" placeholder="ΔY" value={p.dy} onChange={(e) => updatePoint(i, 'dy', e.target.value)} />
                            <button onClick={() => removePoint(i)} className="btn-danger-icon">✕</button>
                        </div>
                    ))}
                </div>
                <div className="actions-row">
                    <button onClick={addPoint} className="btn-outline">+ Agregar</button>
                    <button onClick={handleFit} disabled={loading} className="btn-primary" style={{ flex: 1 }}>{loading ? 'Ajustando...' : 'Ajustar'}</button>
                </div>
                {error && <div className="error-text">{error}</div>}
            </div>

            {/* Right: Results + Chart */}
            <div>
                {result ? (
                    <>
                        <div className="card" style={{ marginBottom: 20 }}>
                            <h3 className="section-title">Estadísticas</h3>
                            <div className="stats-grid">
                                <div className="stat-card"><div className="stat-label">χ² / NDOF</div><div className="stat-value">{result.stats.chi2_ndof?.toFixed(4)}</div></div>
                                {result.stats.params && Object.entries(result.stats.params).map(([key, val]) => (
                                    <div key={key} className="stat-card wide"><div className="stat-label">Parámetro {key}</div><div className="stat-value">{val.value?.toExponential(4)} ± {val.error?.toExponential(4)}</div></div>
                                ))}
                            </div>

                            {/* Prediction Tool */}
                            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 10, color: 'var(--primary)' }}>🔮 Predicción</h4>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="Valor de X"
                                        value={predictX}
                                        onChange={e => setPredictX(e.target.value)}
                                        style={{ maxWidth: 120 }}
                                    />
                                    <button onClick={handlePredict} className="btn-secondary" style={{ padding: '10px 16px' }}>Calcular Y</button>
                                </div>
                                {prediction !== null && (
                                    <div style={{ marginTop: 10, fontSize: '0.9rem', fontWeight: 600 }}>
                                        Y = <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '1.1rem' }}>{prediction.toExponential(4)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="plot-container" style={{ background: 'var(--bg-card)', padding: 10, height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis
                                        dataKey="x"
                                        type="number"
                                        domain={['auto', 'auto']}
                                        name={meta.xlabel}
                                        label={{ value: meta.xlabel, position: 'bottom', offset: 0, fill: 'var(--text-muted)' }}
                                        stroke="var(--text-muted)"
                                    />
                                    <YAxis
                                        type="number"
                                        domain={['auto', 'auto']}
                                        name={meta.ylabel}
                                        label={{ value: meta.ylabel, angle: -90, position: 'left', fill: 'var(--text-muted)' }}
                                        stroke="var(--text-muted)"
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                        itemStyle={{ color: 'var(--text)' }}
                                        cursor={{ strokeDasharray: '3 3' }}
                                    />
                                    <Legend />

                                    {/* Fit Line */}
                                    <Line
                                        data={chartData.fitLine}
                                        dataKey="y_fit"
                                        stroke="var(--primary)"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Ajuste"
                                        type="monotone"
                                    />

                                    {/* Scatter Data Points */}
                                    <Scatter
                                        data={chartData.dataPoints}
                                        fill="var(--text)"
                                        name="Datos"
                                        shape="circle"
                                    >
                                        <ErrorBar dataKey="dy" direction="y" width={4} strokeWidth={1} stroke="var(--text-dim)" />
                                        <ErrorBar dataKey="dx" direction="x" width={4} strokeWidth={1} stroke="var(--text-dim)" />
                                    </Scatter>
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                ) : (
                    <div className="placeholder-box"><div className="placeholder-icon">📈</div><p>Ingresa datos para graficar</p></div>
                )}
            </div>
        </div>
    );
};

export default Fitter;
