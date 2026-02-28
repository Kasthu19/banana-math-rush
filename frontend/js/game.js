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

document.addEventListener("DOMContentLoaded", () => {

    startGame();

    document.getElementById("submitAnswer")
        .addEventListener("click", checkAnswer);

    document.getElementById("answer").addEventListener("keypress", (e) => {
        if (e.key === "Enter") checkAnswer();
    });
});

function startGame() {

    score = 0;
    lives = 3;
    combo = 0;
    multiplier = 1;
    analytics = [];
    totalResponseTime = 0;
    questionsAnswered = 0;

    document.getElementById("score").innerText = score;
    document.getElementById("level").innerText = 1;
    document.getElementById("combo").innerText = combo;
    document.getElementById("multiplier").innerText = "x1";

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

    let level = 1;
    let timerValue = 15;

    // Difficulty scaling
    if (score >= 5) {
        timerValue = 12;
        level = 2;
    }
    if (score >= 10) {
        timerValue = 10;
        level = 3;
    }
    if (score >= 20) {
        timerValue = 7;
        level = 4;
    }
    // Elite Level
    if (score >= 35) {
        timerValue = 5;
        level = "Elite 🏆";
        document.getElementById("level").classList.add("elite-mode");
    } else {
        document.getElementById("level").classList.remove("elite-mode");
    }

    timer = timerValue;
    document.getElementById("level").innerText = level;
    document.getElementById("timer").innerText = timer;

    if (countdown !== null) {
        clearInterval(countdown);
    }

    countdown = setInterval(() => {

        timer--;
        document.getElementById("timer").innerText = timer;

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

        loadPuzzle();

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
    startGame();
}
