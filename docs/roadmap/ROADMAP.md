# Roadmap de implementación

## Objetivo

Construir una aplicación útil y estable, incorporando complejidad de manera gradual y evitando que cada nueva función degrade la experiencia existente.

La secuencia inicial por fases cumplió su propósito. A agosto de 2026, Task Engine V2 ya superó las etapas fundacionales y este documento pasa a describir el estado real y el orden de trabajo vigente.

## Estado actual — agosto de 2026

La aplicación ya cuenta con:

- dominio y persistencia local de tareas, áreas, contextos, etiquetas, objetivos y recurrencias;
- sincronización con Google Apps Script y Google Sheets, con reconciliación automática y resolución conservadora de cambios simultáneos;
- adjuntos en Google Drive;
- interfaz responsive para escritorio y celular;
- Inbox, Hoy y atrasadas, Mañana, Próximas, Todas, En espera, Calendario e historial operativo básico de completadas/archivadas/papelera;
- áreas, contextos, etiquetas, prioridades y fecha/hora;
- subtareas y proyectos jerárquicos;
- objetivos y subobjetivos jerárquicos;
- breadcrumbs para Objetivos y Proyectos;
- búsqueda simple, búsqueda avanzada y filtros guardados;
- orden y filtros rápidos persistentes por vista;
- recurrencias;
- selección múltiple;
- editores de tareas específicos para escritorio y celular;
- diálogos propios, selector de color y una interfaz Flat 2.0 consolidada.

Las PR #166 y #167 cerraron el rediseño de los editores. Las PR #171 a #173 consolidaron la navegación jerárquica de Objetivos y Proyectos, incluida la restauración de filtros guardados desde breadcrumbs.

## Etapa actual — Accesibilidad y limpieza final

Antes de incorporar otra función transversal se realizará una auditoría de calidad de interfaz.

Objetivos principales:

- navegación completa por teclado;
- manejo correcto del foco en editores, diálogos y popovers;
- nombres accesibles y estados ARIA coherentes;
- foco visible y objetivos táctiles suficientes;
- contraste y mensajes comprensibles sin depender exclusivamente del color;
- revisión de desbordes y comportamiento responsive extremo;
- eliminación de CSS y lógica obsoleta;
- unificación de comportamientos entre vistas, editores y gestores;
- auditoría de confirmaciones destructivas y ventanas nativas restantes.

Esta etapa no debe agregar funciones grandes. Su objetivo es estabilizar la superficie existente antes del siguiente cambio de dominio.

## Siguiente etapa funcional — Fecha de inicio y períodos

Después de la limpieza se incorporará `startDate` para tareas no recurrentes.

Reglas ya acordadas:

- fecha de inicio opcional e independiente del vencimiento;
- inicio sin vencimiento permitido;
- si existen ambas fechas, `startDate <= dueDate`;
- incompatibilidad con recurrencia;
- tareas futuras ocultas de las listas de ejecución hasta su inicio;
- calendario capaz de representar el período completo;
- tareas en espera continúan ocultas aunque su período haya comenzado;
- integración completa con persistencia, sincronización, backups, filtros, búsqueda, orden y pruebas.

La especificación detallada permanece en `docs/roadmap/PENDIENTES.md`.

## Etapas posteriores

### Historial

Definir qué cambios y acciones merecen persistirse y construir una vista útil de consulta. No se implementará un registro exhaustivo sin una necesidad clara de uso.

### Estadísticas

Depende del historial. Se incorporará únicamente cuando exista una base de datos temporal suficiente y estable para producir métricas útiles.

### Temas visuales

La arquitectura visual debe seguir usando variables y componentes reutilizables para permitir temas futuros, pero su implementación permanece postergada mientras no sea prioritaria.

## Fases históricas

La secuencia original del proyecto fue:

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
12. Optimización.

Las fases 1 a 9 ya forman parte de la aplicación. La optimización visual y estructural se adelantó respecto del plan original porque la aplicación alcanzó antes un nivel de uso real que justificó consolidar la interfaz, la sincronización y la navegación antes de Historial y Estadísticas.

## Regla de avance

Cada bloque nuevo debe:

1. partir de `main` actualizado;
2. tener una rama y una PR específicas;
3. conservar compatibilidad con los datos existentes;
4. incluir pruebas automáticas cuando corresponda;
5. pasar una verificación manual del flujo afectado;
6. actualizar `docs/roadmap/PENDIENTES.md` si cambia el estado de trabajo;
7. fusionarse mediante **Squash and merge** sólo después de la aprobación explícita.
