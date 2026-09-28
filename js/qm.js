let quizData = null;
let currentRound = null;
const bc = new BroadcastChannel('quizzmaster_sync');

document.addEventListener('DOMContentLoaded', () => {
    const dataStr = localStorage.getItem('qm_config');
    if (!dataStr) {
        alert('No configuration found! Redirecting to setup...');
        window.location.href = 'index.html';
        return;
    }
    
    quizData = JSON.parse(dataStr);
    document.getElementById('quizTitle').innerText = quizData.meta.title;
    
    initRoundsDropdown();
    renderScoreboard();
    
    if (quizData.rounds.length > 0) {
        switchRound(quizData.rounds[0].id);
    }
});

function initRoundsDropdown() {
    const sel = document.getElementById('roundSelector');
    sel.innerHTML = '';
    quizData.rounds.forEach(r => {
        sel.innerHTML += `<option value="${r.id}">${r.name}</option>`;
    });
}

function switchRound(roundId) {
    currentRound = quizData.rounds.find(r => r.id === roundId);
    if (!currentRound) return;
    
    document.getElementById('currentRoundName').innerText = currentRound.name;
    document.getElementById('currentRoundType').innerText = currentRound.type.replace('_', ' ').toUpperCase();
    
    document.getElementById('rPtsD').innerText = '+' + currentRound.points_direct;
    document.getElementById('rPtsP').innerText = '+' + currentRound.points_pass;
    document.getElementById('rPtsN').innerText = currentRound.points_negative;
    
    generateSmartButtons();
    broadcastState('ROUND_CHANGED');
}

function renderScoreboard() {
    const board = document.getElementById('scoreBoard');
    board.innerHTML = '';
    
    // Sort by score descending
    const sortedTeams = [...quizData.teams].sort((a,b) => b.score - a.score);
    
    sortedTeams.forEach(t => {
        board.innerHTML += `
            <div class="team-score-row" style="--t-color: ${t.color}">
                <h3>${t.name}</h3>
                <div style="display:flex; align-items:center; gap: 15px;">
                    <div class="score">${t.score}</div>
                    <div style="display:flex; gap: 5px;">
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size:0.8rem;" onclick="adjustScore('${t.id}', 5)">+5</button>
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size:0.8rem;" onclick="adjustScore('${t.id}', -5)">-5</button>
                    </div>
                </div>
            </div>
        `;
    });
}

function generateSmartButtons() {
    const container = document.getElementById('scoringButtons');
    container.innerHTML = '';
    
    quizData.teams.forEach(t => {
        const pDirect = currentRound.points_direct;
        const pPass = currentRound.points_pass;
        const pNeg = currentRound.points_negative;
        
        let html = `<div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border-top: 3px solid ${t.color}">
            <strong style="display:block; margin-bottom:8px; text-align:center;">${t.name}</strong>
            <div style="display:grid; gap:5px;">
                <button class="btn btn-primary" style="background:#10b981; font-size:0.8rem; padding: 6px;" onclick="adjustScore('${t.id}', ${pDirect})">Direct (+${pDirect})</button>
        `;
        
        if (currentRound.type !== 'direct_only' && currentRound.type !== 'buzzer') {
            html += `<button class="btn btn-primary" style="background:#f59e0b; font-size:0.8rem; padding: 6px;" onclick="adjustScore('${t.id}', ${pPass})">Passed (+${pPass})</button>`;
        }
        
        if (pNeg < 0) {
            html += `<button class="btn btn-primary" style="background:#ef4444; font-size:0.8rem; padding: 6px;" onclick="adjustScore('${t.id}', ${pNeg})">Penalty (${pNeg})</button>`;
        }
        
        html += `</div></div>`;
        container.innerHTML += html;
    });
}

function adjustScore(teamId, amount) {
    const team = quizData.teams.find(t => t.id === teamId);
    if (team) {
        team.score += amount;
        saveState();
        renderScoreboard();
        broadcastState('SCORE_UPDATE');
    }
}

function saveState() {
    localStorage.setItem('qm_config', JSON.stringify(quizData));
}

function broadcastState(action) {
    bc.postMessage({
        action: action,
        data: quizData,
        currentRound: currentRound
    });
}

function broadcastLeaderboard() {
    broadcastState('SHOW_LEADERBOARD');
}

function resetQuiz() {
    if(confirm("Are you sure you want to end this quiz? All scores will be lost!")) {
        localStorage.removeItem('qm_config');
        window.location.href = 'index.html';
    }
}
