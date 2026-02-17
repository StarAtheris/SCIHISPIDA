import React, { useState } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Line, ReferenceLine } from 'recharts';

const Gauss = () => {
    const [values, setValues] = useState(['', '', '']);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const updateValue = (index, val) => {
        const newValues = [...values];
        newValues[index] = val;
        setValues(newValues);
    };

    const addValue = () => setValues([...values, '']);

    const removeValue = (index) => {
        if (values.length > 2) setValues(values.filter((_, i) => i !== index));
    };

    const handleCalculate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const nums = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
            if (nums.length < 2) {
                setError('At least 2 values needed');
                setLoading(false);
                return;
            }
            const response = await axios.post('/api/gauss', { values: nums });
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error');
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = () => {
        if (!result) return [];

        // Create histogram buckets
        const nums = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        const min = Math.min(...nums);
        const max = Math.max(...nums);
        const range = max - min || 1;
        const nBins = Math.min(Math.ceil(Math.sqrt(nums.length)), 10);
        const step = range / nBins || 1;

        const bins = Array.from({ length: nBins }, (_, i) => ({
            binStart: min + i * step,
            binEnd: min + (i + 1) * step,
            mid: min + (i + 0.5) * step,
            count: 0
        }));

        nums.forEach(n => {
            const binIndex = Math.min(Math.floor((n - min) / step), nBins - 1);
            if (bins[binIndex]) bins[binIndex].count++;
        });

        const total = nums.length;
        // Normalize count to density roughly for visualization with PDF? 
        // Or just show counts. For simplicity and correctness in visualization, showing counts and scaling PDF is complex.
        // Let's just show the points and a normal curve overlay "conceptually".
        // Actually, generating a true separate normal curve data series is better.

        const mean = result.mean;
        const sigma = result.stdev;

        // Generate normal curve points
        const curvePoints = [];
        const curveStep = (max - min + 2 * sigma) / 50;
        const startX = min - sigma;
        const endX = max + sigma;

        // Scale factor to match histogram height approx?
        // Max count is max(bins.count). Peak of Gaussian is 1/(sigma*sqrt(2pi)).
        // Scale = MaxCount / GaussianPeak
        const maxCount = Math.max(...bins.map(b => b.count));
        const gaussianPeak = 1 / (sigma * Math.sqrt(2 * Math.PI));
        const scale = gaussianPeak > 0 ? maxCount / gaussianPeak : 1;

        for (let x = startX; x <= endX; x += curveStep) {
            const pdf = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / sigma, 2));
            curvePoints.push({ x, pdf: pdf * scale });
        }

        return { bins, curvePoints };
    };

    const chartData = generateChartData();

    return (
        <div className="two-col">
            <div className="card">
                <h2 className="card-title"><div className="card-title-icon">📊</div> Distribución Normal</h2>
                <div className="data-scroll">
                    {values.map((v, i) => (
                        <div key={i} className="data-row">
                            <span className="row-num">{i + 1}</span>
                            <input className="input-field" type="number" step="any" placeholder="Valor" value={v} onChange={(e) => updateValue(i, e.target.value)} />
                            <button onClick={() => removeValue(i)} className="btn-danger-icon">✕</button>
                        </div>
                    ))}
                </div>
                <div className="actions-row">
                    <button onClick={addValue} className="btn-outline">+ Agregar</button>
                    <button onClick={handleCalculate} disabled={loading} className="btn-primary" style={{ flex: 1 }}>Calcular</button>
                </div>
                {error && <div className="error-text">{error}</div>}
            </div>

            <div>
                {result ? (
                    <>
                        <div className="card" style={{ marginBottom: 20 }}>
                            <div className="stats-grid">
                                <div className="stat-card"><div className="stat-label">Media (x̄)</div><div className="stat-value">{result.mean?.toExponential(4)}</div></div>
                                <div className="stat-card"><div className="stat-label">Error (σ/√n)</div><div className="stat-value">{result.error?.toExponential(4)}</div></div>
                                <div className="stat-card wide"><div className="stat-label">Resultado Final</div><div className="result-value">{result.mean?.toExponential(4)} ± {result.error?.toExponential(4)}</div></div>
                            </div>
                        </div>

                        <div className="plot-container" style={{ background: 'var(--bg-card)', padding: 10, height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="x" type="number" domain={['auto', 'auto']} allowDataOverflow booking="var(--text-muted)" name="Valor" tickFormatter={(v) => v.toFixed(2)} />
                                    <YAxis stroke="var(--text-muted)" />
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }} />

                                    {/* Normal Curve */}
                                    <Line data={chartData.curvePoints} dataKey="pdf" stroke="var(--accent)" strokeWidth={2} dot={false} name="Curva Normal" type="monotone" />

                                    {/* Mean Line */}
                                    <ReferenceLine x={result.mean} stroke="var(--danger)" strokeDasharray="5 5" label={{ value: 'x̄', fill: 'var(--danger)', position: 'insideTopRight' }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 10 }}>
                                * Curva normal escalada para visualización
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="placeholder-box"><div className="placeholder-icon">📊</div><p>Ingresa datos para calcular</p></div>
                )}
            </div>
        </div>
    );
};

export default Gauss;
