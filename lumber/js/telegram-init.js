// Инициализация Telegram Web App
(function() {
    // Проверяем наличие Web App
    if (window.Telegram && window.Telegram.WebApp) {
        try {
            // Инициализируем Web App
            window.Telegram.WebApp.ready();
            console.log('Telegram Web App initialized');

            // Получаем данные пользователя
            const user = window.Telegram.WebApp.initDataUnsafe?.user;
            if (user) {
                console.log('User data:', user);
            }

            // Расширяем на весь экран
            window.Telegram.WebApp.expand();

        } catch (e) {
            console.error('Error initializing Telegram Web App:', e);
        }
    } else {
        console.warn('App is not running in Telegram context');
    }
})(); 