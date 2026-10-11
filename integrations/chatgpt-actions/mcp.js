import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';

const id = z.string().regex(/^[A-Za-z0-9_-]+$/);
const nullableId = id.nullable().optional();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional();
const fields = {
    title: z.string().trim().min(1).max(300).optional(),
    description: z.string().max(10000).optional(),
    areaId: nullableId, contextId: nullableId,
    priority: z.number().int().min(0).max(4).optional(),
    tagIds: z.array(id).max(50).optional(), goalIds: z.array(id).max(50).optional(),
    isWaiting: z.boolean().optional(), startDate: date, dueDate: date,
    dueTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional()
};
const versioned = {
    requestId: z.string().uuid().describe('UUID nuevo por operación; conservarlo al reintentar.'),
    taskId: id,
    expectedVersion: z.number().int().min(1).describe('Versión obtenida leyendo la tarea actual.')
};
const definitions = [
    ['getTaskEngineContext', '/v1/context', 'Consultar áreas, contextos, etiquetas, objetivos y cantidades.', z.object({scope: z.literal('all')}), true],
    ['searchTaskEngineTasks', '/v1/tasks/search', 'Consultar tareas y subtareas. Seguir nextOffset para obtener todas las páginas.', z.object({
        query: z.string().optional(), status: z.enum(['INBOX','PENDING','COMPLETED','ARCHIVED','TRASH']).optional(),
        areaId: nullableId, contextId: nullableId, parentTaskId: nullableId,
        tagId: id.optional(), goalId: id.optional(), priority: fields.priority,
        isWaiting: z.boolean().optional(), hasDueDate: z.boolean().optional(),
        dueFrom: z.string().optional(), dueTo: z.string().optional(),
        offset: z.number().int().min(0).max(100000).optional(), limit: z.number().int().min(1).max(100).optional()
    }), true],
    ['getTaskEngineTask', '/v1/tasks/get', 'Leer una tarea o subtarea y su versión antes de modificarla.', z.object({taskId: id}), true],
    ['createTaskEngineTask', '/v1/tasks/create', 'Crear una tarea o subtarea (parentTaskId). Para subtareas, leer al padre y pasar expectedParentVersion. Hereda área, estado y objetivos del padre.', z.object({
        ...fields, requestId: versioned.requestId, title: fields.title.unwrap(),
        parentTaskId: nullableId, expectedParentVersion: versioned.expectedVersion.optional()
    }), false],
    ['updateTaskEngineTask', '/v1/tasks/update', 'Modificar una tarea o subtarea activa. Ante conflicto volver a leer; no reintentar ciegamente.', z.object({
        ...versioned, changes: z.object(fields).strict().refine(value => Object.keys(value).length > 0, 'Indicar al menos un cambio')
    }), false],
    ['completeTaskEngineTask', '/v1/tasks/complete', 'Completar una tarea o subtarea activa con su versión actual. No completa descendientes.', z.object(versioned), false]
];

// Each request has its own server and transport: no account or session state
// can leak between Worker invocations. The SDK handles JSON-RPC and negotiation.
export async function handleMcpRequest(request, dispatch) {
    const server = new McpServer({name: 'task-engine', version: '1.0.0'}, {
        instructions: 'Consultar contexto antes de elegir IDs. Leer antes de editar o completar. UUID estable por intento lógico. Seguir nextOffset. Explicar conflictos y errores sin afirmar éxito.'
    });
    for (const [name, path, description, schema, readOnly] of definitions) {
        server.registerTool(name, {
            description, inputSchema: schema.strict(),
            annotations: {readOnlyHint: readOnly, destructiveHint: !readOnly, idempotentHint: true, openWorldHint: false}
        }, async input => {
            const response = await dispatch(path, input);
            const result = await response.json();
            return {content: [{type: 'text', text: JSON.stringify(result)}], isError: !response.ok || result?.ok !== true};
        });
    }
    const transport = new WebStandardStreamableHTTPServerTransport({sessionIdGenerator: undefined, enableJsonResponse: true});
    await server.connect(transport);
    try { return await transport.handleRequest(request); }
    finally { await server.close(); }
}
