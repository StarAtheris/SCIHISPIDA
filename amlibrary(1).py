import numpy as np
import statistics as stats
import pandas as pd
from matplotlib.pylab import plt
import matplotlib.ticker as mticker
from iminuit import Minuit, cost
import matplotlib.gridspec as gridspec
import math
import matplotlib
matplotlib.rcParams["text.usetex"] = True

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
  #("Chi2 =", chi2_val, "NDOF =", ndof, "Chi2/NDOF =", chi2_val/ndof,m.values[1])
  return(float(chi2_val/ndof), m.values[0], m.values[1])


def graf_plot(dtframe):
    fig, ax = plt.subplots()

    x = dtframe['x']
    y = dtframe['y']
    dy = dtframe['dy']
    dx = dtframe['dx']
    m_fit = dtframe['a']
    c_fit = dtframe['b']
    fitQty = dtframe.iloc[0, 6] # Este es el único que puede quedarse con iloc si lo prefieres
    dat_c = dtframe['a']
    dat_m = dtframe['b']
    titulo_grafico = dtframe['titulo']
    label_x = dtframe['eje x']
    label_y = dtframe['eje y']

    # ... el resto de la función es igual
    
    plt.errorbar(x, y, yerr=dy, xerr=dx, fmt="ok", label="hola")
    plt.plot(x, funcion_lineal(x, m_fit, c_fit))
    
    format = r"${:.5f}$"
    stats = (
        r"$\chi^2 / \nu $ =" + str(f"{fitQty:.{5}g}") + "\n\n"
        r"$\textup{p}_0$ = " + str(f"{dat_c.iloc[0]:.{5}e}") + "\n\n"
        r"$\textup{p}_1$ = " + str(f"{dat_m.iloc[0]:.{5}e}")
    )

    ax.legend(
        [stats],
        loc="best",
        fontsize="large",
        handlelength=0,
    )
    
    # ... el resto de la función es igual
    
    plt.title(titulo_grafico.iloc[0], fontsize=20)
    plt.tick_params(axis="both", labelsize=15)

    plt.xlabel(label_x.iloc[0], fontsize=20)
    plt.ylabel(label_y.iloc[0], fontsize=20)

    crd_y = np.max(y) - np.min(y)
    crd_x = np.max(x) - np.min(x)

    plt.xlim([np.min(x) - 0.1 * crd_x, np.max(x) + 0.1 * crd_x])
    plt.ylim([np.min(y) - 0.2 * crd_y, np.max(y) + 0.2 * crd_y])

    xlist = np.linspace(np.min(x) - 0.1 * crd_x, np.max(x) + 0.1 * crd_x, 8)
    ax.xaxis.set_major_locator(mticker.FixedLocator(xlist))
    ax.ticklabel_format(style="sci", axis="x", scilimits=(0, 0))

    ylist = np.linspace(np.min(y) - 0.2 * crd_y, np.max(y) + 0.2 * crd_y, 8)

    ax.yaxis.set_major_locator(mticker.FixedLocator(ylist))
    ax.ticklabel_format(style="sci", axis="y", scilimits=(0, 0))

    bbox = dict(boxstyle="round", fc="#FFFFFF", ec="lightgray")

    plt.tight_layout()
    

def Constante(a,x,dx):
    xy=a*x #mesurando operacion
    dxy=abs(a)*dx #error operacion
    print("ax' = ",xy,"\u00B1",dxy)

def Potencia(n,x,dx):
    xy=pow(x,n)
    dxy=abs(n*pow(x,n-1))*dx
    print(" x'"+"\u207f = ",xy,"\u00B1",dxy)

def Producto(x,dx,y,dy):
    xy=x*y
    dxy=abs(xy)*np.sqrt((dx/x)*(dx/x)+(dy/y)*(dy/y))
    print(" x'y' = ",xy,"\u00B1",dxy)

def Suma(x,dx,y,dy):
    xy=x+y #mesurando suma                   
    dxy=np.sqrt((dx)*(dx)+(dy)*(dy))
    print(" x' + y' = ",xy,"\u00B1",dxy)

def Resta(x,dx,y,dy):
    xy=x-y #mesurando suma                   
    dxy=np.sqrt((dx)*(dx)+(dy)*(dy))
    print(" x' - y' = ",xy,"\u00B1",dxy)

def Exponente(x,dx):
    xy=np.exp(x)
    dxy=np.exp(x)*dx
    print(" e"+"\u02e3' = ",xy,"\u00B1",dxy)

def Division(x,dx,y,dy):
    xy=x/y
    dxy=abs(x/y)*np.sqrt(pow(dx/x,2)+pow(dy/y,2))
    print(" x'/y' = ",xy,"\u00B1",dxy)

def Cos(x,dx):
    xy=np.cos(x)
    dxy=abs(np.cos(x))*dx
    print(" Cos(x') = ",xy,"\u00B1",dxy)

def Sin(x,dx):
    xy=np.sin(x)
    dxy=abs(np.sin(x))*dx
    print(" Sin(x') = ",xy,"\u00B1",dxy)

def Log_nat(x,dx):
    xy=np.log(x)
    dxy=dx/x
    print(" ln(x') = ",xy,"\u00B1",dxy)

def fgaus(x):
    n=len(x)
    vsp=stats.mean(x)
    dst=stats.stdev(x)
    dx=dst/np.sqrt(n)
    print(" x' = ",vsp,"\u00B1",dx)

def error_prop():
    opoaraciones= np.array([['G', 'S', 'R', 'M', 'D', 'C', 'P', 'Exp', 'Cos', 'Sin', 'ln'],
    ['Gaus', 'Sume', 'Reste', 'Multiplique', 'Divida', 'Constante', 'Potencia','Exponente', 'Coseno', 'Seno', 'log']])

    df = pd.DataFrame({
    'Digite': opoaraciones[0],
    'Operación': opoaraciones[1],
    })

    print(df)

    rsp=True
    
    while rsp==True:
        print("\n")
        funct=input("Digite una operacion deseada: ")
        print("\n") 
    
        if(funct=="S"):
            x=float(input(" x= "))
            dx=float(input(" \u0394"+"x= "))
            y=float(input(" y= "))
            dy=float(input(" \u0394"+"y= "))
            Suma(x,dx,y,dy)
    
        elif(funct=="R"):
            x=float(input(" x= "))
            dx=float(input(" \u0394"+"x= "))
            y=float(input(" y= "))
            dy=float(input(" \u0394"+"y= "))
            Resta(x,dx,y,dy)
    
        elif(funct=="C"):
            a=float(input(" a= "))
            x=float(input(" x= "))
            dx=float(input(" \u0394"+"x= "))
            Constante(a,x,dx)
    
        elif(funct=="P"):
            n=float(input(" n= "))
            x=float(input(" x= "))
            dx=float(input(" \u0394"+"x= "))
            Potencia(n,x,dx)
    
        elif(funct=="M"):
            x=float(input(" x= "))
            dx=float(input(" \u0394"+"x= "))
            y=float(input(" y= "))
            dy=float(input(" \u0394"+"y= "))
            Producto(x,dx,y,dy)
    
        elif(funct=="Exp"):
            x=float(input(" x= "))
            dx=float(input(" \u0394"+"x= "))
            Exponente(x,dx)
    
        elif(funct=="D"):
            x=float(input(" x= "))
            dx=float(input(" \u0394"+"x= "))
            y=float(input(" y= "))
            dy=float(input(" \u0394"+"y= "))
            Division(x,dx,y,dy)
    
        elif(funct=="Cos"):
            x=float(input(" x= "))
            dx=float(input(" \u0394"+"x= "))
            Cos(x,dx)
    
        elif(funct=="Sin"):
            x=float(input(" x= "))
            dx=float(input(" \u0394"+"x= "))
            Sin(x,dx)
    
        elif(funct=="ln"):
            x=float(input(" x= "))
            dx=float(input(" \u0394"+"x= "))
            Log_nat(x,dx)
    
        elif(funct=="G"):
            x=[]
            nN=int(input("Numero de datos = "))
            print("Ingrese los datos\n")
            for i in range(nN):
                valor=float(input())
                x.append(valor)
            print(x)
            print("\n")    
            fgaus(x)
        print("\n")
        rsp=input("Desea otra operacion s/n ? ")
    
        if((rsp=="S") or (rsp=="s") ):
            rsp=True
        else:
            rsp=False