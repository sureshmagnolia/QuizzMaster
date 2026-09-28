const defaultColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1', '#84cc16'];

function generateTeamInputs() {
    const count = parseInt(document.getElementById('teamCount').value);
    const container = document.getElementById('teamsContainer');
    container.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const color = defaultColors[i % defaultColors.length];
        container.innerHTML += `
            <div class="team-card" style="--team-color: ${color}">
                <input type="color" id="teamColor_${i}" value="${color}" style="width: 30px; height: 30px; border: none; border-radius: 4px; cursor: pointer; padding: 0; background: none;">
                <div style="flex: 1;">
                    <input type="text" id="teamName_${i}" placeholder="Team ${i + 1} Name" value="Team ${String.fromCharCode(65 + i)}">
                </div>
            </div>
        `;
    }
}

let roundCount = 0;
function addRound() {
    roundCount++;
    const container = document.getElementById('roundsContainer');
    const roundHtml = `
        <div class="glass-panel" id="roundCard_${roundCount}" style="background: rgba(0,0,0,0.2); padding: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <input type="text" id="rName_${roundCount}" value="Round ${roundCount}" style="width: 70%; font-weight: bold;">
                <button class="btn btn-secondary" onclick="document.getElementById('roundCard_${roundCount}').remove()" style="padding: 8px; color: var(--danger); border-color: rgba(239, 68, 68, 0.3);">🗑</button>
            </div>
            <div class="form-group">
                <label>Round Type</label>
                <select id="rType_${roundCount}">
                    <option value="infinite_bounce">Infinite Bounce (Standard)</option>
                    <option value="direct_only">Direct Only (No Pass)</option>
                    <option value="buzzer">Buzzer (Fastest Finger)</option>
                </select>
            </div>
            <div style="display: flex; gap: 10px;">
                <div class="form-group" style="flex: 1;">
                    <label>Direct Points (+)</label>
                    <input type="number" id="rDirectPts_${roundCount}" value="10">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label>Pass Points (+)</label>
                    <input type="number" id="rPassPts_${roundCount}" value="5">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label>Negative Points (-)</label>
                    <input type="number" id="rNegPts_${roundCount}" value="0">
                </div>
            </div>
            <button class="btn btn-secondary" style="width: 100%; font-size: 0.85rem;" onclick="alert('Question builder coming in Phase 2!')">📝 Edit Questions for this Round</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', roundHtml);
}

function launchQuiz() {
    // 1. Gather Data
    const title = document.getElementById('quizTitle').value || 'QuizzMaster 2026';
    const teamCount = parseInt(document.getElementById('teamCount').value);
    
    let teams = [];
    for (let i = 0; i < teamCount; i++) {
        teams.push({
            id: 't' + i,
            name: document.getElementById('teamName_' + i).value || 'Team ' + (i+1),
            color: document.getElementById('teamColor_' + i).value,
            score: 0
        });
    }

    let rounds = [];
    for (let i = 1; i <= roundCount; i++) {
        const card = document.getElementById('roundCard_' + i);
        if (card) {
            rounds.push({
                id: 'r' + i,
                name: document.getElementById('rName_' + i).value,
                type: document.getElementById('rType_' + i).value,
                points_direct: parseInt(document.getElementById('rDirectPts_' + i).value) || 0,
                points_pass: parseInt(document.getElementById('rPassPts_' + i).value) || 0,
                points_negative: parseInt(document.getElementById('rNegPts_' + i).value) || 0,
                questions: [] // Will be populated by the CMS
            });
        }
    }

    const config = {
        meta: { title: title },
        teams: teams,
        rounds: rounds
    };

    // 2. Save to LocalStorage
    localStorage.setItem('qm_config', JSON.stringify(config));
    
    // 3. Redirect to QM Dashboard
    window.location.href = 'qm.html';
}

// Initialize default state
document.addEventListener('DOMContentLoaded', () => {
    generateTeamInputs();
    addRound();
});
