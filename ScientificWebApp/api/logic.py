import numpy as np
import statistics as stats
import pandas as pd
import matplotlib
matplotlib.use('Agg') # Use non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from iminuit import Minuit, cost
import io
import base64

# Modelo lineal
def funcion_lineal(x, a, b):
    return a * x + b

def funcionChi2(x, y, yerr, funcionx):
    #funcion chi2
    least_squares = cost.LeastSquares(x, y, yerr, funcionx)

    # Ajuste con Minuit
    m = Minuit(least_squares, a=1, b=0)
    m.migrad()

    # Valor de chi2
    chi2_val = least_squares(*m.values)   # calcula χ² con los parámetros óptimos
    ndof = len(x) - len(m.values)        # grados de libertad
    
    return {
        "chi2": float(chi2_val),
        "ndof": ndof,
        "chi2_ndof": float(chi2_val/ndof),
        "p0": m.values[0],
        "p1": m.values[1],
        "p0_error": m.errors[0],
        "p1_error": m.errors[1]
    }

def graf_plot(data):
    """
    Generates a plot and returns it as a base64 string.
    data: dict containing lists for x, y, dx, dy and fit parameters a, b.
          keys: 'x', 'y', 'dx', 'dy', 'a', 'b', 'title', 'xlabel', 'ylabel'
    """
    fig, ax = plt.subplots(figsize=(10, 6))

    x = np.array(data['x'])
    y = np.array(data['y'])
    dx = np.array(data['dx'])
    dy = np.array(data['dy'])
    m_fit = data['a'] # slope
    c_fit = data['b'] # intercept
    
    # Plot data with error bars
    plt.errorbar(x, y, yerr=dy, xerr=dx, fmt="ok", label="Data")
    
    # Plot fit line
    x_fit = np.linspace(min(x), max(x), 100)
    plt.plot(x_fit, funcion_lineal(x_fit, m_fit, c_fit), label="Fit")
    
    # Annotation
    stats_text = (
        r"$\chi^2 / \nu = {:.5f}$".format(data.get('chi2_ndof', 0)) + "\n"
        r"$p_0 = {:.5e}$".format(c_fit) + "\n" # Intercept
        r"$p_1 = {:.5e}$".format(m_fit)       # Slope
    )

    ax.legend(title="Fit Stats", loc="best", fontsize="medium")
    # We add text to the plot instead of legend for stats to avoid clutter if preferred,
    # but strictly following the original style:
    ax.text(0.05, 0.95, stats_text, transform=ax.transAxes, verticalalignment='top', bbox=dict(boxstyle="round", fc="white", ec="lightgray"))

    plt.title(data.get('title', 'Linear Fit'), fontsize=16)
    plt.xlabel(data.get('xlabel', 'X Axis'), fontsize=14)
    plt.ylabel(data.get('ylabel', 'Y Axis'), fontsize=14)
    
    plt.grid(True, which='both', linestyle='--', linewidth=0.5)
    plt.tight_layout()

    # Save to buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    
    # Encode
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    return img_base64


# --- Calculus Functions ---

def Constante(a, x, dx):
    xy = a * x
    dxy = abs(a) * dx
    return {"value": xy, "uncertainty": dxy}

def Potencia(n, x, dx):
    xy = pow(x, n)
    dxy = abs(n * pow(x, n-1)) * dx
    return {"value": xy, "uncertainty": dxy}

def Producto(x, dx, y, dy):
    xy = x * y
    # Avoid division by zero if x or y is 0
    if x == 0 or y == 0:
         dxy = 0 # Simplified, or could use different formula
    else:
        dxy = abs(xy) * np.sqrt((dx/x)**2 + (dy/y)**2)
    return {"value": xy, "uncertainty": dxy}

def Suma(x, dx, y, dy):
    xy = x + y
    dxy = np.sqrt(dx**2 + dy**2)
    return {"value": xy, "uncertainty": dxy}

def Resta(x, dx, y, dy):
    xy = x - y
    dxy = np.sqrt(dx**2 + dy**2)
    return {"value": xy, "uncertainty": dxy}

def Exponente(x, dx):
    xy = np.exp(x)
    dxy = np.exp(x) * dx
    return {"value": xy, "uncertainty": dxy}

def Division(x, dx, y, dy):
    if y == 0:
        return {"error": "Division by zero"}
    xy = x / y
    dxy = abs(xy) * np.sqrt((dx/x)**2 + (dy/y)**2)
    return {"value": xy, "uncertainty": dxy}

def Cos(x, dx):
    xy = np.cos(x)
    dxy = abs(np.sin(x)) * dx # Derivative of cos is -sin, abs makes it positive
    return {"value": xy, "uncertainty": dxy}

def Sin(x, dx):
    xy = np.sin(x)
    dxy = abs(np.cos(x)) * dx
    return {"value": xy, "uncertainty": dxy}

def Log_nat(x, dx):
    if x <= 0:
        return {"error": "Log of non-positive number"}
    xy = np.log(x)
    dxy = dx / x
    return {"value": xy, "uncertainty": dxy}

def fgaus(x_list):
    n = len(x_list)
    if n < 2:
         return {"mean": x_list[0] if n==1 else 0, "error": 0}
    vsp = stats.mean(x_list)
    dst = stats.stdev(x_list)
    dx = dst / np.sqrt(n)
    return {"mean": vsp, "error": dx}
