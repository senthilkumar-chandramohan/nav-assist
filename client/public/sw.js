self.addEventListener("install", e => {
    e.waitUntil(
        caches.open("static").then(cache => {
            return cache.addAll(["./", "./css/master.css", "./images/logo192.png"]);
        })
    )
    console.log("Install!");
});

self.addEventListener("fetch", e => {
    // console.log(`Intercepting fetch request for ${e.request.url}`);
    e.respondWith(
        caches.match(e.request).then(response => {
            return response || fetch(e.request);
        })
    )
})