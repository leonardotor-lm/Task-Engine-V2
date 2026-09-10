# Integración de Task Engine con ChatGPT

Este directorio contiene el intermediario HTTP y el esquema de GPT Actions para consultar, crear, editar y completar tareas sin exponer el token de sincronización.

## Arquitectura

1. ChatGPT autentica la Action con una API key Bearer.
2. El Worker busca la cuenta asociada a esa clave.
3. El Worker agrega internamente el endpoint y token de Task Engine.
4. Apps Script valida y ejecuta sólo una operación `gpt*` específica.

No existe una operación para reemplazar la copia completa, archivar o borrar.

## Configuración inicial

1. Publicá en Apps Script `Code.gs`, `GptActions.gs` y los demás archivos existentes como una nueva versión del despliegue.
2. Copiá `wrangler.toml.example` como `wrangler.toml`.
3. Generá una clave aleatoria de al menos 32 caracteres.
4. Configurá el secreto `TASK_ENGINE_ACCOUNTS` con este formato, en una sola línea:

```json
[{"id":"leo","apiKey":"CLAVE-DE-LA-ACTION","endpoint":"URL-EXEC-DE-APPS-SCRIPT","token":"TOKEN-DE-TASK-ENGINE"}]
```

5. Desplegá el Worker. El esquema ya apunta a `task-engine-chatgpt-actions.leonardotor.workers.dev`.
6. Creá un GPT personalizado, pegá `GPT_INSTRUCTIONS.md` en sus instrucciones e importá `openapi.yaml` como Action.
7. En autenticación elegí API Key, tipo Bearer, y guardá `CLAVE-DE-LA-ACTION`.

## Segundo usuario

Para otra base se agrega otra entrada a `TASK_ENGINE_ACCOUNTS`, con una API key, endpoint y token propios. Cada GPT o cada conexión usa únicamente la clave de su cuenta.

## Prueba segura

1. Consultá el contexto.
2. Buscá una tarea conocida.
3. Creá una tarea titulada `Prueba ChatGPT` sin otros datos.
4. Volvé a buscarla.
5. Editala usando su versión actual.
6. Completala usando la nueva versión.

Conservá una copia de seguridad antes de la primera prueba sobre la base real.

## Diagnóstico de respuestas inválidas

Si el Worker devuelve `INVALID_UPSTREAM_RESPONSE`, la solicitud llegó al
Worker pero Apps Script respondió con un contenido que no era JSON. El error
incluye solamente dos datos seguros: el estado HTTP (`upstreamStatus`) y el
tipo de contenido (`upstreamContentType`). Nunca incluye la URL privada, el
token ni el cuerpo recibido.

- `text/html` con estado `401` o `403`: revisá quién puede acceder al despliegue de Apps Script.
- `text/html` con estado `404`: revisá que `TASK_ENGINE_ACCOUNTS` conserve la URL `/exec` vigente.
- `text/html` con estado `200`: revisá redirecciones o una página intermedia de Google.

Después de modificar el Worker, volvé a desplegarlo. Después de modificar
`openapi.yaml`, reemplazá el esquema de la Action dentro del editor del GPT.
