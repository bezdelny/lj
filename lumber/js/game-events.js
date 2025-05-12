// Перехват событий игры
(function() {
    // Функция для генерации события gameOver
    function triggerGameOver(score) {
        document.dispatchEvent(new CustomEvent('gameOver', {
            detail: { score: score }
        }));
    }

    // Перехватываем обновление счета
    const originalScoreValue = document.getElementById('score_value');
    if (originalScoreValue) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'characterData' || mutation.type === 'childList') {
                    const score = originalScoreValue.textContent;
                    if (score && !isNaN(parseInt(score))) {
                        // Проверяем, что игра действительно закончилась
                        const pageWrap = document.getElementById('page_wrap');
                        if (pageWrap && pageWrap.classList.contains('in_result')) {
                            triggerGameOver(parseInt(score));
                        }
                    }
                }
            });
        });

        observer.observe(originalScoreValue, {
            characterData: true,
            childList: true,
            subtree: true
        });
    }

    // Перехватываем клик по кнопке "Поделиться"
    const shareButton = document.getElementById('score_share');
    if (shareButton) {
        const originalClick = shareButton.onclick;
        shareButton.onclick = function(e) {
            const score = document.getElementById('score_value').textContent;
            if (score && !isNaN(parseInt(score))) {
                triggerGameOver(parseInt(score));
            }
            if (originalClick) {
                originalClick.call(this, e);
            }
        };
    }
})(); 