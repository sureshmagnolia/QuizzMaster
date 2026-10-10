/**
 * Shared Quiz State Manager
 * Real-time synchronization across Public View and QM Controller using BroadcastChannel & localStorage
 */

const STORAGE_KEY = 'SAHYADRI_WILDLIFE_QUIZ_STATE_2026';
const CHANNEL_NAME = 'sahyadri_quiz_channel';

function deduplicateRepeatedPhrases(str) {
    if (!str || typeof str !== 'string' || str.length < 50) return str;
    str = str.replace(/When a swimming micro-invertebrate touches the trigger hair, the trapdoor snaps open in less than a millisecond, creating a high-speed vacuum that sucks the prey inside[—–-]the fastest mechanical movement in the entire plant kingdom!\s*/gi, '');
    str = str.replace(/ഒരു സൂക്ഷ്മജീവി ഇതിന്റെ രോമങ്ങളിൽ സ്പർശിച്ചാൽ സെക്കൻഡിന്റെ ആയിരത്തിലൊരംശം കൊണ്ട് വാതിൽ തുറന്ന് ജീവിയെ ഉള്ളിലേക്ക് വലിച്ചെടുക്കുന്നു[—–-]സസ്യലോകത്തെ ഏറ്റവും വേഗതയേറിയ ചലനമാണിത്!\s*/gi, '');
    str = str.replace(/Coexisting with long-extinct dinosaurs over two hundred million years ago as an ancient gymnosperm living fossil, this rugged palm-like plant bears massive cones whose toxic starch-rich seeds were traditionally soaked in water for days and boiled to make celebratory flatbreads during lean monsoon months\.\s*(?:What is this indigenous cone-bearing mountain flora\?\s*)?/gi, '');
    str = str.replace(/ദിനോസറുകളുടെ കാലം മുതൽ ഭൂമിയിൽ മാറ്റമില്ലാതെ തുടരുന്ന ഒരു ജിംനോസ്പേം ജീവത്ഫോസിലായ, പനയോലകൾ പോലുള്ള ഇലകളും കൂറ്റൻ കോണുകളുമുള്ളതും, കായ്കളിലെ വിഷാംശം ദിവസങ്ങളോളം വെള്ളത്തിലിട്ട് തിളപ്പിച്ചു കളഞ്ഞ് പഞ്ഞമാസങ്ങളിൽ വിശേഷ വിഭവങ്ങളുണ്ടാക്കാൻ ആദിവാസി ജനവിഭാഗങ്ങൾ ഉപയോഗിച്ചിരുന്നതുമായ പശ്ചിമഘട്ടത്തിലെ പുരാതന കാട്ടുസസ്യമേത്\?\s*/gi, '');
    
    const sentences = str.split(/(?<=\.\s+)/);
    if (sentences.length > 1) {
        const seen = new Set();
        const unique = [];
        for (const s of sentences) {
            const trimmed = s.trim();
            if (trimmed.length > 20 && seen.has(trimmed)) {
                continue;
            }
            if (trimmed.length > 20) seen.add(trimmed);
            unique.push(s);
        }
        return unique.join('').trim();
    }
    return str;
}

function sanitizeQuizStateStrings(str) {
    if (!str || typeof str !== 'string') return str || '';
    str = deduplicateRepeatedPhrases(str);
    return str
        .replace(/\s*\[\s*(?:verified(?:\s+on\s+the\s+go)?|admin|audit|review(?:ed)?|draft|note|notes|custom|check|status|scoring|marks?|points?|english(?:\s*prompt)?|മലയാളം(?:\s*ചോദ്യം)?)[^\]]*\]/gi, '')
        .replace(/\s*\[\s*\+?\d+\s*(?:pts?|marks?|points?)\s*\]/gi, '')
        .replace(/\s*\[\s*malayalam:[^\]]*\]/gi, '')
        .replace(/^\s*(?:English\s*(?:Prompt|Question)?|Prompt|ചോദ്യം|മലയാളം(?:\s*ചോദ്യം)?)\s*:\s*/gi, '')
        .trim();
}

function sanitizeQuestionObj(q) {
    if (!q || typeof q !== 'object') return q;
    const clean = { ...q };
    const stringKeys = ['question_en', 'question_ml', 'prompt_en', 'prompt_ml', 'answer_en', 'answer_ml', 'clue_en', 'clue_ml', 'fact_en', 'fact_ml', 'media_desc'];
    stringKeys.forEach(k => {
        if (typeof clean[k] === 'string') {
            if (k === 'fact_en' || k === 'fact_ml') {
                clean[k] = clean[k].trim();
            } else {
                clean[k] = sanitizeQuizStateStrings(clean[k]);
            }
        }
    });
    if (Array.isArray(clean.clues)) {
        clean.clues = clean.clues.map(c => ({
            ...c,
            clue_en: sanitizeQuizStateStrings(c.clue_en),
            clue_ml: sanitizeQuizStateStrings(c.clue_ml)
        }));
    }
    return clean;
}

class QuizStateManager {
    constructor() {
        this.channel = null;
        this.listeners = [];
        this.timerInterval = null;
        this.worker = null;
        this.onTickCallback = null;
        this.onCompleteCallback = null;

        this.initTimerWorker();

        try {
            this.channel = new BroadcastChannel(CHANNEL_NAME);
            this.channel.onmessage = (event) => {
                if (event && event.data) {
                    this.syncFromExternalState(event.data);
                }
            };
        } catch (e) {
            console.warn('BroadcastChannel not supported, falling back to localStorage events', e);
        }

        if (typeof window !== 'undefined') {
            window.addEventListener('storage', (event) => {
                if (event.key === STORAGE_KEY && event.newValue) {
                    try {
                        const parsed = JSON.parse(event.newValue);
                        this.syncFromExternalState(parsed);
                    } catch (err) {}
                }
            });
        }

        this.state = this.getInitialState();
        this.loadFromStorage();
    }

    initTimerWorker() {
        if (typeof window !== 'undefined' && typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
            try {
                const workerScript = `
                    let intervalId = null;
                    self.onmessage = function(e) {
                        if (e.data && e.data.action === 'start') {
                            if (intervalId) clearInterval(intervalId);
                            intervalId = setInterval(function() {
                                self.postMessage({ type: 'tick' });
                            }, e.data.interval || 250);
                        } else if (e.data && e.data.action === 'stop') {
                            if (intervalId) {
                                clearInterval(intervalId);
                                intervalId = null;
                            }
                        }
                    };
                `;
                const blob = new Blob([workerScript], { type: 'application/javascript' });
                this.worker = new Worker(URL.createObjectURL(blob));
                this.worker.onmessage = (event) => {
                    if (event && event.data && event.data.type === 'tick') {
                        this.handleTimerTick();
                    }
                };
            } catch (err) {
                console.warn('[QuizState] Web Worker ticker unavailable, using setInterval fallback.', err);
                this.worker = null;
            }
        }
    }

    syncFromExternalState(incoming) {
        if (!incoming || typeof incoming !== 'object') return;

        // Check if a new quiz package was loaded
        if (incoming.packageUpdated && incoming.packageUpdated !== this._lastKnownPackageUpdate) {
            this._lastKnownPackageUpdate = incoming.packageUpdated;
            try {
                if (typeof localStorage !== 'undefined') {
                    const rawPkg = localStorage.getItem('QUIZZMASTER_ACTIVE_PACKAGE');
                    if (rawPkg && typeof window !== 'undefined') {
                        window.QUIZ_DATA = JSON.parse(rawPkg);
                    }
                }
            } catch (e) {}
        }

        this.state = incoming;
        if (this.state.customQuestions) {
            for (const qid in this.state.customQuestions) {
                this.state.customQuestions[qid] = sanitizeQuestionObj(this.state.customQuestions[qid]);
            }
        }
        // If external state indicates timer is stopped, stop local ticker
        if (!this.state.timer || !this.state.timer.isRunning) {
            this.stopTicker();
        }
        this.notifyListeners();
    }

    updateQuizPackage(newPackage) {
        if (!newPackage) return;
        if (typeof window !== 'undefined') {
            window.QUIZ_DATA = newPackage;
        }
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('QUIZZMASTER_ACTIVE_PACKAGE', JSON.stringify(newPackage));
            }
        } catch (e) {}

        const newScores = {};
        if (Array.isArray(newPackage.teams)) {
            newPackage.teams.forEach(t => {
                newScores[t.id] = (this.state.scores && this.state.scores[t.id] !== undefined) ? this.state.scores[t.id] : (t.score || 0);
            });
        }
        this.state.scores = newScores;
        this.state.activeTeamTurn = (newPackage.teams && newPackage.teams[0] && newPackage.teams[0].id) || 'team_1';
        this.state.currentRoundIndex = 0;
        this.state.currentQuestionIndex = 0;
        this.state.isRoundIntro = true;
        this.state.revealed = false;
        if (newPackage.meta && newPackage.meta.theme) {
            this.state.theme = newPackage.meta.theme;
        }
        this.state.packageUpdated = Date.now();
        this._lastKnownPackageUpdate = this.state.packageUpdated;

        this.broadcast();
    }

    sendMediaCommand(cmd) {
        this.state.mediaControl = {
            command: cmd,
            timestamp: Date.now()
        };
        this.broadcast();
    }

    getInitialState() {
        let initCustom = {};
        try {
            if (typeof localStorage !== 'undefined') {
                const rawC = localStorage.getItem('SAHYADRI_QUIZ_CUSTOM_QUESTIONS');
                if (rawC) {
                    initCustom = JSON.parse(rawC);
                    for (const qid in initCustom) {
                        initCustom[qid] = sanitizeQuestionObj(initCustom[qid]);
                    }
                }
            }
        } catch (e) {}

        const initialScores = {};
        if (typeof window !== 'undefined' && window.QUIZ_DATA && Array.isArray(window.QUIZ_DATA.teams)) {
            window.QUIZ_DATA.teams.forEach(t => {
                initialScores[t.id] = t.score || 0;
            });
        } else {
            initialScores['team_1'] = 0;
            initialScores['team_2'] = 0;
            initialScores['team_3'] = 0;
            initialScores['team_4'] = 0;
        }

        const firstTeamId = (typeof window !== 'undefined' && window.QUIZ_DATA && window.QUIZ_DATA.teams && window.QUIZ_DATA.teams[0] && window.QUIZ_DATA.teams[0].id) || 'team_1';

        return {
            viewMode: 'welcome', // 'welcome', 'prelims', 'stage', 'scores', 'winner'
            currentRoundIndex: 0,
            currentQuestionIndex: 0,
            currentQuestionId: 1,
            isRoundIntro: true,
            revealed: false,
            revealedClues: [1],
            revealedClueCount: 1,
            activeTeamTurn: firstTeamId,
            scores: initialScores,
            scoreHistory: [],
            timer: {
                duration: 30,
                remaining: 30,
                targetEndTime: null,
                isRunning: false
            },
            buzzedTeam: null,
            audioPlaying: false,
            mediaControl: {
                command: 'idle', // 'play', 'pause', 'stop', 'restart'
                timestamp: 0
            },
            prelimsMode: 'single', // 'single', 'all', 'tiebreaker'
            prelimsPhase: 'questions', // 'questions' (play questions only) or 'answers' (reveal answers 1-by-1)
            activePrelimIndex: 0,
            prelimTimerDuration: 30,
            prelimAutoAdvance: true,
            prelimsCompleted: false,
            defaultTimerDuration: 30,
            customQuestions: initCustom,
            theme: (typeof localStorage !== 'undefined' && localStorage.getItem('SAHYADRI_QUIZ_THEME')) || 'emerald',
            projectorZoom: (typeof localStorage !== 'undefined' && parseFloat(localStorage.getItem('SAHYADRI_PROJECTOR_ZOOM'))) || 1.0,
            packageUpdated: 0,
            lastUpdate: Date.now()
        };
    }

    loadFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                this.state = { ...this.state, ...parsed };
                // Ensure timer is paused on fresh reload
                if (this.state.timer) {
                    this.state.timer.isRunning = false;
                    this.state.timer.targetEndTime = null;
                }
                if (this.state.customQuestions) {
                    for (const qid in this.state.customQuestions) {
                        this.state.customQuestions[qid] = sanitizeQuestionObj(this.state.customQuestions[qid]);
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load state from localStorage', e);
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save state to localStorage', e);
        }
    }

    broadcast() {
        this.state.lastUpdate = Date.now();
        this.saveToStorage();
        if (this.channel) {
            try {
                this.channel.postMessage(this.state);
            } catch (e) {
                console.warn('Channel post error', e);
            }
        }
        this.notifyListeners();
    }

    notifyListeners() {
        this.listeners.forEach(cb => {
            try {
                cb(this.state);
            } catch (e) {
                console.error('Error in state listener', e);
            }
        });
    }

    onStateChange(callback) {
        this.listeners.push(callback);
        // Initial fire
        callback(this.state);
    }

    updateQuestion(qid, updates) {
        if (!this.state.customQuestions) {
            this.state.customQuestions = {};
        }
        this.state.customQuestions[qid] = sanitizeQuestionObj({
            ...(this.state.customQuestions[qid] || {}),
            ...updates
        });
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('SAHYADRI_QUIZ_CUSTOM_QUESTIONS', JSON.stringify(this.state.customQuestions));
            }
        } catch (e) {}
        this.broadcast();
    }

    resetQuestion(qid) {
        if (this.state.customQuestions && this.state.customQuestions[qid]) {
            delete this.state.customQuestions[qid];
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('SAHYADRI_QUIZ_CUSTOM_QUESTIONS', JSON.stringify(this.state.customQuestions));
                }
            } catch (e) {}
            this.broadcast();
        }
    }

    setTheme(themeName) {
        this.state.theme = themeName || 'emerald';
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('SAHYADRI_QUIZ_THEME', this.state.theme);
            }
        } catch (e) {}
        this.broadcast();
    }

    setProjectorZoom(zoomVal) {
        let zoom = parseFloat(zoomVal);
        if (isNaN(zoom) || zoom < 0.6) zoom = 0.6;
        if (zoom > 1.6) zoom = 1.6;
        zoom = Math.round(zoom * 100) / 100;
        this.state.projectorZoom = zoom;
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('SAHYADRI_PROJECTOR_ZOOM', String(zoom));
            }
        } catch (e) {}
        this.broadcast();
    }

    setClueStage(count) {
        const val = Math.min(3, Math.max(1, count));
        this.setState({ revealedClueCount: val });
    }

    revealNextClue() {
        const current = this.state.revealedClueCount || 1;
        if (current < 3) {
            this.setState({ revealedClueCount: current + 1 });
        }
    }

    setState(updates) {
        if (updates.currentQuestionId !== undefined && updates.currentQuestionId !== this.state.currentQuestionId && updates.revealedClueCount === undefined) {
            updates.revealedClueCount = 1;
        }
        this.state = { ...this.state, ...updates };
        this.broadcast();
    }

    // --- Scoring Methods ---
    addScore(teamId, delta, reason = '') {
        if (!this.state.scores.hasOwnProperty(teamId)) return;
        const oldScore = this.state.scores[teamId];
        const newScore = oldScore + delta;
        this.state.scores[teamId] = newScore;
        this.state.scoreHistory.push({
            id: Date.now(),
            teamId,
            delta,
            oldScore,
            newScore,
            reason,
            roundIndex: this.state.currentRoundIndex,
            questionId: this.state.currentQuestionId,
            timestamp: new Date().toLocaleTimeString()
        });
        this.broadcast();
    }

    undoLastScore() {
        if (!this.state.scoreHistory.length) return;
        const last = this.state.scoreHistory.pop();
        if (last && this.state.scores.hasOwnProperty(last.teamId)) {
            this.state.scores[last.teamId] = last.oldScore;
            this.broadcast();
        }
    }

    resetScores() {
        this.state.scores = {
            team_1: 0,
            team_2: 0,
            team_3: 0,
            team_4: 0
        };
        this.state.scoreHistory = [];
        this.broadcast();
    }

    // --- Timer Controls (Web Worker & Wall-Clock Throttling-Proof) ---
    startTicker(interval = 250) {
        if (this.worker) {
            try {
                this.worker.postMessage({ action: 'start', interval: interval });
                return;
            } catch (err) {}
        }
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => this.handleTimerTick(), interval);
    }

    stopTicker() {
        if (this.worker) {
            try {
                this.worker.postMessage({ action: 'stop' });
            } catch (err) {}
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    handleTimerTick() {
        if (!this.state.timer || !this.state.timer.isRunning) {
            this.stopTicker();
            return;
        }

        const target = this.state.timer.targetEndTime;
        if (!target) return;

        const now = Date.now();
        const diffMs = target - now;
        const remainingSec = Math.max(0, Math.ceil(diffMs / 1000));

        if (remainingSec !== this.state.timer.remaining) {
            this.state.timer.remaining = remainingSec;
            if (typeof this.onTickCallback === 'function') {
                this.onTickCallback(remainingSec);
            }
            this.broadcast();
        }

        if (diffMs <= 0 || remainingSec === 0) {
            this.stopTicker();
            if (this.state.timer) {
                this.state.timer.remaining = 0;
                this.state.timer.isRunning = false;
                this.state.timer.targetEndTime = null;
            }
            if (typeof this.onCompleteCallback === 'function') {
                this.onCompleteCallback();
            } else {
                this.broadcast();
            }
        }
    }

    setTimerDuration(seconds) {
        this.stopTicker();
        this.state.timer = {
            ...this.state.timer,
            duration: seconds,
            remaining: seconds,
            targetEndTime: null,
            isRunning: false
        };
        this.broadcast();
    }

    startTimer(onTick, onComplete) {
        if (typeof onTick === 'function') this.onTickCallback = onTick;
        if (typeof onComplete === 'function') this.onCompleteCallback = onComplete;

        const curRem = (this.state.timer && typeof this.state.timer.remaining === 'number') ? this.state.timer.remaining : 30;
        const curDur = (this.state.timer && typeof this.state.timer.duration === 'number') ? this.state.timer.duration : 30;
        const remaining = (curRem > 0) ? curRem : curDur;
        const now = Date.now();

        // If targetEndTime is already set and in the future, retain it; otherwise calculate fresh
        const targetEndTime = (this.state.timer && this.state.timer.targetEndTime && this.state.timer.targetEndTime > now)
            ? this.state.timer.targetEndTime
            : (now + (remaining * 1000));

        this.state.timer = {
            duration: curDur,
            remaining: remaining,
            targetEndTime: targetEndTime,
            isRunning: true
        };
        this.broadcast();

        this.startTicker(250);
    }

    pauseTimer() {
        this.stopTicker();
        if (this.state.timer) {
            this.state.timer.isRunning = false;
            this.state.timer.targetEndTime = null;
        }
        this.broadcast();
    }

    resetTimer() {
        this.stopTicker();
        if (this.state.timer) {
            this.state.timer.remaining = this.state.timer.duration;
            this.state.timer.isRunning = false;
            this.state.timer.targetEndTime = null;
        }
        this.broadcast();
    }

    // --- Export / Import ---
    exportState() {
        return JSON.stringify(this.state, null, 2);
    }

    importState(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            this.state = parsed;
            this.broadcast();
            return true;
        } catch (e) {
            return false;
        }
    }
}

window.QuizState = new QuizStateManager();


// Global Clue Stage Helper
if (typeof window !== 'undefined') {
    window.setClueStage = function(count) {
        if (typeof QuizState !== 'undefined') {
            QuizState.setClueStage(count);
        }
    };
    window.revealNextClue = function() {
        if (typeof QuizState !== 'undefined') {
            QuizState.revealNextClue();
        }
    };
}
