# PlazoFijo Pro — Monitor y Gestor de Plazos Fijos en Argentina (ARS)

Aplicación web profesional, responsive y 100% local desarrollada para el registro, seguimiento personal, simulación, análisis financiero e importación/exportación de plazos fijos en Pesos Argentinos (ARS).

---

## 🚀 Características Principales

1. **Dashboard Financiero e Indicadores Dinámicos**
   - Tarjetas de métricas consolidadas: Capital vigente total, Intereses estimados pendientes, Monto al vencimiento, TNA promedio ponderada y Vencimientos a 7/15/30 días.
   - Gráficos interactivos con Chart.js: Distribución de capital por entidad bancaria y Cronograma de vencimientos por mes.
   - Lista interactiva de vencimientos próximos e inminentes.

2. **Gestión Integral de Plazos Fijos (CRUD)**
   - Alta, edición, consulta detallada, eliminación y filtrado (por banco, estado operativo o búsqueda por texto).
   - Separación estricta entre **Valores Estimados** (calculados por la app), **Valores Informados por la Entidad** e **Importes Efectivamente Cobrados**.

3. **Simulador Financiero Independiente**
   - Cálculo en tiempo real con la fórmula bancaria argentina oficial de convención 365 días:
     $$\text{Interés} = \text{Capital} \times \left(\frac{\text{TNA}}{100}\right) \times \left(\frac{\text{Días}}{365}\right)$$
   - Estimación de Tasa Efectiva Anual (TEA) y Rendimiento del período.
   - Opción con 1-click para registrar la inversión simulada en la cartera de plazos fijos.

4. **Importación Masiva desde Excel (.xlsx) y CSV**
   - Asistente interactivo de carga, lectura, previsualización y mapeo de columnas.
   - Parser inteligente de fechas (`DD/MM/AAAA` o `YYYY-MM-DD`) y formatos numéricos argentinos (`$ 1.234.567,89`).
   - Detección proactiva de posibles registros duplicados y validación fila por fila.
   - Plantillas oficiales descargables en CSV y Excel.

5. **Gestión de Vencimientos, Confirmaciones y Renovaciones Vinculadas**
   - Alertas visuales categorizadas por urgencia (≤ 7 días, ≤ 15 días, ≤ 30 días) y vencidos pendientes de confirmación.
   - Flujo de **Renovación Vinculada**: actualiza el estado de la colocación anterior a `RENOVADO` y crea el nuevo registro vinculado con el nuevo capital sin duplicar el capital activo en la cartera.
   - Registro de confirmación de cobro/acreditación de capital e intereses.

6. **Historial e Inmutabilidad de Eventos**
   - Trazabilidad completa e inalterable de cada evento (Alta, Modificación, Confirmación de Cobro, Renovación, Cierre).

7. **Reportes Ejecutivos y Respaldos de Seguridad**
   - Informe ejecutivo formal descargable en **PDF** (con resumen consolidado y tabla formateada).
   - Exportación de la cartera completa a **Excel (.xlsx)** y **CSV**.
   - Respaldo de seguridad completo en **JSON** y función de Restauración con advertencia de confirmación.

8. **Privacidad y Seguridad Local**
   - **100% Offline y Local**: Almacenamiento seguro en IndexedDB dentro del navegador del usuario.
   - Sin conexiones bancarias externas, sin solicitud de credenciales ni envío de datos financieros a servidores terceros.

---

## 🛠️ Arquitectura Técnica

- **Frontend**: React 18 + TypeScript + Vite.
- **Estilos**: Tailwind CSS con la paleta institucional *Aura Wealth* y tipografía Inter con numerales tabulares (`font-feature-settings: "tnum"`).
- **Persistencia**: IndexedDB mediante el cliente `idb` con versionado de esquemas y transacciones atómicas.
- **Visualización de Datos**: Chart.js + react-chartjs-2.
- **Procesamiento de Planillas y PDF**: XLSX, PapaParse y jsPDF.
- **Pruebas Automatizadas**: Vitest + testing-library + fake-indexeddb.

---

## 📂 Estructura del Código Fuente

```text
├── src/
│   ├── components/
│   │   ├── DashboardView.tsx           # Consola visual y métricas
│   │   ├── ListView.tsx                # Tabla de inversiones, búsqueda y filtros
│   │   ├── DepositFormModal.tsx        # Modal de alta y edición
│   │   ├── DetailModal.tsx             # Detalle extendido e historial de la inversión
│   │   ├── SimulatorView.tsx           # Simulador financiero
│   │   ├── CalendarView.tsx            # Agenda y cronograma de vencimientos
│   │   ├── ImportView.tsx              # Importador interactivo de Excel/CSV
│   │   ├── OperationalActionModal.tsx  # Modal de Acreditación y Renovaciones
│   │   ├── HistoryView.tsx             # Timeline inmutable de eventos
│   │   └── ReportsView.tsx             # Reportes PDF, Excel y respaldos JSON
│   ├── services/
│   │   ├── db.ts                       # Servicio IndexedDB con idb
│   │   └── demoData.ts                 # Datos ficticios iniciales
│   ├── utils/
│   │   ├── financial.ts                # Motor de cálculo y formateadores ARS
│   │   └── importer.ts                 # Parser de planillas y validaciones
│   ├── types/
│   │   └── index.ts                    # Modelos de datos TypeScript
│   ├── App.tsx                         # Contenedor principal y navegación
│   └── main.tsx                        # Punto de entrada Vite
├── src/test/                           # Pruebas automatizadas en Vitest
├── tailwind.config.js                  # Configuración de colores Aura Wealth
└── index.html                          # Layout base HTML
```

---

## 💻 Instrucciones de Instalación y Ejecución

### Requisitos Previos
- Node.js v18 o superior.
- npm / bun.

### Pasos
1. Clonar o acceder a la carpeta del proyecto:
   ```bash
   cd /app
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

4. Ejecutar la suite de pruebas unitarias y de integración:
   ```bash
   npx vitest run
   ```

5. Compilar la versión de producción:
   ```bash
   npm run build
   ```

---

## 🧪 Pruebas Automatizadas Ejecutadas

El proyecto cuenta con un conjunto de 17 pruebas unitarias e integrales que validan:
- **Cálculo Financiero**: Exactitud matemática en el cálculo de intereses con convención de 365 días, cálculo de TEA y rendimiento del período.
- **Formato Argentino**: Correcto parseo e interpretación de cadenas con formato de moneda (`$ 1.234.567,89`) y fechas (`DD/MM/AAAA`).
- **Persistencia IndexedDB**: Escritura, lectura, aislamiento de datos reales vs. demo y exportación/restauración de backups.
- **Importador de Planillas**: Detección de filas inválidas y alertas de potencial duplicación.
- **Trazabilidad de Renovaciones**: Garantía de que una renovación marca la colocación anterior como `RENOVADO` sin duplicar el capital activo vigente.

---

## 🔒 Privacidad y Almacenamiento Local

Toda la información se almacena localmente en la base de datos IndexedDB del navegador del usuario. La aplicación no requiere conexión a Internet para operar ni envía datos a servidores remotos. Se recomienda utilizar periódicamente la función de **Generar Respaldo Completo (JSON)** para mantener copias de seguridad externas.
