# Mejora de experiencia móvil

Estado: pendiente de definición detallada.

## Alcance

Revisar y simplificar exclusivamente la experiencia de uso en celular, sin modificar la experiencia de escritorio y sin recortar funcionalidades existentes.

## Objetivo

Reducir ruido visual, desplazamiento innecesario y cantidad de controles simultáneos, manteniendo todas las capacidades de Task Engine accesibles desde móvil.

## Principios acordados

- Tratar la interfaz móvil como una experiencia propia, no como una mera reducción del escritorio.
- Priorizar menos controles visibles al mismo tiempo.
- Reducir scroll vertical cuando sea posible.
- Mejorar la jerarquía entre título, acción principal, contenido y opciones secundarias.
- Mostrar acciones de forma contextual, sólo cuando tengan sentido en la vista o tarea actual.
- Mantener la misma lógica funcional subyacente para evitar duplicación innecesaria y riesgos de estabilidad.

## Próximo paso

Realizar una auditoría móvil por flujos antes de implementar cambios. Revisar al menos:

1. captura rápida;
2. procesamiento de Inbox;
3. navegación;
4. edición de tareas;
5. selección múltiple;
6. planificación;
7. estadísticas.

A partir de esa auditoría, definir qué elementos conviene compactar, ocultar temporalmente, mover a menús o paneles secundarios, o presentar de otra forma en pantallas pequeñas.
