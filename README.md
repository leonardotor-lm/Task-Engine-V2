# Task Engine V2

**Mis tareas** es una aplicación personal de gestión de tareas, proyectos y objetivos. Está orientada a reducir la carga cognitiva: las vistas de ejecución mantienen el foco en lo inmediato y las herramientas de planificación muestran la estructura sólo cuando resulta necesaria.

## Estado

La aplicación está en desarrollo activo y dispone de un flujo funcional completo para uso personal en escritorio y celular.

Capacidades principales:

- tareas, subtareas y proyectos jerárquicos;
- áreas, contextos, etiquetas, prioridades y objetivos jerárquicos;
- Inbox, Hoy y atrasadas, Mañana, Próximas, Todas, En espera y Calendario;
- fechas de inicio y vencimiento, hora, períodos y recurrencias;
- búsqueda simple y avanzada, filtros guardados, filtros rápidos y orden por vista;
- adjuntos almacenados en Google Drive;
- historial de actividad y estadísticas de proyectos y objetivos;
- selección y edición múltiple;
- papelera, eliminación definitiva y copias de seguridad;
- sincronización mediante Google Apps Script y Google Sheets;
- instalación como PWA y acceso a la aplicación y a los datos locales sin conexión.

La fuente de verdad del estado del proyecto es [Pendientes](docs/roadmap/PENDIENTES.md). Las funciones cerradas y la evolución general se registran en el [Roadmap](docs/roadmap/ROADMAP.md) y en el historial de Git.

## Arquitectura

- **Frontend:** JavaScript modular, HTML y CSS responsive.
- **Persistencia local:** repositorios del navegador; la aplicación continúa guardando cambios localmente cuando no hay conexión.
- **Sincronización:** Google Apps Script y Google Sheets.
- **Adjuntos:** Google Drive.
- **Distribución:** GitHub Pages y PWA instalable.

Google Sheets funciona como mecanismo de persistencia y sincronización, no como el dominio de la aplicación. Las reglas de negocio permanecen en el cliente.

## Documentación

- [Principios del proyecto](PROJECT.md)
- [Pendientes vigentes](docs/roadmap/PENDIENTES.md)
- [Roadmap y estado de implementación](docs/roadmap/ROADMAP.md)
- [Registro de decisiones](docs/decisions/DECISIONS.md)
- [Guía de búsqueda avanzada](docs/BUSQUEDA_AVANZADA.md)
- [Guía visual](docs/design/VISUAL-GUIDE.md)
- [Configuración de Google Sheets](docs/sync/GOOGLE_SHEETS_SETUP.md)
- [Adjuntos: referencia operativa](docs/roadmap/ADJUNTOS.md)
- [Tareas en espera: reglas funcionales](docs/roadmap/EN_ESPERA.md)

## Desarrollo

```bash
npm test
```

La política de avance exige una rama y una PR específicas por bloque, compatibilidad con datos existentes, pruebas automáticas cuando corresponda y verificación manual del flujo afectado.
