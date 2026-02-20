const API_BASE = "../api/";

function fetchBanana() {
    return fetch(API_BASE + "banana.php")
        .then(res => res.json());
}

function saveScore(score) {
    return fetch(API_BASE + "score.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "score=" + score
    });
}
