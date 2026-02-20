let score = 0;

document.addEventListener("DOMContentLoaded", () => {

    loadPuzzle();

    document.getElementById("submitAnswer")
        .addEventListener("click", checkAnswer);

});

function loadPuzzle() {
    fetchBanana().then(data => {
        document.getElementById("bananaImage").src = data.question;
        window.correctAnswer = data.solution;
    });
}

function checkAnswer() {
    let userAnswer = document.getElementById("answer").value;

    if (userAnswer == window.correctAnswer) {
        score++;
        document.getElementById("score").innerText = score;
        saveScore(score);
        loadPuzzle();
    } else {
        alert("Wrong answer!");
    }
}
