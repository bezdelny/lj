class Game {
    constructor() {
        this.storage = new TelegramStorage();
        this.score = 0;
        this.isGameOver = false;
        this.playerName = '';
        this.init();
    }

    async init() {
        try {
            // Инициализация хранилища
            const storageReady = await this.storage.init();
            if (!storageReady) {
                console.error('Не удалось инициализировать хранилище');
                return;
            }

            // Получаем имя игрока из Telegram WebApp
            const user = window.Telegram.WebApp.initDataUnsafe?.user;
            this.playerName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Игрок';

            // Инициализация остальных компонентов игры
            this.initGameComponents();
            this.setupEventListeners();
        } catch (error) {
            console.error('Ошибка инициализации игры:', error);
        }
    }

    async gameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        try {
            // Обновляем статистику игрока
            const stats = await this.storage.updatePlayerStats(this.score);
            
            // Обновляем таблицу лидеров
            const leaderboard = await this.storage.updateLeaderboard(this.score, this.playerName);
            
            // Обновляем UI с новыми данными
            this.updateGameOverUI(stats, leaderboard);
        } catch (error) {
            console.error('Ошибка при завершении игры:', error);
        }
    }

    async updateGameOverUI(stats, leaderboard) {
        // Обновляем отображение статистики
        document.getElementById('highScore').textContent = stats.highScore;
        document.getElementById('gamesPlayed').textContent = stats.gamesPlayed;
        document.getElementById('totalScore').textContent = stats.totalScore;

        // Обновляем таблицу лидеров
        const leaderboardElement = document.getElementById('leaderboard');
        leaderboardElement.innerHTML = leaderboard.map((entry, index) => `
            <div class="leaderboard-entry">
                <span class="rank">${index + 1}</span>
                <span class="name">${entry.name}</span>
                <span class="score">${entry.score}</span>
            </div>
        `).join('');
    }

    // ... остальные методы игры ...
}

// Экспортируем класс для использования в других модулях
window.Game = Game; 