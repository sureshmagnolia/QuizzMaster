let quizData = null;
let currentRound = null;
let currentQIndex = -1;
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
    if (quizData.rounds.length > 0) switchRound(quizData.rounds[0].id);
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
    
    currentQIndex = currentRound.questions && currentRound.questions.length > 0 ? 0 : -1;
    generateSmartButtons();
    renderActiveQuestion();
    broadcastState('ROUND_CHANGED');
}

function prevQuestion() {
    if (currentQIndex > 0) {
        currentQIndex--;
        renderActiveQuestion();
    }
}

function nextQuestion() {
    if (currentRound && currentRound.questions && currentQIndex < currentRound.questions.length - 1) {
        currentQIndex++;
        renderActiveQuestion();
    }
}

function renderActiveQuestion() {
    document.getElementById('aTextDisplay').style.display = 'none';
    document.getElementById('aMediaBadge').style.display = 'none';
    
    if (currentQIndex === -1) {
        document.getElementById('qProgress').innerText = "No Questions";
        document.getElementById('qTextDisplay').innerText = "(No questions in this round)";
        document.getElementById('btnShowQuestion').style.display = 'none';
        document.getElementById('btnRevealAnswer').style.display = 'none';
        document.getElementById('qMediaBadge').style.display = 'none';
        return;
    }
    
    document.getElementById('qProgress').innerText = `Question ${currentQIndex + 1}/${currentRound.questions.length}`;
    const q = currentRound.questions[currentQIndex];
    
    document.getElementById('qTextDisplay').innerText = q.q_text || '(Media Only)';
    if (q.q_media) {
        document.getElementById('qMediaBadge').style.display = 'inline-block';
        document.getElementById('qMediaBadge').innerText = "📎 Q Media Attached";
    } else {
        document.getElementById('qMediaBadge').style.display = 'none';
    }
    
    document.getElementById('btnShowQuestion').style.display = 'inline-block';
    document.getElementById('btnRevealAnswer').style.display = 'inline-block';
}

function revealAnswer() {
    if (currentQIndex === -1) return;
    const q = currentRound.questions[currentQIndex];
    document.getElementById('aTextDisplay').style.display = 'block';
    document.getElementById('aTextDisplay').innerText = "A: " + (q.a_text || '(Media Only)');
    
    if (q.a_media) {
        document.getElementById('aMediaBadge').style.display = 'inline-block';
        document.getElementById('aMediaBadge').innerText = "📎 A Media Attached";
    }
    
    bc.postMessage({
        action: 'SHOW_ANSWER',
        question: q
    });
}

function renderScoreboard() {
    const board = document.getElementById('scoreBoard');
    board.innerHTML = '';
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
        bc.postMessage({ action: 'SCORE_UPDATE', data: quizData });
    }
}

function saveState() {
    localStorage.setItem('qm_config', JSON.stringify(quizData));
}

function broadcastState(action) {
    bc.postMessage({ action: action, data: quizData, currentRound: currentRound });
}

function broadcastLeaderboard() {
    broadcastState('SHOW_LEADERBOARD');
}

function clearScreen() {
    bc.postMessage({ action: 'CLEAR_SCREEN' });
}

function broadcastQuestion() {
    if (currentQIndex === -1) return;
    const q = currentRound.questions[currentQIndex];
    bc.postMessage({
        action: 'SHOW_QUESTION',
        question: q
    });
}

function resetQuiz() {
    if(confirm("End this quiz? All scores will be lost!")) {
        localStorage.removeItem('qm_config');
        window.location.href = 'index.html';
    }
}
