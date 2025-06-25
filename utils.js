/**
 * 
 * @param {ServiceWorkerRegistration} registration 
 * @param {{ activateImmediately?: boolean }} [options] - Options for activating the service worker
 * @returns 
 */
function resolveServiceWorker(registration, options = { activateImmediately: false }) {
    if (options.activateImmediately && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        console.log('Service Worker activated immediately.');
    }

    return new Promise((resolve) => {
        if (registration.installing) {
            registration.installing.onstatechange = () => {
                if (registration.installing?.state === 'activated' && navigator.serviceWorker.controller) {
                    console.log('Service Worker is now active.');
                    resolve(registration.installing)
                }
            };
        }

        if (registration.active) {
            console.log('Service Worker is already active.');
            resolve(registration.active);
        } else if (registration.waiting) {
            console.log('Service Worker is waiting to be activated.');
            resolve(registration.waiting);
        } else if (registration.waiting) {
            console.log('Service Worker is installing.');
            resolve(registration.waiting);
        } else {
            console.log('Service Worker is not yet installed.');
            resolve(undefined);
        }
    })
}

/**
 * @param {string} url - The URL of the service worker script
 * @param {RegistrationOptions & {activateImmediately?: boolean, update?: boolean}} [options] - Options for registering the service worker
 * @description Registers a service worker for the given URL.
 * This function checks if the browser supports service workers, then attempts to register the service worker script
 * located at the specified URL. It also optionally activates the service worker immediately.
 * @returns {Promise<ServiceWorker | undefined>}
 */
async function registeServiceWorker(url, options = { activateImmediately: false }) {
    if ("serviceWorker" in navigator) {
        try {
            const existingRegistration = await navigator.serviceWorker.getRegistration(url);
            if (existingRegistration) {
                console.log(`Service Worker already registered:`, existingRegistration);
                if (options.update) {
                    console.log('Updating existing Service Worker...');
                    await existingRegistration.update();
                }
                return resolveServiceWorker(existingRegistration, options);
            }

            const registration = await navigator.serviceWorker.register(url, options);
            console.log(`Service Worker registered successfully:`, registration);
            return resolveServiceWorker(registration, options);
        } catch (error) {
            console.error(`Service Worker registration failed:`, error);
            return undefined;
        }
    }

    return undefined
}
