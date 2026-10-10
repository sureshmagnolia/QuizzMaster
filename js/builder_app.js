/**
 * QuizzMaster Studio CMS Application Controller
 */

(function () {
    'use strict';

    // State Variables
    let currentQuiz = null;
    let selectedRoundIndex = 0;
    let selectedQuestionId = null;
    let selectedPrelimIndex = 0;
    let stateManager = null;

    // DOM Elements
    const elements = {};

    function init() {
        cacheDOMElements();
        initQuizState();
        bindEvents();
        renderAll();
    }

    function cacheDOMElements() {
        elements.presetSelector = document.getElementById('presetSelector');
        elements.btnImportJson = document.getElementById('btnImportJson');
        elements.fileImportJson = document.getElementById('fileImportJson');
        elements.btnExportJson = document.getElementById('btnExportJson');
        elements.btnExportCsv = document.getElementById('btnExportCsv');
        elements.btnSaveApply = document.getElementById('btnSaveApply');

        elements.btnExportZip = document.getElementById('btnExportZip');
        elements.btnImportZip = document.getElementById('btnImportZip');
        elements.fileImportZip = document.getElementById('fileImportZip');
        elements.btnExportZipCard = document.getElementById('btnExportZipCard');
        elements.btnImportZipCard = document.getElementById('btnImportZipCard');
        elements.bundleMediaCountBadge = document.getElementById('bundleMediaCountBadge');

        elements.tabs = document.querySelectorAll('.tab-btn');
        elements.panes = document.querySelectorAll('.tab-pane');

        elements.teamCountBadge = document.getElementById('teamCountBadge');
        elements.roundCountBadge = document.getElementById('roundCountBadge');

        // Meta Tab
        elements.metaTitle = document.getElementById('metaTitle');
        elements.metaTitleMl = document.getElementById('metaTitleMl');
        elements.metaSubtitle = document.getElementById('metaSubtitle');
        elements.metaCurator = document.getElementById('metaCurator');
        elements.metaTheme = document.getElementById('metaTheme');
        elements.metaShowLogos = document.getElementById('metaShowLogos');
        elements.metaInstitution = document.getElementById('metaInstitution');
        elements.metaDepartment = document.getElementById('metaDepartment');
        elements.metaLogoPrimary = document.getElementById('metaLogoPrimary');
        elements.fileLogoPrimary = document.getElementById('fileLogoPrimary');
        elements.btnUploadLogoPrimary = document.getElementById('btnUploadLogoPrimary');
        elements.btnClearLogoPrimary = document.getElementById('btnClearLogoPrimary');
        elements.logoPrimaryPreview = document.getElementById('logoPrimaryPreview');
        elements.metaLogoSecondary = document.getElementById('metaLogoSecondary');
        elements.fileLogoSecondary = document.getElementById('fileLogoSecondary');
        elements.btnUploadLogoSecondary = document.getElementById('btnUploadLogoSecondary');
        elements.btnClearLogoSecondary = document.getElementById('btnClearLogoSecondary');
        elements.logoSecondaryPreview = document.getElementById('logoSecondaryPreview');
        elements.btnPresetGvcLogos = document.getElementById('btnPresetGvcLogos');
        elements.btnClearAllLogos = document.getElementById('btnClearAllLogos');

        // Teams Tab
        elements.teamCountSlider = document.getElementById('teamCountSlider');
        elements.teamCountDisplay = document.getElementById('teamCountDisplay');
        elements.btnAddTeam = document.getElementById('btnAddTeam');
        elements.teamsContainer = document.getElementById('teamsContainer');

        // Rounds Tab
        elements.btnAddRound = document.getElementById('btnAddRound');
        elements.roundsContainer = document.getElementById('roundsContainer');

        // Questions Tab
        elements.qRoundSelector = document.getElementById('qRoundSelector');
        elements.questionNavList = document.getElementById('questionNavList');
        elements.btnAddQuestion = document.getElementById('btnAddQuestion');
        elements.btnDeleteQuestion = document.getElementById('btnDeleteQuestion');
        elements.activeQuestionSerialBadge = document.getElementById('activeQuestionSerialBadge');
        elements.activeQuestionHeading = document.getElementById('activeQuestionHeading');

        elements.qTextEn = document.getElementById('qTextEn');
        elements.qTextMl = document.getElementById('qTextMl');
        elements.qMediaType = document.getElementById('qMediaType');
        elements.qMediaFields = document.getElementById('qMediaFields');
        elements.qMediaSrc = document.getElementById('qMediaSrc');
        elements.qMediaYtStart = document.getElementById('qMediaYtStart');
        elements.qMediaYtEnd = document.getElementById('qMediaYtEnd');
        elements.qMediaPreview = document.getElementById('qMediaPreview');

        elements.aTextEn = document.getElementById('aTextEn');
        elements.aTextMl = document.getElementById('aTextMl');
        elements.aMediaType = document.getElementById('aMediaType');
        elements.aMediaFields = document.getElementById('aMediaFields');
        elements.aMediaSrc = document.getElementById('aMediaSrc');
        elements.aMediaYtStart = document.getElementById('aMediaYtStart');
        elements.aMediaYtEnd = document.getElementById('aMediaYtEnd');
        elements.aMediaPreview = document.getElementById('aMediaPreview');

        elements.cluesSection = document.getElementById('cluesSection');
        elements.clue1En = document.getElementById('clue1En');
        elements.clue1Ml = document.getElementById('clue1Ml');
        elements.clue2En = document.getElementById('clue2En');
        elements.clue2Ml = document.getElementById('clue2Ml');
        elements.clue3En = document.getElementById('clue3En');
        elements.clue3Ml = document.getElementById('clue3Ml');

        elements.factEn = document.getElementById('factEn');
        elements.factMl = document.getElementById('factMl');
        elements.statusToast = document.getElementById('statusToast');

        // Prelims Tab
        elements.prelimCountBadge = document.getElementById('prelimCountBadge');
        elements.btnAddPrelim = document.getElementById('btnAddPrelim');
        elements.btnAddPrelimTB = document.getElementById('btnAddPrelimTB');
        elements.prelimTimerDuration = document.getElementById('prelimTimerDuration');
        elements.prelimAutoAdvanceDefault = document.getElementById('prelimAutoAdvanceDefault');
        elements.prelimRegularCountDisplay = document.getElementById('prelimRegularCountDisplay');
        elements.prelimTBCountDisplay = document.getElementById('prelimTBCountDisplay');
        elements.prelimTotalBadge = document.getElementById('prelimTotalBadge');
        elements.prelimNavList = document.getElementById('prelimNavList');
        elements.activePrelimSerialBadge = document.getElementById('activePrelimSerialBadge');
        elements.activePrelimHeading = document.getElementById('activePrelimHeading');
        elements.prelimIsTiebreaker = document.getElementById('prelimIsTiebreaker');
        elements.btnDeletePrelim = document.getElementById('btnDeletePrelim');

        elements.pQTextEn = document.getElementById('pQTextEn');
        elements.pQTextMl = document.getElementById('pQTextMl');
        elements.pQMediaType = document.getElementById('pQMediaType');
        elements.pQMediaFields = document.getElementById('pQMediaFields');
        elements.pQMediaSrc = document.getElementById('pQMediaSrc');
        elements.pQMediaYtStart = document.getElementById('pQMediaYtStart');
        elements.pQMediaYtEnd = document.getElementById('pQMediaYtEnd');
        elements.pQMediaPreview = document.getElementById('pQMediaPreview');

        elements.pATextEn = document.getElementById('pATextEn');
        elements.pATextMl = document.getElementById('pATextMl');
        elements.pAMediaType = document.getElementById('pAMediaType');
        elements.pAMediaFields = document.getElementById('pAMediaFields');
        elements.pAMediaSrc = document.getElementById('pAMediaSrc');
        elements.pAMediaYtStart = document.getElementById('pAMediaYtStart');
        elements.pAMediaYtEnd = document.getElementById('pAMediaYtEnd');
        elements.pAMediaPreview = document.getElementById('pAMediaPreview');

        elements.pFactEn = document.getElementById('pFactEn');
        elements.pFactMl = document.getElementById('pFactMl');
    }

    function initQuizState() {
        if (typeof window.QuizStateManager !== 'undefined') {
            stateManager = new window.QuizStateManager();
        }

        // Clone current QUIZ_DATA
        if (window.QUIZ_DATA) {
            currentQuiz = JSON.parse(JSON.stringify(window.QUIZ_DATA));
        } else if (typeof PRESET_SAMPLE_MULTIMEDIA !== 'undefined') {
            currentQuiz = JSON.parse(JSON.stringify(PRESET_SAMPLE_MULTIMEDIA));
        } else {
            currentQuiz = getBlankQuizTemplate();
        }

        normalizeQuizStructure(currentQuiz);
    }

    function getBlankQuizTemplate() {
        return {
            version: '2.0.0',
            meta: {
                title: 'New Custom Quiz',
                title_ml: 'പുതിയ ക്വിസ്',
                subtitle: 'Edition 2026',
                curator: 'Quizmaster',
                institution: 'Host Institution / College',
                department: 'Quiz Committee / Club',
                logo_primary: '',
                logo_secondary: '',
                show_logos: true,
                theme: 'emerald'
            },
            teams: [
                { id: 'team_1', num: 1, name: 'Team Alpha', name_ml: 'ടീം ആൽഫ', color: '#EF4444', color_dark: '#7F1D1D', icon: '🔥', score: 0 },
                { id: 'team_2', num: 2, name: 'Team Beta', name_ml: 'ടീം ബീറ്റ', color: '#F59E0B', color_dark: '#78350F', icon: '⚡', score: 0 },
                { id: 'team_3', num: 3, name: 'Team Gamma', name_ml: 'ടീം ഗാമ', color: '#3B82F6', color_dark: '#1E3A8A', icon: '🌊', score: 0 },
                { id: 'team_4', num: 4, name: 'Team Delta', name_ml: 'ടീം ഡെൽറ്റ', color: '#10B981', color_dark: '#064E3B', icon: '🌿', score: 0 }
            ],
            rounds: [
                {
                    round_id: 'r1',
                    round_num: 1,
                    title: 'Round 1: General Trivia',
                    title_ml: 'റൗണ്ട് 1: പൊതുവിജ്ഞാനം',
                    type: 'direct_pass',
                    format: 'Direct (+10), Pass (+5)',
                    timing_sec: 30,
                    pass_timing_sec: 15,
                    scoring: { direct: 10, pass: 5, wrong: 0 },
                    description: 'Direct & pass round.',
                    question_ids: [1]
                }
            ],
            all_stage_questions: {
                "1": {
                    id: 1,
                    serial: 'R01-Q1',
                    serial_no: 'R01-Q1',
                    round_id: 'r1',
                    question_en: 'Sample Question: Enter your prompt here.',
                    question_ml: '',
                    answer_en: 'Sample Answer',
                    answer_ml: '',
                    q_media_type: 'none',
                    q_media_url: '',
                    a_media_type: 'none',
                    a_media_url: '',
                    fact_en: '',
                    fact_ml: ''
                }
            },
            prelimTimerDuration: 30,
            prelimAutoAdvance: true,
            prelims: [
                {
                    num: 1,
                    serial_no: 'P01',
                    serial: 'P01',
                    is_tiebreaker: false,
                    question_en: 'Sample Prelim 1: Enter your screening question prompt here.',
                    question_ml: 'മാതൃകാ പ്രാഥമിക ചോദ്യം 1...',
                    answer_en: 'Sample Answer 1',
                    answer_ml: 'മാതൃകാ ഉത്തരം 1',
                    q_media_type: 'none',
                    q_media_url: '',
                    a_media_type: 'none',
                    a_media_url: '',
                    fact_en: 'Interesting background note for answer phase.',
                    fact_ml: 'ഉത്തര വിശദീകരണം.'
                },
                {
                    num: 2,
                    serial_no: 'P02',
                    serial: 'P02',
                    is_tiebreaker: false,
                    question_en: 'Sample Prelim 2: Enter question prompt here.',
                    question_ml: 'മാതൃകാ പ്രാഥമിക ചോദ്യം 2...',
                    answer_en: 'Sample Answer 2',
                    answer_ml: 'മാതൃകാ ഉത്തരം 2',
                    q_media_type: 'none',
                    q_media_url: '',
                    a_media_type: 'none',
                    a_media_url: '',
                    fact_en: '',
                    fact_ml: ''
                }
            ]
        };
    }

    function normalizeQuizStructure(quiz) {
        if (!quiz.meta) quiz.meta = {};
        if (!Array.isArray(quiz.teams)) quiz.teams = [];
        if (!Array.isArray(quiz.rounds)) quiz.rounds = [];
        if (!quiz.all_stage_questions) quiz.all_stage_questions = {};
        if (!Array.isArray(quiz.prelims)) quiz.prelims = [];

        // Ensure questions in round are linked in all_stage_questions
        quiz.rounds.forEach((round, rIdx) => {
            if (!round.question_ids) round.question_ids = [];
            // If round has inline questions, migrate to all_stage_questions
            if (Array.isArray(round.questions) && round.questions.length > 0) {
                round.questions.forEach((q, qIdx) => {
                    const qid = q.id || ((rIdx + 1) * 100 + qIdx + 1);
                    q.id = qid;
                    round.question_ids.push(qid);
                    quiz.all_stage_questions[String(qid)] = q;
                });
                delete round.questions;
            }
        });

        // Normalize Prelims questions
        quiz.prelims.forEach((p, idx) => {
            p.num = p.num || (idx + 1);
            p.serial_no = p.serial_no || (p.is_tiebreaker ? `TB${idx + 1}` : `P${String(idx + 1).padStart(2, '0')}`);
            p.serial = p.serial_no;
            p.question_en = p.question_en || p.prompt_en || '';
            p.question_ml = p.question_ml || p.prompt_ml || '';
            p.answer_en = p.answer_en || '';
            p.answer_ml = p.answer_ml || '';
        });
    }

    function bindEvents() {
        // Tab Navigation
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                elements.tabs.forEach(t => t.classList.remove('active'));
                elements.panes.forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                const target = document.getElementById(tab.dataset.tab);
                if (target) target.classList.add('active');
            });
        });

        // Preset Selector
        elements.presetSelector.addEventListener('change', (e) => {
            const val = e.target.value;
            if (!val) return;
            if (confirm(`Load preset "${val}"? Any unsaved changes in current editor will be replaced.`)) {
                loadPreset(val);
            }
            e.target.value = '';
        });

        // Import / Export JSON
        elements.btnExportJson.addEventListener('click', exportJson);
        if (elements.btnImportJson) elements.btnImportJson.addEventListener('click', () => elements.fileImportJson.click());
        if (elements.fileImportJson) elements.fileImportJson.addEventListener('change', handleFileImport);

        // Export & Import Portable ZIP Package (with all Media)
        if (elements.btnExportZip) elements.btnExportZip.addEventListener('click', exportZipBundle);
        if (elements.btnExportZipCard) elements.btnExportZipCard.addEventListener('click', exportZipBundle);
        if (elements.btnImportZip) elements.btnImportZip.addEventListener('click', () => elements.fileImportZip.click());
        if (elements.btnImportZipCard) elements.btnImportZipCard.addEventListener('click', () => elements.fileImportZip.click());
        if (elements.fileImportZip) elements.fileImportZip.addEventListener('change', handleZipOrJsonImport);

        // Export CSV
        elements.btnExportCsv.addEventListener('click', exportCsv);

        // Save & Apply
        elements.btnSaveApply.addEventListener('click', saveAndApply);

        // Teams Controls
        elements.teamCountSlider.addEventListener('input', (e) => {
            adjustTeamCount(parseInt(e.target.value, 10));
        });
        elements.btnAddTeam.addEventListener('click', addTeam);

        // Rounds Controls
        elements.btnAddRound.addEventListener('click', addRound);

        // Questions Controls
        elements.qRoundSelector.addEventListener('change', (e) => {
            selectedRoundIndex = parseInt(e.target.value, 10);
            renderQuestionsList();
        });
        elements.btnAddQuestion.addEventListener('click', addQuestion);
        elements.btnDeleteQuestion.addEventListener('click', deleteCurrentQuestion);

        // Media Type dropdowns
        elements.qMediaType.addEventListener('change', () => {
            updateMediaTypeVisibility('q');
            saveCurrentQuestionFromForm();
            renderMediaPreview('q');
        });
        elements.aMediaType.addEventListener('change', () => {
            updateMediaTypeVisibility('a');
            saveCurrentQuestionFromForm();
            renderMediaPreview('a');
        });

        // Live inputs save to active question
        const qInputs = [
            elements.qTextEn, elements.qTextMl, elements.qMediaSrc, elements.qMediaYtStart, elements.qMediaYtEnd,
            elements.aTextEn, elements.aTextMl, elements.aMediaSrc, elements.aMediaYtStart, elements.aMediaYtEnd,
            elements.clue1En, elements.clue1Ml, elements.clue2En, elements.clue2Ml, elements.clue3En, elements.clue3Ml,
            elements.factEn, elements.factMl
        ];
        qInputs.forEach(input => {
            input.addEventListener('input', () => {
                saveCurrentQuestionFromForm();
            });
        });

        elements.qMediaSrc.addEventListener('change', () => renderMediaPreview('q'));
        elements.aMediaSrc.addEventListener('change', () => renderMediaPreview('a'));

        // Prelims Controls & Media Dropdowns
        if (elements.btnAddPrelim) elements.btnAddPrelim.addEventListener('click', () => addPrelimQuestion(false));
        if (elements.btnAddPrelimTB) elements.btnAddPrelimTB.addEventListener('click', () => addPrelimQuestion(true));
        if (elements.btnDeletePrelim) elements.btnDeletePrelim.addEventListener('click', deleteCurrentPrelim);
        if (elements.prelimIsTiebreaker) {
            elements.prelimIsTiebreaker.addEventListener('change', () => {
                saveCurrentPrelimFromForm();
                renderPrelimsList();
            });
        }
        if (elements.pQMediaType) {
            elements.pQMediaType.addEventListener('change', () => {
                updatePrelimMediaTypeVisibility('q');
                saveCurrentPrelimFromForm();
                renderPrelimMediaPreview('q');
            });
        }
        if (elements.pAMediaType) {
            elements.pAMediaType.addEventListener('change', () => {
                updatePrelimMediaTypeVisibility('a');
                saveCurrentPrelimFromForm();
                renderPrelimMediaPreview('a');
            });
        }
        const pLiveInputs = [
            elements.pQTextEn, elements.pQTextMl, elements.pQMediaSrc, elements.pQMediaYtStart, elements.pQMediaYtEnd,
            elements.pATextEn, elements.pATextMl, elements.pAMediaSrc, elements.pAMediaYtStart, elements.pAMediaYtEnd,
            elements.pFactEn, elements.pFactMl
        ];
        pLiveInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    saveCurrentPrelimFromForm();
                });
            }
        });
        if (elements.pQMediaSrc) elements.pQMediaSrc.addEventListener('change', () => renderPrelimMediaPreview('q'));
        if (elements.pAMediaSrc) elements.pAMediaSrc.addEventListener('change', () => renderPrelimMediaPreview('a'));

        // Theme live switcher & broadcast
        if (elements.metaTheme) {
            elements.metaTheme.addEventListener('change', () => {
                const selectedTheme = elements.metaTheme.value || 'emerald';
                if (!currentQuiz.meta) currentQuiz.meta = {};
                currentQuiz.meta.theme = selectedTheme;
                document.documentElement.setAttribute('data-theme', selectedTheme);
                document.body.setAttribute('data-theme', selectedTheme);
                if (stateManager && typeof stateManager.setTheme === 'function') {
                    stateManager.setTheme(selectedTheme);
                }
            });
        }

        // Branding Logo Inputs & File Browsers
        if (elements.btnUploadLogoPrimary && elements.fileLogoPrimary) {
            elements.btnUploadLogoPrimary.addEventListener('click', () => elements.fileLogoPrimary.click());
            elements.fileLogoPrimary.addEventListener('change', (e) => handleLogoFileSelect(e, 'primary'));
        }
        if (elements.btnClearLogoPrimary) {
            elements.btnClearLogoPrimary.addEventListener('click', () => {
                elements.metaLogoPrimary.value = '';
                if (!currentQuiz.meta) currentQuiz.meta = {};
                currentQuiz.meta.logo_primary = '';
                renderLogoPreview('primary', '');
            });
        }
        if (elements.metaLogoPrimary) {
            elements.metaLogoPrimary.addEventListener('input', () => {
                const url = elements.metaLogoPrimary.value.trim();
                if (!currentQuiz.meta) currentQuiz.meta = {};
                currentQuiz.meta.logo_primary = url;
                renderLogoPreview('primary', url);
            });
        }

        if (elements.btnUploadLogoSecondary && elements.fileLogoSecondary) {
            elements.btnUploadLogoSecondary.addEventListener('click', () => elements.fileLogoSecondary.click());
            elements.fileLogoSecondary.addEventListener('change', (e) => handleLogoFileSelect(e, 'secondary'));
        }
        if (elements.btnClearLogoSecondary) {
            elements.btnClearLogoSecondary.addEventListener('click', () => {
                elements.metaLogoSecondary.value = '';
                if (!currentQuiz.meta) currentQuiz.meta = {};
                currentQuiz.meta.logo_secondary = '';
                renderLogoPreview('secondary', '');
            });
        }
        if (elements.metaLogoSecondary) {
            elements.metaLogoSecondary.addEventListener('input', () => {
                const url = elements.metaLogoSecondary.value.trim();
                if (!currentQuiz.meta) currentQuiz.meta = {};
                currentQuiz.meta.logo_secondary = url;
                renderLogoPreview('secondary', url);
            });
        }

        if (elements.metaShowLogos) {
            elements.metaShowLogos.addEventListener('change', () => {
                if (!currentQuiz.meta) currentQuiz.meta = {};
                currentQuiz.meta.show_logos = elements.metaShowLogos.checked;
            });
        }

        if (elements.btnPresetGvcLogos) {
            elements.btnPresetGvcLogos.addEventListener('click', () => {
                if (!currentQuiz.meta) currentQuiz.meta = {};
                currentQuiz.meta.institution = 'Govt. Victoria College, Palakkad';
                currentQuiz.meta.department = 'Department of Botany';
                currentQuiz.meta.logo_primary = 'assets/branding/gvc_college_emblem_512.png';
                currentQuiz.meta.logo_secondary = 'assets/branding/gvc_botany_logo.png';
                currentQuiz.meta.show_logos = true;
                renderMetaTab();
                showToast('Applied Victoria College & Botany logos!');
            });
        }

        if (elements.btnClearAllLogos) {
            elements.btnClearAllLogos.addEventListener('click', () => {
                if (!currentQuiz.meta) currentQuiz.meta = {};
                currentQuiz.meta.logo_primary = '';
                currentQuiz.meta.logo_secondary = '';
                renderMetaTab();
                showToast('Cleared both logos.');
            });
        }
    }

    function renderAll() {
        renderMetaTab();
        renderTeamsTab();
        renderRoundsTab();
        renderQuestionsTab();
        renderPrelimsTab();
    }

    // --- TAB 1: METADATA & BRANDING ---
    function renderMetaTab() {
        const m = currentQuiz.meta || {};
        elements.metaTitle.value = m.title || '';
        elements.metaTitleMl.value = m.title_ml || '';
        elements.metaSubtitle.value = m.subtitle || '';
        elements.metaCurator.value = m.curator || '';
        elements.metaTheme.value = m.theme || 'emerald';

        if (elements.metaInstitution) elements.metaInstitution.value = m.institution || '';
        if (elements.metaDepartment) elements.metaDepartment.value = m.department || '';
        if (elements.metaShowLogos) elements.metaShowLogos.checked = m.show_logos !== false;
        if (elements.metaLogoPrimary) elements.metaLogoPrimary.value = m.logo_primary || '';
        if (elements.metaLogoSecondary) elements.metaLogoSecondary.value = m.logo_secondary || '';

        // Live preview of active theme
        const activeTheme = m.theme || 'emerald';
        document.documentElement.setAttribute('data-theme', activeTheme);
        document.body.setAttribute('data-theme', activeTheme);

        renderLogoPreview('primary', m.logo_primary || '');
        renderLogoPreview('secondary', m.logo_secondary || '');

        const metaInputs = [
            elements.metaTitle, elements.metaTitleMl, elements.metaSubtitle,
            elements.metaCurator, elements.metaInstitution, elements.metaDepartment
        ];
        metaInputs.forEach(el => {
            if (!el) return;
            el.oninput = () => {
                if (!currentQuiz.meta) currentQuiz.meta = {};
                currentQuiz.meta.title = elements.metaTitle.value;
                currentQuiz.meta.title_ml = elements.metaTitleMl.value;
                currentQuiz.meta.subtitle = elements.metaSubtitle.value;
                currentQuiz.meta.curator = elements.metaCurator.value;
                if (elements.metaInstitution) currentQuiz.meta.institution = elements.metaInstitution.value;
                if (elements.metaDepartment) currentQuiz.meta.department = elements.metaDepartment.value;
            };
        });

        updateMediaCountBadge();
    }

    function handleLogoFileSelect(e, type) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            if (!currentQuiz.meta) currentQuiz.meta = {};
            if (type === 'primary') {
                if (elements.metaLogoPrimary) elements.metaLogoPrimary.value = dataUrl;
                currentQuiz.meta.logo_primary = dataUrl;
                renderLogoPreview('primary', dataUrl);
            } else {
                if (elements.metaLogoSecondary) elements.metaLogoSecondary.value = dataUrl;
                currentQuiz.meta.logo_secondary = dataUrl;
                renderLogoPreview('secondary', dataUrl);
            }
            showToast(`Uploaded ${type === 'primary' ? 'primary' : 'secondary'} logo!`);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }

    function renderLogoPreview(type, url) {
        const container = type === 'primary' ? elements.logoPrimaryPreview : elements.logoSecondaryPreview;
        if (!container) return;

        if (url && url.trim()) {
            container.innerHTML = `<img src="${escapeHtml(url)}" alt="Logo Preview" onerror="this.onerror=null; this.parentNode.innerHTML='<span style=\\'color:var(--danger);font-size:0.75rem;\\'>⚠️ Invalid Image URL</span>';">`;
        } else {
            const icon = type === 'primary' ? '🏛️' : '🌿';
            container.innerHTML = `
                <div class="logo-placeholder">
                    <span>${icon}</span>
                    <span>No logo loaded</span>
                </div>
            `;
        }
    }

    // --- TAB 2: TEAMS ---
    function renderTeamsTab() {
        const teams = currentQuiz.teams || [];
        elements.teamCountSlider.value = teams.length;
        elements.teamCountDisplay.textContent = teams.length;
        elements.teamCountBadge.textContent = teams.length;

        elements.teamsContainer.innerHTML = '';
        teams.forEach((team, idx) => {
            const card = document.createElement('div');
            card.className = 'team-editor-card';
            card.style.setProperty('--team-color', team.color || '#10B981');

            card.innerHTML = `
                <div class="team-card-top">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <div class="team-badge-preview">${team.icon || '🦁'}</div>
                        <strong style="color:#fff;">Team #${idx + 1}</strong>
                    </div>
                    <button type="button" class="btn btn-sm btn-danger btn-remove-team" data-index="${idx}">✕</button>
                </div>
                <div class="form-group" style="margin-bottom:0.5rem;">
                    <label class="form-label">Team Name (EN)</label>
                    <input type="text" class="form-input team-name-in" value="${escapeHtml(team.name || '')}">
                </div>
                <div class="form-group" style="margin-bottom:0.5rem;">
                    <label class="form-label">Team Name (ML / Subtitle)</label>
                    <input type="text" class="form-input ml-text team-name-ml-in" value="${escapeHtml(team.name_ml || '')}">
                </div>
                <div class="form-grid" style="grid-template-columns: 1fr 1fr;">
                    <div class="form-group">
                        <label class="form-label">Color</label>
                        <input type="color" class="form-input team-color-in" value="${team.color || '#10B981'}" style="height:38px; padding:2px;">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Emoji / Icon</label>
                        <input type="text" class="form-input team-icon-in" value="${escapeHtml(team.icon || '🦁')}" maxlength="4">
                    </div>
                </div>
            `;

            // Live updates
            const nameIn = card.querySelector('.team-name-in');
            const nameMlIn = card.querySelector('.team-name-ml-in');
            const colorIn = card.querySelector('.team-color-in');
            const iconIn = card.querySelector('.team-icon-in');
            const removeBtn = card.querySelector('.btn-remove-team');

            nameIn.oninput = () => { team.name = nameIn.value; };
            nameMlIn.oninput = () => { team.name_ml = nameMlIn.value; };
            colorIn.oninput = () => {
                team.color = colorIn.value;
                card.style.setProperty('--team-color', team.color);
            };
            iconIn.oninput = () => {
                team.icon = iconIn.value;
                card.querySelector('.team-badge-preview').textContent = team.icon;
            };

            removeBtn.onclick = () => {
                if (currentQuiz.teams.length <= 2) {
                    alert('A quiz must have at least 2 teams.');
                    return;
                }
                currentQuiz.teams.splice(idx, 1);
                renderTeamsTab();
            };

            elements.teamsContainer.appendChild(card);
        });
    }

    function adjustTeamCount(targetCount) {
        const teams = currentQuiz.teams;
        const defaultPalette = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#A855F7'];
        const defaultIcons = ['🔥', '⚡', '🌊', '🌿', '🦅', '🦁', '⭐', '💎', '🚀', '👑', '🎯', '🌙'];

        while (teams.length < targetCount) {
            const nextIdx = teams.length + 1;
            teams.push({
                id: `team_${nextIdx}`,
                num: nextIdx,
                name: `Team ${String.fromCharCode(64 + nextIdx)}`,
                name_ml: `ടീം ${nextIdx}`,
                color: defaultPalette[(nextIdx - 1) % defaultPalette.length],
                color_dark: '#000000',
                icon: defaultIcons[(nextIdx - 1) % defaultIcons.length],
                score: 0
            });
        }
        while (teams.length > targetCount) {
            teams.pop();
        }
        renderTeamsTab();
    }

    function addTeam() {
        if (currentQuiz.teams.length >= 12) {
            alert('Maximum 12 teams supported.');
            return;
        }
        adjustTeamCount(currentQuiz.teams.length + 1);
    }

    // --- TAB 3: ROUNDS ---
    function renderRoundsTab() {
        const rounds = currentQuiz.rounds || [];
        elements.roundCountBadge.textContent = rounds.length;
        elements.roundsContainer.innerHTML = '';

        rounds.forEach((round, idx) => {
            const card = document.createElement('div');
            card.className = 'round-item-card';

            card.innerHTML = `
                <div class="round-item-top">
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <span class="round-type-pill">Round #${idx + 1}</span>
                        <strong style="color:#fff; font-size:1.05rem;">${escapeHtml(round.title || 'Untitled Round')}</strong>
                    </div>
                    <div style="display:flex; gap:0.4rem;">
                        <button type="button" class="btn btn-sm btn-move-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>▲</button>
                        <button type="button" class="btn btn-sm btn-move-down" data-idx="${idx}" ${idx === rounds.length - 1 ? 'disabled' : ''}>▼</button>
                        <button type="button" class="btn btn-sm btn-danger btn-remove-round" data-idx="${idx}">🗑️</button>
                    </div>
                </div>

                <div class="form-grid" style="grid-template-columns: 2fr 1fr;">
                    <div class="form-group">
                        <label class="form-label">Round Title (EN)</label>
                        <input type="text" class="form-input round-title-in" value="${escapeHtml(round.title || '')}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Round Type</label>
                        <select class="form-select round-type-select">
                            <option value="direct_pass" ${round.type === 'direct_pass' ? 'selected' : ''}>Direct & Pass (+10 / +5)</option>
                            <option value="pounce_bounce" ${round.type === 'pounce_bounce' ? 'selected' : ''}>Pounce & Bounce</option>
                            <option value="visual" ${round.type === 'visual' ? 'selected' : ''}>Visual Safari (Picture Round)</option>
                            <option value="audio" ${round.type === 'audio' ? 'selected' : ''}>Acoustic Arena (Audio Round)</option>
                            <option value="video" ${round.type === 'video' ? 'selected' : ''}>Video & Cinema (MP4 / YouTube)</option>
                            <option value="clue_hunter" ${round.type === 'clue_hunter' ? 'selected' : ''}>Clue Hunter (Progressive Clues)</option>
                            <option value="buzzer" ${round.type === 'buzzer' ? 'selected' : ''}>Speed Buzzer / Rapid Fire</option>
                            <option value="prelims" ${round.type === 'prelims' ? 'selected' : ''}>Written Prelims</option>
                        </select>
                    </div>
                </div>

                <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));">
                    <div class="form-group">
                        <label class="form-label">Direct (Pts)</label>
                        <input type="number" class="form-input r-pts-direct" value="${(round.scoring && round.scoring.direct) !== undefined ? round.scoring.direct : 10}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Pass (Pts)</label>
                        <input type="number" class="form-input r-pts-pass" value="${(round.scoring && round.scoring.pass) !== undefined ? round.scoring.pass : 5}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Penalty (Pts)</label>
                        <input type="number" class="form-input r-pts-penalty" value="${(round.scoring && round.scoring.penalty) !== undefined ? round.scoring.penalty : 0}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Timer (Sec)</label>
                        <input type="number" class="form-input r-timer-sec" value="${round.timing_sec || 30}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Questions</label>
                        <div style="font-weight:700; color:var(--accent); padding-top:0.5rem;">${(round.question_ids && round.question_ids.length) || 0} Questions</div>
                    </div>
                </div>
            `;

            // Bind inputs
            const titleIn = card.querySelector('.round-title-in');
            const typeSel = card.querySelector('.round-type-select');
            const directIn = card.querySelector('.r-pts-direct');
            const passIn = card.querySelector('.r-pts-pass');
            const penaltyIn = card.querySelector('.r-pts-penalty');
            const timerIn = card.querySelector('.r-timer-sec');

            titleIn.oninput = () => { round.title = titleIn.value; };
            typeSel.onchange = () => { round.type = typeSel.value; };
            directIn.oninput = () => { if (!round.scoring) round.scoring = {}; round.scoring.direct = parseInt(directIn.value, 10); };
            passIn.oninput = () => { if (!round.scoring) round.scoring = {}; round.scoring.pass = parseInt(passIn.value, 10); };
            penaltyIn.oninput = () => { if (!round.scoring) round.scoring = {}; round.scoring.penalty = parseInt(penaltyIn.value, 10); };
            timerIn.oninput = () => { round.timing_sec = parseInt(timerIn.value, 10); };

            // Reorder & Delete buttons
            card.querySelector('.btn-move-up').onclick = () => {
                if (idx > 0) {
                    const temp = rounds[idx - 1];
                    rounds[idx - 1] = rounds[idx];
                    rounds[idx] = temp;
                    renderRoundsTab();
                    renderQuestionsTab();
                }
            };
            card.querySelector('.btn-move-down').onclick = () => {
                if (idx < rounds.length - 1) {
                    const temp = rounds[idx + 1];
                    rounds[idx + 1] = rounds[idx];
                    rounds[idx] = temp;
                    renderRoundsTab();
                    renderQuestionsTab();
                }
            };
            card.querySelector('.btn-remove-round').onclick = () => {
                if (rounds.length <= 1) {
                    alert('Quiz must contain at least 1 round.');
                    return;
                }
                if (confirm(`Delete "${round.title}" and its questions?`)) {
                    rounds.splice(idx, 1);
                    selectedRoundIndex = Math.max(0, selectedRoundIndex - 1);
                    renderRoundsTab();
                    renderQuestionsTab();
                }
            };

            elements.roundsContainer.appendChild(card);
        });
    }

    function addRound() {
        const nextNum = (currentQuiz.rounds && currentQuiz.rounds.length + 1) || 1;
        const newRound = {
            round_id: `r${nextNum}`,
            round_num: nextNum,
            title: `Round ${nextNum}: New Round`,
            title_ml: `റൗണ്ട് ${nextNum}`,
            type: 'direct_pass',
            format: 'Direct (+10), Pass (+5)',
            timing_sec: 30,
            pass_timing_sec: 15,
            scoring: { direct: 10, pass: 5, wrong: 0 },
            question_ids: []
        };
        currentQuiz.rounds.push(newRound);
        renderRoundsTab();
        renderQuestionsTab();
    }

    // --- TAB 4: QUESTIONS & MEDIA ---
    function renderQuestionsTab() {
        // Populate round selector dropdown
        elements.qRoundSelector.innerHTML = '';
        currentQuiz.rounds.forEach((round, rIdx) => {
            const opt = document.createElement('option');
            opt.value = rIdx;
            opt.textContent = `${round.title || `Round ${rIdx + 1}`} (${(round.question_ids && round.question_ids.length) || 0} Qs)`;
            if (rIdx === selectedRoundIndex) opt.selected = true;
            elements.qRoundSelector.appendChild(opt);
        });

        renderQuestionsList();
    }

    function renderQuestionsList() {
        const round = currentQuiz.rounds[selectedRoundIndex];
        elements.questionNavList.innerHTML = '';

        if (!round || !round.question_ids || round.question_ids.length === 0) {
            elements.questionNavList.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; padding:0.5rem;">No questions in this round. Click "+ Add" to create one.</div>';
            clearQuestionForm();
            return;
        }

        // Set first question active if none selected
        if (!selectedQuestionId || !round.question_ids.includes(selectedQuestionId)) {
            selectedQuestionId = round.question_ids[0];
        }

        round.question_ids.forEach((qid, qIdx) => {
            const qData = currentQuiz.all_stage_questions[String(qid)] || {};
            const btn = document.createElement('button');
            btn.className = `question-nav-item ${qid === selectedQuestionId ? 'active' : ''}`;
            btn.type = 'button';

            const serial = qData.serial || `Q${qIdx + 1}`;
            const shortPrompt = (qData.question_en || 'Empty question').substring(0, 32);

            btn.innerHTML = `<span><strong>${serial}</strong></span><span style="opacity:0.75; font-size:0.75rem;">${shortPrompt}...</span>`;
            btn.onclick = () => {
                saveCurrentQuestionFromForm();
                selectedQuestionId = qid;
                renderQuestionsList();
                loadQuestionIntoForm(qid);
            };

            elements.questionNavList.appendChild(btn);
        });

        loadQuestionIntoForm(selectedQuestionId);
    }

    function loadQuestionIntoForm(qid) {
        const qData = currentQuiz.all_stage_questions[String(qid)];
        if (!qData) {
            clearQuestionForm();
            return;
        }

        elements.activeQuestionSerialBadge.textContent = qData.serial || `Q${qid}`;
        elements.activeQuestionHeading.textContent = `Question: ${qData.serial || qid}`;

        elements.qTextEn.value = qData.question_en || '';
        elements.qTextMl.value = qData.question_ml || '';

        // Question Media
        elements.qMediaType.value = qData.q_media_type || (qData.image && qData.has_visual ? 'image' : (qData.audio ? 'audio' : 'none'));
        elements.qMediaSrc.value = qData.q_media_url || qData.image || qData.audio || '';
        elements.qMediaYtStart.value = qData.q_media_yt_start || 0;
        elements.qMediaYtEnd.value = qData.q_media_yt_end || 0;
        updateMediaTypeVisibility('q');
        renderMediaPreview('q');

        // Answer
        elements.aTextEn.value = qData.answer_en || '';
        elements.aTextMl.value = qData.answer_ml || '';

        // Answer Media
        elements.aMediaType.value = qData.a_media_type || (qData.image && !qData.has_visual ? 'image' : 'none');
        elements.aMediaSrc.value = qData.a_media_url || (qData.image && !qData.has_visual ? qData.image : '');
        elements.aMediaYtStart.value = qData.a_media_yt_start || 0;
        elements.aMediaYtEnd.value = qData.a_media_yt_end || 0;
        updateMediaTypeVisibility('a');
        renderMediaPreview('a');

        // Clues
        const round = currentQuiz.rounds[selectedRoundIndex];
        const isClueRound = round && round.type === 'clue_hunter';
        elements.cluesSection.style.display = isClueRound ? 'block' : 'none';

        if (Array.isArray(qData.clues) && qData.clues.length >= 3) {
            elements.clue1En.value = qData.clues[0].clue_en || '';
            elements.clue1Ml.value = qData.clues[0].clue_ml || '';
            elements.clue2En.value = qData.clues[1].clue_en || '';
            elements.clue2Ml.value = qData.clues[1].clue_ml || '';
            elements.clue3En.value = qData.clues[2].clue_en || '';
            elements.clue3Ml.value = qData.clues[2].clue_ml || '';
        } else {
            elements.clue1En.value = '';
            elements.clue1Ml.value = '';
            elements.clue2En.value = '';
            elements.clue2Ml.value = '';
            elements.clue3En.value = '';
            elements.clue3Ml.value = '';
        }

        // Facts
        elements.factEn.value = qData.fact_en || '';
        elements.factMl.value = qData.fact_ml || '';
    }

    function saveCurrentQuestionFromForm() {
        if (!selectedQuestionId) return;
        const qData = currentQuiz.all_stage_questions[String(selectedQuestionId)];
        if (!qData) return;

        qData.question_en = elements.qTextEn.value;
        qData.question_ml = elements.qTextMl.value;

        // Question Media
        qData.q_media_type = elements.qMediaType.value;
        qData.q_media_url = elements.qMediaSrc.value.trim();
        qData.q_media_yt_start = parseInt(elements.qMediaYtStart.value, 10) || 0;
        qData.q_media_yt_end = parseInt(elements.qMediaYtEnd.value, 10) || 0;

        // Answer
        qData.answer_en = elements.aTextEn.value;
        qData.answer_ml = elements.aTextMl.value;

        // Answer Media
        qData.a_media_type = elements.aMediaType.value;
        qData.a_media_url = elements.aMediaSrc.value.trim();
        qData.a_media_yt_start = parseInt(elements.aMediaYtStart.value, 10) || 0;
        qData.a_media_yt_end = parseInt(elements.aMediaYtEnd.value, 10) || 0;

        // Clues
        const round = currentQuiz.rounds[selectedRoundIndex];
        if (round && round.type === 'clue_hunter') {
            qData.clues = [
                { pts: 15, clue_en: elements.clue1En.value, clue_ml: elements.clue1Ml.value },
                { pts: 10, clue_en: elements.clue2En.value, clue_ml: elements.clue2Ml.value },
                { pts: 5, clue_en: elements.clue3En.value, clue_ml: elements.clue3Ml.value }
            ];
        }

        // Facts
        qData.fact_en = elements.factEn.value;
        qData.fact_ml = elements.factMl.value;
    }

    function clearQuestionForm() {
        elements.activeQuestionSerialBadge.textContent = 'None';
        elements.activeQuestionHeading.textContent = 'No Question Selected';
        elements.qTextEn.value = '';
        elements.qTextMl.value = '';
        elements.qMediaType.value = 'none';
        elements.qMediaSrc.value = '';
        elements.aTextEn.value = '';
        elements.aTextMl.value = '';
        elements.aMediaType.value = 'none';
        elements.aMediaSrc.value = '';
        elements.factEn.value = '';
        elements.factMl.value = '';
        elements.qMediaPreview.innerHTML = '<div class="media-preview-placeholder"><span>Preview will appear here</span></div>';
        elements.aMediaPreview.innerHTML = '<div class="media-preview-placeholder"><span>Preview will appear here</span></div>';
    }

    function addQuestion() {
        const round = currentQuiz.rounds[selectedRoundIndex];
        if (!round) return;

        const nextNum = (round.question_ids && round.question_ids.length + 1) || 1;
        const newQid = Date.now();
        const rNum = selectedRoundIndex + 1;
        const serial = `R${rNum < 10 ? '0' + rNum : rNum}-Q${nextNum}`;

        const newQ = {
            id: newQid,
            serial: serial,
            serial_no: serial,
            round_id: round.round_id,
            question_en: 'New Question Prompt',
            question_ml: '',
            answer_en: 'New Answer',
            answer_ml: '',
            q_media_type: 'none',
            q_media_url: '',
            a_media_type: 'none',
            a_media_url: '',
            fact_en: '',
            fact_ml: ''
        };

        if (!round.question_ids) round.question_ids = [];
        round.question_ids.push(newQid);
        currentQuiz.all_stage_questions[String(newQid)] = newQ;

        selectedQuestionId = newQid;
        renderQuestionsTab();
    }

    function deleteCurrentQuestion() {
        const round = currentQuiz.rounds[selectedRoundIndex];
        if (!round || !selectedQuestionId) return;

        if (confirm(`Delete question ${elements.activeQuestionSerialBadge.textContent}?`)) {
            const idx = round.question_ids.indexOf(selectedQuestionId);
            if (idx !== -1) {
                round.question_ids.splice(idx, 1);
            }
            delete currentQuiz.all_stage_questions[String(selectedQuestionId)];
            selectedQuestionId = (round.question_ids && round.question_ids[0]) || null;
            renderQuestionsTab();
        }
    }

    function updateMediaTypeVisibility(prefix) {
        const typeEl = prefix === 'q' ? elements.qMediaType : elements.aMediaType;
        const fieldsEl = prefix === 'q' ? elements.qMediaFields : elements.aMediaFields;
        const isNone = typeEl.value === 'none';
        fieldsEl.style.display = isNone ? 'none' : 'block';

        const isYT = typeEl.value === 'youtube';
        const ytFields = document.querySelectorAll(prefix === 'q' ? '.yt-only-field' : '.a-yt-only-field');
        ytFields.forEach(f => f.style.display = isYT ? 'flex' : 'none');
    }

    function renderMediaPreview(prefix) {
        const typeEl = prefix === 'q' ? elements.qMediaType : elements.aMediaType;
        const srcEl = prefix === 'q' ? elements.qMediaSrc : elements.aMediaSrc;
        const previewEl = prefix === 'q' ? elements.qMediaPreview : elements.aMediaPreview;
        const startEl = prefix === 'q' ? elements.qMediaYtStart : elements.aMediaYtStart;
        const endEl = prefix === 'q' ? elements.qMediaYtEnd : elements.aMediaYtEnd;

        const mediaType = typeEl.value;
        const mediaSrc = srcEl.value.trim();

        if (mediaType === 'none' || !mediaSrc) {
            previewEl.innerHTML = '<div class="media-preview-placeholder"><span>No media attached</span></div>';
            return;
        }

        if (window.MediaPlayer) {
            window.MediaPlayer.render(previewEl, {
                type: mediaType,
                src: mediaSrc,
                start: parseInt(startEl.value, 10) || 0,
                end: parseInt(endEl.value, 10) || 0
            }, { isQMView: true });
        }
    }

    // --- TAB 5: PRELIMS SCREENING STUDIO ---
    function renderPrelimsTab() {
        const prelims = currentQuiz.prelims || [];
        const regularCount = prelims.filter(p => !p.is_tiebreaker).length;
        const tbCount = prelims.filter(p => p.is_tiebreaker).length;

        if (elements.prelimCountBadge) elements.prelimCountBadge.textContent = prelims.length;
        if (elements.prelimTotalBadge) elements.prelimTotalBadge.textContent = `${prelims.length} Total`;
        if (elements.prelimRegularCountDisplay) elements.prelimRegularCountDisplay.textContent = `${regularCount} Regular Qs`;
        if (elements.prelimTBCountDisplay) elements.prelimTBCountDisplay.textContent = `${tbCount} Tie-Breakers`;

        if (elements.prelimTimerDuration) {
            elements.prelimTimerDuration.value = currentQuiz.prelimTimerDuration || 30;
            elements.prelimTimerDuration.oninput = () => {
                currentQuiz.prelimTimerDuration = parseInt(elements.prelimTimerDuration.value, 10) || 30;
            };
        }
        if (elements.prelimAutoAdvanceDefault) {
            elements.prelimAutoAdvanceDefault.checked = currentQuiz.prelimAutoAdvance !== false;
            elements.prelimAutoAdvanceDefault.onchange = () => {
                currentQuiz.prelimAutoAdvance = elements.prelimAutoAdvanceDefault.checked;
            };
        }

        renderPrelimsList();
    }

    function renderPrelimsList() {
        const prelims = currentQuiz.prelims || [];
        if (!elements.prelimNavList) return;
        elements.prelimNavList.innerHTML = '';

        if (prelims.length === 0) {
            elements.prelimNavList.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; padding:0.5rem;">No prelim screening questions yet. Click "+ Add Prelim Q" to create one.</div>';
            clearPrelimForm();
            return;
        }

        if (selectedPrelimIndex >= prelims.length) {
            selectedPrelimIndex = 0;
        }

        prelims.forEach((p, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `question-nav-item ${idx === selectedPrelimIndex ? 'active' : ''}`;
            const isTB = Boolean(p.is_tiebreaker);
            const serial = p.serial_no || (isTB ? `TB${idx + 1}` : `P${String(idx + 1).padStart(2, '0')}`);
            const shortPrompt = (p.question_en || p.prompt_en || 'Empty question').substring(0, 32);
            const hasMedia = (p.q_media_type && p.q_media_type !== 'none') || (p.a_media_type && p.a_media_type !== 'none') || p.image;

            btn.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <span style="font-weight:700; color:${isTB ? '#f59e0b' : '#34d399'};">${isTB ? '🚨 ' : ''}${serial}</span>
                    ${hasMedia ? '<span style="font-size:0.7rem; opacity:0.8;">📷</span>' : ''}
                </div>
                <span style="opacity:0.75; font-size:0.75rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block;">${escapeHtml(shortPrompt)}...</span>
            `;

            btn.onclick = () => {
                saveCurrentPrelimFromForm();
                selectedPrelimIndex = idx;
                renderPrelimsList();
                loadPrelimIntoForm(idx);
            };

            elements.prelimNavList.appendChild(btn);
        });

        loadPrelimIntoForm(selectedPrelimIndex);
    }

    function loadPrelimIntoForm(idx) {
        const p = (currentQuiz.prelims && currentQuiz.prelims[idx]) || null;
        if (!p) {
            clearPrelimForm();
            return;
        }

        const isTB = Boolean(p.is_tiebreaker);
        const serial = p.serial_no || (isTB ? `TB${idx + 1}` : `P${String(idx + 1).padStart(2, '0')}`);
        if (elements.activePrelimSerialBadge) {
            elements.activePrelimSerialBadge.textContent = serial;
            elements.activePrelimSerialBadge.style.background = isTB ? '#d97706' : '#059669';
        }
        if (elements.activePrelimHeading) {
            elements.activePrelimHeading.textContent = `Prelim: ${serial}`;
        }

        if (elements.prelimIsTiebreaker) elements.prelimIsTiebreaker.checked = isTB;
        if (elements.pQTextEn) elements.pQTextEn.value = p.question_en || p.prompt_en || '';
        if (elements.pQTextMl) elements.pQTextMl.value = p.question_ml || p.prompt_ml || '';

        // Question Media
        if (elements.pQMediaType) {
            elements.pQMediaType.value = p.q_media_type || (p.image && p.has_visual ? 'image' : 'none');
            elements.pQMediaSrc.value = p.q_media_url || (p.image && p.has_visual ? p.image : '') || '';
            elements.pQMediaYtStart.value = p.q_media_yt_start || 0;
            elements.pQMediaYtEnd.value = p.q_media_yt_end || 0;
            updatePrelimMediaTypeVisibility('q');
            renderPrelimMediaPreview('q');
        }

        // Answer
        if (elements.pATextEn) elements.pATextEn.value = p.answer_en || '';
        if (elements.pATextMl) elements.pATextMl.value = p.answer_ml || '';

        // Answer Media
        if (elements.pAMediaType) {
            elements.pAMediaType.value = p.a_media_type || (p.image && !p.has_visual ? 'image' : 'none');
            elements.pAMediaSrc.value = p.a_media_url || (p.image && !p.has_visual ? p.image : '') || '';
            elements.pAMediaYtStart.value = p.a_media_yt_start || 0;
            elements.pAMediaYtEnd.value = p.a_media_yt_end || 0;
            updatePrelimMediaTypeVisibility('a');
            renderPrelimMediaPreview('a');
        }

        if (elements.pFactEn) elements.pFactEn.value = p.fact_en || '';
        if (elements.pFactMl) elements.pFactMl.value = p.fact_ml || '';
    }

    function saveCurrentPrelimFromForm() {
        if (!currentQuiz.prelims || currentQuiz.prelims.length === 0) return;
        const p = currentQuiz.prelims[selectedPrelimIndex];
        if (!p) return;

        if (elements.prelimIsTiebreaker) p.is_tiebreaker = elements.prelimIsTiebreaker.checked;
        if (elements.pQTextEn) {
            p.question_en = elements.pQTextEn.value;
            p.prompt_en = p.question_en;
        }
        if (elements.pQTextMl) {
            p.question_ml = elements.pQTextMl.value;
            p.prompt_ml = p.question_ml;
        }

        if (elements.pQMediaType) {
            p.q_media_type = elements.pQMediaType.value;
            p.q_media_url = (elements.pQMediaSrc.value || '').trim();
            p.q_media_yt_start = parseInt(elements.pQMediaYtStart.value, 10) || 0;
            p.q_media_yt_end = parseInt(elements.pQMediaYtEnd.value, 10) || 0;
        }

        if (elements.pATextEn) p.answer_en = elements.pATextEn.value;
        if (elements.pATextMl) p.answer_ml = elements.pATextMl.value;

        if (elements.pAMediaType) {
            p.a_media_type = elements.pAMediaType.value;
            p.a_media_url = (elements.pAMediaSrc.value || '').trim();
            p.a_media_yt_start = parseInt(elements.pAMediaYtStart.value, 10) || 0;
            p.a_media_yt_end = parseInt(elements.pAMediaYtEnd.value, 10) || 0;
        }

        if (p.a_media_type === 'image' && p.a_media_url) {
            p.image = p.a_media_url;
            p.has_visual = false;
        } else if (p.q_media_type === 'image' && p.q_media_url) {
            p.image = p.q_media_url;
            p.has_visual = true;
        }

        if (elements.pFactEn) p.fact_en = elements.pFactEn.value;
        if (elements.pFactMl) p.fact_ml = elements.pFactMl.value;
    }

    function clearPrelimForm() {
        if (elements.activePrelimSerialBadge) elements.activePrelimSerialBadge.textContent = 'None';
        if (elements.activePrelimHeading) elements.activePrelimHeading.textContent = 'No Prelim Selected';
        if (elements.prelimIsTiebreaker) elements.prelimIsTiebreaker.checked = false;
        if (elements.pQTextEn) elements.pQTextEn.value = '';
        if (elements.pQTextMl) elements.pQTextMl.value = '';
        if (elements.pQMediaType) elements.pQMediaType.value = 'none';
        if (elements.pQMediaSrc) elements.pQMediaSrc.value = '';
        if (elements.pATextEn) elements.pATextEn.value = '';
        if (elements.pATextMl) elements.pATextMl.value = '';
        if (elements.pAMediaType) elements.pAMediaType.value = 'none';
        if (elements.pAMediaSrc) elements.pAMediaSrc.value = '';
        if (elements.pFactEn) elements.pFactEn.value = '';
        if (elements.pFactMl) elements.pFactMl.value = '';
        if (elements.pQMediaPreview) elements.pQMediaPreview.innerHTML = '<div class="media-preview-placeholder"><span>Question media preview</span></div>';
        if (elements.pAMediaPreview) elements.pAMediaPreview.innerHTML = '<div class="media-preview-placeholder"><span>Answer media preview</span></div>';
    }

    function addPrelimQuestion(isTiebreaker = false) {
        saveCurrentPrelimFromForm();
        if (!Array.isArray(currentQuiz.prelims)) currentQuiz.prelims = [];

        const existingCount = currentQuiz.prelims.length;
        const num = existingCount + 1;
        const serial = isTiebreaker 
            ? `TB${currentQuiz.prelims.filter(p => p.is_tiebreaker).length + 1}`
            : `P${String(currentQuiz.prelims.filter(p => !p.is_tiebreaker).length + 1).padStart(2, '0')}`;

        const newPrelim = {
            num: num,
            serial_no: serial,
            serial: serial,
            is_tiebreaker: isTiebreaker,
            question_en: `New Prelim Question #${num}`,
            question_ml: '',
            answer_en: 'Answer',
            answer_ml: '',
            q_media_type: 'none',
            q_media_url: '',
            a_media_type: 'none',
            a_media_url: '',
            fact_en: '',
            fact_ml: ''
        };

        currentQuiz.prelims.push(newPrelim);
        selectedPrelimIndex = currentQuiz.prelims.length - 1;
        renderPrelimsTab();
        showToast(`Added ${isTiebreaker ? 'Tie-Breaker' : 'Prelim'} question ${serial}!`);
    }

    function deleteCurrentPrelim() {
        if (!currentQuiz.prelims || currentQuiz.prelims.length === 0) return;
        const p = currentQuiz.prelims[selectedPrelimIndex];
        if (!p) return;

        if (confirm(`Delete Prelim question "${p.serial_no || p.num}"?`)) {
            currentQuiz.prelims.splice(selectedPrelimIndex, 1);
            selectedPrelimIndex = Math.max(0, selectedPrelimIndex - 1);
            renderPrelimsTab();
            showToast('Prelim question deleted.');
        }
    }

    function updatePrelimMediaTypeVisibility(prefix) {
        const typeEl = prefix === 'q' ? elements.pQMediaType : elements.pAMediaType;
        const fieldsEl = prefix === 'q' ? elements.pQMediaFields : elements.pAMediaFields;
        if (!typeEl || !fieldsEl) return;
        const isNone = typeEl.value === 'none';
        fieldsEl.style.display = isNone ? 'none' : 'block';

        const isYT = typeEl.value === 'youtube';
        const ytFields = document.querySelectorAll(prefix === 'q' ? '.p-q-yt-only' : '.p-a-yt-only');
        ytFields.forEach(f => f.style.display = isYT ? 'flex' : 'none');
    }

    function renderPrelimMediaPreview(prefix) {
        const typeEl = prefix === 'q' ? elements.pQMediaType : elements.pAMediaType;
        const srcEl = prefix === 'q' ? elements.pQMediaSrc : elements.pAMediaSrc;
        const previewEl = prefix === 'q' ? elements.pQMediaPreview : elements.pAMediaPreview;
        const startEl = prefix === 'q' ? elements.pQMediaYtStart : elements.pAMediaYtStart;
        const endEl = prefix === 'q' ? elements.pQMediaYtEnd : elements.pAMediaYtEnd;
        if (!typeEl || !srcEl || !previewEl) return;

        const mediaType = typeEl.value;
        const mediaSrc = srcEl.value.trim();

        if (mediaType === 'none' || !mediaSrc) {
            previewEl.innerHTML = `<div class="media-preview-placeholder"><span>${prefix === 'q' ? 'Question' : 'Answer'} preview will appear here</span></div>`;
            return;
        }

        if (window.MediaPlayer) {
            window.MediaPlayer.render(previewEl, {
                type: mediaType,
                src: mediaSrc,
                start: parseInt(startEl ? startEl.value : 0, 10) || 0,
                end: parseInt(endEl ? endEl.value : 0, 10) || 0
            }, { isQMView: true });
        }
    }

    // --- PRESETS & PERSISTENCE ---
    function loadPreset(presetKey) {
        if (presetKey === 'sample_multimedia' && typeof PRESET_SAMPLE_MULTIMEDIA !== 'undefined') {
            currentQuiz = JSON.parse(JSON.stringify(PRESET_SAMPLE_MULTIMEDIA));
        } else if (presetKey === 'sahyadri_wildlife' && typeof PRESET_SAHYADRI_WILDLIFE_2026 !== 'undefined') {
            currentQuiz = JSON.parse(JSON.stringify(PRESET_SAHYADRI_WILDLIFE_2026));
        } else if (presetKey === 'clean_blank') {
            currentQuiz = getBlankQuizTemplate();
        } else {
            alert('Preset not found.');
            return;
        }

        normalizeQuizStructure(currentQuiz);
        selectedRoundIndex = 0;
        selectedQuestionId = null;
        selectedPrelimIndex = 0;
        renderAll();
        showToast('Preset loaded successfully! Click "Save & Apply" to deploy.');
    }

    function exportJson() {
        saveCurrentQuestionFromForm();
        saveCurrentPrelimFromForm();
        const jsonStr = JSON.stringify(currentQuiz, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = (currentQuiz.meta.title || 'quiz').toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.quiz.json';
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleFileImport(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                normalizeQuizStructure(parsed);
                currentQuiz = parsed;
                selectedRoundIndex = 0;
                selectedQuestionId = null;
                renderAll();
                showToast('Quiz package imported successfully!');
            } catch (err) {
                alert('Invalid JSON file format: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    // --- PORTABLE ZIP BUNDLE (OFFLINE & PC-TO-PC TRANSFER) ---
    function getReferencedMediaStats(quiz) {
        quiz = quiz || currentQuiz;
        if (!quiz) return { count: 0, files: [] };
        const files = new Set();
        const m = quiz.meta || {};
        if (m.logo_primary && !m.logo_primary.startsWith('http://') && !m.logo_primary.startsWith('https://')) files.add(m.logo_primary);
        if (m.logo_secondary && !m.logo_secondary.startsWith('http://') && !m.logo_secondary.startsWith('https://')) files.add(m.logo_secondary);

        Object.values(quiz.all_stage_questions || {}).forEach(q => {
            if (q.q_media_url && !q.q_media_url.startsWith('http://') && !q.q_media_url.startsWith('https://')) files.add(q.q_media_url);
            if (q.a_media_url && !q.a_media_url.startsWith('http://') && !q.a_media_url.startsWith('https://')) files.add(q.a_media_url);
        });

        (quiz.prelims || []).forEach(p => {
            if (p.q_media_url && !p.q_media_url.startsWith('http://') && !p.q_media_url.startsWith('https://')) files.add(p.q_media_url);
            if (p.a_media_url && !p.a_media_url.startsWith('http://') && !p.a_media_url.startsWith('https://')) files.add(p.a_media_url);
        });

        return {
            count: files.size,
            files: Array.from(files)
        };
    }

    function updateMediaCountBadge() {
        if (!elements.bundleMediaCountBadge) return;
        const stats = getReferencedMediaStats(currentQuiz);
        elements.bundleMediaCountBadge.textContent = `📦 ${stats.count} Media File${stats.count === 1 ? '' : 's'} Linked`;
    }

    async function exportZipBundle() {
        saveCurrentQuestionFromForm();
        saveCurrentPrelimFromForm();

        const stats = getReferencedMediaStats(currentQuiz);
        showToast(`⏳ Bundling ${stats.count} media file(s) into portable ZIP...`);

        try {
            const resp = await fetch('/api/export_quiz_zip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentQuiz)
            });

            if (!resp.ok) {
                throw new Error(`Server returned HTTP ${resp.status}`);
            }

            const blob = await resp.blob();
            let filename = `QuizzMaster_${(currentQuiz.meta?.title || 'quiz').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_package.zip`;
            const cdHeader = resp.headers.get('Content-Disposition');
            if (cdHeader && cdHeader.includes('filename=')) {
                const match = cdHeader.match(/filename="?([^"]+)"?/);
                if (match && match[1]) filename = match[1];
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            const mb = (blob.size / (1024 * 1024)).toFixed(2);
            showToast(`✅ Portable ZIP exported (${mb} MB, ${stats.count} media files)! Transfer this file to PC2.`);
        } catch (err) {
            console.error('Export ZIP error:', err);
            alert('Failed to generate ZIP package from local server: ' + err.message + '\n\nMake sure server.py is running on PC1!');
        }
    }

    async function handleZipOrJsonImport(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const isZip = file.name.toLowerCase().endsWith('.zip') || (file.type && file.type.includes('zip'));

        if (isZip) {
            showToast(`⏳ Unpacking ${file.name} and extracting media assets onto this PC...`);
            try {
                const resp = await fetch('/api/import_quiz_zip', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/zip'
                    },
                    body: file
                });

                const result = await resp.json();
                if (!resp.ok || !result.success) {
                    throw new Error(result.error || result.message || 'Import failed');
                }

                const importedQuiz = result.quiz || result.quiz_data;
                if (importedQuiz) {
                    normalizeQuizStructure(importedQuiz);
                    currentQuiz = importedQuiz;
                }

                // Persist & synchronize
                try {
                    localStorage.setItem('QUIZZMASTER_ACTIVE_PACKAGE', JSON.stringify(currentQuiz));
                } catch (e) {}

                window.QUIZ_DATA = currentQuiz;
                if (stateManager && typeof stateManager.updateQuizPackage === 'function') {
                    stateManager.updateQuizPackage(currentQuiz);
                }

                selectedRoundIndex = 0;
                selectedQuestionId = null;
                selectedPrelimIndex = 0;
                renderAll();

                const extractedCount = result.media_count !== undefined ? result.media_count : ((result.files_extracted && result.files_extracted.length) || 0);
                showToast(`🎉 ZIP imported! Extracted ${extractedCount} media files & activated quiz.`);
                alert(`🎉 Quiz imported successfully!\n\n• Quiz: ${currentQuiz.meta?.title || 'Quiz'}\n• Unpacked: ${extractedCount} media files\n• Active on: This PC (${window.location.origin})`);
            } catch (err) {
                console.error('Import ZIP error:', err);
                alert('Failed to import ZIP bundle: ' + err.message + '\n\nEnsure server.py is running on this PC!');
            }
        } else {
            // JSON fallback
            handleFileImport(e);
        }
        e.target.value = '';
    }

    function exportCsv() {
        saveCurrentQuestionFromForm();
        let csv = 'Serial,Round,Question (EN),Question (ML),Answer (EN),Answer (ML),Question Media Type,Question Media URL,Answer Media Type,Answer Media URL,Fun Fact\n';

        currentQuiz.rounds.forEach(r => {
            (r.question_ids || []).forEach(qid => {
                const q = currentQuiz.all_stage_questions[String(qid)] || {};
                const row = [
                    q.serial || '',
                    r.title || '',
                    cleanCsvCell(q.question_en || ''),
                    cleanCsvCell(q.question_ml || ''),
                    cleanCsvCell(q.answer_en || ''),
                    cleanCsvCell(q.answer_ml || ''),
                    q.q_media_type || 'none',
                    cleanCsvCell(q.q_media_url || ''),
                    q.a_media_type || 'none',
                    cleanCsvCell(q.a_media_url || ''),
                    cleanCsvCell(q.fact_en || '')
                ];
                csv += row.join(',') + '\n';
            });
        });

        // Export Prelims questions too
        (currentQuiz.prelims || []).forEach(p => {
            const row = [
                p.serial_no || (p.is_tiebreaker ? `TB${p.num}` : `P${p.num}`),
                p.is_tiebreaker ? 'Prelims Tie-Breaker' : 'Written Prelims',
                cleanCsvCell(p.question_en || ''),
                cleanCsvCell(p.question_ml || ''),
                cleanCsvCell(p.answer_en || ''),
                cleanCsvCell(p.answer_ml || ''),
                p.q_media_type || 'none',
                cleanCsvCell(p.q_media_url || ''),
                p.a_media_type || 'none',
                cleanCsvCell(p.a_media_url || ''),
                cleanCsvCell(p.fact_en || '')
            ];
            csv += row.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quiz_questions_export.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    function cleanCsvCell(str) {
        const escaped = str.replace(/"/g, '""');
        return `"${escaped}"`;
    }

    function saveAndApply() {
        saveCurrentQuestionFromForm();
        saveCurrentPrelimFromForm();

        // 1. Save to localStorage
        try {
            localStorage.setItem('QUIZZMASTER_ACTIVE_PACKAGE', JSON.stringify(currentQuiz));
        } catch (e) {
            console.error('LocalStorage save error:', e);
        }

        // 2. Persist to disk via server.py if running
        try {
            fetch('/api/save_quiz_package', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentQuiz)
            }).catch(() => {});
        } catch (e) {}

        // 3. Broadcast via StateManager
        if (stateManager && typeof stateManager.updateQuizPackage === 'function') {
            stateManager.updateQuizPackage(currentQuiz);
        }

        // 4. Update global window.QUIZ_DATA
        window.QUIZ_DATA = currentQuiz;

        showToast('🚀 Quiz saved and live-synchronized to all windows!');
    }

    function showToast(msg) {
        elements.statusToast.textContent = msg;
        elements.statusToast.classList.add('show');
        setTimeout(() => {
            elements.statusToast.classList.remove('show');
        }, 3000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Start App on DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
