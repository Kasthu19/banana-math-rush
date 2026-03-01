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
        endGame();
    } else {
        alert("Time's up! You lost a life.");
        loadPuzzle();
    }
}

function checkAnswer() {

    let userAnswer = document.getElementById("answer").value;

    if (userAnswer === "") {
        alert("Please enter an answer");
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

        score++;
        questionsAnswered++;
        totalResponseTime += responseTime;

        document.getElementById("score").innerText = score;
        document.getElementById("finalScoreDisplay").innerText = score;

        // Level 1 Finish Logic
        if (currentActiveLevel === 1 && score === 5) {
            clearInterval(countdown);
            localStorage.setItem('level1_done', 'true');
            setTimeout(showLevel1Complete, 500);
            return; // Stop loading next puzzle automatically
        }

        // Bonus for speed
        if (responseTime < 3) {
            combo++;
            if (combo > 2) multiplier = 2;
        } else {
            combo = 0;
            multiplier = 1;
        }

        document.getElementById("combo").innerText = combo;
        document.getElementById("multiplier").innerText = `x${multiplier}`;

        showSuccessFeedback();

        // Level Jump Detection
        if (score === 5 || score === 10 || score === 20 || score === 35) {
            setTimeout(() => showLevelUpFeedback(score === 5 ? 2 : score === 10 ? 3 : score === 20 ? 4 : 'Elite'), 500);
        }

        setTimeout(loadPuzzle, 1500); // Wait for animations before loading next puzzle

    } else {
        lives--;
        updateLivesDisplay();
        combo = 0;
        multiplier = 1;

        if (lives <= 0) {
            clearInterval(countdown);
            endGame();
        } else {
            alert("Wrong answer! You lost a life.");
        }
    }
}

function updateLivesDisplay() {
    let hearts = "";
    for (let i = 0; i < lives; i++) {
        hearts += "❤️";
    }
    document.getElementById("livesDisplay").innerText = hearts || "💀";
}

function endGame() {
    document.getElementById("gameArea").style.display = "none";
    document.getElementById("gameOver").style.display = "block";
    document.getElementById("submitAnswer").disabled = true;

    // Fix: Show the final score in the Game Over message
    document.getElementById("finalScoreDisplay").innerText = score;

    const avgResponseTime = questionsAnswered > 0 ? (totalResponseTime / questionsAnswered).toFixed(2) : 0;

    saveScore({
        score: score,
        level: parseInt(document.getElementById("level").innerText) || 5, // Handles Elite
        avg_response_time: avgResponseTime,
        analytics: analytics
    }).then(result => {
        console.log("Game result saved:", result);
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
