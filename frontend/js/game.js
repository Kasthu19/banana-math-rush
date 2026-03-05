// Check authentication
if (!localStorage.getItem('username')) {
    window.location.href = 'login.html';
}

let score = 0;
let lives = 3;
let combo = 0;
let multiplier = 1;
let timer = 15;
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

    document.getElementById("submitAnswer")
        .addEventListener("click", checkAnswer);

    document.getElementById("answer").addEventListener("keypress", (e) => {
        if (e.key === "Enter") checkAnswer();
    });
});

function startGame() {
    const urlParams = new URLSearchParams(window.location.search);
    currentActiveLevel = parseInt(urlParams.get('level')) || 1;

    // Set progression state based on level
    if (currentActiveLevel === 2) score = 5;
    else if (currentActiveLevel === 3) score = 10;
    else if (currentActiveLevel === 4) score = 20;
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

    // Show monkey on start if Level 2+
    if (currentActiveLevel >= 2) {
        setTimeout(() => showLevelUpFeedback(currentActiveLevel), 800);
    }

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
    let timerValue = 15;

    // Highest reached logic
    if (score >= 35 || currentActiveLevel >= 5) { timerValue = 5; level = "Elite 🏆"; }
    else if (score >= 20 || currentActiveLevel >= 4) { timerValue = 7; level = 4; }
    else if (score >= 10 || currentActiveLevel >= 3) { timerValue = 10; level = 3; }
    else if (score >= 5 || currentActiveLevel >= 2) { timerValue = 12; level = 2; }
    else { timerValue = 15; level = 1; }

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
        showWrongFeedback("Time's up!");
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
            const nextLvl = score === 5 ? 2 : score === 10 ? 3 : score === 20 ? 4 : 'Elite';
            SoundEffects.levelUp();
            setTimeout(() => showLevelUpFeedback(nextLvl), 500);

            // Level Reward
            claimReward(null, true).then(res => {
                if (res.status === "success") {
                    spawnDiamonds(10);
                    const currentBalance = parseInt(document.getElementById("diamondCount").innerText);
                    document.getElementById("diamondCount").innerText = currentBalance + res.reward;
                }
            });
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
            showWrongFeedback("Wrong Answer!");
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

function spawnDiamonds(count) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const diamond = document.createElement("div");
            diamond.className = "diamond-particle";
            diamond.innerText = "💎";
            diamond.style.left = Math.random() * 80 + 10 + "%";
            diamond.style.top = "-50px";
            document.body.appendChild(diamond);

            const animation = diamond.animate([
                { top: "-50px", opacity: 0 },
                { top: "20%", opacity: 1, offset: 0.2 },
                { top: "100%", opacity: 0 }
            ], {
                duration: 2000 + Math.random() * 1000,
                easing: "ease-in"
            });

            animation.onfinish = () => diamond.remove();
        }, i * 100);
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

    levelNum.innerText = level;
    overlay.classList.add("active");
    document.getElementById("gameArea").classList.add("shake");

    // Extra confetti for level up
    for (let i = 0; i < 100; i++) {
        setTimeout(createConfetti, i * 10);
    }

    setTimeout(() => {
        overlay.classList.remove("active");
        document.getElementById("gameArea").classList.remove("shake");
    }, 2500);
}

function showLevel1Complete() {
    const overlay = document.getElementById("levelCompleteOverlay");
    overlay.classList.add("active");

    // Massive confetti
    for (let i = 0; i < 150; i++) {
        setTimeout(createConfetti, i * 15);
    }
}
