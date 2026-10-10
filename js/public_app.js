
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

function sanitizePublicText(str) {
    if (!str || typeof str !== 'string') return str || '';
    str = deduplicateRepeatedPhrases(str);
    return str
        // Strip [Verified on the Go], [Verified], [Admin], [Audit], [Review], [Draft], [Custom], [Pending], etc.
        .replace(/\s*\[\s*(?:verified(?:\s+on\s+the\s+go)?|admin|audit|review(?:ed)?|draft|note|notes|custom|check|status|scoring|marks?|points?)[^\]]*\]/gi, '')
        // Strip bracketed point indicators like [10 pts], [+10], [1 pt], etc.
        .replace(/\s*\[\s*\+?\d+\s*(?:pts?|marks?|points?)\s*\]/gi, '')
        // Strip redundant Malayalam editorial bracket notes e.g. [Malayalam: ...]
        .replace(/\s*\[\s*malayalam:[^\]]*\]/gi, '')
        // Strip bracketed prompt/question notes e.g. [English Prompt], [മലയാളം ചോദ്യം]
        .replace(/\s*\[\s*(?:english(?:\s*prompt)?|മലയാളം(?:\s*ചോദ്യം)?)[^\]]*\]/gi, '')
        // Strip redundant inline prefixes like English Prompt:, മലയാളം ചോദ്യം:, Prompt:, ചോദ്യം:
        .replace(/^\s*(?:English\s*(?:Prompt|Question)?|Prompt|ചോദ്യം|മലയാളം(?:\s*ചോദ്യം)?)\s*:\s*/gi, '')
        .trim();
}

function safeImageSrc(src, ver) {
    if (!src || typeof src !== 'string' || !src.trim()) return '';
    const trimmed = src.trim();
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
        return trimmed;
    }
    if (trimmed.includes('?v=')) {
        return trimmed;
    }
    return ver ? `${trimmed}?v=${ver}` : trimmed;
}
window.safeImageSrc = safeImageSrc;

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
window.escapeHtml = escapeHtml;

function getResolvedQuestion(qid) {
    if (!qid && qid !== 0) return null;
    let base = (QUIZ_DATA.all_stage_questions && (QUIZ_DATA.all_stage_questions[qid] || QUIZ_DATA.all_stage_questions[String(qid)])) || null;
    if (!base && QUIZ_DATA.all_stage_questions) {
        for (const k in QUIZ_DATA.all_stage_questions) {
            const sq = QUIZ_DATA.all_stage_questions[k];
            if (sq && (sq.serial_no === qid || sq.serial === qid || sq.id === qid || String(sq.id) === String(qid))) {
                base = sq;
                break;
            }
        }
    }
    if (!base && QUIZ_DATA.prelims) {
        base = QUIZ_DATA.prelims.find(p => p.serial_no === qid || p.serial === qid || p.num === qid || p.id === qid || String(p.num) === String(qid)) || null;
    }
    if (!base) {
        base = {};
    }
    let custom = {};
    try {
        const customObj = (window.QuizState && QuizState.state && QuizState.state.customQuestions) 
            || (typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem('SAHYADRI_QUIZ_CUSTOM_QUESTIONS') || '{}')) 
            || {};
        custom = customObj[qid] 
            || (base.id !== undefined && customObj[base.id]) 
            || (base.id !== undefined && customObj[String(base.id)]) 
            || (base.serial_no && customObj[base.serial_no]) 
            || (base.serial && customObj[base.serial]) 
            || (base.num !== undefined && customObj[base.num]) 
            || {};
    } catch (e) {
        custom = {};
    }
    const cleanCustom = {};
    for (const k in custom) {
        const val = custom[k];
        if (val !== undefined && val !== null && (k === 'clue_en' || k === 'clue_ml' || k === 'fact_en' || k === 'fact_ml' || k === 'image' || String(val).trim() !== '') && String(val).trim() !== 'undefined') {
            cleanCustom[k] = val;
        }
    }
    const merged = { ...base, ...cleanCustom };
    if (custom.image !== undefined) {
        merged.image = custom.image;
        if (custom.has_visual !== undefined) {
            merged.has_visual = custom.has_visual;
        }
    }
    if (cleanCustom.question_en) {
        merged.prompt_en = cleanCustom.question_en;
    }
    if (cleanCustom.question_ml) {
        merged.prompt_ml = cleanCustom.question_ml;
    }
    // Absolute null-coalescing fallbacks
    if (!merged.question_en || merged.question_en === 'undefined') merged.question_en = base.question_en || '';
    if (!merged.question_ml || merged.question_ml === 'undefined') merged.question_ml = base.question_ml || merged.question_en || '';
    if (!merged.answer_en || merged.answer_en === 'undefined') merged.answer_en = base.answer_en || '';
    if (!merged.answer_ml || merged.answer_ml === 'undefined') merged.answer_ml = base.answer_ml || merged.answer_en || '';
    if (cleanCustom.fact_en !== undefined && String(cleanCustom.fact_en).trim() !== '') {
        merged.fact_en = String(cleanCustom.fact_en).trim();
    } else if (!merged.fact_en || merged.fact_en === 'undefined') {
        merged.fact_en = base.fact_en || 'Keystone ecological and conservation significance.';
    }
    if (cleanCustom.fact_ml !== undefined && String(cleanCustom.fact_ml).trim() !== '') {
        merged.fact_ml = String(cleanCustom.fact_ml).trim();
    } else if (!merged.fact_ml || merged.fact_ml === 'undefined') {
        merged.fact_ml = base.fact_ml || 'പാരിസ്ഥിതിക സംരക്ഷണ പ്രാധാന്യമുള്ള ജീവിവർഗ്ഗം.';
    }

    // Comprehensive Public Sanitation: Strip all admin marks, notes, verification tags
    merged.question_en = sanitizePublicText(merged.question_en);
    merged.question_ml = sanitizePublicText(merged.question_ml);
    if (merged.prompt_en) merged.prompt_en = sanitizePublicText(merged.prompt_en);
    if (merged.prompt_ml) merged.prompt_ml = sanitizePublicText(merged.prompt_ml);
    merged.answer_en = sanitizePublicText(merged.answer_en);
    merged.answer_ml = sanitizePublicText(merged.answer_ml);
    if (merged.clue_en) merged.clue_en = sanitizePublicText(merged.clue_en);
    if (merged.clue_ml) merged.clue_ml = sanitizePublicText(merged.clue_ml);
    merged.fact_en = (merged.fact_en || '').trim();
    merged.fact_ml = (merged.fact_ml || '').trim();

    if (Array.isArray(merged.clues)) {
        merged.clues = merged.clues.map(c => ({
            ...c,
            clue_en: sanitizePublicText(c.clue_en),
            clue_ml: sanitizePublicText(c.clue_ml)
        }));
    }

    return merged;
}

/**
 * Public Stage Screen Controller
 * Drives animations, timer, audio visualization, live scoreboard, and stage question display
 */

document.addEventListener('DOMContentLoaded', () => {
    // Immediate initial theme check
    const savedTheme = (typeof localStorage !== 'undefined' && localStorage.getItem('SAHYADRI_QUIZ_THEME')) || 'emerald';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
    const container = document.querySelector('.public-container');
    const stageArea = document.getElementById('stageArea');
    const teamsList = document.getElementById('teamsList');
    const roundTitleEn = document.getElementById('roundTitleEn');
    const roundTitleMl = document.getElementById('roundTitleMl');
    const timerBox = document.getElementById('timerBox');

    let prevScores = {};
    let prevStageKey = null;
    let prevScoreboardKey = null;
    let prevRemaining = null;
    let prevAudioTrigger = null;

    // Screen Wake Lock API to prevent screen dimming/sleeping when left unattended
    let activePublicWakeLock = null;
    async function requestPublicWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                activePublicWakeLock = await navigator.wakeLock.request('screen');
                activePublicWakeLock.addEventListener('release', () => {
                    activePublicWakeLock = null;
                });
            } catch (e) {}
        }
    }
    requestPublicWakeLock();
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !activePublicWakeLock) {
            requestPublicWakeLock();
        }
    });
    document.addEventListener('click', () => {
        if (!activePublicWakeLock) requestPublicWakeLock();
    });

    // Autonomous Watchdog for Unattended Prelims Display
    let isAutonomousAdvancing = false;
    function advancePrelimAutonomous() {
        if (isAutonomousAdvancing) return;
        isAutonomousAdvancing = true;
        try {
            const state = window.QuizState ? QuizState.state : null;
            if (!state || state.viewMode !== 'prelims' || (state.prelimsMode !== 'single' && state.prelimsMode !== 'tiebreaker') || state.prelimAutoAdvance === false || state.prelimsCompleted) {
                return;
            }

            const isTiebreaker = state.prelimsMode === 'tiebreaker';
            const questions = QUIZ_DATA.prelims ? QUIZ_DATA.prelims.filter(q => isTiebreaker ? q.is_tiebreaker : !q.is_tiebreaker) : [];
            const curIdx = state.activePrelimIndex || 0;

            if (curIdx < questions.length - 1) {
                const nextIdx = curIdx + 1;
                const nextQ = questions[nextIdx];
                const duration = state.prelimTimerDuration || 30;
                const now = Date.now();

                QuizState.setState({
                    activePrelimIndex: nextIdx,
                    currentQuestionId: nextQ ? (nextQ.serial_no || nextQ.num) : (nextIdx + 1),
                    revealed: false,
                    prelimsCompleted: false,
                    timer: {
                        duration: duration,
                        remaining: duration,
                        targetEndTime: now + (duration * 1000),
                        isRunning: true
                    }
                });
                if (window.SFX && typeof SFX.playTick === 'function') {
                    SFX.playTick();
                }
            } else {
                QuizState.setState({
                    prelimsCompleted: true,
                    timer: {
                        duration: state.prelimTimerDuration || 30,
                        remaining: 0,
                        targetEndTime: null,
                        isRunning: false
                    }
                });
                if (window.SFX && typeof SFX.playFanfare === 'function') {
                    SFX.playFanfare();
                }
            }
        } finally {
            setTimeout(() => {
                isAutonomousAdvancing = false;
            }, 800);
        }
    }

    // High-precision HUD clock & autonomous watchdog loop (runs in active foreground tab)
    let prevClockRemaining = null;
    setInterval(() => {
        const state = window.QuizState ? QuizState.state : null;
        if (!state || !state.timer) return;

        // 1. Smooth real-time clock update on active screen
        if (state.timer.isRunning && state.timer.targetEndTime) {
            const now = Date.now();
            const trueRemaining = Math.max(0, Math.ceil((state.timer.targetEndTime - now) / 1000));
            if (trueRemaining !== prevClockRemaining) {
                prevClockRemaining = trueRemaining;
                renderHeaderAndTimer({
                    ...state,
                    timer: {
                        ...state.timer,
                        remaining: trueRemaining
                    }
                });
                const prelimTimerBadge = document.getElementById('prelimSingleTimerText');
                if (prelimTimerBadge) {
                    prelimTimerBadge.textContent = `⏱️ Question Timer: ${trueRemaining}s`;
                }
            }

            // 2. Autonomous Watchdog: if controller is throttled/asleep in background tab, auto-advance after 600ms grace period
            if (state.viewMode === 'prelims' && (state.prelimsMode === 'single' || state.prelimsMode === 'tiebreaker') && !state.prelimsCompleted && state.prelimAutoAdvance !== false) {
                if (now >= state.timer.targetEndTime + 600) {
                    console.log('[Autonomous Watchdog] Controller sleeping in background. Auto-advancing prelim question from active display.');
                    advancePrelimAutonomous();
                }
            }
        }
    }, 100);

    function getPublicBrandingMeta() {
        const meta = (window.QUIZ_DATA && QUIZ_DATA.meta) || {};
        return {
            title: meta.title || "The Sahyadri Wildlife Quiz",
            title_ml: meta.title_ml || "",
            subtitle: meta.subtitle || "",
            subtitle_ml: meta.subtitle_ml || "",
            institution: meta.institution || meta.curator || "Govt. Victoria College, Palakkad",
            department: meta.department || "Department of Botany",
            logo_primary: meta.logo_primary || "",
            logo_secondary: meta.logo_secondary || "",
            show_logos: meta.show_logos !== false
        };
    }

    function renderPublicHeaderBranding() {
        const bm = getPublicBrandingMeta();

        // 1. Stage Quiz Title
        const titleEl = document.getElementById('publicQuizTitle') || document.querySelector('.brand-title h1');
        if (titleEl && bm.title) {
            titleEl.textContent = bm.title.toUpperCase();
        }

        // 2. Department & Institution Subtitle in Header
        const deptInstEl = document.getElementById('publicBrandConductedBy') || document.querySelector('.brand-conducted-by');
        if (deptInstEl) {
            if (bm.department && bm.institution) {
                deptInstEl.innerHTML = `<span class="inst-dept">${escapeHtml(bm.department)}</span> • <span class="inst-college">${escapeHtml(bm.institution)}</span>`;
                deptInstEl.style.display = '';
            } else if (bm.department || bm.institution) {
                deptInstEl.innerHTML = `<span class="inst-college">${escapeHtml(bm.department || bm.institution)}</span>`;
                deptInstEl.style.display = '';
            } else {
                deptInstEl.style.display = 'none';
            }
        }

        // 3. Institution & Department Logos in Header
        const logosBox = document.getElementById('publicBrandLogos') || document.querySelector('.brand-institution-logos');
        if (logosBox) {
            const hasLogos = bm.show_logos && (bm.logo_primary || bm.logo_secondary);
            if (hasLogos) {
                logosBox.style.display = 'flex';
                let logosHtml = '';
                if (bm.logo_primary) {
                    logosHtml += `<img src="${safeImageSrc(bm.logo_primary)}" alt="Primary Logo" class="brand-logo-img emblem-college" id="publicLogoPrimary" title="${escapeHtml(bm.institution)}" />`;
                }
                if (bm.logo_secondary) {
                    logosHtml += `<img src="${safeImageSrc(bm.logo_secondary)}" alt="Secondary Logo" class="brand-logo-img emblem-botany" id="publicLogoSecondary" title="${escapeHtml(bm.department)}" />`;
                }
                logosBox.innerHTML = logosHtml;
            } else {
                logosBox.style.display = 'none';
                logosBox.innerHTML = '';
            }
        }
    }

    // Listen to synchronized state updates
    QuizState.onStateChange(state => {
        // Synchronize UI Color Theme selected by Quizmaster or Studio
        const activeTheme = state.theme || (window.QUIZ_DATA && QUIZ_DATA.meta && QUIZ_DATA.meta.theme) || 'emerald';
        document.documentElement.setAttribute('data-theme', activeTheme);
        document.body.setAttribute('data-theme', activeTheme);
        if (state.projectorZoom !== undefined) {
            applyProjectorZoom(state.projectorZoom);
        }
        renderPublicHeaderBranding();
        renderHeaderAndTimer(state);
        renderScoreboard(state);
        renderStageContent(state);

        // Synchronize stage audio playback when QM triggers it
        if (state.audioTriggerTimestamp && state.audioTriggerTimestamp !== prevAudioTrigger) {
            prevAudioTrigger = state.audioTriggerTimestamp;
            setTimeout(() => {
                const publicAudio = document.getElementById('publicAudio');
                if (publicAudio) {
                    publicAudio.currentTime = 0;
                    publicAudio.play().catch(e => console.log('Stage audio trigger note:', e));
                }
            }, 50);
        } else if (state.audioTriggerTimestamp === 0) {
            const publicAudio = document.getElementById('publicAudio');
            if (publicAudio) {
                publicAudio.pause();
                publicAudio.currentTime = 0;
            }
        }
    });

    function renderHeaderAndTimer(state) {
        // Toggle Prelims fullscreen class
        if (state.viewMode === 'prelims') {
            container.classList.add('mode-prelims');
        } else {
            container.classList.remove('mode-prelims');
        }

        // Update Round Title HUD
        if (state.viewMode === 'welcome') {
            roundTitleEn.textContent = "Welcome & Teams Intro";
            roundTitleMl.textContent = "സ്വാഗതം & ടീമുകൾ";
        } else if (state.viewMode === 'prelims') {
            const isTiebreaker = state.prelimsMode === 'tiebreaker';
            const isSingle = state.prelimsMode === 'single';
            const isAnswers = state.prelimsPhase === 'answers';
            if (isTiebreaker) {
                if (isSingle) {
                    const idx = (state.activePrelimIndex || 0) + 1;
                    roundTitleEn.textContent = isAnswers 
                        ? `💡 Prelims TB Answers (Q${idx} of 5)` 
                        : `🚨 Prelims Tie-Breaker (Q${idx} of 5)`;
                    roundTitleMl.textContent = isAnswers 
                        ? `പ്രാഥമിക ടൈ-ബ്രേക്കർ ശരിയുത്തരം (${idx}/5)` 
                        : `പ്രാഥമിക ടൈ-ബ്രേക്കർ (${idx}/5)`;
                } else {
                    roundTitleEn.textContent = "🚨 Prelims Sudden-Death Tie-Breakers (5 Questions)";
                    roundTitleMl.textContent = "പ്രാഥമിക ടൈ-ബ്രേക്കർ ചോദ്യങ്ങൾ";
                }
            } else if (isSingle) {
                const idx = (state.activePrelimIndex || 0) + 1;
                roundTitleEn.textContent = isAnswers
                    ? `💡 Prelims Official Answers (Q${idx} of 20)`
                    : `📝 Prelims Screening (Question ${idx} of 20)`;
                roundTitleMl.textContent = isAnswers
                    ? `പ്രാഥമിക ശരിയുത്തരങ്ങൾ • ചോദ്യം ${idx} / 20`
                    : `പ്രാഥമിക ലിഖിത പരീക്ഷ • ചോദ്യം ${idx} / 20`;
            } else {
                roundTitleEn.textContent = "📝 Preliminary Screening Written Test (All 20 Questions)";
                roundTitleMl.textContent = "പ്രാഥമിക ലിഖിത പരീക്ഷ (20 ചോദ്യങ്ങൾ ഒന്നിച്ച്)";
            }
        } else if (state.viewMode === 'winner') {
            roundTitleEn.textContent = "Championship Podium";
            roundTitleMl.textContent = "വിജയികൾ";
        } else if (state.currentRoundIndex === -1) {
            if (state.isRoundIntro) {
                roundTitleEn.textContent = "🚨 Stage Tie-Breaker (Sudden-Death Knockout)";
                roundTitleMl.textContent = "സഡൻ ഡെത്ത് ടൈ-ബ്രേക്കർ • ആദ്യം പറയുന്നവർ മുന്നിൽ";
            } else {
                const qNum = state.currentQuestionIndex + 1;
                const totalQ = QUIZ_DATA.stage_tie_breakers.length;
                roundTitleEn.textContent = `🚨 Stage Tie-Breaker (Q${qNum}/${totalQ})`;
                roundTitleMl.textContent = "ടൈ-ബ്രേക്കർ മത്സരം (സഡൻ ഡെത്ത്)";
            }
        } else if (state.currentRoundIndex === -2) {
            const resRound = QUIZ_DATA.reserve_round || { title: "Reserve & Pool Questions", title_ml: "റിസർവ്വ് ചോദ്യങ്ങൾ", question_ids: [] };
            if (state.isRoundIntro) {
                roundTitleEn.textContent = "📦 Reserve Question Bank (Overview)";
                roundTitleMl.textContent = "റിസർവ്വ് ചോദ്യശേഖരം (24 ചോദ്യങ്ങൾ)";
            } else {
                const qNum = state.currentQuestionIndex + 1;
                const totalQ = resRound.question_ids ? resRound.question_ids.length : 24;
                roundTitleEn.textContent = `📦 Reserve Pool (Q${qNum}/${totalQ})`;
                roundTitleMl.textContent = resRound.title_ml || "റിസർവ്വ് ചോദ്യങ്ങൾ";
            }
        } else {
            const round = QUIZ_DATA.rounds[state.currentRoundIndex] || QUIZ_DATA.rounds[0];
            if (state.isRoundIntro) {
                roundTitleEn.textContent = `Round ${round.round_num}: ${round.title} (Rules & Format)`;
                roundTitleMl.textContent = `${round.title_ml} (റൗണ്ട് വിവരണം)`;
            } else {
                const qNum = state.currentQuestionIndex + 1;
                const totalQ = round.question_ids ? round.question_ids.length : 8;
                roundTitleEn.textContent = `R${round.round_num}: ${round.title} (Q${qNum}/${totalQ})`;
                roundTitleMl.textContent = round.title_ml;
            }
        }

        // Update Timer with wall-clock accuracy
        let remaining = state.timer ? state.timer.remaining : 30;
        if (state.timer && state.timer.isRunning && state.timer.targetEndTime) {
            remaining = Math.max(0, Math.ceil((state.timer.targetEndTime - Date.now()) / 1000));
        }
        const displayTime = remaining >= 60 
            ? `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`
            : remaining;
        timerBox.innerHTML = `<span style="font-size: 1.05rem; opacity: 0.9;">⏱️</span> <span>${displayTime}</span>`;

        if (remaining <= 5 && remaining > 0 && state.timer && state.timer.isRunning) {
            timerBox.classList.add('timer-warning');
            if (prevRemaining !== remaining) {
                SFX.playTick();
            }
        } else if (remaining === 0 && prevRemaining === 1) {
            timerBox.classList.add('timer-warning');
            SFX.playTimeUp();
        } else {
            timerBox.classList.remove('timer-warning');
        }
        prevRemaining = remaining;
    }

    function renderScoreboard(state) {
        const sidebarFooter = document.getElementById('sidebarFooter');

        if (state.viewMode === 'prelims') {
            prevScoreboardKey = null;
            if (sidebarFooter) sidebarFooter.style.display = 'none';
            return;
        }

        const currentScoreboardKey = [
            state.viewMode,
            state.isRoundIntro,
            state.currentRoundIndex,
            state.activeTeamTurn,
            JSON.stringify(state.scores || {})
        ].join('::');

        // Avoid re-rendering scoreboard if scores and active team have not changed
        if (currentScoreboardKey === prevScoreboardKey) {
            return;
        }
        prevScoreboardKey = currentScoreboardKey;

        if (state.viewMode === 'welcome') {
            if (sidebarFooter) sidebarFooter.style.display = 'none';
            teamsList.innerHTML = `
                <div class="prelim-sidebar-content">
                    <div class="prelim-rules-box">
                        <div class="prelim-rules-title">
                            <span>📝 Prelims Format</span>
                        </div>
                        <ul class="prelim-rules-list">
                            <li><span>✅</span> <strong>20 Written Questions</strong></li>
                            <li><span>⏱️</span> <strong>15–20 Mins Total Duration</strong></li>
                            <li><span>🎯</span> <strong>1 Mark Each (No Negatives)</strong></li>
                            <li><span>🏆</span> <strong>Top 4 Teams Reach Stage</strong></li>
                        </ul>
                    </div>

                    <div class="prelim-podiums-title">
                        <span>Stage Finalist Podiums</span>
                    </div>

                    ${QUIZ_DATA.teams.map((t, idx) => `
                        <div class="prelim-team-slot" style="border-left: 4px solid ${t.color};">
                            <span class="slot-icon">${t.icon}</span>
                            <div class="slot-info">
                                <span class="slot-name" style="color: ${t.color};">${t.name.split('/')[0]}</span>
                                <span class="slot-status">Podium ${String.fromCharCode(65 + idx)} • Awaiting Finalist</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            return;
        }

        // Stage Finals / Leaderboard
        const sortedTeams = [...QUIZ_DATA.teams].sort((a, b) => {
            const scoreA = state.scores[a.id] || 0;
            const scoreB = state.scores[b.id] || 0;
            return scoreB - scoreA;
        });

        const currentRound = QUIZ_DATA.rounds[state.currentRoundIndex];
        const isBuzzer = currentRound && currentRound.type === "Buzzer Round";
        const maxScore = Math.max(1, ...sortedTeams.map(t => state.scores[t.id] || 0));

        teamsList.innerHTML = '';
        sortedTeams.forEach((team, index) => {
            const score = state.scores[team.id] || 0;
            const isActiveTurn = state.activeTeamTurn === team.id && state.viewMode === 'stage' && !state.isRoundIntro && !isBuzzer;
            const rankClass = index === 0 ? 'rank-1' : (index === 1 ? 'rank-2' : (index === 2 ? 'rank-3' : 'rank-4'));

            const hadChange = prevScores[team.id] !== undefined && prevScores[team.id] !== score;
            prevScores[team.id] = score;

            const scorePercent = score > 0 ? Math.max(6, Math.min(100, Math.round((score / maxScore) * 100))) : 0;

            const card = document.createElement('div');
            card.className = `team-score-card glass-panel ${isActiveTurn ? 'team-active-turn' : ''} ${hadChange ? 'score-pulse' : ''}`;
            card.style.borderLeft = `5px solid ${team.color}`;

            card.innerHTML = `
                <div class="team-card-inner">
                    <div class="team-rank-badge ${rankClass}">#${index + 1}</div>
                    <div class="team-icon-pill">${team.icon}</div>
                    <div class="team-info">
                        <div class="team-name-row">
                            <span class="team-name-en" title="${team.name.split('/')[0]}">${team.name.split('/')[0]}</span>
                            ${isActiveTurn ? '<span class="direct-turn-pill"><span class="direct-turn-dot"></span> DIRECT</span>' : ''}
                        </div>
                        <span class="team-name-ml">${team.name_ml}</span>
                    </div>
                    <div class="team-score-pod">
                        <span class="team-score-num" style="color: ${score < 0 ? '#EF4444' : team.color};">${score}</span>
                        <span class="team-score-pts">PTS</span>
                    </div>
                </div>
                <div class="team-score-track">
                    <div class="team-score-bar" style="width: ${scorePercent}%; background: ${team.color};"></div>
                </div>
            `;
            teamsList.appendChild(card);
        });

        // Render Stage Match Matrix Footer
        if (sidebarFooter) {
            sidebarFooter.style.display = 'flex';
            const activeTeam = QUIZ_DATA.teams.find(t => t.id === state.activeTeamTurn);
            const roundTypeName = isBuzzer ? 'Buzzer Round' : (currentRound ? (currentRound.type || 'Direct & Pass') : 'Standard');
            const isClueRound = currentRound && currentRound.type === "Clue Round";
            const currentClueTier = state.revealedClueCount || 1;
            const currentCluePts = currentClueTier === 1 ? 15 : (currentClueTier === 2 ? 10 : 5);

            const bm = getPublicBrandingMeta();
            const stampText = [bm.department, bm.institution].filter(Boolean).join(' • ');
            const stampHtml = `
                <div class="sidebar-tournament-stamp">
                    ${bm.show_logos && bm.logo_primary ? `<img src="${safeImageSrc(bm.logo_primary)}" style="height: 14px; width: 14px; object-fit: contain; border-radius: 50%;" alt="Logo" />` : ''}
                    <span>${escapeHtml(stampText || 'QuizzMaster Pro')}</span>
                    ${bm.show_logos && bm.logo_secondary ? `<img src="${safeImageSrc(bm.logo_secondary)}" style="height: 14px; width: 14px; object-fit: contain; border-radius: 50%;" alt="Logo" />` : ''}
                </div>
            `;

            sidebarFooter.innerHTML = isClueRound ? `
                <div class="rules-card-header">
                    <div class="rules-header-title-box">
                        <span class="rules-header-icon">🕵️‍♂️</span>
                        <span class="rules-header-title">ORGANISM IDENTIFIER</span>
                    </div>
                    <span class="badge badge-gold" style="font-size: 0.62rem; padding: 2px 7px;">Living Organisms</span>
                </div>

                <div class="rules-pills-row">
                    <div class="rules-mini-pill ${currentClueTier === 1 ? 'pill-direct' : ''}" style="${currentClueTier === 1 ? 'box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); border-width: 2px;' : 'opacity: 0.6;'}">
                        <span class="pill-lbl">CLUE 1</span>
                        <span class="pill-val">+15</span>
                    </div>
                    <div class="rules-mini-pill ${currentClueTier === 2 ? 'pill-pass' : ''}" style="${currentClueTier === 2 ? 'box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); border-width: 2px;' : 'opacity: 0.6;'}">
                        <span class="pill-lbl">CLUE 2</span>
                        <span class="pill-val">+10</span>
                    </div>
                    <div class="rules-mini-pill ${currentClueTier === 3 ? 'pill-pounce' : ''}" style="${currentClueTier === 3 ? 'box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); border-width: 2px;' : 'opacity: 0.6;'}">
                        <span class="pill-lbl">CLUE 3</span>
                        <span class="pill-val">+5</span>
                    </div>
                </div>

                <div class="turn-status-banner status-active-turn">
                    <span class="status-icon">${activeTeam ? activeTeam.icon : '🎯'}</span>
                    <div class="status-texts">
                        <span class="status-lead">${activeTeam ? activeTeam.name.split('/')[0] : 'ALL TEAMS'} • CLUE ${currentClueTier}</span>
                        <span class="status-desc">Worth +${currentCluePts} pts on direct answer</span>
                    </div>
                </div>

                ${stampHtml}
            ` : `
                <div class="rules-card-header">
                    <div class="rules-header-title-box">
                        <span class="rules-header-icon">⚖️</span>
                        <span class="rules-header-title">SCORING RULES</span>
                    </div>
                    <span class="badge ${isBuzzer ? 'badge-ruby' : 'badge-gold'}" style="font-size: 0.62rem; padding: 2px 7px;">${roundTypeName}</span>
                </div>

                <div class="rules-pills-row">
                    <div class="rules-mini-pill pill-direct">
                        <span class="pill-lbl">DIRECT</span>
                        <span class="pill-val">+10</span>
                    </div>
                    <div class="rules-mini-pill pill-pass">
                        <span class="pill-lbl">PASS</span>
                        <span class="pill-val">+5</span>
                    </div>
                    <div class="rules-mini-pill pill-pounce">
                        <span class="pill-lbl">POUNCE</span>
                        <span class="pill-val">+10 / -5</span>
                    </div>
                </div>

                <div class="turn-status-banner ${isBuzzer ? 'status-buzzer' : (state.activeTeamTurn ? 'status-active-turn' : 'status-standby')}">
                    <span class="status-icon">${isBuzzer ? '⚡' : (activeTeam ? activeTeam.icon : '🎯')}</span>
                    <div class="status-texts">
                        <span class="status-lead">${isBuzzer ? 'BUZZER ROUND ACTIVE' : (activeTeam ? activeTeam.name.split('/')[0] : 'ALL TEAMS STANDBY')}</span>
                        <span class="status-desc">${isBuzzer ? 'Any team may buzz on QM signal' : (activeTeam ? 'Direct question on clock' : 'Awaiting question')}</span>
                    </div>
                </div>

                ${stampHtml}
            `;
        }
    }

    function renderStageContent(state) {
        const currentStageKey = [
            state.viewMode,
            state.prelimsMode,
            state.activePrelimIndex,
            state.currentQuestionId,
            state.revealed,
            state.revealedClueCount,
            state.isRoundIntro,
            state.prelimsCompleted,
            state.timer ? state.timer.isRunning : false
        ].join('::');

        if (currentStageKey === prevStageKey) {
            // Only update inline stage timer text without re-rendering entire DOM
            const prelimTimerBadge = document.getElementById('prelimSingleTimerText');
            if (prelimTimerBadge && state.timer) {
                const rem = (state.timer.targetEndTime && state.timer.isRunning)
                    ? Math.max(0, Math.ceil((state.timer.targetEndTime - Date.now()) / 1000))
                    : state.timer.remaining;
                prelimTimerBadge.textContent = state.timer.isRunning ? `⏱️ Question Timer: ${rem}s` : '⏳ Awaiting Start';
            }
            return;
        }
        prevStageKey = currentStageKey;

        if (state.viewMode === 'welcome') {
            renderWelcomeStage();
        } else if (state.viewMode === 'prelims') {
            if (state.prelimsCompleted) {
                renderPrelimsCompletionScreen(state);
            } else if (state.prelimsMode === 'single' || state.prelimsMode === 'tiebreaker') {
                renderPrelimsSingleQuestion(state);
            } else {
                renderPrelimsAll20Questions(state);
            }
        } else if (state.viewMode === 'winner') {
            renderWinnerStage(state);
        } else if (state.isRoundIntro) {
            renderRoundIntroStage(state);
        } else {
            renderQuestionStage(state);
        }
    }

    function renderWelcomeStage() {
        const bm = getPublicBrandingMeta();
        const hasLeftLogo = bm.show_logos && bm.logo_primary;
        const hasRightLogo = bm.show_logos && bm.logo_secondary;

        stageArea.innerHTML = `
            <div class="welcome-stage-container glass-panel">
                <div class="welcome-host-banner">
                    ${hasLeftLogo ? `
                        <div class="welcome-host-logo-box">
                            <img src="${safeImageSrc(bm.logo_primary)}" alt="Host Emblem" class="welcome-host-logo emblem-college" title="${escapeHtml(bm.institution)}" />
                        </div>
                    ` : ''}
                    <div class="welcome-host-details">
                        <div class="welcome-host-inst-name">${escapeHtml(bm.institution.toUpperCase())}</div>
                        ${bm.department ? `
                            <div class="welcome-host-dept-row">
                                <span class="welcome-dept-lead">Conducted by</span>
                                <span class="welcome-dept-name">${escapeHtml(bm.department.toUpperCase())}</span>
                            </div>
                        ` : ''}
                    </div>
                    ${hasRightLogo ? `
                        <div class="welcome-host-logo-box">
                            <img src="${safeImageSrc(bm.logo_secondary)}" alt="Department Logo" class="welcome-host-logo emblem-botany" title="${escapeHtml(bm.department)}" />
                        </div>
                    ` : ''}
                </div>

                ${bm.subtitle ? `
                    <div style="display: inline-block; margin: 0 auto;">
                        <span class="badge badge-gold welcome-badge">
                            ✨ ${escapeHtml(bm.subtitle)}
                        </span>
                    </div>
                ` : ''}
                <div class="welcome-header-area">
                    <h2 class="welcome-title-en">
                        ${escapeHtml(bm.title.toUpperCase())}
                    </h2>
                    ${bm.title_ml ? `
                        <h3 class="welcome-title-ml ml-text">
                            ${escapeHtml(bm.title_ml)}
                        </h3>
                    ` : ''}
                </div>

                <div class="welcome-banner">
                    <span style="font-size: 1.35rem;">📝</span>
                    <div style="text-align: left; min-width: 0;">
                        <strong style="color: var(--text-gold); font-size: 0.92rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            Preliminary Screening Written Test (All 20 Questions Displayed at Once)
                        </strong>
                        <span class="ml-text" style="color: #CBD5E1; font-size: 0.80rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ആദ്യം 20 ചോദ്യങ്ങളടങ്ങിയ പ്രാഥമിക ലിഖിത പരീക്ഷ • 4 ടീമുകൾ സ്റ്റേജിലേക്ക് യോഗ്യത നേടും
                        </span>
                    </div>
                </div>

                <div class="welcome-teams-grid">
                    ${QUIZ_DATA.teams.map(t => `
                        <div class="welcome-team-card" style="border-left: 4px solid ${t.color};">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.35rem;">${t.icon}</span>
                                <div style="min-width: 0;">
                                    <h4 style="color: ${t.color}; font-size: 0.86rem; font-weight: 800; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.name}</h4>
                                    <span class="ml-text" style="color: #CBD5E1; font-size: 0.74rem;">${t.name_ml}</span>
                                </div>
                            </div>
                            <p style="font-size: 0.68rem; color: #94A3B8; margin: 2px 0 0 0; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;"><em>${t.species}</em> — ${t.lore}</p>
                        </div>
                    `).join('')}
                </div>

                <div class="welcome-stats-row">
                    <div style="text-align: center;">
                        <span style="font-size: 1.05rem; font-weight: 900; color: var(--text-gold);">20 Qs</span>
                        <p style="font-size: 0.64rem; color: #94A3B8; margin: 0;">Screening Prelims</p>
                    </div>
                    <div style="text-align: center;">
                        <span style="font-size: 1.05rem; font-weight: 900; color: var(--emerald-primary);">4 Teams</span>
                        <p style="font-size: 0.64rem; color: #94A3B8; margin: 0;">Stage Finalists</p>
                    </div>
                    <div style="text-align: center;">
                        <span style="font-size: 1.05rem; font-weight: 900; color: var(--sapphire-primary);">5 Rounds</span>
                        <p style="font-size: 0.64rem; color: #94A3B8; margin: 0;">General, Visual, Audio, Clue, Buzzer</p>
                    </div>
                    <div style="text-align: center;">
                        <span style="font-size: 1.05rem; font-weight: 900; color: #F43F5E;">90 Mins</span>
                        <p style="font-size: 0.64rem; color: #94A3B8; margin: 0;">Total Duration</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Dedicated Round Intro & Rules Slide
     * Displayed before each round starts
     */
    function renderRoundIntroStage(state) {
        const isTieBreaker = state.currentRoundIndex === -1;
        const isReserve = state.currentRoundIndex === -2;
        const round = isTieBreaker 
            ? {
                round_num: "TB",
                title: "Stage Sudden-Death Tie-Breakers",
                title_ml: "സ്റ്റേജ് ടൈ-ബ്രേക്കർ (സഡൻ ഡെത്ത്)",
                type: "Tie-Breaker Decider",
                format: "Sudden-Death Knockout • Whoever answers goes to the front",
                timing_sec: 30,
                pass_timing_sec: 0,
                scoring: { direct: 0, pass: 0, penalty: 0 },
                description: "Whoever answers correctly goes straight to the front (podium spot)! Standard scoring rules do not apply.",
                description_ml: "ആദ്യം ശരിയുത്തരം പറയുന്ന ടീം മുന്നിലെത്തുന്നു / വിജയിക്കുന്നു."
            }
            : isReserve
            ? (QUIZ_DATA.reserve_round || {
                round_num: "RES",
                title: "Reserve & Pool Questions",
                title_ml: "റിസർവ്വ് ചോദ്യങ്ങൾ (പൂൾ)",
                type: "Reserve Pool",
                format: "Backup & Pool (24 Questions)",
                timing_sec: 30,
                pass_timing_sec: 0,
                scoring: { direct: 10, pass: 0, penalty: 0 },
                description: "Comprehensive backup question bank reserved for additional tie-breakers, substitutions, or reserve rounds.",
                description_ml: "ആവശ്യാനുസരണം ഉപയോഗിക്കാവുന്ന റിസർവ്വ് ചോദ്യശേഖരം."
            })
            : (QUIZ_DATA.rounds[state.currentRoundIndex] || QUIZ_DATA.rounds[0]);

        const directPts = round.scoring.direct || (round.scoring.correct || (round.scoring.clue_1 || 10));
        const passPts = round.scoring.pass !== undefined ? round.scoring.pass : 5;
        const penaltyPts = round.scoring.penalty ? `${round.scoring.penalty} pts` : "0 (No Negative)";

        stageArea.innerHTML = `
            <div class="round-intro-container">
                <div class="round-intro-top-badge">
                    <span>${isTieBreaker ? '🚨 STAGE TIE-BREAKER KNOCKOUT' : (isReserve ? '📦 RESERVE QUESTIONS POOL' : '🌿 STAGE FINALS • റൗണ്ട് വിവരണം')}</span>
                </div>

                <div class="round-intro-title-area">
                    <h1 class="round-intro-title">${round.round_num && round.round_num !== 'TB' && round.round_num !== 'RES' ? `Round ${round.round_num}: ` : ''}${round.title}</h1>
                    <h2 class="round-intro-title-ml ml-text">${round.title_ml}</h2>
                    <span class="round-intro-type-tag">${round.type} • ${round.format}</span>
                </div>

                ${isTieBreaker ? `
                    <!-- TB2 Sudden-Death: No Regular Scoring Rules, First to Answer Advances -->
                    <div class="round-rules-grid" style="grid-template-columns: 1fr;">
                        <div class="rule-card" style="padding: 26px 20px; border: 2.5px solid var(--border-gold); background: linear-gradient(135deg, rgba(239, 68, 68, 0.28), rgba(245, 158, 11, 0.22)); text-align: center;">
                            <span class="rule-card-icon" style="font-size: 2.6rem;">🚨 ⚡ 🏆</span>
                            <h3 style="font-size: 1.8rem; color: #FFF; margin: 10px 0 6px 0; font-weight: 800; letter-spacing: 0.5px;">SUDDEN-DEATH KNOCKOUT</h3>
                            <div class="rule-card-val" style="color: var(--text-gold); font-size: 1.5rem; margin-bottom: 8px; font-weight: 800;">
                                Whoever answers correctly goes straight to the front!
                            </div>
                            <p class="ml-text" style="font-size: 1.25rem; color: var(--text-mint); font-weight: 600; margin: 6px 0 12px 0;">
                                ആദ്യം ശരിയുത്തരം പറയുന്ന ടീം മുന്നിലെത്തുന്നു / വിജയിക്കുന്നു
                            </p>
                            <p style="font-size: 0.95rem; color: #CBD5E1; margin: 0; line-height: 1.4;">
                                Standard round scoring rules do not apply • No pounce • Direct sudden-death decider between tied teams
                            </p>
                        </div>
                    </div>
                ` : isReserve ? `
                    <!-- Reserve Pool: 24 Backup Questions Overview -->
                    <div class="round-rules-grid" style="grid-template-columns: 1fr;">
                        <div class="rule-card" style="padding: 24px 20px; border: 2px solid #3B82F6; background: linear-gradient(135deg, rgba(59, 130, 246, 0.22), rgba(16, 185, 129, 0.2)); text-align: center;">
                            <span class="rule-card-icon" style="font-size: 2.4rem;">📦 🌿</span>
                            <h3 style="font-size: 1.6rem; color: #FFF; margin: 8px 0 6px 0; font-weight: 800;">RESERVE QUESTION POOL</h3>
                            <div class="rule-card-val" style="color: #93C5FD; font-size: 1.35rem; margin-bottom: 6px; font-weight: 700;">
                                24 Preserved Backup Questions
                            </div>
                            <p class="ml-text" style="font-size: 1.15rem; color: var(--text-mint); font-weight: 600; margin: 4px 0 10px 0;">
                                റിസർവ്വ് ചോദ്യശേഖരം (24 ചോദ്യങ്ങൾ) • ആവശ്യാനുസരണം ഉപയോഗിക്കാവുന്ന ബാക്കപ്പ് ചോദ്യങ്ങൾ
                            </p>
                            <p style="font-size: 0.92rem; color: #CBD5E1; margin: 0;">
                                Preserved from Endemics, Sanctuaries & Living Fossils • Ready for substitutions or extra rounds
                            </p>
                        </div>
                    </div>
                ` : `
                    <div class="round-rules-grid">
                        <div class="rule-card">
                            <span class="rule-card-icon">🎯</span>
                            <h4>Direct Oral Turn</h4>
                            <div class="rule-card-val" style="color: var(--text-gold);">+10 pts</div>
                            <p>${round.timing_sec || 30}s oral answer • 0 if pass/wrong (No negative)</p>
                        </div>

                        <div class="rule-card">
                            <span class="rule-card-icon">🐾</span>
                            <h4>Pounce (Written Slips)</h4>
                            <div class="rule-card-val" style="color: #34D399;">+10 pts</div>
                            <p>Other teams write answer slip before timer ends</p>
                        </div>

                        <div class="rule-card">
                            <span class="rule-card-icon">⚠️</span>
                            <h4>Pounce Risk</h4>
                            <div class="rule-card-val" style="color: #F87171;">-5 pts</div>
                            <p>Wrong written pounce slip incurs -5 pt penalty</p>
                        </div>

                        <div class="rule-card">
                            <span class="rule-card-icon">⚖️</span>
                            <h4>Unbiased Fair Play</h4>
                            <div class="rule-card-val" style="font-size: 1.15rem; color: #38BDF8;">All Teams</div>
                            <p>Every team can score on every single question</p>
                        </div>
                    </div>
                `}

                <div class="round-lore-card">
                    <p class="round-desc-en"><strong>${isTieBreaker ? 'Decider Rule:' : isReserve ? 'Pool Info:' : 'Round Overview:'}</strong> ${round.description}</p>
                    <p class="round-desc-ml ml-text"><strong>${isTieBreaker ? 'ടൈ-ബ്രേക്കർ നിയമം:' : 'വിവരണം:'}</strong> ${round.description_ml}</p>
                </div>

                <div class="round-ready-pill">
                    <span class="pulse-dot"></span>
                    <span>Quizmaster will launch Question 1 shortly • മത്സരം ഉടൻ ആരംഭിക്കുന്നു</span>
                </div>
            </div>
        `;
    }

    /**
     * Streamlined, Elegant Stage Question Slide
     * Clean typography, NO ARTIFICIAL LABELS like "Field Narrative Clue:", pure question text
     */
    function renderQuestionStage(state) {
        let qData = getResolvedQuestion(state.currentQuestionId);
        if (!qData || (!qData.question_en && !qData.question)) {
            const isTieBreaker = state.currentRoundIndex === -1;
            const isReserve = state.currentRoundIndex === -2;
            const curRound = isTieBreaker 
                ? { question_ids: QUIZ_DATA.stage_tie_breakers } 
                : isReserve
                ? (QUIZ_DATA.reserve_round || { question_ids: [] })
                : (QUIZ_DATA.rounds[state.currentRoundIndex] || QUIZ_DATA.rounds[0]);
            if (curRound && curRound.question_ids && curRound.question_ids[state.currentQuestionIndex]) {
                qData = getResolvedQuestion(curRound.question_ids[state.currentQuestionIndex]);
            }
        }
        if (!qData || (!qData.question_en && !qData.question && !qData.answer_en)) {
            stageArea.innerHTML = `<div class="question-clean-container"><h3>Select a question from QM Control</h3></div>`;
            return;
        }

        const isTieBreaker = state.currentRoundIndex === -1;
        const isReserve = state.currentRoundIndex === -2;
        const round = isTieBreaker 
            ? { round_num: "TB", title: "Stage Tie-Breaker", type: "Tie Breaker", scoring: { direct: 0, pass: 0, penalty: 0 } }
            : isReserve
            ? (QUIZ_DATA.reserve_round || { round_num: "RES", title: "Reserve Pool", type: "Reserve Pool", scoring: { direct: 10, pass: 0, penalty: 0 } })
            : (QUIZ_DATA.rounds[state.currentRoundIndex] || QUIZ_DATA.rounds[0]);
        const activeTeam = QUIZ_DATA.teams.find(t => t.id === state.activeTeamTurn) || QUIZ_DATA.teams[0];
        const isBuzzer = round.type === "Buzzer Round";
        const totalQ = round.question_ids ? round.question_ids.length : 8;

        // Clean natural question text
        const qEn = (qData.question_en && qData.question_en !== 'undefined') ? qData.question_en : (qData.question || '');
        const qMl = (qData.question_ml && qData.question_ml !== 'undefined') ? qData.question_ml : (qData.question || qEn);
        const fullQuestionEn = qEn;
        const fullQuestionMl = qMl;
        

        const isClueRound = round.type === "Clue Round" || qData.is_clue_question || (qData.clues && qData.clues.length > 0);
        const currentClueCount = state.revealedClueCount || 1;
        const currentPts = currentClueCount === 1 ? 15 : (currentClueCount === 2 ? 10 : 5);

        if (state.revealed) {
            // ==============================================================
            // STATE: ANSWER REVEALED (MASTER SPOTLIGHT - AUTO FITS SCREEN)
            // ==============================================================
            stageArea.innerHTML = `
                <div class="question-clean-container answer-revealed">
                    <!-- Top Meta HUD Bar -->
                    <div class="qn-top-meta">
                        <span class="qn-round-tag">${round.round_num === 'RES' ? '📦 Reserve' : (round.round_num === 'TB' ? '🚨 TB' : 'R' + round.round_num)} • ${round.title}</span>
                        <div class="qn-turn-indicator">
                            ${isTieBreaker ? '🚨 SUDDEN DEATH • Whoever answers goes to the front!' : isBuzzer ? '⚡ OPEN BUZZER ROUND' : `🎯 Direct Turn: ${activeTeam.name.split('/')[0]} (${activeTeam.icon})`}
                        </div>
                        <span class="qn-count-tag">Question ${state.currentQuestionIndex + 1} of ${totalQ}</span>
                    </div>

                    <!-- Sleek Question Reference Banner: Contextual reminder without pushing answer down -->
                    <div class="qn-ref-strip">
                        <span class="qn-ref-badge">${isClueRound ? '🕵️‍♂️ Clue Target' : '❓ Question'}</span>
                        <span class="qn-ref-text-en">${qData.question_en || fullQuestionEn}</span>
                        <span class="qn-ref-text-ml ml-text">(${qData.question_ml || fullQuestionMl})</span>
                    </div>

                    <!-- Master Answer Spotlight Card (Auto-Scales to Fill All Available Screen Height) -->
                    <div class="answer-reveal-card">
                        <div class="answer-text-area">
                            <div class="answer-title-group">
                                <span class="answer-badge">✓ Official Answer • ശരിയുത്തരം</span>
                                <div class="answer-title-en">${qData.answer_en}</div>
                                <div class="answer-title-ml ml-text">${qData.answer_ml}</div>
                            </div>

                            <div class="answer-fact-box">
                                <div class="answer-fact-header">
                                    <span>💡 Fun Fact</span>
                                </div>
                                <p class="answer-fact-en">${qData.fact_en}</p>
                                <p class="answer-fact-ml ml-text">${qData.fact_ml}</p>
                            </div>
                        </div>

                        <div class="answer-photo-box" id="answerMediaBox">
                            <img src="${safeImageSrc(qData.a_media_url || qData.image, 30)}" alt="${qData.answer_en}" class="answer-photo" />
                        </div>
                    </div>
                </div>
            `;

            const ansMediaBox = stageArea.querySelector('#answerMediaBox');
            if (ansMediaBox && window.MediaPlayer) {
                const aType = qData.a_media_type || (qData.image ? 'image' : 'none');
                const aSrc = (qData.a_media_url || qData.image || '').trim();
                if (aType !== 'none' && aSrc) {
                    MediaPlayer.render(ansMediaBox, {
                        type: aType,
                        src: aSrc,
                        start: qData.a_media_yt_start,
                        end: qData.a_media_yt_end,
                        autoPlay: true,
                        caption: qData.answer_en
                    });
                } else if (!qData.image) {
                    ansMediaBox.style.display = 'none';
                }
            }
        } else if (isClueRound && qData.clues && qData.clues.length > 0) {
            // ==============================================================
            // STATE: CLUE HUNTER PROGRESSIVE 3-TIER CLUE STAGE
            // ==============================================================
            stageArea.innerHTML = `
                <div class="question-clean-container clue-hunter-stage-container">
                    <div class="qn-top-meta">
                        <span class="qn-round-tag">R${round.round_num || '4'} • ${round.title}</span>
                        <div class="qn-turn-indicator">
                            🎯 Direct Turn: ${activeTeam.name.split('/')[0]} (${activeTeam.icon}) • Active Value: <strong style="color: var(--text-gold); font-size: 0.95rem;">+${currentPts} PTS</strong>
                        </div>
                        <span class="qn-count-tag">Question ${state.currentQuestionIndex + 1} of ${totalQ}</span>
                    </div>

                    <div class="clue-hunter-prompt-bar">
                        <div class="clue-target-header-pill">
                            <span class="target-pulse-dot"></span>
                            <span class="target-title-en">TARGET: LIVING ORGANISM</span>
                            <span class="target-title-ml ml-text">സസ്യ / ജീവി / ഫംഗസ് വർഗ്ഗം</span>
                        </div>
                        <div class="clue-prompt-text-group">
                            <span class="clue-prompt-en">${qData.question_en || "Identify this living organism based on the progressive clues below:"}</span>
                            <span class="clue-prompt-ml ml-text">(${qData.question_ml || "സൂചനകളുടെ അടിസ്ഥാനത്തിൽ ഈ ജീവിയെ തിരിച്ചറിയുക:"})</span>
                        </div>
                    </div>

                    <div class="clue-cards-stack">
                        ${qData.clues.map((clue) => {
                            const isRevealed = currentClueCount >= clue.tier;
                            const isCurrent = currentClueCount === clue.tier;
                            return `
                                <div class="stage-clue-card ${isRevealed ? 'is-revealed' : 'is-locked'} ${isCurrent ? 'is-current' : ''}">
                                    <div class="stage-clue-header">
                                        <div class="stage-clue-badge-box">
                                            <span class="stage-clue-badge ${isRevealed ? 'badge-revealed' : 'badge-locked'}">
                                                ${isRevealed ? '✓ ' : '🔒 '}CLUE ${clue.tier}
                                            </span>
                                            <span class="stage-clue-pts-pill ${isCurrent ? 'pill-current' : (isRevealed ? 'pill-revealed' : 'pill-locked')}">
                                                +${clue.pts} PTS
                                            </span>
                                        </div>
                                        <span class="stage-clue-status-label">
                                            ${isCurrent ? '⚡ CURRENT STAGE' : (isRevealed ? 'UNLOCKED' : 'LOCKED')}
                                        </span>
                                    </div>

                                    ${isRevealed ? `
                                        <div class="stage-clue-body">
                                            <p class="stage-clue-text-en">${clue.clue_en}</p>
                                            <p class="stage-clue-text-ml ml-text">${clue.clue_ml}</p>
                                        </div>
                                    ` : `
                                        <div class="stage-clue-locked-placeholder">
                                            <span class="locked-icon">🔒</span>
                                            <span class="locked-text-en">Clue ${clue.tier} Locked (+${clue.pts} Pts) — Awaiting Quizmaster Unlock</span>
                                            <span class="locked-text-ml ml-text">സൂചന ${clue.tier} ക്വിസ് മാസ്റ്റർ ഉടൻ നൽകുന്നതാണ്</span>
                                        </div>
                                    `}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        } else {
            // ==============================================================
            // STATE: QUESTION ACTIVE (AUTO-SCALES TO FILL STAGE CARD)
            // ==============================================================
            let mediaHtml = '';
            const qType = qData.q_media_type || (qData.has_visual && qData.image ? 'image' : (qData.audio ? 'audio' : 'none'));
            const qSrc = (qData.q_media_url || (qData.has_visual ? qData.image : (qData.audio ? qData.audio : '')) || '').trim();
            const isVisualRound = Boolean(round && (round.round_num === 2 || round.type === 'visual' || round.type === 'Visual Round' || (round.title && round.title.toLowerCase().includes('visual')))) || Boolean(isReserve && qData.round_type === 'Visual Round');
            const isAudioQuestion = Boolean(qType === 'audio' || qData.has_audio || qData.audio || round.round_num === 3 || round.round_num === 7 || qData.round_type === 'Audio Round');
            const hasMedia = (qType !== 'none' && Boolean(qSrc)) || isAudioQuestion || (isVisualRound && Boolean(qData.image));

            if (hasMedia) {
                mediaHtml = `<div class="media-box" id="questionMediaBox"></div>`;
            }

            stageArea.innerHTML = `
                <div class="question-clean-container ${hasMedia ? 'has-media' : 'is-text-only'}">
                    <div class="qn-top-meta">
                        <span class="qn-round-tag">${round.round_num === 'RES' ? '📦 Reserve' : (round.round_num === 'TB' ? '🚨 TB' : 'R' + round.round_num)} • ${round.title}</span>
                        <div class="qn-turn-indicator">
                            ${isTieBreaker ? '🚨 SUDDEN DEATH • Whoever answers goes to the front!' : isBuzzer ? '⚡ OPEN BUZZER ROUND' : `🎯 Direct Turn: ${activeTeam.name.split('/')[0]} (${activeTeam.icon}) • 🐾 Pounce Open (+10 / -5)`}
                        </div>
                        <span class="qn-count-tag">Question ${state.currentQuestionIndex + 1} of ${totalQ}</span>
                    </div>

                    <div class="qn-body-content">
                        <div class="qn-text-flow">
                            <p class="qn-text-en">${fullQuestionEn}</p>
                            <p class="qn-text-ml ml-text">${fullQuestionMl}</p>
                        </div>
                    </div>

                    ${mediaHtml}
                </div>
            `;

            if (hasMedia) {
                const qMediaBox = stageArea.querySelector('#questionMediaBox');
                if (qMediaBox && window.MediaPlayer) {
                    if (qType !== 'none' && qSrc) {
                        MediaPlayer.render(qMediaBox, {
                            type: qType,
                            src: qSrc,
                            start: qData.q_media_yt_start,
                            end: qData.q_media_yt_end,
                            autoPlay: true,
                            caption: qData.media_desc || qData.question_en
                        });
                    } else if (isAudioQuestion) {
                        MediaPlayer.render(qMediaBox, {
                            type: 'audio',
                            src: qData.audio || qSrc,
                            autoPlay: false,
                            caption: qData.media_desc || 'Acoustic Audio Recording'
                        });
                    } else if (qData.image) {
                        MediaPlayer.render(qMediaBox, {
                            type: 'image',
                            src: safeImageSrc(qData.image, 55),
                            caption: qData.media_desc || 'Visual Challenge'
                        });
                    }
                }
            }
        }

        // Trigger mathematical auto-fit engine across screen sizes
        requestAnimationFrame(() => {
            autoFitStageContent();
        });
    }

    /**
     * DYNAMIC AUTO-FIT CONTENT ENGINE:
     * Mathematically guarantees text & cards fit ANY screen size, aspect ratio & browser:
     * - Prevents clipping/overflow on smaller screens (1024x768, 1280x720, 1366x768)
     * - Prevents feeble appearance/empty voids on large screens (1920x1080, 2560x1440, 4K)
     */
    function autoFitStageContent() {
        if (!stageArea) return;

        // 1. Text-Only Question Stage Auto-Fit (Flow Measurement Fill-to-Space Engine)
        // Precisely measures the content flow height against available card height to fill 80% to 92% of space
        const textOnlyCard = stageArea.querySelector('.question-clean-container.is-text-only');
        if (textOnlyCard) {
            const bodyContent = textOnlyCard.querySelector('.qn-body-content');
            const textFlow = textOnlyCard.querySelector('.qn-text-flow');
            const textEn = textOnlyCard.querySelector('.qn-text-en');
            const textMl = textOnlyCard.querySelector('.qn-text-ml');

            if (bodyContent && textFlow && textEn && textMl) {
                // Calculate actual usable inner height
                const cs = window.getComputedStyle(bodyContent);
                const padTop = parseFloat(cs.paddingTop) || 24;
                const padBottom = parseFloat(cs.paddingBottom) || 24;
                const maxUsableHeight = Math.max(150, (bodyContent.clientHeight || 540) - padTop - padBottom - 8);

                let minRem = 1.00;
                let maxRem = maxUsableHeight < 360 ? 1.65 : maxUsableHeight < 500 ? 2.25 : maxUsableHeight < 680 ? 2.85 : 3.40;

                let low = minRem;
                let high = maxRem;
                let best = minRem;

                // 8-iteration binary search directly measuring content flow box
                for (let i = 0; i < 8; i++) {
                    const mid = (low + high) / 2;
                    textEn.style.fontSize = `${mid.toFixed(2)}rem`;
                    textMl.style.fontSize = `${(mid * 0.90).toFixed(2)}rem`;

                    // Measure actual rendered height of the text content flow
                    const currentFlowH = Math.max(textFlow.offsetHeight, textFlow.scrollHeight);
                    if (currentFlowH <= maxUsableHeight) {
                        best = mid;
                        low = mid; // Fits cleanly! Test larger font to fill more space
                    } else {
                        high = mid; // Overflows available height! Step down
                    }
                }

                // Lock in the mathematically optimal fill size
                textEn.style.fontSize = `${best.toFixed(2)}rem`;
                textMl.style.fontSize = `${(best * 0.90).toFixed(2)}rem`;
            }
        }

        // 2. Answer Spotlight Auto-Fit
        const answerCard = stageArea.querySelector('.question-clean-container.answer-revealed .answer-reveal-card');
        if (answerCard) {
            const factBox = answerCard.querySelector('.answer-fact-box');
            const factEn = answerCard.querySelector('.answer-fact-en');
            const factMl = answerCard.querySelector('.answer-fact-ml');
            const titleEn = answerCard.querySelector('.answer-title-en');
            const titleMl = answerCard.querySelector('.answer-title-ml');

            const cardH = answerCard.clientHeight;

            // Auto-size Titles proportionally
            if (titleEn && titleMl) {
                let tRem = Math.max(1.3, Math.min(2.4, cardH / 240));
                titleEn.style.fontSize = `${tRem.toFixed(2)}rem`;
                titleMl.style.fontSize = `${(tRem * 0.82).toFixed(2)}rem`;
            }

            // Auto-size Fact Note Box
            if (factBox && factEn && factMl) {
                let fRem = 0.90;
                if (cardH < 440) fRem = 0.78;
                else if (cardH < 540) fRem = 0.85;
                else if (cardH > 720) fRem = 1.05;

                factEn.style.fontSize = `${fRem}rem`;
                factMl.style.fontSize = `${(fRem * 0.92).toFixed(2)}rem`;

                let iter = 0;
                while (answerCard.scrollHeight > answerCard.clientHeight && fRem > 0.70 && iter < 12) {
                    fRem -= 0.03;
                    factEn.style.fontSize = `${fRem.toFixed(2)}rem`;
                    factMl.style.fontSize = `${(fRem * 0.92).toFixed(2)}rem`;
                    iter++;
                }
            }
        }

        // 4. Prelims Full Grid & Tie-Breakers Auto-Fit Binary Search Engine
        // Mathematically scales question text to fill 85% to 96% of available card space without overflow
        const prelimsCards = stageArea.querySelectorAll('.prelims-full-grid .exam-grid-card, .prelims-tb-grid .exam-grid-card');
        if (prelimsCards.length > 0) {
            prelimsCards.forEach(card => {
                const en = card.querySelector('.exam-card-en');
                const ml = card.querySelector('.exam-card-ml');
                const header = card.querySelector('.exam-card-header');
                const ans = card.querySelector('.exam-card-ans');
                if (!en) return;

                // Accurately measure available height inside the card for text
                const cardH = card.clientHeight;
                if (cardH <= 0) return;

                const cs = window.getComputedStyle(card);
                const padV = (parseFloat(cs.paddingTop) || 6) + (parseFloat(cs.paddingBottom) || 6);
                const headerH = header ? header.offsetHeight : 18;
                const ansH = (ans && ans.offsetHeight) ? ans.offsetHeight + 4 : 0;
                const maxTextH = cardH - padV - headerH - ansH - 4;

                // Binary search for exact maximum font size that fits into maxTextH
                let low = 8.5;
                let high = 15.0;
                let best = low;

                for (let i = 0; i < 9; i++) {
                    const mid = (low + high) / 2;
                    en.style.fontSize = `${mid.toFixed(2)}px`;
                    en.style.lineHeight = '1.20';
                    if (ml) {
                        ml.style.fontSize = `${(mid * 0.90).toFixed(2)}px`;
                        ml.style.lineHeight = '1.22';
                    }

                    // Directly measure total rendered pixel height of English + Malayalam
                    const textH = en.offsetHeight + (ml ? ml.offsetHeight : 0);

                    if (textH <= maxTextH) {
                        best = mid;
                        low = mid; // Fits cleanly! Try larger to fill more empty space
                    } else {
                        high = mid; // Overflows! Step down
                    }
                }

                // Apply the optimal font size
                en.style.fontSize = `${best.toFixed(2)}px`;
                en.style.lineHeight = '1.20';
                if (ml) {
                    ml.style.fontSize = `${(best * 0.90).toFixed(2)}px`;
                    ml.style.lineHeight = '1.22';
                }
            });
        }

        // 3. Visual Media Question Auto-Fit
        const mediaBox = stageArea.querySelector('.question-clean-container.has-media .media-box');
        const mediaImg = stageArea.querySelector('.question-clean-container.has-media .media-image');
        if (mediaBox && mediaImg) {
            const maxImgH = mediaBox.clientHeight - 8;
            mediaImg.style.maxHeight = `${Math.max(180, maxImgH)}px`;
        }
    }

    // Attach window resize auto-fit listener
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(autoFitStageContent, 40);
    });

    function renderPrelimsAll20Questions(state) {
        const questions = QUIZ_DATA.prelims.filter(q => !q.is_tiebreaker);
        const rowCount = questions.length > 20 ? 5 : 4;

        stageArea.innerHTML = `
            <div class="prelims-full-grid" style="grid-template-rows: repeat(${rowCount}, 1fr);">
                ${questions.map(q => `
                    <div class="exam-grid-card">
                        <div class="exam-card-header">
                            <span class="exam-card-badge">Question ${q.num}</span>
                        </div>
                        <div class="exam-card-body">
                            <p class="exam-card-en">${q.question_en || q.prompt_en}</p>
                            <p class="exam-card-ml ml-text">${q.question_ml || q.prompt_ml}</p>
                        </div>
                        ${state.revealed ? `
                            <div class="exam-card-ans">
                                <span>✓</span>
                                <strong>${q.answer_en.split('/')[0]}</strong>
                                <span class="ml-text" style="color: var(--text-mint); font-size: 0.68rem;">(${q.answer_ml.split('/')[0]})</span>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                autoFitStageContent();
            });
        });
    }

    /**
     * Renders all 5 Tie-Breakers at once across 5 columns
     */
    function renderPrelimsTieBreakers(state) {
        const questions = QUIZ_DATA.prelims.filter(q => q.is_tiebreaker);

        stageArea.innerHTML = `
            <div class="prelims-tb-grid">
                ${questions.map((q, idx) => `
                    <div class="exam-grid-card" style="padding: 12px 14px; gap: 8px;">
                        <div class="exam-card-header">
                            <span class="exam-card-badge tb-badge">Tie-Breaker ${idx + 1}</span>
                        </div>
                        <p class="exam-card-en" style="font-size: 0.95rem; -webkit-line-clamp: 6; line-height: 1.35;">${q.question_en || q.prompt_en}</p>
                        <p class="exam-card-ml ml-text" style="font-size: 0.88rem; -webkit-line-clamp: 5; line-height: 1.35;">${q.question_ml || q.prompt_ml}</p>
                        ${state.revealed ? `
                        ${q.image ? `<img src="${safeImageSrc(q.image, 30)}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 4px; margin-top: 6px;" />` : ''}
                            <div class="exam-card-ans" style="margin-top: 6px; padding: 4px 8px; font-size: 0.85rem;">
                                <span>✓</span>
                                <strong>${q.answer_en.split('/')[0]}</strong>
                                <span class="ml-text">(${q.answer_ml.split('/')[0]})</span>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderPrelimsSingleQuestion(state) {
        if (state.prelimsCompleted) {
            renderPrelimsCompletionScreen(state);
            return;
        }

        const isTiebreaker = state.prelimsMode === 'tiebreaker';
        const rawQuestions = QUIZ_DATA.prelims ? QUIZ_DATA.prelims.filter(q => isTiebreaker ? q.is_tiebreaker : !q.is_tiebreaker) : [];
        const activeIdx = Math.max(0, Math.min(state.activePrelimIndex || 0, rawQuestions.length - 1));
        const rawQ = rawQuestions[activeIdx] || rawQuestions[0];
        if (!rawQ) {
            stageArea.innerHTML = `<div class="question-clean-container"><h3>No Prelim Question Found</h3></div>`;
            return;
        }
        const q = getResolvedQuestion(rawQ.serial_no || rawQ.num) || rawQ;

        const totalQs = rawQuestions.length;
        const qNum = activeIdx + 1;
        const qLabel = isTiebreaker ? `Tie-Breaker ${qNum} of ${totalQs}` : `Question ${qNum} of ${totalQs}`;
        const qEn = q.question_en || q.prompt_en || '';
        const qMl = q.question_ml || q.prompt_ml || '';
        const ansEn = q.answer_en || '';
        const ansMl = q.answer_ml || '';
        let timerRemaining = state.timer ? state.timer.remaining : 30;
        if (state.timer && state.timer.isRunning && state.timer.targetEndTime) {
            timerRemaining = Math.max(0, Math.ceil((state.timer.targetEndTime - Date.now()) / 1000));
        }
        const isTimerRunning = Boolean(state.timer && state.timer.isRunning);
        const isAnswersPhase = (state.prelimsPhase === 'answers' || Boolean(state.revealed));

        if (isAnswersPhase) {
            stageArea.innerHTML = `
                <div class="question-clean-container prelim-single-container answer-revealed">
                    <div class="qn-top-meta">
                        <span class="qn-round-tag">💡 ${isTiebreaker ? 'Sudden-Death Tie-Breakers' : 'Written Prelims'} • Official Solutions (1-by-1)</span>
                        <div class="qn-turn-indicator" style="background: rgba(245, 158, 11, 0.2); border-color: #F59E0B; color: #FCD34D;">
                            ✓ OFFICIAL ANSWER ON STAGE
                        </div>
                        <span class="qn-count-tag">
                            ${qLabel}
                        </span>
                    </div>

                    <div class="qn-ref-strip">
                        <span class="qn-ref-badge">❓ ${isTiebreaker ? `Tie-Breaker ${qNum}` : `Question ${qNum}`}</span>
                        <span class="qn-ref-text-en">${qEn}</span>
                        <span class="qn-ref-text-ml ml-text">(${qMl})</span>
                    </div>

                    <div class="answer-reveal-card prelim-answer-card">
                        <div class="answer-text-area">
                            <div class="answer-title-group">
                                <span class="answer-badge" style="background: #F59E0B; color: #000; font-weight: 800;">✓ Official Answer • ശരിയുത്തരം</span>
                                <div class="answer-title-en">${ansEn}</div>
                                <div class="answer-title-ml ml-text">${ansMl}</div>
                            </div>

                            ${(q.fact_en || q.fact_ml) ? `
                                <div class="answer-fact-box">
                                    <div class="answer-fact-header">
                                        <span>💡 Ecological Insight • പ്രസക്ത വിവരണം</span>
                                    </div>
                                    ${q.fact_en ? `<p class="answer-fact-en">${q.fact_en}</p>` : ''}
                                    ${q.fact_ml ? `<p class="answer-fact-ml ml-text">${q.fact_ml}</p>` : ''}
                                </div>
                            ` : ''}
                        </div>

                        <div id="prelimAnswerMediaBox" class="answer-photo-box" style="flex: 1; max-width: 480px; min-height: 220px; display: flex; align-items: center; justify-content: center;">
                            ${(q.image && (!q.a_media_type || q.a_media_type === 'image')) ? `
                                <img src="${safeImageSrc(q.image, 65)}" alt="${ansEn}" class="answer-photo" />
                            ` : ''}
                        </div>
                    </div>

                    ${renderPrelimsProgressTrack(activeIdx, totalQs, isTiebreaker, true)}
                </div>
            `;

            const ansMediaBox = stageArea.querySelector('#prelimAnswerMediaBox');
            if (ansMediaBox && window.MediaPlayer) {
                const aType = q.a_media_type || (q.image ? 'image' : 'none');
                const aSrc = (q.a_media_url || q.image || '').trim();
                if (aType !== 'none' && aSrc) {
                    MediaPlayer.render(ansMediaBox, {
                        type: aType,
                        src: aSrc,
                        start: q.a_media_yt_start,
                        end: q.a_media_yt_end,
                        autoPlay: true,
                        caption: q.answer_en
                    });
                } else if (!q.image) {
                    ansMediaBox.style.display = 'none';
                }
            }
        } else {
            const hasQMedia = Boolean(q.q_media_type && q.q_media_type !== 'none' && q.q_media_url);
            stageArea.innerHTML = `
                <div class="question-clean-container prelim-single-container ${hasQMedia ? 'has-media' : 'is-text-only'}">
                    <div class="qn-top-meta">
                        <span class="qn-round-tag">
                            📝 ${isTiebreaker ? '🚨 Sudden-Death Tie-Breaker' : 'Preliminary Written Screening Test'}
                        </span>
                        <div class="qn-turn-indicator ${isTimerRunning ? 'status-active-turn' : ''}">
                            <span class="pulse-dot" style="${isTimerRunning ? 'background: #10B981;' : 'background: #F59E0B;'}"></span>
                            <span id="prelimSingleTimerText">${isTimerRunning ? `⏱️ Question Timer: ${timerRemaining}s` : '⏳ Awaiting Start'}</span>
                            <span style="opacity: 0.7; margin-left: 6px; font-size: 0.75rem;">• All Student Teams (Paper)</span>
                        </div>
                        <span class="qn-count-tag">
                            ${qLabel}
                        </span>
                    </div>

                    <div class="qn-body-content prelim-single-body" style="${hasQMedia ? 'display: flex; gap: 24px; align-items: center;' : ''}">
                        <div class="qn-text-flow prelim-text-flow" style="${hasQMedia ? 'flex: 1;' : ''}">
                            <p class="qn-text-en prelim-text-en">${qEn}</p>
                            <p class="qn-text-ml prelim-text-ml ml-text">${qMl}</p>
                        </div>
                        ${hasQMedia ? `
                            <div id="prelimQuestionMediaBox" class="qn-media-flow" style="flex: 1; max-width: 480px; min-height: 240px; display: flex; align-items: center; justify-content: center;">
                            </div>
                        ` : ''}
                    </div>

                    ${renderPrelimsProgressTrack(activeIdx, totalQs, isTiebreaker, false)}
                </div>
            `;

            if (hasQMedia) {
                const qMediaBox = stageArea.querySelector('#prelimQuestionMediaBox');
                if (qMediaBox && window.MediaPlayer) {
                    MediaPlayer.render(qMediaBox, {
                        type: q.q_media_type,
                        src: q.q_media_url,
                        start: q.q_media_yt_start,
                        end: q.q_media_yt_end,
                        autoPlay: true,
                        caption: q.question_en
                    });
                }
            }
        }

        requestAnimationFrame(() => {
            autoFitStageContent();
        });
    }

    function renderPrelimsProgressTrack(activeIdx, totalQs, isTiebreaker, isAnswersMode = false) {
        let pillsHtml = '';
        for (let i = 0; i < totalQs; i++) {
            const isCompleted = i < activeIdx;
            const isCurrent = i === activeIdx;
            const label = isTiebreaker ? `TB${i+1}` : `${i+1}`;
            pillsHtml += `
                <div class="prelim-step-pill ${isCurrent ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}" style="${isAnswersMode && isCurrent ? 'border-color: #F59E0B; background: rgba(245, 158, 11, 0.3); color: #FFF;' : ''}" title="${isTiebreaker ? 'Tie-Breaker ' + (i+1) : 'Question ' + (i+1)}">
                    ${isCompleted ? '✓ ' : ''}${label}
                </div>
            `;
        }
        return `
            <div class="prelim-progress-strip">
                <span class="prelim-strip-title">${isAnswersMode ? '💡 Answers Revealed:' : '📝 Question Progress:'}</span>
                <div class="prelim-step-pills">
                    ${pillsHtml}
                </div>
                <span class="prelim-strip-counter">${activeIdx + 1} / ${totalQs}</span>
            </div>
        `;
    }

    function renderPrelimsCompletionScreen(state) {
        const isTiebreaker = state.prelimsMode === 'tiebreaker';
        const bm = getPublicBrandingMeta();
        stageArea.innerHTML = `
            <div class="welcome-stage-container glass-panel prelim-complete-container">
                <div style="display: inline-block; margin: 0 auto;">
                    <span class="badge badge-gold welcome-badge" style="font-size: 0.95rem; padding: 6px 20px;">
                        ${isTiebreaker ? '🚨 PRELIMS TIE-BREAKER COMPLETED • ടൈ-ബ്രേക്കർ അവസാനിച്ചു' : '🌿 PRELIMINARY SCREENING TEST COMPLETED • പരീക്ഷ അവസാനിച്ചു'}
                    </span>
                </div>
                <div class="welcome-header-area" style="margin: 15px 0;">
                    <h2 class="welcome-title-en" style="font-size: 2.2rem; color: var(--text-gold);">
                        ${isTiebreaker ? 'ALL 5 TIE-BREAKER QUESTIONS COMPLETED!' : 'ALL 20 QUESTIONS COMPLETED!'}
                    </h2>
                    <h3 class="welcome-title-ml ml-text" style="font-size: 1.6rem; color: #FFF; margin-top: 6px;">
                        ${isTiebreaker ? 'എല്ലാ 5 ടൈ-ബ്രേക്കർ ചോദ്യങ്ങളും അവസാനിച്ചു' : 'എല്ലാ 20 പ്രാഥമിക ചോദ്യങ്ങളും അവസാനിച്ചു'}
                    </h3>
                    <p class="welcome-subtitle" style="font-size: 1.05rem; max-width: 750px; margin: 12px auto 0 auto; line-height: 1.5;">
                        ${isTiebreaker 
                            ? 'Please submit the tie-breaker written sheets to the Quizmaster desk for sudden-death evaluation.<br><span class="ml-text" style="color: var(--text-mint);">ടൈ-ബ്രേക്കർ ഉത്തരക്കടലാസുകൾ മൂല്യനിർണ്ണയത്തിനായി ക്വിസ് മാസ്റ്റർക്ക് സമർപ്പിക്കുക.</span>' 
                            : 'Please review your written answer sheets and submit them to the Quizmaster desk for paper evaluation.<br><span class="ml-text" style="color: var(--text-mint);">ഉത്തരക്കടലാസുകൾ പരിശോധിച്ചു മൂല്യനിർണ്ണയത്തിനായി ക്വിസ് മാസ്റ്റർക്ക് സമർപ്പിക്കുക.</span>'}
                    </p>
                </div>

                <div class="prelim-complete-card-grid">
                    <div class="prelim-complete-stat-card">
                        <span style="font-size: 1.8rem;">${isTiebreaker ? '🚨' : '📝'}</span>
                        <div style="font-size: 1.4rem; font-weight: 900; color: var(--text-gold);">${isTiebreaker ? '5 Questions' : '20 Questions'}</div>
                        <span style="font-size: 0.8rem; color: #94A3B8;">${isTiebreaker ? 'Sudden-Death TB' : 'All Questions Projected'}</span>
                    </div>
                    <div class="prelim-complete-stat-card">
                        <span style="font-size: 1.8rem;">📋</span>
                        <div style="font-size: 1.4rem; font-weight: 900; color: #38BDF8;">Paper Evaluation</div>
                        <span style="font-size: 0.8rem; color: #94A3B8;">1 Mark Each • No Negatives</span>
                    </div>
                    <div class="prelim-complete-stat-card">
                        <span style="font-size: 1.8rem;">🏆</span>
                        <div style="font-size: 1.4rem; font-weight: 900; color: #10B981;">Finalists</div>
                        <span style="font-size: 0.8rem; color: #94A3B8;">Break Tie & Enter Stage</span>
                    </div>
                </div>

                <div class="prelim-host-signature">
                    ${bm.show_logos && bm.logo_primary ? `<img src="${safeImageSrc(bm.logo_primary)}" style="height: 24px; width: 24px; object-fit: contain; border-radius: 50%;" alt="Host Logo" />` : ''}
                    <span>Conducted by <strong>${escapeHtml(bm.department || '')}</strong> • <strong>${escapeHtml(bm.institution || '')}</strong></span>
                    ${bm.show_logos && bm.logo_secondary ? `<img src="${safeImageSrc(bm.logo_secondary)}" style="height: 24px; width: 24px; object-fit: contain; border-radius: 50%;" alt="Dept Logo" />` : ''}
                </div>
            </div>
        `;
    }

    function renderWinnerStage(state) {
        SFX.playFanfare();
        const bm = getPublicBrandingMeta();
        const sortedTeams = [...QUIZ_DATA.teams].sort((a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0));
        const champion = sortedTeams[0];
        const runnerUp = sortedTeams[1];
        const thirdPlace = sortedTeams[2];

        stageArea.innerHTML = `
            <div class="winner-stage-container glass-panel">
                <span class="badge badge-gold" style="font-size: 0.82rem; padding: 4px 18px;">🏆 CHAMPIONSHIP RESULTS</span>
                <div style="margin: 2px 0;">
                    <h2 class="winner-title-en">${escapeHtml((bm.title || 'QUIZ').toUpperCase())} CHAMPIONS</h2>
                    <h3 class="winner-title-ml ml-text">${escapeHtml(bm.title_ml || 'ക്വിസ് വിജയികൾ')}</h3>
                </div>

                <div class="winner-podiums-row">
                    <!-- 2nd Place -->
                    <div class="winner-card-2nd">
                        <span style="font-size: 1.8rem;">🥈</span>
                        <h4 style="color: #94A3B8; margin: 3px 0 0 0; font-size: 0.82rem;">2nd Place</h4>
                        <div style="font-size: 1.8rem; margin: 3px 0;">${runnerUp.icon}</div>
                        <strong style="color: #FFF; font-size: 0.86rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${runnerUp.name.split('/')[0]}</strong>
                        <span class="ml-text" style="color: var(--text-muted); font-size: 0.74rem;">${runnerUp.name_ml}</span>
                        <span style="font-size: 1.45rem; font-weight: 900; color: var(--text-gold); margin-top: 5px;">${state.scores[runnerUp.id] || 0} pts</span>
                    </div>

                    <!-- 1st Place (Champion) -->
                    <div class="winner-card-1st">
                        <span style="font-size: 2.1rem;">👑 🥇</span>
                        <h3 style="color: var(--text-gold); font-size: 1.05rem; font-weight: 900; margin: 2px 0 0 0;">CHAMPIONS</h3>
                        <div style="font-size: 2.1rem; margin: 4px 0;">${champion.icon}</div>
                        <strong style="color: #FFF; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${champion.name.split('/')[0]}</strong>
                        <span class="ml-text" style="color: var(--text-mint); font-size: 0.80rem;">${champion.name_ml}</span>
                        <span style="font-size: 1.85rem; font-weight: 900; color: var(--text-gold); margin-top: 6px;">${state.scores[champion.id] || 0} pts</span>
                    </div>

                    <!-- 3rd Place -->
                    <div class="winner-card-3rd">
                        <span style="font-size: 1.8rem;">🥉</span>
                        <h4 style="color: #B45309; margin: 3px 0 0 0; font-size: 0.82rem;">3rd Place</h4>
                        <div style="font-size: 1.8rem; margin: 3px 0;">${thirdPlace.icon}</div>
                        <strong style="color: #FFF; font-size: 0.86rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${thirdPlace.name.split('/')[0]}</strong>
                        <span class="ml-text" style="color: var(--text-muted); font-size: 0.74rem;">${thirdPlace.name_ml}</span>
                        <span style="font-size: 1.45rem; font-weight: 900; color: var(--text-gold); margin-top: 5px;">${state.scores[thirdPlace.id] || 0} pts</span>
                    </div>
                </div>

                <div class="winner-host-signature">
                    ${bm.show_logos && bm.logo_primary ? `<img src="${safeImageSrc(bm.logo_primary)}" class="winner-sig-logo" alt="Host Logo" />` : ''}
                    <div class="winner-sig-text">
                        <span>Organized & Conducted by <strong>${escapeHtml(bm.department || '')}</strong> • <strong>${escapeHtml(bm.institution || '')}</strong></span>
                    </div>
                    ${bm.show_logos && bm.logo_secondary ? `<img src="${safeImageSrc(bm.logo_secondary)}" class="winner-sig-logo" alt="Dept Logo" />` : ''}
                </div>
            </div>
        `;
    }
});

// ==========================================================================
// IN-APP PROJECTOR SCALING & FULLSCREEN ENGINE (PREVENTS BROWSER SYNC-ZOOM)
// ==========================================================================

function applyProjectorZoom(scale) {
    let zoom = parseFloat(scale);
    if (isNaN(zoom) || zoom < 0.6) zoom = 0.6;
    if (zoom > 1.6) zoom = 1.6;
    zoom = Math.round(zoom * 100) / 100;

    const container = document.querySelector('.public-container');
    if (container) {
        container.style.zoom = String(zoom);
        container.style.width = `calc(100vw / ${zoom})`;
        container.style.height = `calc(100vh / ${zoom})`;
        container.style.maxWidth = `calc(100vw / ${zoom})`;
        container.style.maxHeight = `calc(100vh / ${zoom})`;
    }
    document.documentElement.style.setProperty('--projector-zoom', String(zoom));

    const hudText = document.getElementById('hudZoomText');
    if (hudText) {
        hudText.textContent = Math.round(zoom * 100) + '%';
    }

    const hud = document.getElementById('projectorZoomHud');
    if (hud) {
        hud.classList.add('is-active');
        if (window._hudTimer) clearTimeout(window._hudTimer);
        window._hudTimer = setTimeout(() => {
            hud.classList.remove('is-active');
        }, 2200);
    }
}
window.applyProjectorZoom = applyProjectorZoom;

function setProjectorZoom(scale) {
    if (window.QuizState && typeof QuizState.setProjectorZoom === 'function') {
        QuizState.setProjectorZoom(scale);
    } else {
        applyProjectorZoom(scale);
        try {
            localStorage.setItem('SAHYADRI_PROJECTOR_ZOOM', String(scale));
        } catch (e) {}
    }
}
window.setProjectorZoom = setProjectorZoom;

function adjustProjectorZoom(delta) {
    const cur = (window.QuizState && QuizState.state && QuizState.state.projectorZoom) 
        ? QuizState.state.projectorZoom 
        : (parseFloat(localStorage.getItem('SAHYADRI_PROJECTOR_ZOOM')) || 1.0);
    setProjectorZoom(cur + delta);
}
window.adjustProjectorZoom = adjustProjectorZoom;

function togglePublicFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen request notice:', err);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(e => {});
        }
    }
}
window.togglePublicFullscreen = togglePublicFullscreen;

// Intercept Ctrl/Meta Zoom keys and mouse wheel on Public Screen
// to prevent Chrome from altering origin-level browser zoom across all windows
window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

    if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+' || e.key === '-' || e.key === '_' || e.key === '0')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === '=' || e.key === '+') {
            adjustProjectorZoom(0.05);
        } else if (e.key === '-' || e.key === '_') {
            adjustProjectorZoom(-0.05);
        } else if (e.key === '0') {
            setProjectorZoom(1.0);
        }
        return;
    }

    // Direct projector hotkeys when focused on public window
    if (e.key === '+' || e.key === '=') {
        adjustProjectorZoom(0.05);
    } else if (e.key === '-' || e.key === '_') {
        adjustProjectorZoom(-0.05);
    } else if (e.key === '0') {
        setProjectorZoom(1.0);
    } else if (e.key === 'f' || e.key === 'F') {
        togglePublicFullscreen();
    }
}, { passive: false });

window.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
            adjustProjectorZoom(0.05);
        } else if (e.deltaY > 0) {
            adjustProjectorZoom(-0.05);
        }
    }
}, { passive: false });

// Apply saved projector zoom on initial startup
(function() {
    const savedZoom = (typeof localStorage !== 'undefined' && parseFloat(localStorage.getItem('SAHYADRI_PROJECTOR_ZOOM'))) || 1.0;
    applyProjectorZoom(savedZoom);
})();

