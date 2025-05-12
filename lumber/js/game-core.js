// Основной класс игровой логики
class GameCore {
    constructor(gameInstance) {
        this.game = gameInstance; // Ссылка на основной класс игры
        this.score = 0;
        this.isPlaying = false;
        this.isGameOver = false;
        
        // Настройки игры
        this.settings = {
            gravity: 0.5,
            jumpForce: -12,
            moveSpeed: 5,
            treeSpeed: 2,
            treeSpawnInterval: 2000,
            scorePerTree: 1
        };
        
        // Состояние игры
        this.state = {
            player: {
                x: 0,
                y: 0,
                velocityY: 0,
                isJumping: false,
                direction: 1 // 1 вправо, -1 влево
            },
            trees: [],
            lastTreeSpawn: 0,
            groundY: 0
        };
        
        // Инициализация PixiJS
        this.initPixi();
        
        // Привязка обработчиков
        this.bindEvents();
    }
    
    initPixi() {
        // Создаем рендерер
        this.renderer = PIXI.autoDetectRenderer({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x87CEEB,
            resolution: window.devicePixelRatio || 1
        });
        
        // Добавляем canvas в DOM
        document.getElementById('canvas_wrap').appendChild(this.renderer.view);
        
        // Создаем основной контейнер
        this.stage = new PIXI.Container();
        
        // Создаем слои
        this.layers = {
            background: new PIXI.Container(),
            game: new PIXI.Container(),
            foreground: new PIXI.Container()
        };
        
        // Добавляем слои на сцену
        this.stage.addChild(this.layers.background);
        this.stage.addChild(this.layers.game);
        this.stage.addChild(this.layers.foreground);
        
        // Загружаем ресурсы
        this.loadResources();
    }
    
    async loadResources() {
        // Создаем загрузчик
        const loader = PIXI.loader;
        
        // Добавляем ресурсы
        loader
            .add('player', 'images/lumberjack.svg')
            .add('tree', 'images/tree.svg')
            .add('background', 'images/bg.svg')
            .add('ground', 'images/ground.svg');
        
        // Загружаем ресурсы
        await new Promise((resolve) => {
            loader.load(() => resolve());
        });
        
        // Создаем спрайты
        this.createSprites();
    }
    
    createSprites() {
        // Создаем фон
        this.background = new PIXI.Sprite(PIXI.loader.resources.background.texture);
        this.background.width = this.renderer.width;
        this.background.height = this.renderer.height;
        this.layers.background.addChild(this.background);
        
        // Создаем землю
        this.ground = new PIXI.Sprite(PIXI.loader.resources.ground.texture);
        this.ground.width = this.renderer.width;
        this.ground.y = this.renderer.height - this.ground.height;
        this.state.groundY = this.ground.y;
        this.layers.foreground.addChild(this.ground);
        
        // Создаем игрока
        this.player = new PIXI.Sprite(PIXI.loader.resources.player.texture);
        this.player.anchor.set(0.5);
        this.player.x = this.renderer.width / 4;
        this.player.y = this.state.groundY - this.player.height / 2;
        this.state.player.x = this.player.x;
        this.state.player.y = this.player.y;
        this.layers.game.addChild(this.player);
    }
    
    bindEvents() {
        // Обработка нажатий клавиш
        window.addEventListener('keydown', (e) => {
            if (!this.isPlaying) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.movePlayer(-1);
                    break;
                case 'ArrowRight':
                    this.movePlayer(1);
                    break;
                case ' ':
                case 'ArrowUp':
                    this.jump();
                    break;
            }
        });
        
        // Обработка касаний
        const canvas = this.renderer.view;
        canvas.addEventListener('touchstart', (e) => {
            if (!this.isPlaying) return;
            
            const touch = e.touches[0];
            const centerX = canvas.width / 2;
            
            if (touch.clientX < centerX) {
                this.movePlayer(-1);
            } else {
                this.movePlayer(1);
            }
            
            this.jump();
        });
    }
    
    start() {
        this.isPlaying = true;
        this.isGameOver = false;
        this.score = 0;
        this.state.trees = [];
        this.state.lastTreeSpawn = Date.now();
        
        // Сбрасываем позицию игрока
        this.state.player.x = this.renderer.width / 4;
        this.state.player.y = this.state.groundY - this.player.height / 2;
        this.state.player.velocityY = 0;
        this.state.player.isJumping = false;
        this.state.player.direction = 1;
        
        this.player.x = this.state.player.x;
        this.player.y = this.state.player.y;
        this.player.scale.x = Math.abs(this.player.scale.x);
        
        // Запускаем игровой цикл
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isPlaying) return;
        
        // Обновляем состояние
        this.update();
        
        // Отрисовываем
        this.render();
        
        // Следующий кадр
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Обновляем физику игрока
        this.updatePlayer();
        
        // Обновляем деревья
        this.updateTrees();
        
        // Проверяем коллизии
        this.checkCollisions();
        
        // Спавним новые деревья
        this.spawnTrees();
    }
    
    updatePlayer() {
        // Применяем гравитацию
        this.state.player.velocityY += this.settings.gravity;
        this.state.player.y += this.state.player.velocityY;
        
        // Проверяем столкновение с землей
        if (this.state.player.y > this.state.groundY - this.player.height / 2) {
            this.state.player.y = this.state.groundY - this.player.height / 2;
            this.state.player.velocityY = 0;
            this.state.player.isJumping = false;
        }
        
        // Обновляем позицию спрайта
        this.player.y = this.state.player.y;
    }
    
    updateTrees() {
        for (let i = this.state.trees.length - 1; i >= 0; i--) {
            const tree = this.state.trees[i];
            
            // Двигаем дерево
            tree.x -= this.settings.treeSpeed;
            
            // Удаляем дерево, если оно ушло за экран
            if (tree.x + tree.width < 0) {
                this.layers.game.removeChild(tree);
                this.state.trees.splice(i, 1);
                this.score += this.settings.scorePerTree;
                this.game.displayScore(this.score);
            }
        }
    }
    
    checkCollisions() {
        for (const tree of this.state.trees) {
            if (this.checkCollision(this.player, tree)) {
                this.gameOver();
                break;
            }
        }
    }
    
    checkCollision(player, tree) {
        const playerBounds = player.getBounds();
        const treeBounds = tree.getBounds();
        
        return playerBounds.x < treeBounds.x + treeBounds.width &&
               playerBounds.x + playerBounds.width > treeBounds.x &&
               playerBounds.y < treeBounds.y + treeBounds.height &&
               playerBounds.y + playerBounds.height > treeBounds.y;
    }
    
    spawnTrees() {
        const now = Date.now();
        if (now - this.state.lastTreeSpawn > this.settings.treeSpawnInterval) {
            const tree = new PIXI.Sprite(PIXI.loader.resources.tree.texture);
            tree.anchor.set(0.5);
            tree.x = this.renderer.width + tree.width;
            tree.y = this.state.groundY - tree.height / 2;
            
            this.layers.game.addChild(tree);
            this.state.trees.push(tree);
            this.state.lastTreeSpawn = now;
        }
    }
    
    movePlayer(direction) {
        this.state.player.direction = direction;
        this.player.scale.x = Math.abs(this.player.scale.x) * direction;
    }
    
    jump() {
        if (!this.state.player.isJumping) {
            this.state.player.velocityY = this.settings.jumpForce;
            this.state.player.isJumping = true;
        }
    }
    
    gameOver() {
        this.isPlaying = false;
        this.isGameOver = true;
        this.game.gameOver(this.score);
    }
    
    render() {
        this.renderer.render(this.stage);
    }
    
    resize() {
        // Обновляем размеры рендерера
        this.renderer.resize(window.innerWidth, window.innerHeight);
        
        // Обновляем размеры фона
        this.background.width = this.renderer.width;
        this.background.height = this.renderer.height;
        
        // Обновляем позицию земли
        this.ground.width = this.renderer.width;
        this.ground.y = this.renderer.height - this.ground.height;
        this.state.groundY = this.ground.y;
        
        // Обновляем позицию игрока
        this.state.player.y = this.state.groundY - this.player.height / 2;
        this.player.y = this.state.player.y;
    }
}

// Экспортируем класс
window.GameCore = GameCore; 