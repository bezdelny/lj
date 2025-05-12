// Инициализация Telegram Web App
(function() {
    // Проверяем, запущено ли приложение в Telegram
    if (window.Telegram && window.Telegram.WebApp) {
        try {
            // Инициализируем Web App
            window.Telegram.WebApp.ready();
            console.log('Telegram Web App initialized');
            
            // Расширяем на весь экран
            window.Telegram.WebApp.expand();
            
            // Сохраняем оригинальные функции, если они есть
            const originalSaveScore = window.TelegramGameInit?.saveScore;
            const originalGetLeaderboard = window.TelegramGameInit?.getLeaderboard;
            const originalUpdateLeaderboardUI = window.TelegramGameInit?.updateLeaderboardUI;
            const originalShareScore = window.TelegramGameInit?.shareScore;

            // Добавляем или обновляем функции для работы с Telegram Storage
            window.TelegramGameInit = {
                ...window.TelegramGameInit, // Сохраняем все существующие функции

                // Сохранение счета в Telegram Storage
                saveScore: async function(score) {
                    try {
                        // Сначала пробуем сохранить через оригинальную функцию
                        if (originalSaveScore) {
                            await originalSaveScore(score);
                        }

                        // Затем сохраняем в Telegram Storage
                        const currentData = await this.getLeaderboard();
                        const userId = window.Telegram.WebApp.initDataUnsafe.user?.id;
                        
                        if (!userId) {
                            console.warn('User ID not available');
                            return;
                        }

                        const userData = {
                            id: userId,
                            name: window.Telegram.WebApp.initDataUnsafe.user?.first_name || 'Player',
                            score: score
                        };

                        const existingIndex = currentData.findIndex(item => item.id === userId);
                        if (existingIndex !== -1) {
                            if (score > currentData[existingIndex].score) {
                                currentData[existingIndex] = userData;
                            }
                        } else {
                            currentData.push(userData);
                        }

                        currentData.sort((a, b) => b.score - a.score);
                        await window.Telegram.WebApp.CloudStorage.setItem('leaderboard', JSON.stringify(currentData));
                        console.log('Score saved to Telegram Storage');

                        // Обновляем UI
                        this.updateLeaderboardUI(document.getElementById('table'));
                    } catch (e) {
                        console.error('Error saving score:', e);
                    }
                },

                // Получение таблицы лидеров
                getLeaderboard: async function() {
                    try {
                        // Сначала пробуем получить через оригинальную функцию
                        if (originalGetLeaderboard) {
                            const originalData = await originalGetLeaderboard();
                            if (originalData && originalData.length > 0) {
                                return originalData;
                            }
                        }

                        // Если нет данных, получаем из Telegram Storage
                        const data = await window.Telegram.WebApp.CloudStorage.getItem('leaderboard');
                        return data ? JSON.parse(data) : [];
                    } catch (e) {
                        console.error('Error getting leaderboard:', e);
                        return [];
                    }
                },

                // Обновление UI таблицы лидеров
                updateLeaderboardUI: async function(tableElement) {
                    if (!tableElement) return;

                    try {
                        // Сначала пробуем обновить через оригинальную функцию
                        if (originalUpdateLeaderboardUI) {
                            await originalUpdateLeaderboardUI(tableElement);
                            return;
                        }

                        const leaderboard = await this.getLeaderboard();
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
                        console.error('Error updating leaderboard UI:', e);
                    }
                },

                // Поделиться результатом
                shareScore: function(score) {
                    try {
                        // Сначала пробуем поделиться через оригинальную функцию
                        if (originalShareScore) {
                            originalShareScore(score);
                        }

                        // Затем пробуем поделиться через Web App
                        window.Telegram.WebApp.shareUrl(
                            window.location.href,
                            `Я набрал ${score} очков в игре LumberJack! Попробуй побить мой рекорд!`
                        );
                    } catch (e) {
                        console.error('Error sharing score:', e);
                    }
                }
            };

            // Добавляем обработчик для кнопки "Поделиться", если его еще нет
            const shareButton = document.getElementById('score_share');
            if (shareButton && !shareButton.hasEventListener) {
                shareButton.addEventListener('click', function() {
                    const score = document.getElementById('score_value').textContent;
                    window.TelegramGameInit.shareScore(score);
                });
                shareButton.hasEventListener = true;
            }

        } catch (e) {
            console.error('Error initializing Telegram Web App:', e);
        }
    } else {
        console.warn('App is not running in Telegram context');
    }
})(); 