# Documentación Técnica del Proyecto: Telos

Este documento proporciona una visión general completa de la arquitectura, tecnologías y estructura del proyecto ****. Diseñado como una referencia técnica para futuro desarrollo y mantenimiento.

## 1. Visión General
El proyecto es una aplicación web de gestión personal que integra múltiples módulos:
- **Finanzas**: Rastreo de ingresos, gastos, ahorros y metas.
- **Calendario/Horario**: Gestión de eventos y tareas diarias.
- **Estudio**: Gestión de tareas académicas y visualización de documentos PDF.
- **Devocional**: Registro de lecturas diarias y versículos.
- **Programación/Portales**: Enlaces y recursos para desarrollo.

La aplicación funciona como un "Monorepo" ligero, donde el Frontend y el Backend conviven en el mismo repositorio pero tienen responsabilidades separadas.

## 2. Arquitectura de Software

El sistema sigue una arquitectura **Cliente-Servidor (Client-Server)** simple:

```mermaid
graph TD
    User[Usuario (Navegador)] <--> Frontend[Frontend (React + Vite)]
    Frontend <-->|API HTTP (JSON)| Backend[Backend (Node.js + Express)]
    Backend <-->|Lectura/Escritura| FS[Sistema de Archivos (JSON Local)]
```

### Frontend (Cliente)
- **Rol**: Interfaz de usuario interactiva y lógica de presentación.
- **Comunicación**: Realiza peticiones HTTP (`GET`, `POST`, `DELETE`) al backend para obtener o guardar datos.
- **Estado**: Maneja el estado de la aplicación localmente mientras el usuario navega.

### Backend (Servidor)
- **Rol**: API RESTful que procesa las peticiones del cliente.
- **Persistencia**: En lugar de una base de datos tradicional (como SQL o MongoDB), utiliza el **Sistema de Archivos** local. Los datos se guardan en archivos JSON en la carpeta `backend/data`.
- **Archivos Estáticos**: Sirve imágenes y PDFs subidos por el usuario.

## 3. Stack Tecnológico

### Frontend
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) (JavaScript con tipos estáticos para mayor seguridad).
- **Framework**: [React](https://react.dev/) (v19) - Biblioteca para construir interfaces de usuario.
- **Build Tool**: [Vite](https://vitejs.dev/) - Herramienta de compilación rápida y servidor de desarrollo.
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) - Framework de utilidades CSS para diseño rápido y responsivo.
- **Navegación**: `react-router-dom` - Para el manejo de rutas y páginas.
- **Gráficos**: `recharts` - Para visualizar datos financieros.
- **Iconos**: `lucide-react` - Paquete de iconos ligero y moderno.
- **Utilidades**: `date-fns` (probablemente) o nativo `Intl` para fechas, `react-pdf` para visualizar documentos.

### Backend
- **Entorno**: [Node.js](https://nodejs.org/) - Entorno de ejecución de JavaScript.
- **Framework**: [Express](https://expressjs.com/) - Framework web minimalista para crear la API.
- **Librerías Clave**:
    - `cors`: Para permitir peticiones desde el frontend (que corre en otro puerto).
    - `fs` (File System): Módulo nativo de Node para leer/escribir archivos JSON.

### Herramientas de Desarrollo
- **Concurrently**: Permite ejecutar el frontend y el backend al mismo tiempo con un solo comando (`npm run dev:full`).

## 4. Estructura del Proyecto

```text
telos/
├── package.json          # Configuración raíz y scripts globales
├── backend/              # Lógica del Servidor
│   ├── data/             # "Base de Datos" (Archivos JSON)
│   │   ├── finance-data.json  # Transacciones y balances
│   │   ├── schedule.json      # Eventos del calendario
│   │   ├── study.json         # Tareas y PDFs
│   │   ├── devotional.json    # Entradas del diario
│   │   ├── images/            # Imágenes subidas por el usuario
│   │   └── pdfs/              # Documentos PDF almacenados
│   └── server/           # Código fuente del Backend
│       └── server.js     # Punto de entrada de la API Express
└── frontend/             # Código fuente de la UI
    ├── index.html        # Archivo HTML principal
    ├── vite.config.ts    # Configuración de Vite
    └── src/              # Código fuente TSX/TS
        ├── main.tsx      # Punto de entrada de React
        ├── App.tsx       # Componente raíz y rutas
        ├── components/   # Componentes reusables (Botones, Tarjetas, Inputs)
        ├── pages/        # Vistas principales:
        │   ├── Dashboard.tsx  # Vista general
        │   ├── Wallet.tsx     # Gestión financiera
        │   ├── Schedule.tsx   # Calendario
        │   ├── Study.tsx      # Estudios y PDFs
        │   ├── Settings.tsx   # Configuración
        │   └── ...
        └── layouts/      # Estructuras de diseño (Sidebar, Header)
```

## 5. Descripción de Módulos y Funciones

### Finanzas (Wallet & Dashboard)
- **Funcionalidad**: Registra ingresos, egresos, metas de ahorro y pagos recurrentes.
- **Datos**: Se guardan en `finance-data.json`.
- **API**: `/api/money` o `/api/finance`.

### Calendario (Schedule)
- **Funcionalidad**: Permite agregar eventos y recordatorios. Soporta días en español.
- **Datos**: Se guardan en `schedule.json`.
- **API**: `/api/schedule`.

### Estudio (Study)
- **Funcionalidad**: Gestión de tareas (To-Do), temporizador Pomodoro y visor de PDFs.
- **Datos**: Metadatos en `study.json`, archivos físicos en `backend/data/pdfs`.
- **API**: `/api/study` y `/api/study/upload-pdf`.

### Devocional
- **Funcionalidad**: Espacio para lecturas y notas diarias.
- **Datos**: Se guardan en `devotional.json`.

### Configuración (Settings)
- **Funcionalidad**: Permite subir imágenes de perfil y portada, gestionar datos generales.
- **Persistencia**: Las imágenes se guardan en la carpeta local, no en base de datos.

## 6. Notas para el Futuro (Escalabilidad)

Si deseas llevar este proyecto al siguiente nivel (producción o multi-usuario):

1.  **Migrar a Base de Datos Real**: Actualmente, si dos procesos escriben en el JSON al mismo tiempo, podría corromperse. Para el futuro, considera usar **SQLite** (fácil, local) o **PostgreSQL** (robusto).
2.  **Validación de Datos**: Usar librerías como `Zod` en el backend para asegurar que los datos que llegan son correctos antes de guardarlos.
3.  **Autenticación**: Actualmente no hay login. Se podría añadir un sistema simple de JWT (JSON Web Tokens) para proteger las rutas.
4.  **Optimización**: El backend lee/escribe el archivo *completo* en cada petición. Con una base de datos real, solo leerías/escribirías el registro necesario.

---
*Generado por tu Asistente de IA - 27 de Enero, 2026*
