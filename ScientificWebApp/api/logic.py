import numpy as np
import statistics as stat_module
import math
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from iminuit import Minuit, cost
from scipy.stats import norm
import io
import base64

# ========== HELPERS ==========

def safe_float(val):
    """Convert to JSON-safe float (replace inf/nan with 0)."""
    if isinstance(val, (np.floating, float)):
        if math.isinf(val) or math.isnan(val):
            return 0.0
        return float(val)
    return val

def safe_dict(d):
    """Recursively sanitize all floats in a dict."""
    result = {}
    for k, v in d.items():
        if isinstance(v, dict):
            result[k] = safe_dict(v)
        elif isinstance(v, (float, np.floating)):
            result[k] = safe_float(v)
        elif isinstance(v, (np.integer,)):
            result[k] = int(v)
        else:
            result[k] = v
    return result

# ========== FIT MODELS ==========

def funcion_lineal(x, a, b):
    return a * x + b

def funcion_cuadratica(x, a, b, c):
    return a * x**2 + b * x + c

def funcion_exponencial(x, a, b):
    return a * np.exp(b * x)

# ========== CHI2 FIT ==========

def funcionChi2(x, y, yerr, funcionx, model_type="linear"):
    # Ensure yerr has no zeros (causes division by zero in chi2)
    yerr_safe = np.where(yerr == 0, 1e-10, yerr)

    least_squares = cost.LeastSquares(x, y, yerr_safe, funcionx)

    if model_type == "quadratic":
        m = Minuit(least_squares, a=0.01, b=1, c=0)
    elif model_type == "exponential":
        m = Minuit(least_squares, a=1, b=0.01)
    else:
        m = Minuit(least_squares, a=1, b=0)

    m.migrad()

    chi2_val = float(least_squares(*m.values))
    ndof = len(x) - len(m.values)
    chi2_ndof = float(chi2_val / ndof) if ndof > 0 else 0

    result = {
        "chi2": safe_float(chi2_val),
        "ndof": ndof,
        "chi2_ndof": safe_float(chi2_ndof),
        "model_type": model_type,
    }

    if model_type == "quadratic":
        result["params"] = {
            "a": {"value": safe_float(m.values[0]), "error": safe_float(m.errors[0])},
            "b": {"value": safe_float(m.values[1]), "error": safe_float(m.errors[1])},
            "c": {"value": safe_float(m.values[2]), "error": safe_float(m.errors[2])},
        }
    else:
        result["params"] = {
            "a": {"value": safe_float(m.values[0]), "error": safe_float(m.errors[0])},
            "b": {"value": safe_float(m.values[1]), "error": safe_float(m.errors[1])},
        }

    # Keep backward compat
    result["p0"] = safe_float(m.values[0])
    result["p1"] = safe_float(m.values[1])
    result["p0_error"] = safe_float(m.errors[0])
    result["p1_error"] = safe_float(m.errors[1])

    return safe_dict(result)

# ========== PLOT ==========

def graf_plot(data, model_type="linear"):
    fig, ax = plt.subplots(figsize=(10, 6))

    x = np.array(data['x'], dtype=float)
    y = np.array(data['y'], dtype=float)
    dx = np.array(data['dx'], dtype=float)
    dy = np.array(data['dy'], dtype=float)

    plt.errorbar(x, y, yerr=dy, xerr=dx, fmt="ok", label="Datos", capsize=3, markersize=5)

    margin = 0.1 * (max(x) - min(x)) if max(x) != min(x) else 1
    x_fit = np.linspace(min(x) - margin, max(x) + margin, 200)

    params = data['params']
    if model_type == "quadratic":
        a, b, c = params['a']['value'], params['b']['value'], params['c']['value']
        y_fit = funcion_cuadratica(x_fit, a, b, c)
        label = f"y = {a:.3e}x² + {b:.3e}x + {c:.3e}"
    elif model_type == "exponential":
        a, b = params['a']['value'], params['b']['value']
        y_fit = funcion_exponencial(x_fit, a, b)
        label = f"y = {a:.3e}·e^({b:.3e}x)"
    else:
        a, b = params['a']['value'], params['b']['value']
        y_fit = funcion_lineal(x_fit, a, b)
        label = f"y = {a:.3e}x + {b:.3e}"

    plt.plot(x_fit, y_fit, '-', color='#6c63ff', linewidth=2, label=label)

    chi2_text = r"$\chi^2 / \nu = {:.4f}$".format(data.get('chi2_ndof', 0))
    ax.text(0.05, 0.95, chi2_text, transform=ax.transAxes, verticalalignment='top',
            fontsize=11, bbox=dict(boxstyle="round,pad=0.4", fc="#f0f0ff", ec="#6c63ff", alpha=0.9))

    ax.legend(loc="best", fontsize=10, framealpha=0.9)
    plt.title(data.get('title', 'Ajuste'), fontsize=16, fontweight='bold')
    plt.xlabel(data.get('xlabel', 'Eje X'), fontsize=13)
    plt.ylabel(data.get('ylabel', 'Eje Y'), fontsize=13)
    plt.grid(True, which='both', linestyle='--', linewidth=0.4, alpha=0.7)
    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=120, bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')

# ========== GAUSS HISTOGRAM ==========

def gauss_plot(values):
    fig, ax = plt.subplots(figsize=(8, 5))
    data = np.array(values, dtype=float)
    mean = np.mean(data)
    std = np.std(data, ddof=1) if len(data) > 1 else 1

    n_bins = max(5, min(len(data) // 2, 20))
    ax.hist(data, bins=n_bins, density=True, alpha=0.7,
            color='#6c63ff', edgecolor='white', linewidth=1.2, label='Histograma')

    x_range = np.linspace(mean - 4 * std, mean + 4 * std, 200)
    ax.plot(x_range, norm.pdf(x_range, mean, std), '-', color='#00d4aa', linewidth=2.5, label='Curva Normal')
    ax.axvline(mean, color='#ff4d6a', linestyle='--', linewidth=1.5, label=f'Media = {mean:.4g}')

    ax.legend(loc='best', fontsize=10, framealpha=0.9)
    ax.set_title('Distribución Gaussiana', fontsize=15, fontweight='bold')
    ax.set_xlabel('Valor', fontsize=12)
    ax.set_ylabel('Densidad', fontsize=12)
    ax.grid(True, linestyle='--', alpha=0.4)
    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=120, bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')

# ========== ERROR PROPAGATION ==========

def Constante(a, x, dx):
    return safe_dict({"value": a * x, "uncertainty": abs(a) * dx})

def Potencia(n, x, dx):
    return safe_dict({"value": pow(x, n), "uncertainty": abs(n * pow(x, n - 1)) * dx})

def Producto(x, dx, y, dy):
    xy = x * y
    if x == 0 or y == 0:
        dxy = 0.0
    else:
        dxy = abs(xy) * np.sqrt((dx / x) ** 2 + (dy / y) ** 2)
    return safe_dict({"value": xy, "uncertainty": dxy})

def Suma(x, dx, y, dy):
    return safe_dict({"value": x + y, "uncertainty": np.sqrt(dx ** 2 + dy ** 2)})

def Resta(x, dx, y, dy):
    return safe_dict({"value": x - y, "uncertainty": np.sqrt(dx ** 2 + dy ** 2)})

def Exponente(x, dx):
    return safe_dict({"value": np.exp(x), "uncertainty": np.exp(x) * dx})

def Division(x, dx, y, dy):
    if y == 0:
        return {"error": "División por cero", "value": 0, "uncertainty": 0}
    xy = x / y
    dxy = abs(xy) * np.sqrt((dx / x) ** 2 + (dy / y) ** 2) if x != 0 else abs(dx / y)
    return safe_dict({"value": xy, "uncertainty": dxy})

def Cos(x, dx):
    return safe_dict({"value": np.cos(x), "uncertainty": abs(np.sin(x)) * dx})

def Sin(x, dx):
    return safe_dict({"value": np.sin(x), "uncertainty": abs(np.cos(x)) * dx})

def Log_nat(x, dx):
    if x <= 0:
        return {"error": "Log de número no positivo", "value": 0, "uncertainty": 0}
    return safe_dict({"value": np.log(x), "uncertainty": dx / x})

def ErrorPorcentual(theo, d_theo, exp, d_exp):
    """
    Calculates percent error between theoretical and experimental values.
    P = |Theo - Exp| / |Theo| * 100
    Uncertainty propagated from d_theo and d_exp.
    """
    if theo == 0:
        return {"error": "Valor teórico no puede ser cero", "value": 0, "uncertainty": 0}

    diff = abs(theo - exp)
    percent = (diff / abs(theo)) * 100

    return safe_dict({"value": percent, "uncertainty": 0.0})

def fgaus(x_list):
    n = len(x_list)
    if n < 2:
        return {"mean": x_list[0] if n == 1 else 0, "stdev": 0, "error": 0, "n": n}
    vsp = stat_module.mean(x_list)
    dst = stat_module.stdev(x_list)
    dx = dst / np.sqrt(n)
    return safe_dict({"mean": vsp, "stdev": dst, "error": dx, "n": n})
