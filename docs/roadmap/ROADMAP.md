# Roadmap de Implementación
# Objetivo

Construir una aplicación funcional desde el primer momento, incorporando complejidad de manera gradual y evitando la acumulación de deuda técnica.

Cada fase debe dejar un sistema estable y utilizable, aunque todavía incompleto.

# Fase 0 — Fundación

Todavía no existe la aplicación.

Solo existe la estructura.

Entregables
Repositorio Git

README

Documentación

Arquitectura

Estructura de carpetas

Sistema de build (si hiciera falta)

Convenciones de código

No hay interfaz.

No hay tareas.

No hay Google Sheets.

Pero ya existe un proyecto profesional.

# Fase 1 — Core

Esta es, para mí, la fase más importante.

No vamos a crear tareas.

No vamos a hacer pantallas.

Vamos a construir la infraestructura sobre la que todo lo demás descansará.

Objetivos
Bus de eventos.
Estado global.
Sistema de módulos.
Inicialización de la aplicación.
Registro de servicios.

Al terminar esta fase todavía no habrá una aplicación visible.

Pero sí un motor.

# Fase 2 — Persistencia

Ahora incorporamos Google Sheets.

Pero solo lectura y escritura.

Nada más.

Objetivos
Conexión con Apps Script.
Repositorio de tareas.
Repositorio de áreas.
Repositorio de contextos.
Repositorio de etiquetas.
Sincronización.

Todavía no hay interfaz.

# Fase 3 — Dominio

Ahora sí aparecen las primeras reglas.

Casos de uso
Crear tarea.
Editar tarea.
Completar tarea.
Eliminar.
Restaurar.

Todo funcionando mediante pruebas.

Todavía sin interfaz.

# Fase 4 — UI mínima

Recién ahora aparece el navegador.

Una interfaz extremadamente simple.

Solo:

listado;
captura;
edición;
navegación básica.

Nada de colores.

Nada de animaciones.

Nada de paneles sofisticados.

Fase 5 — Organización

Incorporamos:

áreas;
contextos;
etiquetas;
prioridades;
Inbox.

# Fase 6 — Jerarquía

Ahora aparecen:

subtareas;
árbol;
expansión;
colapso.

Fijate que recién acá.

No antes.

# Fase 7 — Búsquedas

Este módulo merece construirse por separado.

Primero:

búsqueda simple.

Después:

búsqueda avanzada.

Después:

búsquedas guardadas.
# Fase 8 — Recurrencias

Muchos proyectos empiezan por acá.

Yo haría exactamente lo contrario.

Las recurrencias son complejas.

Conviene llegar con un sistema sólido.

# Fase 9 — Adjuntos

Google Drive.

# Fase 10 — Historial

Ya existe información suficiente.

Ahora tiene sentido mostrarla.

# Fase 11 — Estadísticas

La última gran funcionalidad.

Porque depende del historial.

# Fase 12 — Optimización

Recién acá nos preocupamos por:

rendimiento;
caché;
renderizados;
animaciones;
mejoras visuales.