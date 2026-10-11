import { createRemoteJWKSet, jwtVerify } from 'jose';

export function oauthMetadata(request, env) {
    if (!env.MCP_OAUTH_ISSUER || !env.MCP_RESOURCE_URL) return null;
    return {
        resource: env.MCP_RESOURCE_URL,
        authorization_servers: [env.MCP_OAUTH_ISSUER],
        scopes_supported: ['tasks:read', 'tasks:write'],
        bearer_methods_supported: ['header']
    };
}

export async function oauthAccount(token, env, accounts, keySet) {
    if (!env.MCP_OAUTH_ISSUER || !env.MCP_OAUTH_JWKS_URL || !env.MCP_RESOURCE_URL) return null;
    try {
        const {payload} = await jwtVerify(token, keySet || createRemoteJWKSet(new URL(env.MCP_OAUTH_JWKS_URL)), {
            issuer: env.MCP_OAUTH_ISSUER, audience: env.MCP_RESOURCE_URL,
            algorithms: ['RS256', 'ES256'], requiredClaims: ['exp', 'sub']
        });
        const scopes = new Set(String(payload.scope || '').split(' '));
        if (!scopes.has('tasks:read')) return null;
        const matches = accounts.filter(account => account.oauthSubject === payload.sub);
        if (matches.length !== 1) return null;
        return {account: matches[0], canWrite: scopes.has('tasks:write')};
    } catch { return null; }
}
