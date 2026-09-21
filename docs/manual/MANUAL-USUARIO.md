# Manual de usuario de Task Engine V2

Última actualización: 21 de septiembre de 2026.

## 1. Qué es Task Engine

Task Engine es una aplicación personal de gestión de tareas pensada para capturar compromisos rápidamente, organizarlos sólo cuando hace falta y trabajar después desde vistas simples de ejecución.

La aplicación funciona como PWA en escritorio y Android. Los datos se conservan localmente para permitir el trabajo sin conexión y se sincronizan con la instalación remota configurada mediante Google Apps Script y Google Sheets.

Task Engine no obliga a usar todas sus funciones. Áreas, contextos, etiquetas, proyectos, objetivos, fechas, prioridades y recordatorios son herramientas opcionales que conviene aplicar sólo cuando ayudan a decidir o encontrar una tarea.

---

## 2. Inicio rápido

Si recién empezás a usar Task Engine, alcanza con este circuito:

1. **Capturá** todo lo nuevo en Inbox.
2. **Procesá Inbox** una o dos veces por día.
3. Poné **fecha de vencimiento sólo cuando exista un plazo real**.
4. Usá **fecha de inicio** cuando una tarea no deba aparecer todavía entre las acciones disponibles.
5. Agrupá en **proyectos** lo que requiera varios pasos.
6. Usá **En espera** para lo que dependa de otra persona o condición.
7. Trabajá principalmente desde **Hoy y atrasadas**, **Próximas** y los proyectos activos.
8. Cuando no esté claro qué seguir, consultá **Qué hago ahora**.
9. Revisá periódicamente las sugerencias de revisión para detectar tareas olvidadas o demasiado pospuestas.
10. Completá, archivá o eliminá lo que ya no requiera atención.

No hace falta configurar todo desde el primer día. Podés empezar usando sólo Inbox, fechas y proyectos, e incorporar el resto a medida que lo necesites.

---

## 3. Flujo de trabajo recomendado


La forma más simple de usar Task Engine puede resumirse así:

**Capturar → procesar → organizar → ejecutar → revisar → cerrar.**

### 2.1 Capturar

Cuando aparece una idea, una obligación o algo que querés recordar, lo más conveniente es registrarlo primero y clasificarlo después.

La entrada natural es **Inbox**.

Podés capturar una tarea:

- desde **Nueva tarea**;
- desde el acceso rápido de la PWA;
- compartiendo texto o un enlace hacia Task Engine desde Android;
- escribiendo metadatos simples en el título de una tarea nueva.

La captura rápida busca evitar que tengas que decidir en ese momento área, proyecto, prioridad o fecha.

### 2.2 Procesar Inbox

Procesar Inbox significa decidir qué hacer con cada elemento capturado.

Para cada tarea conviene preguntarse:

1. ¿Requiere realmente una acción?
2. ¿Es una tarea aislada o forma parte de algo mayor?
3. ¿Tiene una fecha real?
4. ¿Hay algún dato que ayude a encontrarla o ejecutarla después?
5. ¿Depende de otra persona o situación?

Según la respuesta, la tarea puede:

- quedar como tarea pendiente;
- asociarse a un proyecto;
- convertirse en parte de una jerarquía de subtareas;
- vincularse con uno o más objetivos;
- pasar a **En espera**;
- recibir una fecha de inicio o de vencimiento;
- completarse, archivarse o eliminarse si ya no requiere acción.

### 2.3 Organizar sólo lo necesario

Task Engine permite usar:

- **Área**: ámbito estable de responsabilidad, por ejemplo Trabajo, Casa o Personal.
- **Contexto**: condición o lugar útil para ejecutar la tarea, por ejemplo @Casa o @PC.
- **Etiqueta**: clasificación transversal y flexible.
- **Prioridad**: importancia relativa de una tarea.
- **Proyecto**: tarea con subtareas que representa un resultado compuesto.
- **Objetivo**: resultado más amplio al que pueden contribuir varias tareas o proyectos.

No es necesario completar todos esos campos. Una tarea simple puede existir perfectamente sólo con un título.

### 2.4 Programar con criterio

Conviene diferenciar dos conceptos:

- **Fecha de inicio**: desde cuándo una tarea empieza a ser accionable.
- **Fecha de vencimiento**: cuándo existe un plazo real.

No es recomendable usar vencimientos artificiales sólo para que una tarea aparezca en una lista. Para eso existen proyectos, objetivos, filtros, la vista Próximas, las reglas de revisión y «Qué hago ahora».

Una tarea puede tener fecha de inicio sin vencimiento. Cuando tiene ambas, la fecha de inicio debe ser anterior o igual al vencimiento.

### 2.5 Ejecutar

Para el trabajo cotidiano, las vistas más útiles son:

- **Hoy y atrasadas**: tareas que requieren atención inmediata por fecha.
- **Próximas**: tareas programadas para más adelante.
- **Inbox**: elementos que todavía necesitan procesamiento.
- **En espera**: tareas que no pueden avanzar todavía.
- **Proyectos**: cuando estás trabajando sobre un resultado concreto.
- **Qué hago ahora**: ayuda para elegir próximas acciones usando señales existentes de las tareas.

La idea es evitar recorrer permanentemente la lista completa de tareas.

### 2.6 Revisar

La revisión evita que las tareas sin fecha o postergadas desaparezcan del radar.

Task Engine puede detectar situaciones como:

- tareas pendientes sin fecha durante mucho tiempo;
- tareas pospuestas repetidamente;
- tareas vencidas sin resolver;
- tareas procesadas que quedaron sin fecha ni proyecto claro.

Estas reglas sirven como avisos y sugerencias. No modifican silenciosamente las tareas.

También conviene revisar periódicamente:

- Inbox;
- En espera;
- proyectos activos;
- objetivos;
- tareas vencidas;
- tareas que fueron pospuestas varias veces.

### 2.7 Cerrar

Cuando una acción termina:

- **Completar** indica que se realizó.
- **Archivar** conserva una tarea que ya no necesita aparecer en el trabajo activo.
- **Papelera** se reserva para elementos que realmente querés eliminar.

Después de completar una tarea, Task Engine ofrece una posibilidad contextual de deshacer.

---

## 4. Vistas principales

### Inbox

Reúne tareas recién capturadas o todavía no procesadas.

Su función principal es servir como bandeja de entrada, no como lista permanente de trabajo.

### Hoy y atrasadas

Muestra las tareas que vencen hoy y las que ya están vencidas.

Cuando existen horas de vencimiento, las tareas de hoy con hora se ordenan cronológicamente antes de las tareas de hoy sin hora.

### Mañana

Permite anticipar el trabajo inmediatamente próximo.

### Próximas

Muestra tareas futuras para poder revisar lo que viene sin cargar la vista de ejecución diaria.

### Todas

Permite consultar el conjunto general de tareas activas.

### En espera

Agrupa tareas que no pueden avanzar en este momento.

Es útil para acciones que dependen de otra persona, una respuesta, una entrega o una condición externa.

### Calendario

Representa las tareas según sus fechas. Cuando una tarea posee un período entre inicio y vencimiento, ese período también se refleja en el calendario.

### Actividad

Muestra el historial de acciones relevantes realizadas en Task Engine.

Permite revisar cambios sin mezclar eventos técnicos de sincronización con la actividad de uso.

### Estadísticas

Ofrece información de progreso sobre tareas, proyectos y objetivos.

Los períodos disponibles incluyen 7, 30, 90, 180 y 365 días, además del historial completo.

Las estadísticas buscan mostrar evolución y progreso, no asignar un puntaje de productividad.

### Completadas

Reúne las tareas finalizadas.

### Archivadas

Conserva elementos retirados del trabajo activo sin eliminarlos.

### Papelera

Contiene los elementos eliminados y permite separarlos claramente del archivo histórico.

---

## 5. Crear y editar tareas

Una tarea puede incluir:

- título;
- descripción;
- estado;
- área;
- contexto;
- prioridad;
- etiquetas;
- fecha de inicio;
- fecha y hora de vencimiento;
- objetivos;
- adjuntos;
- subtareas;
- recurrencia;
- recordatorio cuando corresponda.

No todos los campos son obligatorios.

### Entrada rápida con lenguaje natural

En una tarea nueva, Task Engine puede reconocer localmente determinados datos escritos junto al título.

Entre otros:

- `/área`;
- `@contexto`;
- `#etiqueta`;
- `!1` prioridad crítica;
- `!2` prioridad alta;
- `!3` prioridad media;
- `!4` prioridad baja;
- fechas y horas reconocibles.

Sólo se utilizan áreas, contextos y etiquetas que ya existen. La interpretación se realiza localmente y no requiere IA.

---

## 6. Fechas, inicio, vencimiento y posposición

### Fecha de inicio

Sirve para ocultar una tarea del trabajo de ejecución hasta que llegue el momento de comenzar a considerarla.

### Vencimiento

Representa un plazo real.

Una tarea vencida aparece entre las tareas que necesitan atención.

### Posponer

Permite mover una tarea hacia adelante sin modificar manualmente toda su programación.

Task Engine conserva información sobre las posposiciones, que también puede utilizarse en las reglas de revisión y en «Qué hago ahora».

---

## 7. Áreas, contextos, etiquetas y prioridad

### Áreas

Una tarea puede pertenecer a una sola área.

Las áreas son apropiadas para responsabilidades relativamente estables.

### Contextos

Los contextos aparecen con el formato `@Nombre` y permiten representar condiciones prácticas de ejecución.

### Etiquetas

Una tarea puede tener varias etiquetas.

Son útiles para agrupaciones que atraviesan áreas, proyectos o contextos.

### Prioridad

La prioridad ayuda a expresar importancia, pero no reemplaza las fechas ni la planificación.

En captura rápida:

- `!1`: crítica;
- `!2`: alta;
- `!3`: media;
- `!4`: baja.

---

## 8. Proyectos y subtareas

Un proyecto es una tarea que posee subtareas.

Las subtareas pueden tener a su vez nuevas subtareas, formando una jerarquía.

Task Engine permite:

- crear subtareas desde un proyecto;
- abrir una subtarea con el editor completo;
- contraer y expandir jerarquías;
- duplicar estructuras conservando sus subtareas;
- navegar mediante breadcrumbs;
- ordenar manualmente cuando la vista lo permite;
- completar un proyecto cuando termina su trabajo asociado.

El orden manual nunca cambia la relación padre-hijo de las tareas.

---

## 9. Objetivos y subobjetivos

Los objetivos representan resultados más amplios que una tarea o un proyecto.

Un objetivo puede:

- contener subobjetivos;
- vincular varias tareas y proyectos;
- mostrar progreso;
- filtrar y ordenar sus tareas;
- permitir crear tareas vinculadas desde el propio objetivo;
- asociarse con notas externas en Notion.

Una tarea puede contribuir a más de un objetivo.

Los proyectos pueden propagar sus objetivos a las tareas descendientes cuando corresponde.

---

## 10. Búsqueda, filtros y orden

### Búsqueda simple

Sirve para localizar tareas por texto rápidamente.

### Búsqueda avanzada

Permite combinar criterios más específicos mediante operadores.

Puede buscar, entre otros datos:

- estado;
- prioridad;
- área;
- contexto;
- etiqueta;
- fechas;
- subtareas;
- recurrencia;
- tareas archivadas o eliminadas;
- proyectos;
- períodos activos.

Los filtros avanzados pueden combinarse mediante AND, OR y NOT.

### Filtros guardados

Una búsqueda de uso frecuente puede conservarse para reutilizarla.

### Filtros rápidos

En determinadas vistas se pueden filtrar las tareas sin construir una búsqueda avanzada completa.

### Orden

Las vistas conservan sus preferencias de orden.

Entre los criterios disponibles se encuentran:

- manual;
- vencimiento;
- prioridad;
- más recientes;
- más antiguas.

---

## 11. Orden manual

Cuando una vista está en **Orden manual** y no existen filtros o búsquedas incompatibles activas, las tareas pueden reorganizarse mediante arrastre.

En Android se utiliza un tirador específico para evitar interferir con el desplazamiento vertical.

El orden se sincroniza entre dispositivos.

---

## 12. Recurrencias

Las recurrencias permiten representar tareas que deben repetirse.

La recurrencia es incompatible con la fecha de inicio.

Conviene utilizar recurrencias para obligaciones verdaderamente repetitivas y no para tareas que simplemente pueden posponerse.

---

## 13. Adjuntos en Google Drive

Las tareas pueden contener archivos adjuntos almacenados en Google Drive.

Task Engine conserva la referencia necesaria para:

- cargar;
- abrir;
- consultar;
- desvincular los archivos según el flujo disponible.

Los adjuntos forman parte de los datos sincronizados de la tarea, mientras que el archivo se mantiene en Drive.

---

## 14. Notas en Notion

Task Engine puede vincular tareas, proyectos y objetivos con páginas externas de Notion.

Desde la entidad correspondiente se puede:

- crear una nota;
- abrirla;
- desvincularla.

El contenido de la nota se edita en Notion. Task Engine conserva el vínculo y determinados metadatos.

Completar, archivar o eliminar una entidad no borra automáticamente su página de Notion.

Si una actualización hacia Notion falla, Task Engine conserva una cola para reintentarla posteriormente.

---

## 15. Recordatorios

Task Engine puede utilizar Google Calendar para generar recordatorios unidireccionales.

El calendario funciona como mecanismo externo de aviso; Task Engine continúa siendo la fuente principal de organización de la tarea.

---

## 16. «Qué hago ahora»

«Qué hago ahora» ayuda a elegir una cantidad reducida de próximas acciones.

Puede considerar señales como:

- prioridad;
- vencimiento;
- atraso;
- fecha de inicio;
- contexto;
- área;
- etiquetas;
- proyecto u objetivo;
- cantidad de posposiciones;
- estado En espera;
- recurrencia.

La función explica por qué una tarea aparece entre las sugerencias.

No cambia prioridades ni modifica tareas automáticamente.

---

## 17. Reglas de revisión

Las reglas configurables detectan situaciones que merecen atención.

Su objetivo es evitar que una tarea permanezca olvidada sólo porque no tiene fecha.

Las reglas generan avisos o sugerencias antes que cambios automáticos.

Pueden desactivarse o configurarse según el flujo personal.

---

## 18. PWA y Android

Task Engine puede instalarse como aplicación web progresiva.

En Android permite:

- abrirse como aplicación independiente;
- trabajar con los datos locales sin conexión;
- recuperar la sincronización al volver Internet;
- recibir texto y enlaces desde **Compartir**;
- utilizar accesos rápidos como Nueva tarea, Inbox y Hoy.

Si Android no ofrece automáticamente la instalación, Task Engine puede mostrar una guía alternativa según el navegador.

---

## 19. Trabajo sin conexión

Si se pierde Internet, los cambios continúan guardándose localmente.

Al recuperar conectividad, Task Engine intenta sincronizar los cambios pendientes.

No es necesario evitar el uso de la aplicación por estar offline.

Si aparece un conflicto real entre dos conjuntos de cambios incompatibles, Task Engine conserva mecanismos explícitos de recuperación en lugar de descartar silenciosamente información.

---

## 20. Sincronización

Task Engine utiliza sincronización incremental para enviar normalmente sólo los cambios locales pendientes.

Cuando es necesario, puede recurrir a una sincronización completa como mecanismo de recuperación.

La interfaz informa el estado general de sincronización y puede mostrar:

- cambios pendientes;
- modo incremental o completo;
- duración;
- datos enviados;
- errores o conflictos;
- información de diagnóstico cuando corresponde.

Los errores transitorios pueden reintentarse. No conviene realizar acciones de recuperación manual mientras la aplicación todavía está intentando confirmar una escritura demorada, salvo que exista un error persistente.

---

## 21. Copias de seguridad y mantenimiento

La instalación puede generar respaldos automáticos en Google Drive.

El sistema de mantenimiento contempla:

- copia diaria;
- copias mensuales;
- copias previas a compactaciones;
- rotación de archivos antiguos;
- copias manuales;
- validación de respaldos;
- restauración como una nueva revisión.

Estas funciones buscan proteger los datos sin depender de copias manuales frecuentes.

---

## 22. Atajos de teclado

En escritorio están disponibles, entre otros:

- **Alt + N**: Nueva tarea;
- **Alt + B**: enfocar la búsqueda;
- **Alt + C**: completar la tarea enfocada.

Los atajos no se ejecutan cuando interferirían con la escritura dentro de campos editables.

---

## 23. Sincronización entre dispositivos

Task Engine puede utilizarse desde más de un dispositivo conectado a la misma instalación.

Las preferencias compatibles y los datos de trabajo se sincronizan.

Para reducir conflictos:

- dejá que termine una sincronización antes de cerrar una sesión cuando acabás de realizar muchos cambios;
- no fuerces recuperaciones manuales ante una demora breve;
- si trabajaste offline en un dispositivo, permití que sincronice al recuperar Internet antes de hacer cambios incompatibles sobre las mismas tareas en otro.

---

## 24. Un ejemplo de rutina diaria

Una rutina sencilla podría ser:

### Al comenzar

1. Abrir **Hoy y atrasadas**.
2. Resolver primero vencimientos reales.
3. Revisar brevemente **Qué hago ahora** si no está claro qué continuar.

### Durante el día

1. Capturar todo lo nuevo en Inbox.
2. No interrumpir el trabajo actual para clasificar cada entrada.
3. Completar o posponer desde la vista donde estés trabajando.

### Al cerrar el día

1. Procesar Inbox.
2. Revisar lo que quedó vencido.
3. Mover a En espera aquello que depende de terceros.
4. Confirmar que los próximos compromisos tengan una programación razonable.

### Periódicamente

1. Revisar proyectos y objetivos.
2. Consultar las reglas de revisión.
3. Revisar tareas reiteradamente pospuestas.
4. Archivar lo que ya no necesita permanecer activo.

---

## 25. Principio general de uso

Task Engine funciona mejor cuando la estructura sirve a las tareas y no al revés.

No hace falta clasificar todo, asignar fechas a todo ni mantener cada lista vacía. El objetivo es que:

- capturar sea rápido;
- decidir qué hacer sea sencillo;
- lo importante no desaparezca;
- las fechas conserven significado;
- los proyectos y objetivos aporten contexto;
- la aplicación reduzca, en lugar de aumentar, la carga mental.
