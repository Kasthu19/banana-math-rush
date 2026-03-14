const API_BASE = "../backend/api/";

function fetchBanana() {
    return fetch(API_BASE + "banana.php", { credentials: 'include' })
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
        body: params.toString(),
        credentials: 'include'
    }).then(res => res.json());
}

function fetchLeaderboard() {
    return fetch(API_BASE + "leaderboard.php", { credentials: 'include' })
        .then(res => res.json());
}

function fetchAchievements() {
    return fetch(API_BASE + "achievements.php", { credentials: 'include' })
        .then(res => res.json());
}

function claimReward(achievementName, isLevelReward = false) {
    const params = new URLSearchParams();
    if (achievementName) params.append('achievement_name', achievementName);
    if (isLevelReward) params.append('is_level_reward', '1');

    return fetch(API_BASE + "claim_reward.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        credentials: 'include'
    }).then(res => res.json());
}

function spendDiamonds(amount, purpose) {
    const params = new URLSearchParams();
    params.append('amount', amount);
    params.append('purpose', purpose);

    return fetch(API_BASE + "spend_diamonds.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        credentials: 'include'
    }).then(res => res.json());
}

function fetchProfile() {
    return fetch(API_BASE + "profile_stats.php", { credentials: 'include' })
        .then(res => res.json());
}
