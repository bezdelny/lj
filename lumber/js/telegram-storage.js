class TelegramStorage {
    constructor() {
        this.storage = window.Telegram.WebApp.CloudStorage;
        this.LEADERBOARD_KEY = 'lumber_leaderboard';
        this.PLAYER_STATS_KEY = 'lumber_player_stats';
    }

    async init() {
        try {
            // Проверяем доступность CloudStorage
            if (!this.storage) {
                console.error('Telegram CloudStorage недоступен');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Ошибка инициализации хранилища:', error);
            return false;
        }
    }

    async getLeaderboard() {
        try {
            const data = await this.storage.getItem(this.LEADERBOARD_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Ошибка получения таблицы лидеров:', error);
            return [];
        }
    }

    async updateLeaderboard(score) {
        try {
            const leaderboard = await this.getLeaderboard();
            const user = window.Telegram.WebApp.initDataUnsafe?.user;
            const playerName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Игрок';
            
            const newEntry = {
                name: playerName,
                score: score,
                date: new Date().toISOString()
            };

            leaderboard.push(newEntry);
            leaderboard.sort((a, b) => b.score - a.score);
            
            // Оставляем только топ-10 результатов
            const topScores = leaderboard.slice(0, 10);
            
            await this.storage.setItem(this.LEADERBOARD_KEY, JSON.stringify(topScores));
            return topScores;
        } catch (error) {
            console.error('Ошибка обновления таблицы лидеров:', error);
            return [];
        }
    }

    async getPlayerStats() {
        try {
            const data = await this.storage.getItem(this.PLAYER_STATS_KEY);
            return data ? JSON.parse(data) : {
                highScore: 0,
                gamesPlayed: 0,
                totalScore: 0
            };
        } catch (error) {
            console.error('Ошибка получения статистики игрока:', error);
            return {
                highScore: 0,
                gamesPlayed: 0,
                totalScore: 0
            };
        }
    }

    async updatePlayerStats(score) {
        try {
            const stats = await this.getPlayerStats();
            stats.gamesPlayed++;
            stats.totalScore += score;
            stats.highScore = Math.max(stats.highScore, score);
            
            await this.storage.setItem(this.PLAYER_STATS_KEY, JSON.stringify(stats));
            return stats;
        } catch (error) {
            console.error('Ошибка обновления статистики игрока:', error);
            return null;
        }
    }
}

// Переопределяем методы для работы с таблицей лидеров
window.TelegramGameProxy = {
    ...window.TelegramGameProxy,
    async shareScore() {
        const storage = new TelegramStorage();
        await storage.init();
        const leaderboard = await storage.getLeaderboard();
        
        // Обновляем существующую таблицу лидеров
        const tableElement = document.getElementById('table');
        if (tableElement) {
            tableElement.innerHTML = leaderboard.map((entry, index) => `
                <li class="table_item">
                    <div class="table_rank">${index + 1}</div>
                    <div class="table_name">${entry.name}</div>
                    <div class="table_score">${entry.score}</div>
                </li>
            `).join('');
        }
    },
    
    async setScore(score) {
        const storage = new TelegramStorage();
        await storage.init();
        await storage.updateLeaderboard(score);
        
        // Обновляем отображение счета
        const scoreElement = document.getElementById('score_value');
        if (scoreElement) {
            scoreElement.textContent = score;
        }
        
        // Обновляем таблицу лидеров
        await this.shareScore();
    }
};

// Экспортируем класс для использования в других модулях
window.TelegramStorage = TelegramStorage; 