import React, { useState } from 'react';
import axios from 'axios';
import { Calculator as CalcIcon, Activity, Plus, Minus, X, Divide, ChevronRight, Hash } from 'lucide-react';
import clsx from 'clsx';

const operations = [
    { id: 'suma', name: 'Suma (x + y)', params: ['x', 'dx', 'y', 'dy'] },
    { id: 'resta', name: 'Resta (x - y)', params: ['x', 'dx', 'y', 'dy'] },
    { id: 'producto', name: 'Producto (x * y)', params: ['x', 'dx', 'y', 'dy'] },
    { id: 'division', name: 'División (x / y)', params: ['x', 'dx', 'y', 'dy'] },
    { id: 'potencia', name: 'Potencia (x^n)', params: ['n', 'x', 'dx'] },
    { id: 'constante', name: 'Constante (a * x)', params: ['a', 'x', 'dx'] },
    { id: 'exponente', name: 'Exponente (e^x)', params: ['x', 'dx'] },
    { id: 'cos', name: 'Coseno (cos(x))', params: ['x', 'dx'] },
    { id: 'sin', name: 'Seno (sin(x))', params: ['x', 'dx'] },
    { id: 'ln', name: 'Log Natural (ln(x))', params: ['x', 'dx'] },
];

const Calculator = () => {
    const [selectedOp, setSelectedOp] = useState(operations[0]);
    const [inputs, setInputs] = useState({ x: 0, dx: 0, y: 0, dy: 0, n: 0, a: 0 });
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        setInputs({ ...inputs, [e.target.name]: parseFloat(e.target.value) || 0 });
    };

    const handleCalculate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const response = await axios.post('/api/calculate', {
                operation: selectedOp.id,
                ...inputs
            });
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || "Error calculating");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CalcIcon className="w-6 h-6 text-primary" />
                Error Propagation Calculator
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Operation</label>
                        <div className="grid grid-cols-2 gap-2">
                            {operations.map(op => (
                                <button
                                    key={op.id}
                                    onClick={() => { setSelectedOp(op); setResult(null); }}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-sm text-left transition-colors border",
                                        selectedOp.id === op.id
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "hover:bg-accent border-transparent"
                                    )}
                                >
                                    {op.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 bg-muted/30 p-6 rounded-xl">
                    <h3 className="font-semibold text-lg border-b pb-2 mb-4">{selectedOp.name}</h3>

                    <div className="grid grid-cols-2 gap-4">
                        {selectedOp.params.includes('x') && (
                            <div className="space-y-1">
                                <label className="text-xs font-mono text-muted-foreground">x</label>
                                <input name="x" type="number" step="any" className="w-full p-2 rounded-md border bg-background" onChange={handleInputChange} />
                            </div>
                        )}
                        {selectedOp.params.includes('dx') && (
                            <div className="space-y-1">
                                <label className="text-xs font-mono text-muted-foreground">Δx</label>
                                <input name="dx" type="number" step="any" className="w-full p-2 rounded-md border bg-background" onChange={handleInputChange} />
                            </div>
                        )}
                        {selectedOp.params.includes('y') && (
                            <div className="space-y-1">
                                <label className="text-xs font-mono text-muted-foreground">y</label>
                                <input name="y" type="number" step="any" className="w-full p-2 rounded-md border bg-background" onChange={handleInputChange} />
                            </div>
                        )}
                        {selectedOp.params.includes('dy') && (
                            <div className="space-y-1">
                                <label className="text-xs font-mono text-muted-foreground">Δy</label>
                                <input name="dy" type="number" step="any" className="w-full p-2 rounded-md border bg-background" onChange={handleInputChange} />
                            </div>
                        )}
                        {selectedOp.params.includes('n') && (
                            <div className="space-y-1">
                                <label className="text-xs font-mono text-muted-foreground">n</label>
                                <input name="n" type="number" step="any" className="w-full p-2 rounded-md border bg-background" onChange={handleInputChange} />
                            </div>
                        )}
                        {selectedOp.params.includes('a') && (
                            <div className="space-y-1">
                                <label className="text-xs font-mono text-muted-foreground">a</label>
                                <input name="a" type="number" step="any" className="w-full p-2 rounded-md border bg-background" onChange={handleInputChange} />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleCalculate}
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Calculating...' : 'Calculate'}
                    </button>

                    {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

                    {result && (
                        <div className="mt-4 p-4 bg-background rounded-lg border shadow-sm animate-in fade-in slide-in-from-bottom-2">
                            <div className="text-sm text-muted-foreground">Result</div>
                            <div className="text-2xl font-mono font-bold">
                                {result.value?.toExponential(4)}
                                <span className="text-muted-foreground mx-1">±</span>
                                {result.uncertainty?.toExponential(4)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Calculator;
