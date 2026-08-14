importScripts("./pwa-assets.js");

const CACHE_PREFIX = "mis-tareas-static";
const CACHE_NAME = `${CACHE_PREFIX}-v2`;
const INDEX_URL = new URL(
    "./index.html",
    self.registration.scope
).href;
const APP_SHELL = [
    "./",
    ...self.__PWA_ASSETS
];

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(
                APP_SHELL.map(path => new Request(
                    path,
                    { cache: "reload" }
                ))
            ))
            .then(() => self.skipWaiting())
    );

});

self.addEventListener("activate", event => {

    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => (
                        key.startsWith(CACHE_PREFIX) &&
                        key !== CACHE_NAME
                    ))
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );

});

self.addEventListener("fetch", event => {

    const { request } = event;
    const url = new URL(request.url);

    if (
        request.method !== "GET" ||
        url.origin !== self.location.origin
    ) {
        return;
    }

    event.respondWith(networkFirst(request));

});

async function networkFirst(request) {

    const cache = await caches.open(CACHE_NAME);

    try {

        const response = await fetch(
            request,
            { cache: "no-store" }
        );

        if (response.ok) {
            await cache.put(request, response.clone());
        }

        return response;

    } catch (error) {

        const cached = await cache.match(request);

        if (cached) return cached;

        if (request.mode === "navigate") {
            return cache.match(INDEX_URL);
        }

        throw error;

    }

}
