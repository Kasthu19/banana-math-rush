let score = 0;
let lives = 3;
let combo = 0;
let multiplier = 1;
let timer = 15;
let countdown = null;
let correctAnswer = null;

document.addEventListener("DOMContentLoaded", () => {

    startGame();

    document.getElementById("submitAnswer")
        .addEventListener("click", checkAnswer);
});

function startGame() {

    score = 0;
    lives = 3;
    combo = 0;
    multiplier = 1;

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

        document.getElementById("answer").value = "";

        resetTimer();
    });
}

function resetTimer() {

    let level = 1;

    // Default timer
    timer = 15;

    // Difficulty scaling
    if (score >= 5) {
        timer = 12;
        level = 2;
    }

    if (score >= 10) {
        timer = 10;
        level = 3;
    }

    document.getElementById("level").innerText = level;
    document.getElementById("timer").innerText = timer;

    if (countdown !== null) {
        clearInterval(countdown);
    }

    countdown = setInterval(() => {

        timer--;
        document.getElementById("timer").innerText = timer;

        if (timer <= 0) {

            clearInterval(countdown);

            lives--;
            updateLivesDisplay();

            if (lives <= 0) {
                gameOver();
            } else {
                alert("Time's up! You lost a life.");
                loadPuzzle();
            }
        }

    }, 1000);
}

function checkAnswer() {

    let userAnswer = document.getElementById("answer").value;

    if (userAnswer === "") {
        alert("Please enter an answer");
        return;
    }

    if (parseInt(userAnswer) === parseInt(correctAnswer)) {

        clearInterval(countdown);

        score++;
        document.getElementById("score").innerText = score;

        saveScore(score);

        loadPuzzle();

    } else {

        lives--;
        updateLivesDisplay();

        if (lives <= 0) {
            clearInterval(countdown);
            gameOver();
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
    document.getElementById("livesDisplay").innerText = hearts;
}

function gameOver() {

    document.getElementById("gameArea").style.display = "none";
    document.getElementById("gameOver").style.display = "block";
    document.getElementById("submitAnswer").disabled = true;
}

function restartGame() {
    startGame();
}g