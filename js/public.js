const bc = new BroadcastChannel('quizzmaster_sync');
let currentState = null;

bc.onmessage = (event) => {
    const { action, data, currentRound } = event.data;
    currentState = data;
    
    document.getElementById('pubTitle').innerText = data.meta.title;
    if (currentRound) {
        document.getElementById('pubRoundName').innerText = currentRound.name;
        document.getElementById('pubRoundType').innerText = currentRound.type.replace('_', ' ');
    }

    if (action === 'SCORE_UPDATE' || action === 'SHOW_LEADERBOARD') {
        renderLeaderboard(data.teams);
        showLeaderboard();
    } else if (action === 'ROUND_CHANGED') {
        // Just flash the round change or show leaderboard
        renderLeaderboard(data.teams);
        showLeaderboard();
    }
};

function renderLeaderboard(teams) {
    const board = document.getElementById('lbView');
    board.innerHTML = '';
    
    // Sort descending
    const sorted = [...teams].sort((a, b) => b.score - a.score);
    
    sorted.forEach((t, i) => {
        // Only show top 5 on main screen if many teams
        if (i >= 6) return; 
        
        board.innerHTML += `
            <div class="lb-row" style="--t-color: ${t.color}">
                <div class="lb-rank">#${i + 1}</div>
                <div class="lb-name">${t.name}</div>
                <div class="lb-score">${t.score}</div>
            </div>
        `;
    });
}

function showLeaderboard() {
    document.getElementById('qView').classList.remove('active');
    document.getElementById('qView').style.display = 'none';
    
    document.getElementById('lbView').style.display = 'flex';
    // Re-trigger animation
    document.getElementById('lbView').classList.remove('active');
    void document.getElementById('lbView').offsetWidth; 
    document.getElementById('lbView').classList.add('active');
}

// Initial state fetch if loaded after QM
// Realistically, QM should broadcast state on load, but we can check localStorage if running on same device
document.addEventListener('DOMContentLoaded', () => {
    const dataStr = localStorage.getItem('qm_config');
    if (dataStr) {
        currentState = JSON.parse(dataStr);
        document.getElementById('pubTitle').innerText = currentState.meta.title;
        renderLeaderboard(currentState.teams);
    }
});
