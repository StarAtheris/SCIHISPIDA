from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logic

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
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
    n: Optional[float] = 0.0 # For Potencia
    a: Optional[float] = 0.0 # For Constante

class FitRequest(BaseModel):
    x: List[float]
    y: List[float]
    dx: List[float]
    dy: List[float]
    title: Optional[str] = "Linear Fit"
    xlabel: Optional[str] = "X Axis"
    ylabel: Optional[str] = "Y Axis"

@app.get("/")
def read_root():
    return {"message": "Scientific Web App API is running"}

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
        else:
            raise HTTPException(status_code=400, detail="Invalid operation")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/fit")
def perform_fit(req: FitRequest):
    try:
        # Perform calculation
        # 1. Fit
        # 2. Plot
        
        # Using logic.funcionChi2 for stats
        # Note: logic.funcionChi2 expects x, y, yerr, model
        # logic.graf_plot expects a dict with everything.
        
        # Let's verify data consistency
        if not (len(req.x) == len(req.y) == len(req.dx) == len(req.dy)):
             raise HTTPException(status_code=400, detail="Input lists must have same length")
             
        stats = logic.funcionChi2(
            np.array(req.x), 
            np.array(req.y), 
            np.array(req.dy), 
            logic.funcion_lineal
        )
        
        plot_data = {
            'x': req.x,
            'y': req.y,
            'dx': req.dx,
            'dy': req.dy,
            'a': stats['p1'], # slope
            'b': stats['p0'], # intercept
            'chi2_ndof': stats['chi2_ndof'],
            'title': req.title,
            'xlabel': req.xlabel,
            'ylabel': req.ylabel
        }
        
        img_base64 = logic.graf_plot(plot_data)
        
        return {
            "stats": stats,
            "image": img_base64
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
