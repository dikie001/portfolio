self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    const title = data.title || "New Message";
    const options = {
        body: data.body || "You have a new inquiry on your portfolio.",
        icon: '/images/logo.png',
        badge: '/images/logo.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/admin/messages.html'
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
