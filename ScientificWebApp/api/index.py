from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import pandas as pd
import io
import logic

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CalculationRequest(BaseModel):
    operation: str
    x: float
    dx: float
    y: Optional[float] = 0.0
    dy: Optional[float] = 0.0
    n: Optional[float] = 0.0
    a: Optional[float] = 0.0

class FitRequest(BaseModel):
    x: List[float]
    y: List[float]
    dx: List[float]
    dy: List[float]
    model: Optional[str] = "linear"
    title: Optional[str] = "Ajuste"
    xlabel: Optional[str] = "Eje X"
    ylabel: Optional[str] = "Eje Y"

class GaussRequest(BaseModel):
    values: List[float]

@app.get("/")
def read_root():
    return {"message": "SciHispida API running"}

@app.post("/api/calculate")
def calculate(req: CalculationRequest):
    op = req.operation.lower()
    try:
        if op == "suma":
            return logic.Suma(req.x, req.dx, req.y, req.dy)
        elif op == "resta":
            return logic.Resta(req.x, req.dx, req.y, req.dy)
        elif op == "producto":
            return logic.Producto(req.x, req.dx, req.y, req.dy)
        elif op == "division":
            return logic.Division(req.x, req.dx, req.y, req.dy)
        elif op == "potencia":
            return logic.Potencia(req.n, req.x, req.dx)
        elif op == "constante":
            return logic.Constante(req.a, req.x, req.dx)
        elif op == "exponente":
            return logic.Exponente(req.x, req.dx)
        elif op == "cos":
            return logic.Cos(req.x, req.dx)
        elif op == "sin":
            return logic.Sin(req.x, req.dx)
        elif op == "ln":
            return logic.Log_nat(req.x, req.dx)
        elif op == "error_porcentual":
            # Map params: x=Theoretical, dx=dTheoretical, y=Experimental, dy=dExperimental
            return logic.ErrorPorcentual(req.x, req.dx, req.y, req.dy)
        else:
            raise HTTPException(status_code=400, detail="Operación inválida")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/fit")
def perform_fit(req: FitRequest):
    try:
        if not (len(req.x) == len(req.y) == len(req.dx) == len(req.dy)):
            raise HTTPException(status_code=400, detail="Las listas deben tener la misma longitud")
        if len(req.x) < 2:
            raise HTTPException(status_code=400, detail="Se necesitan al menos 2 puntos")

        model_type = req.model or "linear"
        if model_type == "quadratic":
            func = logic.funcion_cuadratica
        elif model_type == "exponential":
            func = logic.funcion_exponencial
        else:
            func = logic.funcion_lineal

        stats = logic.funcionChi2(
            np.array(req.x, dtype=float),
            np.array(req.y, dtype=float),
            np.array(req.dy, dtype=float),
            func,
            model_type=model_type
        )

        plot_data = {
            'x': req.x,
            'y': req.y,
            'dx': req.dx,
            'dy': req.dy,
            'params': stats['params'],
            'chi2_ndof': stats['chi2_ndof'],
            'title': req.title,
            'xlabel': req.xlabel,
            'ylabel': req.ylabel,
        }

        img_base64 = logic.graf_plot(plot_data, model_type=model_type)

        return {
            "stats": stats,
            "image": img_base64
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== FILE UPLOAD (CSV/Excel) ==========

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Parse CSV or Excel file with columns: X, Y, EX (or DX), EY (or DY).
    Returns parsed data as JSON arrays."""
    try:
        contents = await file.read()
        filename = file.filename.lower()

        if filename.endswith('.csv') or filename.endswith('.txt'):
            # Try comma, semicolon, tab separators
            for sep in [',', ';', '\t']:
                try:
                    df = pd.read_csv(io.BytesIO(contents), sep=sep)
                    if len(df.columns) >= 2:
                        break
                except:
                    continue
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado. Usa CSV, TXT, o Excel (.xlsx)")

        # Normalize column names
        df.columns = [c.strip().upper() for c in df.columns]

        # Try to map columns
        col_map = {}
        for col in df.columns:
            if col in ['X']:
                col_map['x'] = col
            elif col in ['Y']:
                col_map['y'] = col
            elif col in ['EX', 'DX', 'ΔX', 'DELTAX', 'ERROR_X', 'XERR']:
                col_map['dx'] = col
            elif col in ['EY', 'DY', 'ΔY', 'DELTAY', 'ERROR_Y', 'YERR']:
                col_map['dy'] = col

        # Fallback: use positional columns if not found by name
        cols = list(df.columns)
        if 'x' not in col_map and len(cols) >= 1:
            col_map['x'] = cols[0]
        if 'y' not in col_map and len(cols) >= 2:
            col_map['y'] = cols[1]
        if 'dx' not in col_map and len(cols) >= 3:
            col_map['dx'] = cols[2]
        if 'dy' not in col_map and len(cols) >= 4:
            col_map['dy'] = cols[3]

        if 'x' not in col_map or 'y' not in col_map:
            raise HTTPException(status_code=400, detail="No se encontraron columnas X e Y")

        result = {
            "x": df[col_map['x']].astype(float).tolist(),
            "y": df[col_map['y']].astype(float).tolist(),
            "dx": df[col_map.get('dx', col_map['x'])].astype(float).tolist() if 'dx' in col_map else [0.0] * len(df),
            "dy": df[col_map.get('dy', col_map['y'])].astype(float).tolist() if 'dy' in col_map else [0.0] * len(df),
            "columns_found": list(col_map.keys()),
            "n_rows": len(df),
        }
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al leer archivo: {str(e)}")

# ========== GAUSS ==========

@app.post("/api/gauss")
def gauss_analysis(req: GaussRequest):
    try:
        if len(req.values) < 2:
            raise HTTPException(status_code=400, detail="Se necesitan al menos 2 datos")
        result = logic.fgaus(req.values)
        img_base64 = logic.gauss_plot(req.values)
        result["image"] = img_base64
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
