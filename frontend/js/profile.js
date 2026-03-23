document.addEventListener("DOMContentLoaded", () => {
    // Check authentication
    const localUsername = localStorage.getItem('username');
    if (!localUsername) {
        window.location.href = 'login.html';
        return;
    }

    fetchProfileData();
});

function fetchProfileData() {
    fetch("../backend/api/profile_stats.php")
        .then(res => {
            if (res.status === 401) {
                localStorage.clear();
                window.location.href = 'login.html';
                throw new Error("Unauthorized");
            }
            return res.json();
        })
        .then(data => {
            if (data.status === "success") {
                renderProfile(data.data);
            } else {
                console.error("Failed to load profile:", data.message);
            }
        })
        .catch(err => {
            console.error("Error fetching profile:", err);
        });
}

function renderProfile(data) {
    // Update Header
    document.getElementById('profileUsername').textContent = `${data.username}'s Profile`;
    document.getElementById('diamondCount').innerText = data.diamonds || 0;

    if (data.profile_pic) {
        document.getElementById('profilePic').src = data.profile_pic;
    }

    // Update Stats
    const summary = data.summary;
    document.getElementById('statTotalGames').textContent = summary.total_games || 0;
    document.getElementById('statHighScore').textContent = summary.high_score || 0;
    document.getElementById('statAvgSpeed').textContent = summary.avg_speed ? parseFloat(summary.avg_speed).toFixed(2) + 's' : '0s';
    document.getElementById('statMaxLevel').textContent = summary.max_level || 0;

    // Render Recent History
    const historyBody = document.getElementById('recentHistoryBody');
    historyBody.innerHTML = '';

    if (data.recent_games.length === 0) {
        historyBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No games recorded yet</td></tr>';
    } else {
        data.recent_games.forEach(game => {
            const row = document.createElement('tr');
            const date = new Date(game.created_at).toLocaleDateString();
            row.innerHTML = `
                <td>${date}</td>
                <td>${game.score}</td>
                <td>${game.level}</td>
                <td>${parseFloat(game.average_response_time).toFixed(2)}s</td>
            `;
            historyBody.appendChild(row);
        });
    }

    // Render Achievements
    const achContainer = document.getElementById('achievementsContainer');
    const noAchMsg = document.getElementById('noAchievementsMsg');

    if (data.achievements.length > 0) {
        noAchMsg.style.display = 'none';
        data.achievements.forEach(ach => {
            const badge = document.createElement('div');
            badge.className = 'achievement-badge';
            badge.innerHTML = `
                <div class="badge-icon">🎖️</div>
                <div class="badge-info">
                    <h4>${ach.name}</h4>
                    <small>${ach.description}</small>
                </div>
            `;
            achContainer.appendChild(badge);
        });
    }
}
