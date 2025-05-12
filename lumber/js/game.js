// Инициализация Web App
const webapp = window.Telegram.WebApp;

// Основной класс игры
class Game {
    constructor() {
        // Инициализация Web App
        this.webapp = window.Telegram.WebApp;
        
        // Элементы интерфейса
        this.elements = {
            score: document.getElementById('score_value'),
            highScore: document.getElementById('high_score_value'),
            shareButton: document.getElementById('share_button'),
            startButton: document.getElementById('start_button'),
            gameOverScreen: document.getElementById('game_over'),
            canvasWrap: document.getElementById('canvas_wrap')
        };
        
        // Состояние игры
        this.score = 0;
        this.highScore = 0;
        this.isPlaying = false;
        
        // Инициализация игровой логики
        this.core = new GameCore(this);
        
        // Привязка обработчиков
        this.bindEvents();
        
        // Загрузка рекорда
        this.loadHighScore();
    }
    
    async loadHighScore() {
        try {
            this.highScore = await GameStorage.getHighScore();
            this.displayHighScore();
        } catch (error) {
            console.error('Ошибка загрузки рекорда:', error);
        }
    }
    
    bindEvents() {
        // Обработчик кнопки "Поделиться"
        this.elements.shareButton.addEventListener('click', () => {
            this.shareScore();
        });
        
        // Обработчик кнопки "Начать игру"
        this.elements.startButton.addEventListener('click', () => {
            this.start();
        });
        
        // Обработчик изменения размера окна
        window.addEventListener('resize', () => {
            this.core.resize();
        });
    }
    
    start() {
        // Скрываем экран окончания игры
        this.elements.gameOverScreen.style.display = 'none';
        
        // Сбрасываем счет
        this.score = 0;
        this.displayScore(0);
        
        // Запускаем игру
        this.isPlaying = true;
        this.core.start();
    }
    
    displayScore(score) {
        this.score = score;
        this.elements.score.textContent = score;
    }
    
    displayHighScore() {
        this.elements.highScore.textContent = this.highScore;
    }
    
    async gameOver(finalScore) {
        this.isPlaying = false;
        
        // Показываем экран окончания игры
        this.elements.gameOverScreen.style.display = 'block';
        
        // Проверяем рекорд
        if (finalScore > this.highScore) {
            this.highScore = finalScore;
            this.displayHighScore();
            
            // Сохраняем новый рекорд
            try {
                await GameStorage.saveScore(finalScore);
                this.elements.highScore.classList.add('new-record');
                setTimeout(() => {
                    this.elements.highScore.classList.remove('new-record');
                }, 2000);
            } catch (error) {
                console.error('Ошибка сохранения рекорда:', error);
            }
        }
    }
    
    shareScore() {
        if (this.webapp.isVersionAtLeast('6.0')) {
            this.webapp.showPopup({
                title: 'Поделиться результатом',
                message: `Мой результат: ${this.score} очков!`,
                buttons: [
                    {id: 'share', type: 'share'},
                    {id: 'close', type: 'close'}
                ]
            });
        } else {
            // Для старых версий Telegram
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Мой результат: ${this.score} очков!`)}`;
            window.open(shareUrl, '_blank');
        }
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Инициализируем хранилище
    await GameStorage.init();
    
    // Создаем экземпляр игры
    window.game = new Game();
}); 