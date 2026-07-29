# Registro de decisiones

## D-001

Una tarea pertenece a una única área.

Motivo:
Las múltiples clasificaciones se resuelven mediante etiquetas.

Estado:
Aceptada.

---

## D-002

Las recurrencias son entidades independientes.

Estado:
Aceptada.

---

## D-003

Google Sheets es un mecanismo de persistencia y no la base de datos del sistema.

Estado:
Aceptada.

---

## D-004

La aplicación conserva paridad funcional entre escritorio y celular, pero adapta sus prioridades de uso.

El escritorio es el entorno principal para planificación, revisión, organización, jerarquías y operaciones amplias.

El celular es el entorno principal para consultar acciones inmediatas, capturar, completar, posponer y ejecutar acciones rápidas.

Las funciones complejas permanecen disponibles en celular mediante paneles o secciones que eviten saturar la interfaz.

Estado:
Aceptada.

---

## D-005

Las acciones rápidas se limitan a operaciones útiles durante la ejecución inmediata.

Agregar subtarea y Posponer permanecen como accesos directos contextuales. Archivar y Enviar a Papelera se agrupan en **Más acciones**. Duplicar permanece al final como acción secundaria.

Editar, Mover, Quitar fecha y Convertir en tarea principal se realizan desde el editor. Las tareas recurrentes conservan su menú específico.

Estado:
Aceptada.

---

## D-006

Las listas extensas se administran mediante selectores reutilizables con búsqueda, altura limitada y confirmación explícita. Las selecciones múltiples se representan mediante chips.

Las asociaciones entre objetivos y tareas se gestionan desde sus editores, sin sobrecargar las vistas de seguimiento. Los filtros adicionales por área o tipo se incorporarán sólo si el volumen real demuestra que son necesarios.

Mover una tarea o proyecto, y convertir una subtarea en tarea principal, se realiza desde el editor. El movimiento conserva el árbol completo y excluye la propia tarea y sus descendientes para impedir ciclos.

Estado:
Aceptada.

---

## D-007

La edición múltiple permite agregar uno o varios objetivos mediante el mismo selector buscable y compacto utilizado para otras asociaciones.

La operación es aditiva: conserva los objetivos que cada tarea ya tenía y suma los nuevos sin duplicarlos. Puede aplicarse junto con prioridad, fecha, área, contexto y etiquetas en una sola escritura masiva.

Estado:
Aceptada.

---

## D-008

La arquitectura de seguridad actual se considera adecuada para el uso personal previsto y no requiere reescribir ni migrar el backend.

El token se envía en el cuerpo de solicitudes `POST`, se valida en Apps Script y se conserva localmente para permitir la sincronización automática. Se aceptan los riesgos residuales propios de `localStorage`, el endpoint público y la credencial compartida, con rotación como mecanismo de revocación.

La auditoría del código queda cerrada. La verificación operativa depende de confirmar que el despliegue de Apps Script utiliza la versión actual.

Estado:
Aceptada.

---

## D-009

Las vistas de seguimiento priorizan el contenido existente y mantienen las herramientas de creación bajo demanda.

En Objetivos, la vista inicial muestra los objetivos existentes o un estado vacío y ofrece la creación mediante una acción explícita. Al abrir un objetivo, los proyectos aparecen contraídos y conservan visible su control de expansión; sus subtareas se muestran sólo a pedido.

La simplificación visual no elimina funcionalidad: reduce herramientas permanentes y preserva el foco sobre el contenido.

Estado:
Aceptada.

---

## D-010

En celular, el encabezado de un objetivo reserva una fila completa para el título y ubica todas sus acciones en una fila inferior.

La adaptación es exclusiva de la vista móvil y no altera la distribución de escritorio. El reemplazo general de textos por íconos se mantiene como una decisión posterior y sistemática.

Estado:
Aceptada.

---

## D-011

La estética principal de Task Engine responde a Flat 2.0 y utiliza la simplificación visual como administración contextual de la complejidad, no como pérdida de funciones.

Las vistas de ejecución priorizan concentración y acciones inmediatas; las vistas de planificación permiten mayor detalle. La iconografía se implementa mediante una familia única de SVG simples, consistentes y accesibles. Los valores visuales se organizarán progresivamente mediante variables CSS semánticas para admitir temas futuros.

La referencia normativa queda registrada en `docs/design/VISUAL-GUIDE.md`.

Estado:
Aceptada.
