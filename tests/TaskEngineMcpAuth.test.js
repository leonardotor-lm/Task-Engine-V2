import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair, exportJWK, SignJWT, createLocalJWKSet} from 'jose';
import {oauthAccount, oauthMetadata} from '../integrations/chatgpt-actions/mcp-auth.js';
import {handleRequest} from '../integrations/chatgpt-actions/worker.js';
const env = {MCP_OAUTH_ISSUER:'https://issuer.example/',MCP_OAUTH_JWKS_URL:'https://issuer.example/jwks',MCP_RESOURCE_URL:'https://worker.example/mcp'};
test('OAuth checks signature, expiry, issuer, audience, subject and scopes',async () => {
    const {privateKey,publicKey} = await generateKeyPair('RS256');
    const jwk = await exportJWK(publicKey);
    const keys = createLocalJWKSet({keys:[{...jwk,kid:'test',alg:'RS256'}]});
    const accounts = [{id:'a',oauthSubject:'user-a'}, {id:'b',oauthSubject:'user-b'}];
    const sign = (claims={}) => new SignJWT({scope:'tasks:read tasks:write',...claims}).setProtectedHeader({alg:'RS256',kid:'test'}).setIssuer(env.MCP_OAUTH_ISSUER).setAudience(env.MCP_RESOURCE_URL).setSubject('user-a').setExpirationTime('5m').sign(privateKey);
    const result = await oauthAccount(await sign(),env,accounts,keys);
    assert.equal(result.account.id,'a'); assert.equal(result.canWrite,true);
    assert.equal((await oauthAccount(await sign({scope:'tasks:read'}),env,accounts,keys)).canWrite,false);
    assert.equal(await oauthAccount(await sign({scope:'tasks:write'}),env,accounts,keys),null);
    assert.equal(await oauthAccount(await sign(),{...env,MCP_RESOURCE_URL:'https://other.example/mcp'},accounts,keys),null);
    assert.equal(await oauthAccount(await sign(),{...env,MCP_OAUTH_ISSUER:'https://other.example/'},accounts,keys),null);
    assert.equal(await oauthAccount(await sign(),env,[accounts[1]],keys),null);
    assert.equal(await oauthAccount('invalid',env,accounts,keys),null);
});
test('OAuth discovery and 401 challenge use configured canonical resource',async () => {
    const configured = {...env,TASK_ENGINE_ACCOUNTS:JSON.stringify([{id:'a',apiKey:'a'.repeat(32),endpoint:'https://api.example',token:'secret'}])};
    const discovery = await handleRequest(new Request('https://worker.example/.well-known/oauth-protected-resource/mcp'),configured);
    assert.deepEqual(await discovery.json(),oauthMetadata(null,env));
    const unauthorized = await handleRequest(new Request('https://worker.example/mcp',{method:'POST'}),configured);
    assert.equal(unauthorized.status,401);
    assert.match(unauthorized.headers.get('www-authenticate'),/oauth-protected-resource\/mcp/);
});
