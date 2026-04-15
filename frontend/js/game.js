// Check authentication
if (!localStorage.getItem('username')) {
    window.location.href = 'login.html';
}

let score = 0;
let lives = 3;
let combo = 0;
let multiplier = 1;
let timer = 60;
let countdown = null;
let correctAnswer = null;
let questionStartTime = null;
let currentQuestionId = null;
let analytics = [];
let totalResponseTime = 0;
let questionsAnswered = 0;
let currentActiveLevel = 1; // Default

document.addEventListener("DOMContentLoaded", () => {

    startGame();
    SoundEffects.resume();

    document.getElementById("submitAnswer")
        .addEventListener("click", () => {
            SoundEffects.resume();
            checkAnswer();
        });

    document.getElementById("answer").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            SoundEffects.resume();
            checkAnswer();
        }
    });
});

function startGame() {
    const urlParams = new URLSearchParams(window.location.search);
    currentActiveLevel = parseInt(urlParams.get('level')) || 1;

    // Set progression state based on level
    if (currentActiveLevel === 2) score = 5;
    else if (currentActiveLevel === 3) score = 10;
    else if (currentActiveLevel === 4) score = 20;
    else if (currentActiveLevel >= 5) score = 35;
    else score = 0;

    lives = 3;
    combo = 0;
    multiplier = 1;
    analytics = [];
    totalResponseTime = 0;
    questionsAnswered = 0;

    document.getElementById("score").innerText = score;
    document.getElementById("finalScoreDisplay").innerText = score;
    document.getElementById("level").innerText = currentActiveLevel;
    document.getElementById("combo").innerText = combo;
    document.getElementById("multiplier").innerText = "x1";


    updateLivesDisplay();

    document.getElementById("gameOver").style.display = "none";
    document.getElementById("gameArea").style.display = "block";
    document.getElementById("submitAnswer").disabled = false;
    document.getElementById("reviveModal").classList.remove("active");

    // Initialize Diamonds from Profile
    fetchProfile().then(res => {
        if (res.status === "success") {
            document.getElementById("diamondCount").innerText = res.data.diamonds;
        }
    });

    loadPuzzle();
}

function loadPuzzle() {

    fetchBanana().then(data => {
        document.getElementById("bananaImage").src = data.question;
        correctAnswer = data.solution;
        currentQuestionId = data.question.split('/').pop(); // Simple ID from URL

        document.getElementById("answer").value = "";
        document.getElementById("answer").focus();

        questionStartTime = Date.now();
        resetTimer();
    });
}

function resetTimer() {
    let level = currentActiveLevel;
    let timerValue = 60;

    // Highest reached logic
    if (score >= 35 || currentActiveLevel >= 5) { timerValue = 12; level = `${i18n.t('mode_elite')} 🏆`; }
    else if (score >= 20 || currentActiveLevel >= 4) { timerValue = 25; level = 4; }
    else if (score >= 10 || currentActiveLevel >= 3) { timerValue = 35; level = 3; }
    else if (score >= 5 || currentActiveLevel >= 2) { timerValue = 45; level = 2; }
    else { timerValue = 60; level = 1; }

    timer = timerValue;
    document.getElementById("level").innerText = level;
    document.getElementById("timer").innerText = timer;

    // Apply Theme and Elite styles
    document.body.className = `level-${level === "Elite 🏆" ? 'elite' : level}`;

    if (level === "Elite 🏆") {
        document.getElementById("level").classList.add("elite-mode");
    } else {
        document.getElementById("level").classList.remove("elite-mode");
    }

    if (countdown !== null) {
        clearInterval(countdown);
    }

    countdown = setInterval(() => {

        timer--;
        document.getElementById("timer").innerText = timer;

        // Pulse timer when low
        if (timer <= 5) {
            document.getElementById("timerBox").style.transform = "scale(1.1)";
            document.getElementById("timer").style.color = "#ef4444";
        } else {
            document.getElementById("timerBox").style.transform = "scale(1)";
            document.getElementById("timer").style.color = "#e11d48";
        }

        if (timer <= 0) {
            handleTimeUp();
        }

    }, 1000);
}

function handleTimeUp() {
    clearInterval(countdown);

    // Record fail analytics
    const responseTime = (Date.now() - questionStartTime) / 1000;
    analytics.push({
        question_id: currentQuestionId,
        response_time: responseTime,
        is_correct: false
    });

    lives--;
    updateLivesDisplay();

    if (lives <= 0) {
        SoundEffects.gameOver();
        endGame();
    } else {
        SoundEffects.wrong();
        showWrongFeedback(i18n.t('time_up'));
        loadPuzzle();
    }
}

function checkAnswer() {

    let userAnswer = document.getElementById("answer").value;

    if (userAnswer === "") {
        const input = document.getElementById("answer");
        input.classList.add("shake-error");
        setTimeout(() => input.classList.remove("shake-error"), 500);
        return;
    }

    const responseTime = (Date.now() - questionStartTime) / 1000;
    const isCorrect = parseInt(userAnswer) === parseInt(correctAnswer);

    analytics.push({
        question_id: currentQuestionId,
        response_time: responseTime,
        is_correct: isCorrect
    });

    if (isCorrect) {
        clearInterval(countdown);

        combo++;
        multiplier = Math.floor(combo / 5) + 1;

        score += multiplier;
        questionsAnswered++;
        totalResponseTime += responseTime;

        document.getElementById("score").innerText = score;
        document.getElementById("finalScoreDisplay").innerText = score;
        document.getElementById("combo").innerText = combo;
        document.getElementById("multiplier").innerText = `x${multiplier}`;

        SoundEffects.correct();
        showSuccessFeedback();

        // Level Jump Detection
        if (score === 5 || score === 10 || score === 20 || score === 35) {
            const currentLvlTitle = document.getElementById("level").innerText;
            
            if (currentLvlTitle == "1" && score === 5) {
                SoundEffects.levelUp();
                setTimeout(showLevel1Complete, 500);
                return;
            } else if (score > 5) {
                const nextLvlDisplay = score === 10 ? 3 : score === 20 ? 4 : 'Elite';
                SoundEffects.levelUp();
                setTimeout(() => showLevelUpFeedback(nextLvlDisplay), 500);
                return;
            }
        }

        setTimeout(loadPuzzle, 1500); // Wait for animations before loading next puzzle

    } else {
        lives--;
        updateLivesDisplay();
        combo = 0;
        multiplier = 1;

        if (lives <= 0) {
            clearInterval(countdown);
            SoundEffects.gameOver();
            endGame();
        } else {
            SoundEffects.wrong();
            showWrongFeedback(i18n.t('wrong_answer'));
        }
    }
}

function updateLivesDisplay() {
    const container = document.getElementById("livesDisplay");
    const monkey = document.getElementById("monkeyReaction");

    // Heart Icons with shattering animation
    const oldHearts = container.querySelectorAll('.heart');
    if (oldHearts.length > lives && lives >= 0) {
        const heartToLose = oldHearts[lives];
        if (heartToLose) heartToLose.classList.add('shatter');
    }

    // Full Refresh of hearts if needed (e.g. game start)
    if (oldHearts.length === 0 || lives === 3) {
        container.innerHTML = "";
        for (let i = 0; i < 3; i++) {
            const span = document.createElement("span");
            span.className = "heart";
            span.innerText = "❤️";
            if (i >= lives) span.style.opacity = "0";
            container.appendChild(span);
        }
    }

    // Monkey Reaction Logic
    if (monkey) {
        if (lives === 3) monkey.innerText = "🐒";
        else if (lives === 2) monkey.innerText = "🐵";
        else if (lives === 1) monkey.innerText = "🙈";
        else monkey.innerText = "💀";

        monkey.classList.add("bounce");
        setTimeout(() => monkey.classList.remove("bounce"), 500);
    }
}

function endGame() {
    document.getElementById("gameArea").style.display = "none";
    document.getElementById("gameOver").style.display = "block";
    document.getElementById("submitAnswer").disabled = true;

    // Fix: Show the final score in the Game Over message
    document.getElementById("finalScoreDisplay").innerText = score;

    // Trigger Revive Modal instead of final end if user has diamonds and level >= 3
    const currentLvlNum = parseInt(document.getElementById("level").innerText) || 1;
    if (currentLvlNum >= 3) {
        setTimeout(showReviveModal, 1000);
    } else {
        saveFinalGameResults();
    }
}

function showReviveModal() {
    const modal = document.getElementById("reviveModal");
    modal.classList.add("active");

    document.getElementById("reviveBtn").onclick = () => {
        spendDiamonds(20, "Revive").then(res => {
            if (res.status === "success") {
                modal.classList.remove("active");
                lives = 3;
                updateLivesDisplay();
                document.getElementById("gameArea").style.display = "block";
                document.getElementById("gameOver").style.display = "none";
                document.getElementById("submitAnswer").disabled = false;
                document.getElementById("diamondCount").innerText = res.new_balance;
                loadPuzzle();
            } else {
                alert(res.message);
            }
        });
    };
}

function endGameFinal() {
    document.getElementById("reviveModal").classList.remove("active");
    saveFinalGameResults();
}

function saveFinalGameResults() {
    const avgResponseTime = questionsAnswered > 0 ? (totalResponseTime / questionsAnswered).toFixed(2) : 0;

    saveScore({
        score: score,
        level: parseInt(document.getElementById("level").innerText) || 5, // Handles Elite
        avg_response_time: avgResponseTime,
        analytics: analytics
    }).then(result => {
        console.log("Game result saved:", result);
        if (result.newly_unlocked && result.newly_unlocked.length > 0) {
            result.newly_unlocked.forEach((name, index) => {
                setTimeout(() => showAchievementPopup(name), index * 3500);
            });
        }
    });
}

function restartGame() {
    location.reload();
}

function showSuccessFeedback() {
    const overlay = document.getElementById("successOverlay");
    overlay.classList.add("active");

    // Random emojis
    const smiles = ["👏", "🐒", "🍌", "🔥", "✨", "🌟"];
    overlay.querySelector(".emoji").innerText = "🐒" + smiles[Math.floor(Math.random() * smiles.length)];

    for (let i = 0; i < 30; i++) {
        createConfetti();
    }

    setTimeout(() => {
        overlay.classList.remove("active");
    }, 800);
}

function showWrongFeedback(message) {
    const overlay = document.getElementById("wrongOverlay");
    const text = document.getElementById("wrongText");

    text.innerText = message;
    overlay.classList.add("active");
    document.getElementById("gameArea").classList.add("shake");

    setTimeout(() => {
        overlay.classList.remove("active");
        document.getElementById("gameArea").classList.remove("shake");
        if (message === "Wrong Answer!") {
            loadPuzzle();
        }
    }, 1200);
}

function showAchievementPopup(name) {
    const toast = document.getElementById("achievementToast");
    const nameEl = document.getElementById("achievementName");

    if (!toast || !nameEl) return;

    nameEl.innerText = name;
    toast.classList.add("active");
    SoundEffects.levelUp(); // Reuse level up sound for achievements

    setTimeout(() => {
        toast.classList.remove("active");
    }, 3000);
}

function spawnDiamonds(count, sourceElement) {
    const rect = sourceElement ? sourceElement.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const diamond = document.createElement("div");
            diamond.className = "diamond-particle";
            diamond.innerText = "💎";
            diamond.style.left = startX + "px";
            diamond.style.top = startY + "px";
            document.body.appendChild(diamond);

            // Burst math
            const angle = Math.random() * Math.PI * 2;
            const velocity = 5 + Math.random() * 10;
            const destX = (Math.cos(angle) * 150) + (Math.random() - 0.5) * 50;
            const destY = (Math.sin(angle) * 150) + (Math.random() - 0.5) * 50;

            const animation = diamond.animate([
                { transform: 'translate(0, 0) scale(0)', opacity: 0 },
                { transform: `translate(${destX / 2}px, ${destY / 2}px) scale(1.5)`, opacity: 1, offset: 0.2 },
                { transform: `translate(${destX}px, ${destY}px) scale(1)`, opacity: 0 }
            ], {
                duration: 1000 + Math.random() * 500,
                easing: "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            });

            animation.onfinish = () => diamond.remove();
        }, i * 50);
    }
}

function createConfetti() {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    document.body.appendChild(confetti);

    const colors = ["#fbbf24", "#f59e0b", "#f97316", "#ffffff"];
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];

    const startX = Math.random() * window.innerWidth;
    const startY = -10;

    confetti.style.left = startX + "px";
    confetti.style.top = startY + "px";
    confetti.style.borderRadius = "50%";

    const animation = confetti.animate([
        { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${(Math.random() - 0.5) * 200}px, ${window.innerHeight}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
    ], {
        duration: Math.random() * 1000 + 1000,
        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
    });

    animation.onfinish = () => confetti.remove();
}

function showLevelUpFeedback(level) {
    const overlay = document.getElementById("levelUpOverlay");
    const levelNum = document.getElementById("nextLevelNum");
    const giftBox = document.getElementById("levelGiftBox");
    const msg = document.getElementById("giftClaimMsg");

    levelNum.innerText = level;
    overlay.classList.add("active");
    document.getElementById("gameArea").classList.add("shake");

    // Show Reward Gift if earned
    giftBox.style.display = "block";
    msg.style.display = "block";
    giftBox.innerText = "🎁";
    giftBox.classList.remove("open");

    giftBox.onclick = () => {
        giftBox.innerText = "✨";
        giftBox.classList.add("open");
        msg.innerText = i18n.t('reward_collected');

        // Level Reward Claim
        const proceedToNextLevel = () => {
            setTimeout(() => {
                overlay.classList.remove("active");
                document.getElementById("gameArea").classList.remove("shake");
                giftBox.style.display = "none";
                msg.style.display = "none";
                
                // Automatically start the next level after reward
                window.location.href = `game.html?level=${level}`;
            }, 1500);
        };

        claimReward(null, true).then(res => {
            if (res.status === "success") {
                spawnDiamonds(res.reward, giftBox);
                const currentBalance = parseInt(document.getElementById("diamondCount").innerText) || 0;
                document.getElementById("diamondCount").innerText = currentBalance + res.reward;

                // SAVE PROGRESS NOW to unlock next level
                const nextLvlNum = level === 'Elite' ? 5 : level;
                saveScore({
                    score: score,
                    level: nextLvlNum,
                    avg_response_time: (totalResponseTime / (questionsAnswered || 1)).toFixed(2),
                    analytics: []
                }).finally(proceedToNextLevel);
            } else {
                proceedToNextLevel();
            }
        }).catch(err => {
            console.error("Reward claim failed:", err);
            proceedToNextLevel();
        });
    };

    // Extra confetti for level up
    for (let i = 0; i < 50; i++) {
        setTimeout(createConfetti, i * 20);
    }
}

function showLevel1Complete() {
    const overlay = document.getElementById("levelCompleteOverlay");
    const giftBox = document.getElementById("lv1GiftBox");
    const msg = document.getElementById("lv1GiftMsg");
    const nextBtn = document.getElementById("lv1NextBtn");

    overlay.classList.add("active");
    giftBox.style.display = "block";
    msg.style.display = "block";
    giftBox.innerText = "🎁";
    nextBtn.style.display = "none";

    giftBox.onclick = () => {
        giftBox.innerText = "✨";
        msg.innerText = i18n.t('lv1_reward_claimed');

        claimReward(null, true).then(res => {
            if (res.status === "success") {
                spawnDiamonds(5, giftBox);
                const currentBalance = parseInt(document.getElementById("diamondCount").innerText);
                document.getElementById("diamondCount").innerText = currentBalance + res.reward;

                // Unlock Level 2
                saveScore({
                    score: 5,
                    level: 2,
                    avg_response_time: (totalResponseTime / (questionsAnswered || 1)).toFixed(2),
                    analytics: []
                });

                // Show the original "Continue" button or auto-progress
                setTimeout(() => {
                    giftBox.style.display = "none";
                    msg.style.display = "none";
                    nextBtn.style.display = "inline-block";
                    nextBtn.innerText = i18n.t('start_level_2');
                    nextBtn.onclick = () => window.location.href = 'game.html?level=2';
                    localStorage.setItem('level1_done', 'true');
                }, 1500);
            }
        });
    };

    // Massive confetti
    for (let i = 0; i < 150; i++) {
        setTimeout(createConfetti, i * 15);
    }
}
