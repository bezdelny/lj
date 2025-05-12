// Инициализация Telegram Web App
(function() {
    // Проверяем, запущено ли приложение в Telegram
    if (window.Telegram && window.Telegram.WebApp) {
        try {
            // Инициализируем Web App
            window.Telegram.WebApp.ready();
            console.log('Telegram Web App initialized');
            
            // Проверяем параметры запуска
            const initData = window.Telegram.WebApp.initData;
            const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
            
            // Проверяем, что приложение запущено через бота
            if (!initDataUnsafe.user) {
                console.warn('App is not launched from bot');
                // Показываем сообщение пользователю
                const message = document.createElement('div');
                message.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                    z-index: 1000;
                `;
                message.innerHTML = `
                    <p>Для корректной работы игры, пожалуйста, запустите её через бота:</p>
                    <p><a href="https://t.me/goodgamebot/lumber" style="color: #2AABEE;">Открыть в Telegram</a></p>
                `;
                document.body.appendChild(message);
                return;
            }
            
            // Расширяем на весь экран
            window.Telegram.WebApp.expand();

            // Функция сохранения счета
            async function saveScore(score) {
                try {
                    if (!score) return;

                    // Получаем текущие данные
                    const currentData = await window.Telegram.WebApp.CloudStorage.getItem('leaderboard');
                    const leaderboard = currentData ? JSON.parse(currentData) : [];
                    const userId = window.Telegram.WebApp.initDataUnsafe.user?.id;
                    
                    if (!userId) {
                        console.warn('User ID not available');
                        return;
                    }

                    const userData = {
                        id: userId,
                        name: window.Telegram.WebApp.initDataUnsafe.user?.first_name || 'Player',
                        score: parseInt(score)
                    };

                    // Обновляем или добавляем новый счет
                    const existingIndex = leaderboard.findIndex(item => item.id === userId);
                    if (existingIndex !== -1) {
                        if (userData.score > leaderboard[existingIndex].score) {
                            leaderboard[existingIndex] = userData;
                        }
                    } else {
                        leaderboard.push(userData);
                    }

                    // Сортируем по убыванию счета
                    leaderboard.sort((a, b) => b.score - a.score);

                    // Сохраняем обновленные данные
                    await window.Telegram.WebApp.CloudStorage.setItem('leaderboard', JSON.stringify(leaderboard));
                    console.log('Score saved to Telegram Storage');

                    // Обновляем таблицу лидеров
                    updateLeaderboard();
                } catch (e) {
                    console.error('Error saving score:', e);
                }
            }

            // Функция обновления таблицы лидеров
            async function updateLeaderboard() {
                try {
                    const tableElement = document.getElementById('table');
                    if (!tableElement) return;

                    const data = await window.Telegram.WebApp.CloudStorage.getItem('leaderboard');
                    const leaderboard = data ? JSON.parse(data) : [];
                    const currentUserId = window.Telegram.WebApp.initDataUnsafe.user?.id;

                    tableElement.innerHTML = '';
                    leaderboard.forEach((item, index) => {
                        const li = document.createElement('li');
                        if (item.id === currentUserId) {
                            li.classList.add('current_user');
                        }

                        li.innerHTML = `
                            <div class="rank">${index + 1}</div>
                            <div class="user">${item.name}</div>
                            <div class="score">${item.score}</div>
                        `;

                        tableElement.appendChild(li);
                    });

                    document.querySelector('.table_wrap').classList.add('opened');
                } catch (e) {
                    console.error('Error updating leaderboard:', e);
                }
            }

            // Функция для шаринга результата
            function shareScore(score) {
                try {
                    // Формируем ссылку для шаринга
                    const shareUrl = `https://t.me/goodgamebot/lumber`;
                    window.Telegram.WebApp.shareUrl(
                        shareUrl,
                        `Я набрал ${score} очков в игре LumberJack! Попробуй побить мой рекорд!`
                    );
                } catch (e) {
                    console.error('Error sharing score:', e);
                }
            }

            // Добавляем обработчик для кнопки "Поделиться"
            const shareButton = document.getElementById('score_share');
            if (shareButton && !shareButton.hasEventListener) {
                shareButton.addEventListener('click', function() {
                    const score = document.getElementById('score_value').textContent;
                    if (score) {
                        saveScore(score);
                        shareScore(score);
                    }
                });
                shareButton.hasEventListener = true;
            }

            // Добавляем обработчик для события game over
            document.addEventListener('gameOver', function(e) {
                if (e.detail && e.detail.score) {
                    saveScore(e.detail.score);
                }
            });

            // Загружаем таблицу лидеров при старте
            updateLeaderboard();

        } catch (e) {
            console.error('Error initializing Telegram Web App:', e);
        }
    } else {
        console.warn('App is not running in Telegram context');
        // Показываем сообщение пользователю
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 1000;
        `;
        message.innerHTML = `
            <p>Для корректной работы игры, пожалуйста, запустите её через Telegram:</p>
            <p><a href="https://t.me/goodgamebot/lumber" style="color: #2AABEE;">Открыть в Telegram</a></p>
        `;
        document.body.appendChild(message);
    }
})(); 