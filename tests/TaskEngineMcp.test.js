import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../integrations/chatgpt-actions/worker.js';
const key = 'a'.repeat(32);
const env = {TASK_ENGINE_ACCOUNTS: JSON.stringify([{id:'test',apiKey:key,token:'private',endpoint:'https://example.com/api'}])};
const request = (method, params = {}) => new Request('https://worker.example/mcp', {method:'POST',headers:{authorization:`Bearer ${key}`,'content-type':'application/json',accept:'application/json, text/event-stream'}, body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});

test('MCP initializes and lists authenticated tools with schemas and annotations', async () => {
    const init = await handleRequest(request('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'test',version:'1'}}),env);
    assert.equal(init.status,200);
    assert.equal((await init.json()).result.serverInfo.name,'task-engine');
    const response = await handleRequest(request('tools/list'),env);
    const tools = (await response.json()).result.tools;
    assert.equal(tools.length,6);
    assert.equal(tools[0].annotations.readOnlyHint,true);
    assert.equal(tools[3].annotations.destructiveHint,true);
    assert.ok(tools[3].inputSchema.properties.parentTaskId);
});

test('MCP routes calls through existing account credentials and preserves errors', async () => {
    let forwarded;
    const response = await handleRequest(request('tools/call',{name:'getTaskEngineTask',arguments:{taskId:'task-1'}}),env,async (_,options) => {
        forwarded = JSON.parse(options.body);
        return Response.json({ok:false,error:{code:'TASK_NOT_FOUND',message:'missing'}});
    });
    const result = (await response.json()).result;
    assert.equal(result.isError,true);
    assert.equal(forwarded.token,'private');
    assert.equal(forwarded.action,'gptGetTask');
    assert.equal(JSON.parse(result.content[0].text).error.code,'TASK_NOT_FOUND');
});

test('MCP rejects unauthenticated discovery, foreign origins and invalid arguments', async () => {
    const unauth = request('tools/list'); unauth.headers.delete('authorization');
    assert.equal((await handleRequest(unauth,env)).status,401);
    const foreign = request('tools/list'); foreign.headers.set('origin','https://evil.example');
    assert.equal((await handleRequest(foreign,env)).status,403);
    let called = false;
    const invalid = await handleRequest(request('tools/call',{name:'completeTaskEngineTask',arguments:{taskId:'task-1'}}),env,async () => {called=true;});
    assert.equal(called,false);
    const body = await invalid.json();
    assert.ok(body.error || body.result.isError);
});

test('MCP keeps accounts isolated and forwards every write contract unchanged',async () => {
    const otherKey = 'b'.repeat(32);
    const multi = {TASK_ENGINE_ACCOUNTS:JSON.stringify([
        {id:'a',apiKey:key,token:'private-a',endpoint:'https://a.example/api'},
        {id:'b',apiKey:otherKey,token:'private-b',endpoint:'https://b.example/api'}
    ])};
    const requestId = 'aaf15a8e-e853-4d66-af68-21b48ea7426a';
    for (const [name,action,args] of [
        ['createTaskEngineTask','gptCreateTask',{requestId,title:'Sub',parentTaskId:'parent',expectedParentVersion:2}],
        ['updateTaskEngineTask','gptUpdateTask',{requestId,taskId:'sub',expectedVersion:1,changes:{priority:3}}],
        ['completeTaskEngineTask','gptCompleteTask',{requestId,taskId:'sub',expectedVersion:2}]
    ]) {
        const req = request('tools/call',{name,arguments:args});
        req.headers.set('authorization',`Bearer ${otherKey}`);
        const response = await handleRequest(req,multi,async (url,options) => {
            assert.equal(url,'https://b.example/api');
            assert.deepEqual(JSON.parse(options.body),{action,token:'private-b',input:args});
            return Response.json({ok:true,task:{id:'sub'}});
        });
        const result = (await response.json()).result;
        assert.equal(result.isError,false);
        assert.doesNotMatch(JSON.stringify(result),/private-[ab]/);
    }
});
