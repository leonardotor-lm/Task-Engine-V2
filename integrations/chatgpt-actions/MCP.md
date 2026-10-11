# Task Engine MCP para ChatGPT

## Infraestructura y alcance

El mismo Cloudflare Worker de `integrations/chatgpt-actions/worker.js` conserva las rutas Actions `/v1/*` y agrega `/mcp` con Streamable HTTP sin sesiones y respuestas JSON. Usa el SDK oficial MCP. Cada solicitud crea una instancia independiente; no guarda cuentas en estado global. Las herramientas delegan en las rutas existentes, que inyectan el token privado de Apps Script. No se introduce una segunda base de datos.

Herramientas: `getTaskEngineContext`, `searchTaskEngineTasks`, `getTaskEngineTask`, `createTaskEngineTask`, `updateTaskEngineTask`, `completeTaskEngineTask`. Creación con `parentTaskId` crea una subtarea; exige `expectedParentVersion` leído del padre. El padre debe estar activo y no ser recurrente. La subtarea hereda área, estado y objetivos; el padre pasa a proyecto e incrementa su versión dentro del mismo guardado. La búsqueda acepta `parentTaskId` (null para raíces). Edición y finalización funcionan con el ID y versión de la subtarea. Completar no completa descendientes automáticamente.

Las escrituras conservan `requestId` y `expectedVersion`. Usar un UUID nuevo por operación y el mismo UUID para reintentar el mismo intento lógico. La caché existente de idempotencia dura seis horas; no garantiza deduplicación fuera de esa ventana. Ante `TASK_VERSION_CONFLICT`, leer y explicar el cambio antes de otro intento. Seguir `nextOffset` hasta terminar la consulta. No hay borrado ni escritura masiva.

## Configuración para una futura puesta en servicio

Esta PR no despliega ni modifica secretos ni datos reales. El endpoint público actual no ofrecerá MCP hasta desplegar estos cambios. También se necesita actualizar `GptActions.gs` en la implementación de Apps Script para habilitar subtareas.

1. Desde la raíz instalar con `npm ci`.
2. Copiar `integrations/chatgpt-actions/wrangler.toml.example` a `wrangler.toml` en ese directorio y verificar el nombre del Worker.
3. Conservar el secreto `TASK_ENGINE_ACCOUNTS`, un array de `{id, apiKey, endpoint, token}`. Para OAuth agregar `oauthSubject` a cada cuenta con el identificador exacto del usuario en el proveedor. No usar email ni IDs enviados como argumentos para seleccionar cuentas. Un sujeto debe corresponder a una sola cuenta.
4. Configurar un proveedor OAuth 2.1 externo con Authorization Code + PKCE S256, metadatos de autorización, acceso JWT RS256 o ES256 y JWKS HTTPS. Registrar un cliente para ChatGPT con los redirect URI que muestre su configuración. Si el proveedor no permite registro dinámico, ingresar el client ID y secret registrados en ChatGPT. No se implementa un servidor de autorización ni se generan usuarios en el Worker.
5. Registrar como audiencia/recurso la URL HTTPS canónica completa del MCP, por ejemplo `https://task-engine-chatgpt-actions.leonardotor.workers.dev/mcp`. El proveedor debe emitir `iss`, `aud`, `sub`, `exp` y `scope` separado por espacios. Autorizar `tasks:read` y, para escrituras, `tasks:write`.
6. Configurar las variables no secretas `MCP_RESOURCE_URL`, `MCP_OAUTH_ISSUER` (exactamente como `iss`) y `MCP_OAUTH_JWKS_URL`. Usar sólo URLs HTTPS de confianza. La configuración debe apuntar al proveedor propio, nunca a URLs propuestas por una conversación.
7. `MCP_ALLOWED_ORIGINS` es una lista de orígenes exactos separados por comas. Sin configuración se rechazan todas las solicitudes con Origin; las llamadas servidor a servidor sin Origin funcionan. Para Inspector, agregar sólo el origen local de su interfaz si hace falta. No usar `*`.

El Worker publica `/.well-known/oauth-protected-resource/mcp` y el alias sin `/mcp`, y responde con `WWW-Authenticate` en 401. Valida firma, emisor, audiencia, vencimiento y sujeto antes de seleccionar la cuenta. `tasks:read` es obligatorio y las escrituras exigen `tasks:write`. La API Key existente sigue funcionando para Inspector y clientes con encabezados personalizados; para ChatGPT usar OAuth, no elegir "sin autenticación" ni poner secretos en la URL.

## Verificación local

Desde `integrations/chatgpt-actions`, iniciar `npx wrangler dev` usando `.dev.vars` ignorado por Git con cuentas de prueba y las variables OAuth. Ejecutar `npx @modelcontextprotocol/inspector` y seleccionar Streamable HTTP con `http://localhost:8787/mcp` y `Authorization: Bearer <apiKey de prueba>`.

Verificar initialize, tools/list, contexto, búsqueda paginada, lectura, creación, edición y finalización. Probar IDs inexistentes, versión obsoleta, padre inactivo, reintento con el mismo UUID y credencial incorrecta. No usar la base real para pruebas de escritura. `npm test` ejecuta pruebas unitarias de transporte, backend y autenticación sin llamar a la cuenta real; `npm run test:e2e` verifica la aplicación existente. Para validar empaquetado: `npx wrangler deploy --dry-run --outdir <directorio temporal>` (no publica).

## Conectar con ChatGPT después del despliegue autorizado

La [guía oficial de OpenAI](https://developers.openai.com/plugins/deploy/connect-chatgpt) requiere un endpoint HTTPS accesible o Secure MCP Tunnel, con autenticación y herramientas válidas.

1. Ir a Plugins en ChatGPT, pulsar `+` y `Add custom MCP server` (la disponibilidad depende de la cuenta y políticas del espacio).
2. Nombrarlo Task Engine e ingresar la URL HTTPS que termina en `/mcp`.
3. Elegir OAuth, completar los datos del cliente del proveedor cuando corresponda y autorizar la cuenta. Revisar las herramientas descubiertas y crear el plugin.
4. Instalar el plugin. En una conversación nueva, escribir `@`, seleccionar Task Engine y pedir, por ejemplo, "Consultá mis tareas pendientes".
5. Probar "Creá la tarea Preparar clase", "Agregá una subtarea Buscar material", "Cambiá su prioridad a alta" y "Completá la subtarea", revisando las confirmaciones de escritura.

La integración se puede seleccionar en distintas conversaciones; no se limita al GPT personalizado con Actions. No garantiza que todos los modos o cuentas de ChatGPT habiliten herramientas: deben permitir e instalar el plugin. No se realizó conexión real en esta PR porque todavía no se desplegó ni configuró el proveedor OAuth.

### Diagnóstico

401: credencial, emisor, audiencia, sujeto, expiración o tasks:read incorrectos. 403: Origin no permitido o falta tasks:write. 405 en GET/DELETE autenticados es esperado en transporte sin sesiones ni stream SSE persistente. Errores de API aparecen en el resultado MCP con `isError: true`; `INVALID_UPSTREAM_RESPONSE` conserva estado y tipo de contenido, sin cuerpo privado. Revisar también permisos y URL publicada de Apps Script.

Referencias: [autenticación OpenAI](https://developers.openai.com/plugins/build/auth), [transporte MCP](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports), [SDK oficial](https://ts.sdk.modelcontextprotocol.io/server).
