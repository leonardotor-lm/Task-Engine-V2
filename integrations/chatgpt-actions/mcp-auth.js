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
        // An explicit personal binding avoids replacing an existing encrypted secret.
        // It cannot select from multiple accounts or override an existing subject.
        const singleSubject = env.MCP_SINGLE_ACCOUNT_SUBJECT;
        if (singleSubject !== undefined && (
            typeof singleSubject !== 'string' || !singleSubject || accounts.length !== 1 ||
            (accounts[0].oauthSubject !== undefined && accounts[0].oauthSubject !== singleSubject)
        )) return null;
        const matches = accounts.filter(account => (account.oauthSubject ?? singleSubject) === payload.sub);
        if (matches.length !== 1) return null;
        return {account: matches[0], canWrite: scopes.has('tasks:write')};
    } catch { return null; }
}
