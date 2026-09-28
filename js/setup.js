const defaultColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1', '#84cc16'];
let roundsConfig = [];
let activeRoundId = null;

function generateTeamInputs() {
    const count = parseInt(document.getElementById('teamCount').value);
    const container = document.getElementById('teamsContainer');
    // Keep existing values if present
    const existing = Array.from(container.children).map((el, i) => ({
        color: document.getElementById('teamColor_' + i)?.value,
        name: document.getElementById('teamName_' + i)?.value
    }));
    
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const color = existing[i]?.color || defaultColors[i % defaultColors.length];
        const name = existing[i]?.name || `Team ${String.fromCharCode(65 + i)}`;
        container.innerHTML += `
            <div class="team-card" style="--team-color: ${color}">
                <input type="color" id="teamColor_${i}" value="${color}" style="width: 30px; height: 30px; border: none; border-radius: 4px; cursor: pointer; padding: 0; background: none;" onchange="this.parentElement.style.setProperty('--team-color', this.value)">
                <div style="flex: 1;">
                    <input type="text" id="teamName_${i}" placeholder="Team ${i + 1} Name" value="${name}">
                </div>
            </div>
        `;
    }
}

function renderRounds() {
    const container = document.getElementById('roundsContainer');
    container.innerHTML = '';
    roundsConfig.forEach(r => {
        container.innerHTML += `
            <div class="glass-panel" style="background: rgba(0,0,0,0.2); padding: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <input type="text" id="rName_${r.id}" value="${r.name}" onchange="updateRoundState('${r.id}', 'name', this.value)" style="width: 70%; font-weight: bold;">
                    <button class="btn btn-secondary" onclick="deleteRound('${r.id}')" style="padding: 8px; color: var(--danger); border-color: rgba(239, 68, 68, 0.3);">🗑</button>
                </div>
                <div class="form-group">
                    <label>Round Type</label>
                    <select id="rType_${r.id}" onchange="updateRoundState('${r.id}', 'type', this.value)">
                        <option value="infinite_bounce" ${r.type === 'infinite_bounce' ? 'selected' : ''}>Infinite Bounce</option>
                        <option value="direct_only" ${r.type === 'direct_only' ? 'selected' : ''}>Direct Only</option>
                        <option value="buzzer" ${r.type === 'buzzer' ? 'selected' : ''}>Buzzer</option>
                    </select>
                </div>
                <div style="display: flex; gap: 10px;">
                    <div class="form-group" style="flex: 1;">
                        <label>Direct (+)</label>
                        <input type="number" value="${r.points_direct}" onchange="updateRoundState('${r.id}', 'points_direct', parseInt(this.value))">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label>Pass (+)</label>
                        <input type="number" value="${r.points_pass}" onchange="updateRoundState('${r.id}', 'points_pass', parseInt(this.value))">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label>Neg (-)</label>
                        <input type="number" value="${r.points_negative}" onchange="updateRoundState('${r.id}', 'points_negative', parseInt(this.value))">
                    </div>
                </div>
                <button class="btn btn-secondary" style="width: 100%; font-size: 0.85rem;" onclick="openQuestionBuilder('${r.id}')">📝 Edit Questions (${r.questions.length})</button>
            </div>
        `;
    });
}

function updateRoundState(id, key, val) {
    const r = roundsConfig.find(x => x.id === id);
    if (r) r[key] = val;
}

function addRound() {
    roundsConfig.push({
        id: 'r' + Date.now(),
        name: `Round ${roundsConfig.length + 1}`,
        type: 'infinite_bounce',
        points_direct: 10,
        points_pass: 5,
        points_negative: 0,
        questions: []
    });
    renderRounds();
}

function deleteRound(id) {
    roundsConfig = roundsConfig.filter(r => r.id !== id);
    renderRounds();
}

// Modal Logic
function openQuestionBuilder(roundId) {
    activeRoundId = roundId;
    const r = roundsConfig.find(x => x.id === roundId);
    document.getElementById('modalRoundTitle').innerText = `Edit Questions - ${r.name}`;
    renderQuestionsList();
    document.getElementById('qModal').classList.add('active');
}

function closeModal() {
    document.getElementById('qModal').classList.remove('active');
    activeRoundId = null;
    renderRounds(); // Update the count badge
}

function renderQuestionsList() {
    const r = roundsConfig.find(x => x.id === activeRoundId);
    const list = document.getElementById('questionsList');
    list.innerHTML = '';
    
    if (r.questions.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); text-align:center;">No questions yet.</p>';
        return;
    }
    
    r.questions.forEach((q, idx) => {
        list.innerHTML += `
            <div class="question-item">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <strong>Q${idx + 1}:</strong>
                    <button class="btn btn-danger" style="padding:4px 8px; font-size:0.8rem;" onclick="deleteQuestion(${idx})">Delete</button>
                </div>
                <p style="font-size:0.9rem; color:#fff;">${q.q_text || '<em>(Media Only)</em>'}</p>
                ${q.q_media ? `<div style="font-size:0.8rem; color:var(--primary);">📺 Media: ${q.q_media}</div>` : ''}
                <div style="margin-top: 10px; border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 5px;">
                    <p style="font-size:0.9rem; color:var(--accent);">A: ${q.a_text || '<em>(Media Only)</em>'}</p>
                    ${q.a_media ? `<div style="font-size:0.8rem; color:var(--primary);">📺 Media: ${q.a_media}</div>` : ''}
                </div>
            </div>
        `;
    });
}

function saveNewQuestion() {
    const r = roundsConfig.find(x => x.id === activeRoundId);
    if (!r) return;
    
    r.questions.push({
        q_text: document.getElementById('newQText').value,
        q_media: document.getElementById('newQMedia').value,
        a_text: document.getElementById('newAText').value,
        a_media: document.getElementById('newAMedia').value
    });
    
    // Reset inputs
    document.getElementById('newQText').value = '';
    document.getElementById('newQMedia').value = '';
    document.getElementById('newAText').value = '';
    document.getElementById('newAMedia').value = '';
    
    renderQuestionsList();
}

function deleteQuestion(idx) {
    const r = roundsConfig.find(x => x.id === activeRoundId);
    r.questions.splice(idx, 1);
    renderQuestionsList();
}

// Global Actions
function getFullConfig() {
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
    return { meta: { title: title }, teams: teams, rounds: roundsConfig };
}

function launchQuiz() {
    localStorage.setItem('qm_config', JSON.stringify(getFullConfig()));
    window.location.href = 'qm.html';
}

function exportConfig() {
    const config = getFullConfig();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "quiz_config.json");
    dlAnchorElem.click();
}

document.getElementById('importFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (parsed.meta) document.getElementById('quizTitle').value = parsed.meta.title;
            if (parsed.teams) {
                document.getElementById('teamCount').value = parsed.teams.length;
                generateTeamInputs();
                parsed.teams.forEach((t, i) => {
                    if (document.getElementById('teamName_' + i)) {
                        document.getElementById('teamName_' + i).value = t.name;
                        document.getElementById('teamColor_' + i).value = t.color;
                        document.getElementById('teamColor_' + i).parentElement.style.setProperty('--team-color', t.color);
                    }
                });
            }
            if (parsed.rounds) {
                roundsConfig = parsed.rounds;
                renderRounds();
            }
            alert("Config imported successfully!");
        } catch(err) {
            alert("Invalid JSON file!");
        }
    };
    reader.readAsText(file);
});

// Init
document.addEventListener('DOMContentLoaded', () => {
    generateTeamInputs();
    addRound();
});
