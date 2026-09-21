# Manual técnico de Task Engine V2

Última actualización: 21 de septiembre de 2026.

## 1. Propósito

Este documento describe la arquitectura, estructura, persistencia, sincronización, integraciones, despliegue, pruebas y procedimientos de recuperación de Task Engine V2.

Está pensado como referencia para mantenimiento y evolución del proyecto. No reemplaza el historial de Git, las PR ni `docs/roadmap/PENDIENTES.md`, que continúa siendo la fuente de verdad del backlog vigente.

---

## 2. Resumen de arquitectura

Task Engine V2 es una aplicación web estática, instalable como PWA, construida principalmente con JavaScript ES Modules, HTML y CSS.

La arquitectura puede pensarse en cuatro capas principales:

1. **Dominio**: entidades y reglas del negocio.
2. **Core**: servicios, casos de uso, búsqueda, orden, estadísticas, sincronización y transacciones.
3. **Infraestructura**: persistencia local, preferencias, gateway remoto y estado técnico.
4. **UI**: vistas, editores y controladores de interacción.

El punto de entrada del frontend es:

`src/main.js`

El objeto central de coordinación es:

`src/core/App.js`

La aplicación no utiliza un framework de frontend. El estado principal reside en servicios/repositorios y en el propio objeto `App`; las vistas se vuelven a renderizar a partir de ese estado.

---

## 3. Tecnologías principales

### Frontend

- HTML.
- CSS.
- JavaScript ES Modules.
- APIs nativas del navegador.
- `localStorage` para persistencia local.
- Service Worker y Web App Manifest para PWA.
- Web Locks cuando está disponible, para serializar escrituras de sincronización entre pestañas.

### Backend y almacenamiento remoto

- Google Apps Script.
- Google Sheets como almacenamiento estructurado de revisiones.
- Google Drive para adjuntos, respaldos y mantenimiento.
- Google Calendar para recordatorios.
- Notion como sistema externo de notas.
- Cloudflare Worker como intermediario de la integración GPT ↔ Task Engine.

### Pruebas

- Node Test Runner mediante `node --test`.
- Playwright para pruebas E2E.

Los scripts principales definidos en `package.json` son:

```bash
npm test
npm run test:e2e
npm run generate:pwa-assets
```

---

## 4. Estructura general del repositorio

### `src/domain/`

Contiene las entidades y validaciones fundamentales.

Entre otras:

- `Task.js`
- `Goal.js`
- `Area.js`
- `Context.js`
- `Tag.js`
- `ActivityEvent.js`
- `Attachment.js`
- `Recurrence.js`
- `Priority.js`
- `TaskStatus.js`
- `GoalStatus.js`

La capa de dominio no debería contener lógica de renderizado ni llamadas remotas.

### `src/core/`

Contiene la lógica de aplicación.

Incluye:

- servicios de tareas, áreas, contextos, etiquetas y objetivos;
- transacciones que afectan varias entidades;
- filtros y orden;
- búsqueda avanzada;
- árbol de tareas;
- recurrencias;
- estadísticas;
- señales de revisión;
- «Qué hago ahora»;
- backups lógicos;
- políticas y motor de sincronización;
- reconciliación y merge.

Archivos especialmente relevantes:

- `App.js`
- `TaskService.js`
- `GoalService.js`
- `BackupService.js`
- `AdvancedSearch.js`
- `TaskSorting.js`
- `TaskFilters.js`
- `SyncEngine.js`
- `SyncChangeSet.js`
- `SyncThreeWayMerger.js`
- `SyncBackupMerger.js`
- `WhatDoNow.js`
- `TaskReviewSignals.js`

### `src/infrastructure/`

Contiene persistencia y comunicación con sistemas externos.

Entre otros:

- repositorios de entidades sobre `localStorage`;
- configuración de sincronización;
- snapshot base de sincronización;
- cambios incrementales pendientes;
- métricas de sincronización;
- preferencias de visualización;
- cola de reintentos de Notion;
- `CloudGateway.js`.

### `src/ui/`

Contiene vistas y controladores.

La aplicación utiliza numerosos controladores pequeños y especializados, por ejemplo:

- editores de tarea;
- layout móvil y escritorio;
- filtros;
- orden manual;
- PWA;
- recuperación offline;
- Notion;
- adjuntos;
- recordatorios;
- objetivos;
- proyectos;
- accesibilidad;
- atajos de teclado;
- lenguaje natural;
- «Qué hago ahora».

### `styles/`

Contiene estilos funcionales, responsive y temas.

Los temas intercambiables viven principalmente en:

`styles/themes/`

### `google-apps-script/`

Contiene el backend de Apps Script.

Archivo principal:

`google-apps-script/Code.gs`

### `tests/`

Contiene las pruebas automáticas de dominio, core, infraestructura y UI.

### `docs/`

Contiene documentación funcional, diseño, roadmap y manuales.

---

## 5. Arranque de la aplicación

El frontend comienza en `src/main.js`.

La secuencia general es:

1. se crea una instancia de `App`;
2. se crean los controladores especializados;
3. cada controlador recibe la instancia de `App`;
4. se ejecuta `.start()` sobre los controladores;
5. se inicia `app.start()`;
6. se inicializa el tema visual.

Esto permite que los controladores agreguen o envuelvan comportamiento sin concentrar toda la lógica en una única clase.

`App` coordina:

- servicios;
- repositorios;
- vista actual;
- selección de tareas y objetivos;
- filtros;
- búsqueda;
- edición;
- sincronización;
- renderizado;
- navegación.

---

## 6. Modelo de datos de tareas

La entidad principal es `Task`.

Los campos relevantes incluyen:

- `id`
- `title`
- `description`
- `status`
- `statusBeforeDelete`
- `statusBeforeCompletion`
- `isWaitingBeforeCompletion`
- `areaId`
- `contextId`
- `priority`
- `tagIds`
- `goalIds`
- `attachments`
- `notionPageId`
- `notionPageUrl`
- `isWaiting`
- `isProject`
- `parentTaskId`
- `recurrenceId`
- `recurrence`
- `recurrenceInterval`
- `recurrenceWeekdays`
- `reminder`
- `manualOrder`
- `version`
- `createdAt`
- `updatedAt`
- `completedAt`
- `startDate`
- `dueDate`
- `dueTime`
- `postponements`

Cada tarea tiene un `version` entero que aumenta al modificarse.

Las fechas se almacenan como strings normalizados. Los timestamps completos utilizan formato ISO cuando corresponde.

---

## 7. Estados de tarea

Los estados persistidos principales son:

- `INBOX`
- `PENDING`
- `COMPLETED`
- `ARCHIVED`
- `DELETED`

**En espera** no es un sexto estado independiente: se representa mediante `isWaiting` sobre tareas activas compatibles.

Este diseño permite conservar la distinción entre estado principal y condición de espera.

---

## 8. Jerarquía y proyectos

Una tarea puede vincularse a otra mediante:

`parentTaskId`

Una tarea que actúa como proyecto utiliza además:

`isProject: true`

La jerarquía admite varios niveles.

Las operaciones que afectan estructuras completas deben preservar:

- `parentTaskId`;
- referencias válidas;
- orden;
- asociación a objetivos;
- consistencia del árbol.

La duplicación de proyectos utiliza lógica específica para reconstruir la jerarquía con nuevos identificadores.

El orden manual utiliza `manualOrder`, pero no modifica relaciones padre-hijo.

---

## 9. Objetivos

Los objetivos se almacenan de forma separada de las tareas.

Una tarea puede relacionarse con uno o más objetivos mediante:

`goalIds`

Los objetivos también pueden formar jerarquías mediante referencias a objetivos padre.

La aplicación incluye transacciones específicas para evitar referencias rotas al eliminar objetivos.

---

## 10. Áreas, contextos y etiquetas

Estas entidades tienen repositorios propios.

Las referencias desde una tarea son:

- `areaId`: una sola área;
- `contextId`: un solo contexto;
- `tagIds`: varias etiquetas.

Las eliminaciones que podrían dejar referencias inválidas deben utilizar las transacciones o servicios definidos para limpiar las tareas asociadas.

No conviene eliminar directamente registros desde `localStorage`.

---

## 11. Persistencia local

Los datos funcionales se almacenan en `localStorage`.

Cada colección utiliza una clave propia.

Ejemplos:

- tareas;
- áreas;
- contextos;
- etiquetas;
- objetivos;
- eventos de actividad;
- preferencias;
- estado de sincronización.

Los repositorios cargan los datos al construirse y los persisten después de cada modificación.

Esta persistencia local es la base que permite:

- apertura inmediata;
- funcionamiento offline;
- cambios sin conexión;
- reconciliación posterior.

Google Sheets no reemplaza a la base local durante el uso corriente: funciona como persistencia remota y mecanismo de sincronización entre instalaciones/dispositivos.

---

## 12. Servicios y transacciones

Los repositorios no deberían ser utilizados directamente por la UI para modificar el dominio.

Las operaciones pasan normalmente por servicios, por ejemplo:

- `TaskService`
- `AreaService`
- `ContextService`
- `TagService`
- `GoalService`

Hay guardas y transacciones específicas para cambios que involucran varias entidades.

Ejemplos:

- eliminar una etiqueta y limpiar sus referencias;
- eliminar un objetivo y actualizar tareas;
- operaciones atómicas sobre árboles;
- modificaciones múltiples de tareas.

El objetivo es evitar estados parciales si una operación falla a mitad de camino.

---

## 13. Backup lógico del frontend

`BackupService` construye una representación completa de los datos funcionales.

Ese snapshot es utilizado para:

- sincronización;
- comparación;
- fingerprint;
- merge;
- importación/exportación;
- restauración.

El backup lógico y los respaldos automáticos de Google Drive son conceptos relacionados pero diferentes:

- el **backup lógico** es una representación interna del estado;
- el **respaldo de mantenimiento** es un archivo persistente en Drive.

---

## 14. Sincronización: visión general

La sincronización está coordinada por:

`src/core/SyncEngine.js`

y por:

`src/infrastructure/CloudGateway.js`

El backend remoto vive en:

`google-apps-script/Code.gs`

La sincronización trabaja con una revisión remota numérica.

Cada escritura se realiza contra una `baseRevision`. Esto evita sobrescribir silenciosamente cambios remotos que el cliente no conocía.

---

## 15. Sincronización incremental

El flujo normal intenta enviar sólo las diferencias locales.

Para ello se conserva localmente:

1. el último snapshot sincronizado;
2. la revisión correspondiente;
3. los cambios locales pendientes.

Componentes principales:

- `SyncBaseSnapshotRepository`
- `PendingSyncChangesRepository`
- `SyncChangeSet.js`

El motor compara:

**base sincronizada → estado local actual**

y genera altas, modificaciones y eliminaciones incrementales.

Cuando la escritura incremental se confirma, la base local pasa a ser exactamente el snapshot cuya escritura fue confirmada.

Este punto es importante: no debe reconstruirse la base desde un estado local posterior a la escritura, porque podrían incorporarse cambios que todavía no llegaron a la nube.

---

## 16. Fallback a snapshot completo

La sincronización incremental no elimina el mecanismo de snapshot completo.

El snapshot completo se utiliza como recuperación cuando:

- no existe una base incremental confiable;
- la entidad incremental remota ya no coincide;
- aparece una condición de protocolo recuperable;
- una migración o inconsistencia requiere reconciliación completa.

El fallback conserva la protección de `baseRevision`.

---

## 17. Detección de conflictos

Si la revisión remota avanzó independientemente de la base conocida por el cliente, la aplicación puede detectar un conflicto.

Task Engine distingue entre:

- cambios compatibles;
- migraciones equivalentes;
- modificaciones remotas recuperables;
- conflictos genuinos.

Hay lógica de merge de tres vías y reconciliación segura.

Un conflicto genuino no debe resolverse sobrescribiendo datos automáticamente.

---

## 18. Escrituras inciertas y demoras

Una demora de red o timeout no significa necesariamente que Apps Script no haya guardado.

Por eso el motor puede:

1. detectar que el resultado de la escritura es incierto;
2. consultar la revisión remota;
3. comprobar si la escritura llegó efectivamente;
4. adoptar la nueva revisión si el contenido coincide.

Esto evita duplicaciones y errores falsos.

---

## 19. Reintentos y SERVER_BUSY

Las respuestas `SERVER_BUSY` se reintentan con espera gradual.

El motor utiliza retrasos sucesivos antes de abandonar la operación.

La lógica está separada de las escrituras inciertas porque `SERVER_BUSY` representa un rechazo conocido del servidor, no una escritura cuyo resultado se desconoce.

---

## 20. Escrituras entre pestañas

`CloudGateway` puede utilizar Web Locks del navegador para serializar escrituras iniciadas desde varias pestañas de la misma instalación.

Esto reduce contención y evita que dos envíos locales compitan innecesariamente contra Apps Script.

---

## 21. Consulta liviana de estado

Apps Script admite una acción `status`.

Su objetivo es obtener principalmente:

- revisión remota;
- hora del servidor.

Esto permite comprobar si la nube cambió sin descargar el snapshot completo.

Si el backend desplegado no soporta la acción liviana, el frontend conserva compatibilidad y puede volver a utilizar `load`.

---

## 22. Métricas de sincronización

El sistema registra diagnósticos locales de sincronización.

Pueden incluir:

- duración total;
- bytes enviados;
- cantidad de cambios;
- modo incremental o completo;
- filas escritas;
- tiempo de procesamiento del servidor;
- espera por lock;
- tiempo de lectura;
- tiempo de escritura;
- motivo de fallback.

Estas métricas son diagnósticas y no forman parte del dominio de tareas.

---

## 23. Recuperación offline

`OfflineSyncRecoveryController` observa los eventos `online` y `offline`.

Cuando el navegador queda sin conexión:

- los cambios continúan locales;
- se marca el estado offline;
- no se descartan modificaciones.

Al recuperar Internet:

- se intenta comprobar la nube;
- si existe una edición activa que podría ser interrumpida, se difiere;
- si falla, se aplican reintentos progresivos.

Los retrasos por defecto son aproximadamente:

- 5 s;
- 15 s;
- 30 s;
- 60 s.

---

## 24. Apps Script

`google-apps-script/Code.gs` funciona como API del backend.

Entre sus responsabilidades se encuentran:

- autorización;
- limitación de solicitudes;
- lectura de revisión;
- carga de snapshot;
- escritura completa;
- escritura incremental;
- adjuntos;
- Notion;
- recordatorios;
- mantenimiento;
- respaldos;
- operaciones necesarias para la integración GPT.

Las acciones del frontend se envían generalmente mediante POST con un campo `action`.

---

## 25. Google Sheets

Sheets se utiliza como almacenamiento estructurado de revisiones.

La implementación conserva metadatos de revisión y filas asociadas a la revisión activa.

La escritura está protegida con `LockService` del lado de Apps Script.

El diseño por revisiones permite:

- detectar conflictos;
- validar `baseRevision`;
- realizar backups coherentes;
- restaurar estados sin sobrescribir silenciosamente la historia inmediata.

No se recomienda editar manualmente las hojas de almacenamiento.

---

## 26. Adjuntos en Google Drive

Los archivos adjuntos se almacenan físicamente en Google Drive.

La tarea conserva metadatos como:

- identificador interno;
- `driveFileId`;
- nombre;
- MIME type;
- tamaño;
- URL;
- fecha de creación.

La referencia forma parte del snapshot sincronizado, pero el archivo vive en Drive.

Las validaciones del backend impiden referencias malformadas y duplicados dentro de la misma tarea.

---

## 27. Notion

Task Engine utiliza Notion como almacenamiento externo de notas.

El contenido completo de las notas no se copia a Task Engine.

Task Engine conserva:

- ID de página;
- URL;
- metadatos suficientes para sincronizar estado.

Hay soporte para tareas, proyectos y objetivos.

Las credenciales sensibles permanecen del lado de Apps Script mediante Script Properties.

Las actualizaciones fallidas pueden almacenarse en una cola local persistente y reintentarse más adelante.

Las colas están aisladas por instalación/endpoint para evitar cruces entre usuarios.

---

## 28. Google Calendar y recordatorios

El modelo de tarea admite un objeto `reminder`.

Hay dos tipos principales:

### Relativo al vencimiento

```json
{
  "type": "due",
  "minutesBefore": 30
}
```

Requiere fecha y hora de vencimiento.

### Momento absoluto

```json
{
  "type": "at",
  "at": "2026-09-21T15:00:00.000Z"
}
```

Puede existir sin vencimiento.

La integración es unidireccional: Task Engine origina el recordatorio y Google Calendar funciona como mecanismo externo de aviso.

---

## 29. PWA

Task Engine es instalable como Progressive Web App.

Los componentes principales son:

- `manifest.webmanifest`;
- `service-worker.js`;
- `pwa-assets.js`;
- `PwaController.js`;
- `PwaLaunchController.js`.

El service worker cachea el shell de la aplicación y los módulos incluidos en `pwa-assets.js`.

El archivo de assets se puede regenerar mediante:

```bash
npm run generate:pwa-assets
```

Cuando se agregan o eliminan archivos que deben estar disponibles offline, es importante revisar el precache.

---

## 30. Share Target y shortcuts

El manifest registra Task Engine como destino para compartir contenido compatible desde Android.

El flujo abre el contenido recibido como borrador de tarea, sin guardarlo automáticamente.

También existen shortcuts de PWA para accesos frecuentes.

La lógica de lanzamiento se concentra en `PwaLaunchController`.

---

## 31. Temas visuales

Los temas se implementan como CSS independientes.

La preferencia seleccionada se persiste y `ThemeController` aplica la variante correspondiente.

Al agregar un tema nuevo hay que revisar al menos:

1. CSS del tema;
2. registro entre temas admitidos;
3. selector de Apariencia;
4. persistencia de preferencia;
5. carga desde `index.html`;
6. precache PWA;
7. pruebas.

Un tema visible en el selector pero ausente del registro de preferencias puede quedar seleccionable sin aplicarse correctamente.

---

## 32. Búsqueda avanzada

La búsqueda avanzada se implementa en `AdvancedSearch.js`.

Admite expresiones combinables mediante:

- AND;
- OR;
- NOT.

Los filtros trabajan sobre propiedades semánticas de las tareas, no sobre consultas directas a Google Sheets.

Los filtros guardados persisten como entidades locales y participan de sincronización/backups según su integración vigente.

---

## 33. Orden y filtros por vista

Las preferencias de orden y filtros se guardan separadamente de las entidades principales.

Esto permite conservar configuraciones por vista sin modificar las tareas.

El orden manual sí utiliza `manualOrder` dentro de la tarea porque representa una propiedad persistente de orden relativo.

---

## 34. Historial de actividad

Los eventos de actividad se almacenan localmente y forman parte del backup/sincronización.

El objetivo es registrar acciones útiles para el usuario.

Los eventos puramente técnicos de sincronización quedan fuera del historial funcional para evitar ruido.

---

## 35. Estadísticas

Las estadísticas se calculan a partir de los datos existentes.

No constituyen una base separada de productividad.

Los cálculos deben evitar:

- doble conteo;
- proyectos eliminados;
- árboles borrados;
- mezcla incorrecta entre progreso propio y acumulado.

---

## 36. «Qué hago ahora» y reglas de revisión

Estas funciones operan localmente sobre señales existentes.

No requieren que una IA modifique tareas.

Las señales pueden incluir:

- prioridad;
- fechas;
- atraso;
- contexto;
- área;
- etiquetas;
- proyecto;
- objetivo;
- posposiciones;
- En espera;
- recurrencia.

Las reglas producen sugerencias o avisos antes que cambios automáticos.

---

## 37. Entrada local en lenguaje natural

`NaturalTaskEntryParser.js` interpreta sintaxis acotada y predecible.

Entre otros:

- `/área`;
- `@contexto`;
- `#etiqueta`;
- `!1` a `!4`;
- fechas;
- horas.

El parser sólo acepta referencias existentes cuando corresponde.

No depende de un servicio de IA.

---

## 38. Integración GPT ↔ Task Engine

La integración con ChatGPT está separada del parser local.

Arquitectura general:

**ChatGPT Action → Cloudflare Worker → Apps Script → datos de Task Engine**

El Worker actúa como capa intermedia de autenticación y separación de configuraciones.

Apps Script expone operaciones de contexto y tareas necesarias para:

- buscar;
- leer;
- crear;
- actualizar;
- completar.

El GPT no debe inventar datos cuando una consulta remota falla.

Las credenciales no deben exponerse en el frontend público.

---

## 39. Backups automáticos

El backend puede crear respaldos JSON en Google Drive.

El sistema contempla:

- respaldo diario;
- respaldo mensual;
- copia previa a compactación;
- respaldo manual;
- validación;
- rotación;
- restauración.

La estructura de Drive utiliza una carpeta de mantenimiento asociada a Task Engine y separación por instalación.

---

## 40. Política de retención de respaldos

La configuración consolidada contempla una retención conservadora aproximada de:

- 45 respaldos automáticos;
- 12 mensuales;
- 20 previos a compactación;
- 90 diagnósticos.

Si estas cifras se modifican en `Code.gs`, el manual debe actualizarse.

---

## 41. Restauración

La restauración no debería reemplazar silenciosamente la revisión vigente.

El procedimiento previsto:

1. seleccionar un respaldo válido;
2. validar estructura;
3. generar una copia de seguridad del estado actual;
4. restaurar el respaldo como una nueva revisión;
5. volver a sincronizar los clientes.

Después de una restauración conviene evitar editar simultáneamente desde varios dispositivos hasta que todos hayan adoptado la nueva revisión.

---

## 42. Compactación y mantenimiento

La compactación elimina o reorganiza datos históricos de forma segura según las reglas del backend.

Antes de una compactación se genera un respaldo específico.

El mantenimiento automático no debería romper la revisión activa ni alterar referencias válidas.

---

## 43. Configuración y secretos

Nunca deben incorporarse al repositorio:

- tokens reales;
- credenciales de Notion;
- secretos del Worker;
- tokens de Task Engine;
- claves privadas;
- datos personales de usuarios.

Los secretos de Apps Script se mantienen en Script Properties.

Los secretos del Worker se administran como secrets del entorno correspondiente.

---

## 44. Desarrollo local

Requisitos mínimos:

- Git;
- Node.js;
- navegador moderno;
- opcionalmente VS Code.

Flujo típico:

```bash
git clone <repositorio>
cd Task-Engine-V2
npm install
npm test
```

La aplicación es estática, por lo que puede servirse con un servidor HTTP local apropiado.

No conviene abrir `index.html` directamente mediante `file://` cuando se prueban módulos, PWA o service worker.

---

## 45. Flujo de ramas

La regla de trabajo consolidada es:

1. actualizar `main`;
2. crear una rama específica;
3. implementar;
4. ejecutar pruebas;
5. actualizar documentación/backlog si corresponde;
6. abrir PR;
7. realizar verificación manual;
8. fusionar sólo después de aprobación.

No conviene acumular cambios funcionales no relacionados dentro de la misma PR.

---

## 46. Pruebas unitarias e integración

La suite principal se ejecuta con:

```bash
npm test
```

Utiliza Node Test Runner.

Los cambios de dominio, persistencia, sincronización o reglas deberían incorporar pruebas automáticas siempre que sea razonable.

Antes de fusionar conviene además ejecutar:

```bash
git diff --check
```

para detectar errores de espacios o formato de diff.

---

## 47. Pruebas E2E

Las pruebas de navegador utilizan Playwright.

Se ejecutan con:

```bash
npm run test:e2e
```

Son especialmente útiles para:

- PWA;
- share target;
- navegación;
- interacción real con DOM;
- flujos que dependen del navegador.

Una suite E2E no ejecutada por falta de Playwright debe registrarse explícitamente en la PR; no debe presentarse como aprobada.

---

## 48. Validación manual

Hay cambios que requieren dispositivo real.

Ejemplos:

- instalación PWA;
- Android Share Target;
- rotación;
- drag & drop táctil;
- selectores nativos;
- comportamiento al recuperar conectividad;
- sincronización cross-device.

La cobertura automatizada no reemplaza estas verificaciones.

---

## 49. Despliegue del frontend

Task Engine se publica como sitio estático mediante GitHub Pages.

Después de fusionar cambios en `main`, hay que considerar el caché PWA.

Si la versión publicada no se refleja inmediatamente:

1. verificar que GitHub Pages haya publicado el commit;
2. verificar actualización del service worker;
3. cerrar y volver a abrir la PWA;
4. si persiste, revisar versión/caché del service worker.

No debe asumirse que un error de caché implica pérdida de datos.

---

## 50. Despliegue de Apps Script

Cuando `google-apps-script/Code.gs` cambia, fusionar GitHub no actualiza automáticamente el Apps Script desplegado.

Procedimiento:

1. abrir el proyecto de Apps Script;
2. reemplazar `Code.gs` con la versión correspondiente a `main`;
3. guardar;
4. abrir **Implementar → Administrar implementaciones**;
5. editar la implementación web existente;
6. seleccionar **Nueva versión**;
7. implementar.

Editar la implementación existente mantiene su URL.

Si una PR modifica `Code.gs`, su descripción debe indicar claramente si requiere redespliegue.

---

## 51. Compatibilidad entre frontend y backend

El frontend intenta conservar compatibilidad razonable con versiones anteriores del backend en ciertos flujos, por ejemplo el endpoint liviano de estado.

Sin embargo, una modificación de protocolo puede requerir desplegar ambas partes en orden.

Cuando se modifica el contrato:

1. definir compatibilidad;
2. agregar pruebas;
3. desplegar backend si es compatible hacia atrás;
4. desplegar frontend;
5. validar;
6. retirar compatibilidad vieja sólo en una etapa posterior.

---

## 52. Diagnóstico de sincronización

Ante problemas de sincronización, revisar primero:

1. conexión a Internet;
2. estado visible en Task Engine;
3. cambios pendientes;
4. última métrica;
5. modo incremental/completo;
6. errores de protocolo;
7. revisión local/remota;
8. tiempos de Apps Script.

Indicadores útiles:

- `SERVER_BUSY`;
- timeout de lectura;
- timeout de escritura;
- conflicto de revisión;
- fallback a snapshot completo;
- filas escritas;
- `lockWaitMs`;
- `readMs`;
- `writeMs`.

No conviene modificar datos manualmente en Sheets como primera respuesta a un problema.

---

## 53. Recuperación ante conflicto

Ante un conflicto real:

1. evitar seguir editando las mismas entidades desde varios dispositivos;
2. identificar qué dispositivo posee la versión correcta;
3. utilizar los mecanismos de recuperación de la aplicación;
4. verificar que la revisión se estabilice;
5. confirmar sincronización en los demás dispositivos.

No borrar `localStorage` como primera medida: puede contener los únicos cambios locales todavía no sincronizados.

---

## 54. Recuperación ante problemas de caché PWA

Si la interfaz parece antigua pero los datos están correctos:

1. comprobar la versión publicada;
2. cerrar completamente la PWA;
3. volver a abrir;
4. verificar service worker;
5. sólo como último recurso considerar limpiar datos del sitio.

Limpiar almacenamiento del sitio puede borrar estado local no sincronizado y debe evitarse mientras existan cambios pendientes.

---

## 55. Recuperación ante corrupción o pérdida remota

Si la nube contiene datos dañados o incompletos:

1. detener ediciones en otros dispositivos;
2. identificar un respaldo válido;
3. crear una copia del estado actual si todavía es posible;
4. restaurar mediante el mecanismo de mantenimiento;
5. comprobar la nueva revisión;
6. abrir clientes uno por uno;
7. verificar que adopten el estado restaurado.

---

## 56. Mantenimiento del modelo de datos

Cuando se agrega un campo persistente a una entidad hay que revisar, como mínimo:

- constructor de dominio;
- validación;
- `update()`;
- `toJSON()`;
- repositorio local;
- backup;
- sincronización;
- validación en Apps Script;
- merge;
- búsqueda/filtros si corresponde;
- UI;
- pruebas;
- documentación.

Una modificación que sólo actualice el editor pero no el snapshot puede provocar pérdida de datos al sincronizar.

---

## 57. Incorporación de una nueva colección

Una nueva colección persistente requiere normalmente:

1. entidad de dominio;
2. repositorio;
3. servicio;
4. inclusión en `BackupService`;
5. sincronización;
6. validación remota;
7. merge;
8. backups;
9. migración;
10. UI;
11. pruebas.

Debe evitarse agregar colecciones paralelas si el dato puede vivir correctamente dentro de una entidad existente.

---

## 58. Modificación de sincronización

Los cambios en sincronización son de alto riesgo.

Antes de modificarlos hay que preservar estos invariantes:

- nunca perder cambios locales silenciosamente;
- nunca sobrescribir una revisión remota desconocida;
- distinguir conflicto de timeout;
- no asumir que timeout significa escritura fallida;
- preservar fallback completo;
- mantener una base sincronizada coherente;
- no interrumpir formularios con cambios sin guardar;
- permitir recuperación offline.

Toda modificación relevante debe tener pruebas específicas de regresión.

---

## 59. Modificación de PWA

Al agregar un archivo necesario offline:

1. incluirlo en el shell/asset list;
2. regenerar `pwa-assets.js` si corresponde;
3. revisar service worker;
4. actualizar versión de caché cuando sea necesario;
5. probar actualización desde una instalación existente;
6. probar instalación limpia.

---

## 60. Modificación de Apps Script

Apps Script concentra múltiples responsabilidades y debe tratarse con cautela.

Para cambios importantes:

1. trabajar primero en Git;
2. incorporar pruebas del frontend/protocolo cuando corresponda;
3. evitar editar producción como única copia;
4. fusionar;
5. copiar la versión exacta de `main`;
6. desplegar una nueva versión;
7. probar;
8. registrar cualquier migración o configuración adicional.

---

## 61. Observabilidad y logging

El frontend utiliza logs de consola para determinadas métricas técnicas, especialmente sincronización.

Apps Script conserva diagnósticos adicionales para mantenimiento.

Los logs no deben contener:

- tokens;
- secretos;
- contenido sensible innecesario.

Los mensajes de error visibles al usuario deben ser comprensibles y separar el detalle técnico cuando sea posible.

---

## 62. Multiusuario

La arquitectura actual permite instalaciones/configuraciones separadas.

El aislamiento depende de:

- configuración de endpoint;
- token;
- almacenamiento remoto;
- carpetas;
- Notion;
- colas locales asociadas a instalación.

No debe asumirse que “multiusuario” significa edición colaborativa concurrente sobre una misma base. Esa capacidad es conceptualmente distinta y no forma parte del alcance consolidado.

---

## 63. Principios de evolución

Antes de agregar una nueva función conviene evaluar:

1. si ya puede resolverse con una función existente;
2. si aumenta o reduce carga cognitiva;
3. si necesita persistencia nueva;
4. si afecta sincronización;
5. si debe funcionar offline;
6. si necesita soporte móvil específico;
7. si requiere mantenimiento de backend;
8. cómo se respaldará y restaurará.

La prioridad del proyecto es confiabilidad antes que acumulación de funciones.

---

## 64. Fuentes de verdad del proyecto

Para determinar el estado técnico actual:

1. **Código en `main`**: fuente principal de comportamiento implementado.
2. **`docs/roadmap/PENDIENTES.md`**: backlog vigente.
3. **`docs/roadmap/ROADMAP.md`**: capacidades consolidadas e historial de cierres.
4. **PR e issues**: contexto de decisiones e implementación.
5. **Manual de usuario**: comportamiento esperado desde la perspectiva del usuario.
6. **Este manual técnico**: referencia de arquitectura y mantenimiento.

Si una conversación histórica contradice el código actual, prevalece el repositorio.

---

## 65. Checklist antes de fusionar cambios

### Código

- [ ] parte de `main` actualizado;
- [ ] cambio acotado a una rama;
- [ ] no contiene secretos;
- [ ] preserva compatibilidad de datos;
- [ ] no rompe funcionamiento offline.

### Pruebas

- [ ] `npm test`;
- [ ] pruebas específicas del cambio;
- [ ] `npm run test:e2e` cuando corresponda;
- [ ] `git diff --check`;
- [ ] validación manual cuando dependa de navegador/dispositivo.

### Persistencia

- [ ] modelo;
- [ ] repositorio;
- [ ] backup;
- [ ] sincronización;
- [ ] Apps Script;
- [ ] restauración.

### PWA

- [ ] precache actualizado;
- [ ] instalación existente;
- [ ] instalación limpia;
- [ ] Android si corresponde.

### Documentación

- [ ] `PENDIENTES.md`;
- [ ] `ROADMAP.md` si cierra una etapa;
- [ ] manual de usuario si cambia comportamiento;
- [ ] manual técnico si cambia arquitectura o despliegue.

---

## 66. Checklist ante una incidencia grave

1. No borrar almacenamiento local.
2. No editar Sheets manualmente.
3. Evitar cambios simultáneos en otros dispositivos.
4. Registrar el mensaje exacto del error.
5. Revisar diagnóstico de sincronización.
6. Identificar última revisión válida.
7. Confirmar existencia de respaldo.
8. Recuperar con mecanismos soportados.
9. Validar en un dispositivo.
10. Recién después reabrir los demás clientes.

---

## 67. Estado actual de estabilidad

A septiembre de 2026:

- la sincronización incremental está desplegada;
- las mejoras de contención y diagnóstico están desplegadas;
- la corrección de base incremental está desplegada;
- el sistema fue utilizado durante varios días en escritorio y Android;
- los errores que exigían reintentos se redujeron de forma muy significativa;
- no existe actualmente un pendiente de rediseño de sincronización salvo que aparezca una regresión reproducible.

---

## 68. Criterio general de mantenimiento

Task Engine debe mantenerse como una aplicación personal confiable, comprensible y recuperable.

Ante una decisión técnica, conviene favorecer:

**integridad de datos → recuperación → compatibilidad → claridad → rendimiento → nuevas funciones.**

Una optimización que comprometa la capacidad de recuperar los datos no es una mejora.
