# Lista Plazo Fijo Pro Monitor — PWA Instalable, Offline-First y Gestor de Plazos Fijos en Argentina (ARS)

Aplicación web progresiva (PWA) instalable, adaptable a computadoras y celulares, con funcionamiento 100% sin conexión y mecanismos confiables de respaldo y restauración de datos financieros en Pesos Argentinos (ARS).

---

## 📱 Evolución PWA y Funcionamiento Offline

1. **PWA Instalable (Standalone)**
   - Compatible con escritorios (Chrome, Edge, Brave) y dispositivos móviles (Android / iOS Safari).
   - Detección inteligente del evento `beforeinstallprompt` y botón de instalación nativa en la barra lateral.
   - Instrucciones específicas paso a paso para instalación manual en iOS Safari ("Compartir → Añadir a pantalla de inicio").

2. **Service Worker y Estrategia de Caché**
   - Configurado mediante `vite-plugin-pwa` y Workbox en modo `autoUpdate`.
   - **Precarga de App Shell**: HTML, CSS, JavaScript, fuentes de Google Fonts e iconos SVG precargados.
   - **Separación Estricta entre Caché y Datos Financieros**:
     - La **Cache API** del Service Worker almacena exclusivamente los recursos de la interfaz de usuario.
     - Los **Registros Financieros e Historial** se persisten de forma aislada en la base de datos **IndexedDB**.
     - Ninguna información personal o financiera es almacenada en la caché HTTP ni transmitida por red.

3. **Operatividad Offline Completa**
   - Tras la primera carga, la aplicación abre y opera sin conexión a Internet.
   - Funcionalidades locales activas offline: consulta, alta, edición, simulador, calendario, exportación PDF/Excel/CSV, respaldos JSON y trazabilidad de eventos.

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

5. **Gestión de Vencimientos, Confirmaciones y Renovaciones Vinculadas**
   - Alertas visuales categorizadas por urgencia (≤ 7 días, ≤ 15 días, ≤ 30 días) y vencidos pendientes de confirmación.
   - Flujo de **Renovación Vinculada**: actualiza el estado de la colocación anterior a `RENOVADO` y crea el nuevo registro vinculado con el nuevo capital sin duplicar el capital activo en la cartera.

6. **Sistema de Respaldo y Restauración JSON Confiable**
   - **Exportación con Metadatos**: Genera archivos `.json` versionados que incluyen `backupVersion`, `appVersion`, `exportedAt`, `deposits`, `events` y `settings`.
   - **Validación Previa e Inspección (Dry-Run)**: Antes de modificar la base local, valida el esquema JSON, verifica duplicados de ID, comprueba tipos de datos y muestra una **modal de vista previa** con el total de colocaciones, historial e importe a restaurar.
   - **Restauración Atómica**: Transacción en IndexedDB que garantiza que ante cualquier error el estado original se preserve intacto.
   - **Compatibilidad Móvil (Web Share API)**: Permite enviar el archivo JSON directamente a aplicaciones de mensajería (WhatsApp), almacenamiento en la nube (Google Drive) o correo electrónico en celulares compatibles.

7. **Monitoreo de Almacenamiento Local (Persistent Storage)**
   - Inspección de cuota ocupada y disponible mediante `navigator.storage.estimate()`.
   - Posibilidad de solicitar almacenamiento persistente mediante `navigator.storage.persist()` para prevenir la eliminación automática por parte del sistema operativo.

---

## 🛠️ Arquitectura Técnica

- **Frontend**: React 18 + TypeScript + Vite.
- **PWA / Service Worker**: `vite-plugin-pwa` + Workbox.
- **Estilos**: Tailwind CSS con la paleta institucional *Aura Wealth* y tipografía Inter con numerales tabulares (`font-feature-settings: "tnum"`).
- **Persistencia Local**: IndexedDB mediante `idb` (`plazo_fijo_pro_db`, versión 1) con transacciones atómicas.
- **Visualización de Datos**: Chart.js + react-chartjs-2.
- **Procesamiento de Planillas y PDF**: XLSX, PapaParse y jsPDF.
- **Pruebas Automatizadas**: Vitest + testing-library + fake-indexeddb.

---

## 📂 Estructura del Código Fuente

```text
├── public/
│   ├── favicon.svg                     # Icono vectorial principal
│   ├── pwa-192x192.png                 # Icono PWA estándar 192px
│   ├── pwa-512x512.png                 # Icono PWA estándar 512px
│   ├── maskable-icon-512x512.png       # Icono PWA adaptable (maskable)
│   └── apple-touch-icon.png            # Icono PWA para iOS Safari
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
│   │   ├── ReportsView.tsx             # Reportes PDF/Excel, respaldos y estado de almacenamiento
│   │   ├── InstallPWAButton.tsx        # Componente de instalación PWA e instrucciones móviles
│   │   └── RestoreModal.tsx            # Modal de validación previa y confirmación de restauración JSON
│   ├── services/
│   │   ├── db.ts                       # Servicio IndexedDB, exportación, validación y restauración JSON
│   │   └── demoData.ts                 # Datos ficticios iniciales
│   ├── utils/
│   │   ├── financial.ts                # Motor de cálculo y formateadores ARS
│   │   ├── importer.ts                 # Parser de planillas y validaciones
│   │   └── pwa.ts                      # Hook usePWAInstall, Web Share API y navigator.storage
│   ├── types/
│   │   └── index.ts                    # Modelos de datos TypeScript
│   ├── App.tsx                         # Contenedor principal y navegación
│   └── main.tsx                        # Punto de entrada Vite y registro de Service Worker
├── src/test/
│   ├── backup.test.ts                  # Pruebas de exportación, validación y restauración atómica
│   ├── db.test.ts                      # Pruebas de persistencia IndexedDB
│   ├── pwa.test.ts                     # Pruebas de assets PWA y utilidades de almacenamiento
│   └── financial.test.ts               # Pruebas de motor financiero
├── scripts/
│   └── generate-pwa-icons.cjs          # Generador de iconos PNG desde SVG
├── vite.config.ts                      # Configuración de Vite con VitePWA
├── tailwind.config.js                  # Configuración de colores Aura Wealth
└── index.html                          # Layout base HTML con etiquetas PWA
```

---

## 💻 Instrucciones de Instalación y Ejecución

### Requisitos Previos
- Node.js v18 o superior.
- npm.

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

4. Ejecutar la suite completa de pruebas unitarias e integrales:
   ```bash
   npx vitest run
   ```

5. Verificar compilación de TypeScript:
   ```bash
   npx tsc -b
   ```

6. Compilar la versión de producción con PWA y Service Worker:
   ```bash
   npm run build
   ```
   El resultado de la compilación incluirá `dist/manifest.webmanifest` y `dist/sw.js`.

---

## 🔒 Consideraciones de Seguridad y Entorno HTTPS

- **Service Workers**: Requieren un contexto seguro (HTTPS) para registrarse en entornos de producción. En desarrollo local (`localhost`), los navegadores permiten Service Workers sobre HTTP.
- **Seguridad de Respaldos JSON**: Los archivos de respaldo JSON no están cifrados. Se advierte explícitamente al usuario conservar sus archivos en lugares de acceso restringido o carpetas privadas de almacenamiento en la nube.
- **Sin Telemetría ni Código Remoto**: La app no utiliza `eval`, no transmite datos financieros a ningún servidor ni ejecuta código remoto importado.

---

## 🧪 Pruebas Automatizadas Ejecutadas

El proyecto cuenta con un conjunto de **26 pruebas automatizadas** que validan:
- **Funcionalidad PWA**: Presencia de iconos manifest, utilidades `getStorageEstimateInfo`, `requestPersistentStorage` y fallback de Web Share.
- **Estructura y Validación JSON**: Validación de esquemas de respaldo, detección de registros corruptos o inconsistentes, importes negativos e identificadores duplicados.
- **Restauración Atómica**: Confirmación de reemplazo/combinación limpia de registros y prueba de reversión ante archivos inválidos.
- **Cálculos Financieros**: Fórmulas bancarias oficiales de convención 365 días, TNA, TEA y rendimiento del período.
- **Importador de Planillas**: Parser de planillas Excel/CSV y prevención de duplicados.
- **Trazabilidad de Renovaciones**: Renovaciones vinculadas sin duplicación del capital activo vigente.
