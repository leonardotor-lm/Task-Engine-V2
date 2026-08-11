# Roadmap de implementación

## Objetivo

Construir una aplicación útil y estable, incorporando complejidad de manera gradual y evitando que cada nueva función degrade la experiencia existente.

La secuencia inicial por fases cumplió su propósito. Desde agosto de 2026, este documento registra las capacidades consolidadas y los cierres principales; el trabajo vigente se mantiene únicamente en `docs/roadmap/PENDIENTES.md`.

## Estado actual — agosto de 2026

Task Engine V2 cuenta con:

- dominio y persistencia local de tareas, áreas, contextos, etiquetas, objetivos, recurrencias y actividad;
- sincronización con Google Apps Script y Google Sheets, reconciliación automática, copias de seguridad y conservación de cambios locales ante fallos de red;
- adjuntos en Google Drive;
- interfaz responsive y editores diferenciados para escritorio y celular;
- Inbox, Hoy y atrasadas, Mañana, Próximas, Todas, En espera, Calendario, Actividad, Estadísticas, Completadas, Archivadas y Papelera;
- fechas de inicio y vencimiento, hora y períodos para tareas no recurrentes;
- subtareas, proyectos, objetivos y subobjetivos jerárquicos;
- breadcrumbs para Objetivos y Proyectos;
- búsqueda simple, búsqueda avanzada, filtros guardados, filtros rápidos y orden persistente por vista;
- recurrencias, selección múltiple y operaciones masivas;
- historial de actividad y estadísticas de proyectos y objetivos;
- PWA instalable con caché de la aplicación, datos locales disponibles sin conexión y sincronización al recuperar conectividad;
- accesibilidad funcional, diálogos propios, selector de color y una interfaz Flat 2.0 consolidada.

## Cierres recientes

### Accesibilidad, editores y consistencia visual — PR #163 a #181

- orden y filtros por vista;
- rediseño del editor de escritorio y adaptación móvil;
- navegación jerárquica mediante breadcrumbs;
- PR #180: creación directa de subtareas con el editor completo, sin persistir borradores cancelados;
- manejo de foco, teclado, estados ARIA, overlays y confirmaciones propias;
- persistencia completa de preferencias a través del backend;
- consolidación de la estructura CSS y de los controles principales.

El documento `docs/design/REDISENO-INTERFAZ-TAREAS.md` se conserva como registro histórico de este bloque.

### Finalización asistida de proyectos — PR #188

Al completar la última subtarea pendiente, la aplicación puede ofrecer completar el proyecto padre. La decisión es explícita y evita cascadas de diálogos en jerarquías anidadas.

### Historial de actividad — PR #189

Registra acciones relevantes sobre tareas, resume operaciones masivas y permite buscar y filtrar por categoría. Se conserva en copias y sincronización; excluye deliberadamente eventos técnicos para evitar ruido.

### Navegación y consistencia visual — PR #190

Se auditó la navegación en escritorio y celular, la geometría de encabezados, los breadcrumbs extensos, las áreas táctiles y el orden de la cascada CSS.

### Estadísticas de proyectos y objetivos — PR #191

Las estadísticas miden progreso por tareas completadas sin convertirlo en un puntaje de productividad. Distinguen avance propio y acumulado, evitan doble conteo y ofrecen períodos de 7, 30, 90, 180 y 365 días, además de todo el historial.

### Ajustes móviles de Actividad — PR #192

Se corrigieron la distribución y el espaciado de los controles de búsqueda y categoría en pantallas pequeñas.

### Fecha de inicio, períodos y búsqueda `activaEn` — PR #193

- `startDate` es opcional e independiente del vencimiento;
- inicio sin vencimiento está permitido;
- si existen ambas fechas, se exige `startDate <= dueDate`;
- fecha de inicio y recurrencia son incompatibles;
- las tareas futuras permanecen fuera de las listas de ejecución hasta comenzar;
- el calendario representa el período completo;
- persistencia, sincronización, copias, orden, filtros y búsqueda avanzada incluyen el nuevo dato;
- `activaEn` localiza tareas cuyo período se superpone con un intervalo consultado.

### PWA instalable y funcionamiento sin conexión — PR #194

- manifiesto e íconos de instalación;
- service worker con caché de la aplicación;
- apertura independiente en modo instalado;
- datos locales disponibles sin conexión;
- guía de instalación cuando el navegador no ofrece el diálogo nativo;
- prevención de conflictos entre datos de ejemplo y una nube ya configurada;
- intercepción de Atrás en modo instalado para pedir confirmación antes de salir.

La implementación está fusionada. Su matriz operativa final permanece como **Pendiente de verificación** en `PENDIENTES.md`.

## Etapa operativa actual

La prioridad es cerrar la verificación posterior a la fusión de la PWA. Si las pruebas no revelan defectos, el siguiente bloque funcional debe elegirse explícitamente entre las propuestas registradas; no hay otra gran función previamente acordada.

## Fases históricas

1. Fundación.
2. Persistencia.
3. Dominio.
4. UI mínima.
5. Organización.
6. Jerarquía.
7. Búsquedas.
8. Recurrencias.
9. Adjuntos.
10. Historial.
11. Estadísticas.
12. Optimización y distribución.

Las doce fases forman parte de la aplicación. Optimización continúa como una práctica transversal, no como una excusa para reabrir bloques cerrados sin un defecto o necesidad concreta.

## Regla de avance

Cada bloque nuevo debe:

1. partir de `main` actualizado;
2. tener una rama y una PR específicas;
3. conservar compatibilidad con los datos existentes;
4. incluir pruebas automáticas cuando corresponda;
5. pasar una verificación manual del flujo afectado;
6. actualizar `docs/roadmap/PENDIENTES.md` si cambia el trabajo vigente;
7. actualizar este roadmap cuando se cierre una etapa relevante;
8. fusionarse sólo después de la aprobación explícita.
