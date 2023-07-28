
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker-pwa.js')
    .then(
        (registration) => {
            console.debug('Serviceworker registered', registration.scope, registration);
        }, 
        (err) => {
            console.error('Serviceworker could not be registered', err)
        }
    );
}
