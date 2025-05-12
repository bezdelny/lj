// Инициализация Web App
const webapp = window.Telegram.WebApp;

// Класс для работы с рекордами
const GameStorage = {
    // Инициализация при запуске игры
    async init() {
        try {
            // Загружаем рекорд при старте
            const highScore = await this.getHighScore();
            this.displayHighScore(highScore);
            
            // Инициализируем Web App
            webapp.ready();
            webapp.expand();
            
            return true;
        } catch (error) {
            console.error('Error initializing game:', error);
            return false;
        }
    },

    // Получение рекорда
    async getHighScore() {
        try {
            const score = await webapp.CloudStorage.getItem('high_score');
            return score ? parseInt(score) : 0;
        } catch (error) {
            console.error('Error getting high score:', error);
            return 0;
        }
    },

    // Сохранение рекорда
    async saveScore(score) {
        try {
            // Сохраняем текущий счет
            await webapp.CloudStorage.setItem('current_score', score.toString());
            
            // Получаем текущий рекорд
            const highScore = await this.getHighScore();
            
            // Если новый рекорд
            if (score > highScore) {
                await webapp.CloudStorage.setItem('high_score', score.toString());
                this.displayHighScore(score);
                // Показываем уведомление о новом рекорде
                webapp.showAlert('Новый рекорд! 🎉');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error saving score:', error);
            return false;
        }
    },

    // Отображение рекорда
    displayHighScore(score) {
        const highScoreElement = document.getElementById('high_score_value');
        if (highScoreElement) {
            highScoreElement.textContent = score;
        }
    },

    // Отображение текущего счета
    displayCurrentScore(score) {
        const scoreElement = document.getElementById('score_value');
        if (scoreElement) {
            scoreElement.textContent = score;
        }
    }
};

// Функция для обработки окончания игры
async function gameOver(score) {
    // Отображаем текущий счет
    GameStorage.displayCurrentScore(score);
    
    // Сохраняем счет и проверяем рекорд
    const isNewRecord = await GameStorage.saveScore(score);
    
    // Если нужно, можно добавить дополнительную анимацию для нового рекорда
    if (isNewRecord) {
        const highScoreElement = document.getElementById('high_score_value');
        if (highScoreElement) {
            highScoreElement.classList.add('new-record');
            setTimeout(() => {
                highScoreElement.classList.remove('new-record');
            }, 2000);
        }
    }
} 