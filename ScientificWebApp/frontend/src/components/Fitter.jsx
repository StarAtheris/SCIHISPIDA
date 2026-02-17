import React, { useState } from 'react';
import axios from 'axios';
import { LineChart, Plus, Trash2, Download } from 'lucide-react';

const Fitter = () => {
    const [points, setPoints] = useState([{ x: 0, y: 0, dx: 0, dy: 0 }]);
    const [meta, setMeta] = useState({ title: 'Experiment 1', xlabel: 'Volts (V)', ylabel: 'Current (A)' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const updatePoint = (index, field, value) => {
        const newPoints = [...points];
        newPoints[index][field] = parseFloat(value) || 0;
        setPoints(newPoints);
    };

    const addPoint = () => {
        setPoints([...points, { x: 0, y: 0, dx: 0, dy: 0 }]);
    };

    const removePoint = (index) => {
        if (points.length > 1) {
            setPoints(points.filter((_, i) => i !== index));
        }
    };

    const handleFit = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = {
                x: points.map(p => p.x),
                y: points.map(p => p.y),
                dx: points.map(p => p.dx),
                dy: points.map(p => p.dy),
                ...meta
            };
            const response = await axios.post('/api/fit', data);
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || "Error performing fit");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <LineChart className="w-6 h-6 text-primary" />
                    Linear Regression Fit
                </h2>

                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 gap-4">
                        <input
                            placeholder="Graph Title"
                            className="w-full p-2 rounded-md border bg-background"
                            value={meta.title}
                            onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                placeholder="X Label"
                                className="w-full p-2 rounded-md border bg-background"
                                value={meta.xlabel}
                                onChange={(e) => setMeta({ ...meta, xlabel: e.target.value })}
                            />
                            <input
                                placeholder="Y Label"
                                className="w-full p-2 rounded-md border bg-background"
                                value={meta.ylabel}
                                onChange={(e) => setMeta({ ...meta, ylabel: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-2 mb-4 space-y-2">
                    {points.map((p, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <span className="w-6 text-xs text-muted-foreground font-mono">{i + 1}</span>
                            <input placeholder="x" type="number" className="w-full p-2 rounded border bg-background text-sm" value={p.x} onChange={(e) => updatePoint(i, 'x', e.target.value)} />
                            <input placeholder="dx" type="number" className="w-full p-2 rounded border bg-background text-sm" value={p.dx} onChange={(e) => updatePoint(i, 'dx', e.target.value)} />
                            <input placeholder="y" type="number" className="w-full p-2 rounded border bg-background text-sm" value={p.y} onChange={(e) => updatePoint(i, 'y', e.target.value)} />
                            <input placeholder="dy" type="number" className="w-full p-2 rounded border bg-background text-sm" value={p.dy} onChange={(e) => updatePoint(i, 'dy', e.target.value)} />
                            <button onClick={() => removePoint(i)} className="text-destructive hover:bg-destructive/10 p-2 rounded">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={addPoint} className="flex-1 py-2 border border-dashed border-primary/50 text-primary rounded-md hover:bg-primary/5 transition-colors flex justify-center items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Data Point
                    </button>
                    <button onClick={handleFit} disabled={loading} className="flex-1 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        {loading ? 'Fitting...' : 'Perform Fit'}
                    </button>
                </div>
                {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            </div>

            <div className="space-y-6">
                {result && (
                    <>
                        <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
                            <h3 className="font-semibold mb-4">Fit Statistics</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 bg-muted/20 rounded">
                                    <div className="text-muted-foreground">Chi2 / NDOF</div>
                                    <div className="font-mono font-bold text-lg">{result.stats.chi2_ndof.toFixed(4)}</div>
                                </div>
                                <div className="p-3 bg-muted/20 rounded">
                                    <div className="text-muted-foreground">Chi2</div>
                                    <div className="font-mono">{result.stats.chi2.toFixed(4)}</div>
                                </div>
                                <div className="p-3 bg-muted/20 rounded col-span-2">
                                    <div className="text-muted-foreground">Slope (m)</div>
                                    <div className="font-mono font-bold">
                                        {result.stats.p1.toExponential(4)} ± {result.stats.p1_error.toExponential(4)}
                                    </div>
                                </div>
                                <div className="p-3 bg-muted/20 rounded col-span-2">
                                    <div className="text-muted-foreground">Intercept (c)</div>
                                    <div className="font-mono font-bold">
                                        {result.stats.p0.toExponential(4)} ± {result.stats.p0_error.toExponential(4)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white rounded-xl shadow-sm border border-border flex justify-center items-center">
                            <img src={`data:image/png;base64,${result.image}`} alt="Fit Plot" className="max-w-full h-auto rounded" />
                        </div>
                    </>
                )}
                {!result && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 border-2 border-dashed rounded-xl">
                        <LineChart className="w-12 h-12 mb-4 opacity-20" />
                        <p>Enter data points and click "Perform Fit"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Fitter;
