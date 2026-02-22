const API_BASE = "../backend/api/";

function fetchBanana() {
    return fetch(API_BASE + "banana.php")
        .then(res => res.json());
}

function saveScore(data) {
    const params = new URLSearchParams();
    for (const key in data) {
        if (key === 'analytics') {
            params.append(key, JSON.stringify(data[key]));
        } else {
            params.append(key, data[key]);
        }
    }

    return fetch(API_BASE + "score.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
    }).then(res => res.json());
}

function fetchLeaderboard() {
    return fetch(API_BASE + "leaderboard.php")
        .then(res => res.json());
}

function fetchAchievements() {
    return fetch(API_BASE + "achievements.php")
        .then(res => res.json());
}
