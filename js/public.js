const bc = new BroadcastChannel('quizzmaster_sync');

bc.onmessage = (event) => {
    const { action, data, currentRound, question } = event.data;
    
    if (data && data.meta) document.getElementById('pubTitle').innerText = data.meta.title;
    if (currentRound) {
        document.getElementById('pubRoundName').innerText = currentRound.name;
        document.getElementById('pubRoundType').innerText = currentRound.type.replace('_', ' ').toUpperCase();
    }

    if (action === 'SCORE_UPDATE' || action === 'SHOW_LEADERBOARD' || action === 'ROUND_CHANGED') {
        renderLeaderboard(data.teams);
        switchView('lbView');
    } else if (action === 'CLEAR_SCREEN') {
        document.getElementById('lbView').classList.remove('active');
        document.getElementById('qView').classList.remove('active');
    } else if (action === 'SHOW_QUESTION') {
        renderQuestion(question);
        switchView('qView');
    } else if (action === 'SHOW_ANSWER') {
        renderAnswer(question);
    }
};

function switchView(viewId) {
    document.getElementById('lbView').classList.remove('active');
    document.getElementById('qView').classList.remove('active');
    
    const view = document.getElementById(viewId);
    view.classList.add('active');
    // Trigger reflow for animation
    void view.offsetWidth;
}

function renderLeaderboard(teams) {
    const board = document.getElementById('lbView');
    board.innerHTML = '';
    const sorted = [...teams].sort((a, b) => b.score - a.score);
    sorted.forEach((t, i) => {
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

function renderMedia(mediaStr) {
    if (!mediaStr) return '';
    // Basic check for YT id (11 chars, no spaces, no http)
    if (mediaStr.length === 11 && !mediaStr.includes('http') && !mediaStr.includes(' ')) {
        return `<iframe src="https://www.youtube.com/embed/${mediaStr}?autoplay=1&controls=0" allow="autoplay; encrypted-media"></iframe>`;
    } else if (mediaStr.startsWith('http')) {
        return `<img src="${mediaStr}" alt="Media">`;
    }
    return '';
}

function renderQuestion(q) {
    document.getElementById('qText').innerText = q.q_text || '';
    document.getElementById('aText').style.display = 'none';
    document.getElementById('mediaContainer').innerHTML = renderMedia(q.q_media);
}

function renderAnswer(q) {
    const aEl = document.getElementById('aText');
    aEl.innerText = "Answer: " + (q.a_text || '');
    aEl.style.display = 'block';
    
    // Replace media if answer has distinct media
    if (q.a_media) {
        document.getElementById('mediaContainer').innerHTML = renderMedia(q.a_media);
    }
}

// Initial load fallback
document.addEventListener('DOMContentLoaded', () => {
    const dataStr = localStorage.getItem('qm_config');
    if (dataStr) {
        const data = JSON.parse(dataStr);
        document.getElementById('pubTitle').innerText = data.meta.title;
        renderLeaderboard(data.teams);
        switchView('lbView');
    }
});
