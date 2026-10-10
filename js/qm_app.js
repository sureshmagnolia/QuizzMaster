
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
window.sanitizePublicText = sanitizePublicText;

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

// --- Question & Image On-The-Fly Editing System ---
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
window.getResolvedQuestion = getResolvedQuestion;

let pendingImageFile = null;

function updateImagePreview(src) {
    const imgEl = document.getElementById('editImagePreview');
    const noImgText = document.getElementById('editNoImageText');
    const statusBadge = document.getElementById('editImageStatusBadge');
    if (!imgEl) return;
    
    if (src && src.trim()) {
        const cleanSrc = src.trim();
        let displaySrc = cleanSrc;
        // If not a base64 data URI, blob URI, or local placeholder, append timestamp cache buster to always show latest image
        if (!cleanSrc.startsWith('data:') && !cleanSrc.startsWith('blob:') && !cleanSrc.startsWith('[')) {
            const baseSrc = cleanSrc.replace(/([?&])(?:v|t)=\d+/g, '$1').replace(/[?&]$/, '');
            displaySrc = baseSrc + (baseSrc.includes('?') ? '&' : '?') + 't=' + Date.now();
        }
        imgEl.src = displaySrc;
        imgEl.style.display = 'block';
        if (noImgText) noImgText.style.display = 'none';
        if (statusBadge) statusBadge.textContent = 'Preview active';
        
        imgEl.onerror = function() {
            imgEl.style.display = 'none';
            if (noImgText) {
                noImgText.style.display = 'block';
                noImgText.textContent = 'Image not found';
            }
            if (statusBadge) statusBadge.textContent = 'Invalid path or URL';
        };
        imgEl.onload = function() {
            imgEl.style.display = 'block';
            if (noImgText) noImgText.style.display = 'none';
            if (statusBadge) statusBadge.textContent = 'Image loaded';
        };
    } else {
        imgEl.src = '';
        imgEl.style.display = 'none';
        if (noImgText) {
            noImgText.style.display = 'block';
            noImgText.textContent = 'No Image';
        }
        if (statusBadge) statusBadge.textContent = 'No image selected';
    }
}
window.updateImagePreview = updateImagePreview;

function handleImageFileSelect(input) {
    if (!input || !input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, WEBP, etc.)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        pendingImageFile = {
            filename: file.name,
            data: e.target.result
        };
        updateImagePreview(e.target.result);
        const pathInput = document.getElementById('editImagePath');
        if (pathInput) pathInput.value = '[Local File: ' + file.name + ']';
        const statusBadge = document.getElementById('editImageStatusBadge');
        if (statusBadge) statusBadge.textContent = 'Upload ready (' + (file.size / 1024).toFixed(1) + ' KB)';
    };
    reader.readAsDataURL(file);
}
window.handleImageFileSelect = handleImageFileSelect;

function clearEditImage() {
    pendingImageFile = null;
    const pathInput = document.getElementById('editImagePath');
    if (pathInput) pathInput.value = '';
    const fileInput = document.getElementById('editImageFileInput');
    if (fileInput) fileInput.value = '';
    const descInput = document.getElementById('editMediaDesc');
    if (descInput) descInput.value = '';
    updateImagePreview('');
}
window.clearEditImage = clearEditImage;

function openEditQuestionModal(qid) {
    if (!qid) qid = QuizState.state.currentQuestionId;
    const qData = getResolvedQuestion(qid);
    if (!qData) return;

    document.getElementById('editQid').value = qid;
    document.getElementById('editModalTitle').textContent = 'Edit Question #' + qid + ' on the Fly';

    let fullQEn = qData.question_en || qData.prompt_en || '';
    let fullQMl = qData.question_ml || qData.prompt_ml || '';

    document.getElementById('editQuestionEn').value = deduplicateRepeatedPhrases(fullQEn.trim());
    document.getElementById('editQuestionMl').value = deduplicateRepeatedPhrases(fullQMl.trim());
    document.getElementById('editAnswerEn').value = qData.answer_en || '';
    document.getElementById('editAnswerMl').value = qData.answer_ml || '';
    document.getElementById('editFactEn').value = qData.fact_en || qData.interesting_fact_en || '';
    const factMlInput = document.getElementById('editFactMl');
    if (factMlInput) {
        factMlInput.value = qData.fact_ml || qData.interesting_fact_ml || '';
    }

    // Load Clues if Clue Hunter Question
    const cluesContainer = document.getElementById('editCluesContainer');
    if (cluesContainer) {
        if (qData.is_clue_question && qData.clues && qData.clues.length >= 3) {
            cluesContainer.style.display = 'block';
            document.getElementById('editClue1En').value = qData.clues[0].clue_en || '';
            document.getElementById('editClue1Ml').value = qData.clues[0].clue_ml || '';
            document.getElementById('editClue2En').value = qData.clues[1].clue_en || '';
            document.getElementById('editClue2Ml').value = qData.clues[1].clue_ml || '';
            document.getElementById('editClue3En').value = qData.clues[2].clue_en || '';
            document.getElementById('editClue3Ml').value = qData.clues[2].clue_ml || '';
        } else {
            cluesContainer.style.display = 'none';
        }
    }

    // Load image info
    pendingImageFile = null;
    const fileInput = document.getElementById('editImageFileInput');
    if (fileInput) fileInput.value = '';
    
    const imgPath = qData.image || '';
    const pathInput = document.getElementById('editImagePath');
    if (pathInput) pathInput.value = imgPath;
    
    const descInput = document.getElementById('editMediaDesc');
    if (descInput) descInput.value = qData.media_desc || '';
    
    updateImagePreview(imgPath);

    const modal = document.getElementById('qmEditModal');
    if (modal) modal.style.display = 'flex';
}
window.openEditQuestionModal = openEditQuestionModal;

function closeEditQuestionModal() {
    const modal = document.getElementById('qmEditModal');
    if (modal) modal.style.display = 'none';
}
window.closeEditQuestionModal = closeEditQuestionModal;

function getApiBaseUrl() {
    if (window.location.protocol.startsWith('http')) {
        return '';
    }
    return 'http://localhost:8000';
}

function showQMNotification(msg, status) {
    let isSuccess = (status === true || status === undefined);
    let isInfo = (status === 'info');

    let toast = document.getElementById('qmToastNotification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'qmToastNotification';
        document.body.appendChild(toast);
    }

    let bg = '#059669';
    let border = '#10B981';
    let icon = '💾';

    if (isInfo) {
        bg = '#1E40AF';
        border = '#3B82F6';
        icon = '⏳';
    } else if (!isSuccess) {
        bg = '#B91C1C';
        border = '#EF4444';
        icon = '⚠️';
    }

    toast.style.cssText = 'position:fixed; top:24px; left:50%; transform:translateX(-50%) translateY(0); z-index:100000; background:' + bg + '; color:#FFFFFF; border:2px solid ' + border + '; border-radius:10px; padding:12px 26px; font-family:sans-serif; font-weight:700; font-size:1.02rem; box-shadow:0 12px 35px rgba(0,0,0,0.65), 0 0 15px ' + border + '88; display:flex; align-items:center; gap:10px; opacity:1; transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1); pointer-events:none;';
    toast.innerHTML = (msg.includes('💾') || msg.includes('⏳') || msg.includes('⚠️') ? '' : icon + ' ') + msg;

    if (window._qmToastTimer) {
        clearTimeout(window._qmToastTimer);
    }

    window._qmToastTimer = setTimeout(function() {
        if (toast) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-15px)';
        }
    }, isInfo ? 1800 : 4500);
}
window.showQMNotification = showQMNotification;

function syncMemoryQuizData(qid, updates) {
    if (!updates) return;
    if (window.QUIZ_DATA && window.QUIZ_DATA.all_stage_questions) {
        let memQ = window.QUIZ_DATA.all_stage_questions[qid] || window.QUIZ_DATA.all_stage_questions[String(qid)];
        if (!memQ) {
            for (const k in window.QUIZ_DATA.all_stage_questions) {
                const sq = window.QUIZ_DATA.all_stage_questions[k];
                if (sq && (sq.serial_no === qid || sq.serial === qid || sq.id === qid || String(sq.id) === String(qid) || String(sq.serial_no) === String(qid))) {
                    memQ = sq;
                    break;
                }
            }
        }
        if (memQ) {
            Object.assign(memQ, updates);
        }
    }
    if (window.QUIZ_DATA && window.QUIZ_DATA.prelims) {
        const pq = window.QUIZ_DATA.prelims.find(p => p.serial_no === qid || p.serial === qid || p.num === qid || p.id === qid || String(p.num) === String(qid));
        if (pq) {
            Object.assign(pq, updates);
        }
    }
}
window.syncMemoryQuizData = syncMemoryQuizData;

function saveEditedQuestion() {
    const qidRaw = (document.getElementById('editQid').value || '').trim();
    const qid = (!isNaN(Number(qidRaw)) && qidRaw !== '') ? Number(qidRaw) : (qidRaw || QuizState.state.currentQuestionId);
    let chosenImagePath = (document.getElementById('editImagePath').value || '').trim();
    const mediaDesc = (document.getElementById('editMediaDesc').value || '').trim();

    const targetQ = getResolvedQuestion(qid) || {};
    const isAudioQ = Boolean(targetQ.has_audio || targetQ.audio || targetQ.round_type === 'Audio Round');

    const qEnText = sanitizePublicText(document.getElementById('editQuestionEn').value);
    const qMlText = sanitizePublicText(document.getElementById('editQuestionMl').value);

    const factEnText = (document.getElementById('editFactEn') ? document.getElementById('editFactEn').value : '').trim();
    const factMlText = (document.getElementById('editFactMl') ? document.getElementById('editFactMl').value : '').trim();

    const updates = {
        question_en: qEnText,
        question_ml: qMlText,
        prompt_en: qEnText,
        prompt_ml: qMlText,
        clue_en: '',
        clue_ml: '',
        answer_en: sanitizePublicText(document.getElementById('editAnswerEn').value),
        answer_ml: sanitizePublicText(document.getElementById('editAnswerMl').value),
        fact_en: factEnText,
        fact_ml: factMlText,
        media_desc: sanitizePublicText(mediaDesc)
    };

    // Immediately update in-memory QUIZ_DATA for instant UI reactivity across controller views
    syncMemoryQuizData(qid, updates);

    if (targetQ.is_clue_question && targetQ.clues && targetQ.clues.length >= 3) {
        const c1En = sanitizePublicText(document.getElementById('editClue1En').value);
        const c1Ml = sanitizePublicText(document.getElementById('editClue1Ml').value);
        const c2En = sanitizePublicText(document.getElementById('editClue2En').value);
        const c2Ml = sanitizePublicText(document.getElementById('editClue2Ml').value);
        const c3En = sanitizePublicText(document.getElementById('editClue3En').value);
        const c3Ml = sanitizePublicText(document.getElementById('editClue3Ml').value);

        updates.clues = [
            { tier: 1, pts: 15, clue_en: c1En || sanitizePublicText(targetQ.clues[0].clue_en), clue_ml: c1Ml || sanitizePublicText(targetQ.clues[0].clue_ml) },
            { tier: 2, pts: 10, clue_en: c2En || sanitizePublicText(targetQ.clues[1].clue_en), clue_ml: c2Ml || sanitizePublicText(targetQ.clues[1].clue_ml) },
            { tier: 3, pts: 5,  clue_en: c3En || sanitizePublicText(targetQ.clues[2].clue_en), clue_ml: c3Ml || sanitizePublicText(targetQ.clues[2].clue_ml) }
        ];
    }

    const apiBase = getApiBaseUrl();

    const currentRound = (QuizState.state && QuizState.state.currentRoundIndex >= 0) 
        ? QUIZ_DATA.rounds[QuizState.state.currentRoundIndex] 
        : (QuizState.state && QuizState.state.currentRoundIndex === -2 ? QUIZ_DATA.reserve_round : null);

    if (pendingImageFile) {
        updates.image = pendingImageFile.data;
        updates.has_visual = true;
        syncMemoryQuizData(qid, { image: pendingImageFile.data, has_visual: true });
        QuizState.updateQuestion(qid, updates);

        showQMNotification('⏳ Uploading photo & saving Question #' + qid + ' to disk...', 'info');

        fetch(apiBase + '/api/upload_image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                qid: qid,
                filename: pendingImageFile.filename,
                data: pendingImageFile.data,
                media_desc: mediaDesc
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(uploadResult) {
            if (uploadResult && uploadResult.image) {
                updates.image = uploadResult.image;
                updates.has_visual = true;
                syncMemoryQuizData(qid, { image: uploadResult.image, has_visual: true });
                QuizState.updateQuestion(qid, { image: uploadResult.image, has_visual: true });
            }
            return fetch(apiBase + '/api/save_question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qid: qid, updates: updates })
            }).then(function(res) { return res.json(); });
        })
        .then(function(saveResult) {
            if (saveResult && saveResult.success) {
                showQMNotification('💾 <b>Question #' + qid + '</b> and new photo permanently saved to disk & database!', true);
                renderQMMainDetails(QuizState.state);
            } else {
                showQMNotification('⚠️ Saved to browser, disk write: ' + ((saveResult && saveResult.error) || 'Failed'), false);
            }
        })
        .catch(function(err) {
            console.warn('Backend save offline:', err);
            showQMNotification('💾 <b>Question #' + qid + '</b> saved to browser session! (Start server.py for disk saving)', true);
        });
    } else {
        const isVisualRoundContext = Boolean(currentRound && (currentRound.round_num === 2 || currentRound.type === 'Visual Round'));
        if (chosenImagePath && !chosenImagePath.startsWith('[Local File:')) {
            updates.image = chosenImagePath;
            updates.has_visual = isVisualRoundContext && Boolean(chosenImagePath.trim() !== '');
        } else if (chosenImagePath === '') {
            updates.image = null;
            updates.has_visual = false;
        }
        if (isAudioQ) {
            updates.has_audio = true;
            updates.has_visual = false;
        }

        // Broadcast to Public Display & LocalStorage immediately
        syncMemoryQuizData(qid, updates);
        QuizState.updateQuestion(qid, updates);

        showQMNotification('⏳ Saving Question #' + qid + ' to disk...', 'info');

        fetch(apiBase + '/api/save_question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qid: qid, updates: updates })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data && data.success) {
                showQMNotification('💾 <b>Question #' + qid + '</b> permanently saved to disk & database!', true);
            } else {
                showQMNotification('⚠️ Saved to browser, disk write: ' + ((data && data.error) || 'Failed'), false);
            }
        })
        .catch(function(err) {
            console.warn('Backend save offline:', err);
            showQMNotification('💾 <b>Question #' + qid + '</b> saved to browser session! (Start server.py for disk saving)', true);
        });
    }

    closeEditQuestionModal();
    renderQMMainDetails(QuizState.state);
}
window.saveEditedQuestion = saveEditedQuestion;

function resetCurrentQuestionToOriginal() {
    const qidRaw = (document.getElementById('editQid').value || '').trim();
    const qid = (!isNaN(Number(qidRaw)) && qidRaw !== '') ? Number(qidRaw) : (qidRaw || QuizState.state.currentQuestionId);
    if (confirm('Reset Question #' + qid + ' back to the original pre-loaded default version?')) {
        QuizState.resetQuestion(qid);
        closeEditQuestionModal();
        renderQMMainDetails(QuizState.state);
    }
}
window.resetCurrentQuestionToOriginal = resetCurrentQuestionToOriginal;



function recordPassMiss(teamId) {
    const team = QUIZ_DATA.teams.find(t => t.id === teamId) || { name: teamId };
    QuizState.addScore(teamId, 0, 'No Pounce Slip / Skipped (0 pts)');
}
window.recordPassMiss = recordPassMiss;

function recordDirectPass(teamId) {
    const team = QUIZ_DATA.teams.find(t => t.id === teamId) || { name: teamId };
    QuizState.addScore(teamId, 0, 'Direct Oral Miss (0 pts, No Neg)');
    if (window.SFX && typeof SFX.playBuzzer === 'function') {
        SFX.playBuzzer();
    }
}
window.recordDirectPass = recordDirectPass;

function setQuestionTimerPreset(duration) {
    const dur = Number(duration) || 30;
    const state = QuizState.state;
    if (state.viewMode === 'prelims' && state.prelimsMode === 'single') {
        QuizState.setState({
            prelimTimerDuration: dur,
            timer: {
                duration: dur,
                remaining: dur,
                isRunning: false
            }
        });
        showQMNotification(`⏱️ Prelim question timer set to ${dur}s`, 'info');
    } else {
        QuizState.setState({
            defaultTimerDuration: dur,
            timer: {
                duration: dur,
                remaining: dur,
                isRunning: false
            }
        });
        showQMNotification(`⏱️ Round timer set to ${dur}s`, 'info');
    }
}
window.setQuestionTimerPreset = setQuestionTimerPreset;

function setPrelimTimerDuration(duration) {
    setQuestionTimerPreset(duration);
}
window.setPrelimTimerDuration = setPrelimTimerDuration;


function changeTheme(themeName) {
    if (window.QuizState && typeof QuizState.setTheme === 'function') {
        QuizState.setTheme(themeName);
    }
}
window.changeTheme = changeTheme;

/**
 * Quizmaster Mission Control Script
 * Controls round flow, round intro rules slides, question dispatch, live scoring, timer management, and audio-visual triggers
 */

let activeRoundIdx = 0;
let activeQuestionIdx = 0;
let currentPublicWin = null;

document.addEventListener('DOMContentLoaded', () => {
    initRoundTabs();
    initKeyboardShortcuts();

    // Prevent system / screen sleeping when unattended
    let activeQMWakeLock = null;
    async function requestQMWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                activeQMWakeLock = await navigator.wakeLock.request('screen');
                activeQMWakeLock.addEventListener('release', () => {
                    activeQMWakeLock = null;
                });
            } catch (e) {}
        }
    }
    requestQMWakeLock();
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !activeQMWakeLock) {
            requestQMWakeLock();
        }
    });

    QuizState.onStateChange(state => {
        renderQMState(state);
    });
});

function initRoundTabs() {
    updateNavigationTabs(QuizState.state);
}

function updateNavigationTabs(state) {
    const container = document.getElementById('roundTabsContainer');
    if (!container) return;
    container.innerHTML = '';

    if (state.viewMode === 'welcome') {
        const info = document.createElement('div');
        info.style.cssText = 'color: var(--text-gold); font-weight: 800; font-size: 0.9rem; padding: 4px 8px; display: flex; align-items: center; gap: 8px;';
        info.innerHTML = '<span>🏠 Welcome Screen Active on Stage Display</span>';
        container.appendChild(info);
        return;
    }

    if (state.viewMode === 'prelims') {
        const isTiebreaker = state.prelimsMode === 'tiebreaker';
        const isSingle = state.prelimsMode === 'single';

        const navWrap = document.createElement('div');
        navWrap.className = 'qm-prelim-nav-wrap';

        // Row 1: Mode Switch Buttons & Stage Launch
        const modesRow = document.createElement('div');
        modesRow.className = 'qm-prelim-modes-row';

        const leftModes = document.createElement('div');
        leftModes.style.cssText = 'display: flex; gap: 6px; align-items: center;';

        const btnSingle = document.createElement('button');
        btnSingle.className = `round-tab-btn ${isSingle ? 'round-tab-active' : ''}`;
        btnSingle.innerHTML = '🔍 One by One (1-Q View)';
        btnSingle.title = 'Display questions one by one with countdown timer';
        btnSingle.onclick = () => setAppViewMode('prelims', 'single');
        leftModes.appendChild(btnSingle);

        const btnGrid = document.createElement('button');
        btnGrid.className = `round-tab-btn ${(!isSingle && !isTiebreaker) ? 'round-tab-active' : ''}`;
        btnGrid.innerHTML = '📋 All 20 Grid (Overview)';
        btnGrid.title = 'Display all 20 questions together in a grid';
        btnGrid.onclick = () => setAppViewMode('prelims', 'all');
        leftModes.appendChild(btnGrid);

        const btnTB = document.createElement('button');
        btnTB.className = `round-tab-btn ${isTiebreaker ? 'round-tab-active' : ''}`;
        btnTB.innerHTML = '🚨 5 Tie-Breakers';
        btnTB.title = 'Prelims 5 Sudden-Death Tie-Breakers';
        btnTB.onclick = () => setAppViewMode('prelims', 'tiebreaker');
        leftModes.appendChild(btnTB);

        modesRow.appendChild(leftModes);

        const startStageBtn = document.createElement('button');
        startStageBtn.className = 'btn-primary';
        startStageBtn.style.cssText = 'font-size: 0.82rem; padding: 6px 16px; font-weight: 800; background: linear-gradient(135deg, #059669, #10b981); color: #FFF; box-shadow: 0 0 10px rgba(16,185,129,0.35); border-radius: 6px; border: none; cursor: pointer;';
        startStageBtn.innerHTML = '🎯 Launch Stage Finals (R1) 👉';
        startStageBtn.onclick = () => switchRound(0);
        modesRow.appendChild(startStageBtn);

        navWrap.appendChild(modesRow);

        // Row 2: In One-by-One mode, render 20 Question Tabs!
        if (isSingle) {
            const tabsGrid = document.createElement('div');
            tabsGrid.className = 'qm-prelim-tabs-grid';

            const questions = QUIZ_DATA.prelims.filter(q => !q.is_tiebreaker);
            questions.forEach((q, idx) => {
                const qBtn = document.createElement('button');
                const isCurrent = (state.activePrelimIndex || 0) === idx;
                const isPast = (state.activePrelimIndex || 0) > idx;
                qBtn.className = `qm-prelim-tab-btn ${isCurrent ? 'is-active' : ''} ${isPast ? 'is-completed' : ''}`;
                qBtn.innerHTML = `${isPast ? '✓ ' : ''}Q${idx + 1}`;
                qBtn.title = `${q.serial_no || ('Q' + (idx+1))}: ${(q.question_en || q.prompt_en || '').substring(0, 45)}...`;
                qBtn.onclick = () => selectPrelimQuestion(idx);
                tabsGrid.appendChild(qBtn);
            });
            navWrap.appendChild(tabsGrid);
        } else if (isTiebreaker) {
            const tbGrid = document.createElement('div');
            tbGrid.style.cssText = 'display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; width: 100%; margin-top: 4px;';
            const tbQuestions = QUIZ_DATA.prelims.filter(q => q.is_tiebreaker);
            tbQuestions.forEach((q, idx) => {
                const tbBtn = document.createElement('button');
                const isCurrent = (state.activePrelimIndex || 0) === idx;
                tbBtn.className = `qm-prelim-tab-btn ${isCurrent ? 'is-active' : ''}`;
                tbBtn.innerHTML = `TB ${idx + 1}`;
                tbBtn.title = `${q.serial_no || ('TB ' + (idx+1))}`;
                tbBtn.onclick = () => selectPrelimQuestion(idx);
                tbGrid.appendChild(tbBtn);
            });
            navWrap.appendChild(tbGrid);
        }

        container.appendChild(navWrap);
        return;
    }

    // Default: Stage Finals tabs (Dynamically populated from QUIZ_DATA.rounds)
    QUIZ_DATA.rounds.forEach((r, idx) => {
        const btn = document.createElement('button');
        const isActive = idx === activeRoundIdx;
        btn.className = `round-tab-btn ${isActive ? 'round-tab-active' : ''}`;
        const roundTitle = r.title ? (r.title.includes(':') ? r.title.split(':')[1].trim() : r.title) : `Round ${idx + 1}`;
        btn.innerHTML = `<strong>R${idx + 1}:</strong> ${roundTitle.substring(0, 18)}`;
        btn.title = `R${idx + 1}: ${r.title}`;
        btn.onclick = () => switchRound(idx);
        container.appendChild(btn);
    });

    if (QUIZ_DATA.stage_tie_breakers && QUIZ_DATA.stage_tie_breakers.length > 0) {
        const tbBtn = document.createElement('button');
        const isTbActive = activeRoundIdx === -1;
        tbBtn.className = `round-tab-btn ${isTbActive ? 'round-tab-active' : ''}`;
        tbBtn.innerHTML = `<strong>🚨 TB (${QUIZ_DATA.stage_tie_breakers.length} Qs)</strong>`;
        tbBtn.title = 'Stage Tie-Breakers';
        tbBtn.onclick = () => switchToStageTieBreakers();
        container.appendChild(tbBtn);
    }

    if (QUIZ_DATA.reserve_round && QUIZ_DATA.reserve_round.question_ids && QUIZ_DATA.reserve_round.question_ids.length > 0) {
        const resBtn = document.createElement('button');
        const isResActive = activeRoundIdx === -2;
        resBtn.className = `round-tab-btn ${isResActive ? 'round-tab-active' : ''}`;
        resBtn.innerHTML = `<strong>📦 Reserve (${QUIZ_DATA.reserve_round.question_ids.length} Qs)</strong>`;
        resBtn.title = 'Reserve Pool';
        resBtn.onclick = () => switchToReserveRound();
        container.appendChild(resBtn);
    }

    const roundDropdown = document.getElementById('qmRoundDropdown');
    if (roundDropdown && Array.isArray(QUIZ_DATA.rounds)) {
        roundDropdown.innerHTML = '';
        QUIZ_DATA.rounds.forEach((r, idx) => {
            const opt = document.createElement('option');
            opt.value = String(idx);
            const qCount = (r.question_ids && r.question_ids.length) || 0;
            opt.textContent = `R${idx + 1}: ${r.title || `Round ${idx + 1}`} (${qCount} Qs)`;
            if (idx === activeRoundIdx) opt.selected = true;
            roundDropdown.appendChild(opt);
        });
        if (QUIZ_DATA.stage_tie_breakers && QUIZ_DATA.stage_tie_breakers.length > 0) {
            const optTb = document.createElement('option');
            optTb.value = "-1";
            optTb.textContent = `🚨 TB Knockout (${QUIZ_DATA.stage_tie_breakers.length} Qs)`;
            if (activeRoundIdx === -1) optTb.selected = true;
            roundDropdown.appendChild(optTb);
        }
        if (QUIZ_DATA.reserve_round && QUIZ_DATA.reserve_round.question_ids && QUIZ_DATA.reserve_round.question_ids.length > 0) {
            const optRes = document.createElement('option');
            optRes.value = "-2";
            optRes.textContent = `📦 Reserve Pool (${QUIZ_DATA.reserve_round.question_ids.length} Qs)`;
            if (activeRoundIdx === -2) optRes.selected = true;
            roundDropdown.appendChild(optRes);
        }
    }
}

function startPrelimsTest() {
    setAppViewMode('prelims', 'all');
    setTimerDuration(900); // 15 minutes exam timer
}
window.startPrelimsTest = startPrelimsTest;

function startPrelimsSingle(duration) {
    const dur = Number(duration) || QuizState.state.prelimTimerDuration || 30;
    QuizState.setState({
        activePrelimIndex: 0,
        prelimsCompleted: false,
        prelimTimerDuration: dur
    });
    setAppViewMode('prelims', 'single');
    setTimerDuration(dur);
}
window.startPrelimsSingle = startPrelimsSingle;

function selectPrelimQuestion(idx) {
    stopCurrentAudio();
    const state = QuizState.state;
    const isTiebreaker = state.prelimsMode === 'tiebreaker';
    const questions = QUIZ_DATA.prelims ? QUIZ_DATA.prelims.filter(q => isTiebreaker ? q.is_tiebreaker : !q.is_tiebreaker) : [];
    if (!questions.length) return;
    const validIdx = Math.max(0, Math.min(idx, questions.length - 1));
    const activeQ = questions[validIdx];
    const isSingleOrTB = state.prelimsMode === 'single' || state.prelimsMode === 'tiebreaker';
    const duration = !isSingleOrTB ? (state.timer?.duration || 900) : (state.prelimTimerDuration || 30);
    const wasRunning = Boolean(state.timer && state.timer.isRunning);
    const shouldRun = wasRunning && isSingleOrTB;
    const now = Date.now();

    QuizState.setState({
        activePrelimIndex: validIdx,
        currentQuestionId: activeQ ? (activeQ.serial_no || activeQ.num) : (validIdx + 1),
        revealed: false,
        prelimsCompleted: false,
        timer: {
            duration: duration,
            remaining: duration,
            targetEndTime: shouldRun ? (now + (duration * 1000)) : null,
            isRunning: shouldRun
        }
    });

    if (shouldRun) {
        startTimer();
    }
}
window.selectPrelimQuestion = selectPrelimQuestion;

function advancePrelimQuestion() {
    const state = QuizState.state;
    if (state.viewMode !== 'prelims') return;
    if (state.prelimsMode !== 'single' && state.prelimsMode !== 'tiebreaker') return;
    const isTiebreaker = state.prelimsMode === 'tiebreaker';
    const questions = QUIZ_DATA.prelims ? QUIZ_DATA.prelims.filter(q => isTiebreaker ? q.is_tiebreaker : !q.is_tiebreaker) : [];
    const curIdx = state.activePrelimIndex || 0;

    if (curIdx < questions.length - 1) {
        const nextIdx = curIdx + 1;
        const nextQ = questions[nextIdx];
        const duration = state.prelimTimerDuration || 30;
        const willAutoAdvance = state.prelimAutoAdvance !== false;
        const now = Date.now();
        const prefix = isTiebreaker ? 'Tie-Breaker ' : 'Question ';
        showQMNotification(`⏱️ Time up! Advanced to ${prefix}${nextIdx + 1} of ${questions.length}`, 'info');

        QuizState.setState({
            activePrelimIndex: nextIdx,
            currentQuestionId: nextQ ? (nextQ.serial_no || nextQ.num) : (nextIdx + 1),
            revealed: false,
            prelimsCompleted: false,
            timer: {
                duration: duration,
                remaining: duration,
                targetEndTime: willAutoAdvance ? (now + (duration * 1000)) : null,
                isRunning: willAutoAdvance
            }
        });

        // If auto-advance is enabled, immediately start countdown for next question synchronously
        // with zero reliance on throttled setTimeout in background tabs
        if (willAutoAdvance) {
            startTimer();
        }
    } else {
        // Last question finished!
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
        showQMNotification(
            isTiebreaker ? '🎉 All 5 Tie-Breaker questions finished!' : '🎉 All 20 Preliminary questions finished!',
            'success'
        );
    }
}
window.advancePrelimQuestion = advancePrelimQuestion;

function togglePrelimAutoAdvance() {
    const current = QuizState.state.prelimAutoAdvance !== false;
    const nextVal = !current;
    QuizState.setState({ prelimAutoAdvance: nextVal });
    showQMNotification(
        nextVal ? '⚡ Auto-advance ON: Questions advance automatically when timer ends.' : '⏸️ Auto-advance OFF: Manual advance only.',
        nextVal ? 'success' : 'info'
    );
}
window.togglePrelimAutoAdvance = togglePrelimAutoAdvance;

function handleTimerComplete() {
    const state = QuizState.state;
    if (state.viewMode === 'prelims' && (state.prelimsMode === 'single' || state.prelimsMode === 'tiebreaker')) {
        if (state.prelimAutoAdvance !== false) {
            advancePrelimQuestion();
        } else {
            const isTB = state.prelimsMode === 'tiebreaker';
            const prefix = isTB ? 'Tie-Breaker ' : 'Question ';
            showQMNotification(`⏱️ Time's up for ${prefix}${(state.activePrelimIndex || 0) + 1}!`, 'warning');
        }
    }
}
window.handleTimerComplete = handleTimerComplete;

function switchRound(roundIndex) {
    if (roundIndex === -1) {
        switchToStageTieBreakers();
        return;
    }
    if (roundIndex === -2) {
        switchToReserveRound();
        return;
    }
    stopCurrentAudio();
    activeRoundIdx = roundIndex;
    activeQuestionIdx = 0;
    const round = QUIZ_DATA.rounds[roundIndex] || QUIZ_DATA.rounds[0];
    const qid = round.question_ids[0];
    const teamTurn = QUIZ_DATA.teams[0].id;

    // Start with Round Intro & Rules Slide first!
    QuizState.setState({
        viewMode: 'stage',
        isRoundIntro: true,
        currentRoundIndex: roundIndex,
        currentQuestionIndex: 0,
        currentQuestionId: qid,
        revealed: false,
        activeTeamTurn: teamTurn,
        timer: {
            duration: round.timing_sec || 30,
            remaining: round.timing_sec || 30,
            isRunning: false
        }
    });
}
window.switchRound = switchRound;

function switchToStageTieBreakers() {
    stopCurrentAudio();
    activeRoundIdx = -1;
    activeQuestionIdx = 0;
    const qid = QUIZ_DATA.stage_tie_breakers[0];

    // Start with Tie-Breaker Intro & Rules Slide first!
    QuizState.setState({
        viewMode: 'stage',
        isRoundIntro: true,
        currentRoundIndex: -1,
        currentQuestionIndex: 0,
        currentQuestionId: qid,
        revealed: false,
        activeTeamTurn: 'team_1',
        timer: {
            duration: 30,
            remaining: 30,
            isRunning: false
        }
    });
}
window.switchToStageTieBreakers = switchToStageTieBreakers;

function switchToReserveRound() {
    stopCurrentAudio();
    activeRoundIdx = -2;
    activeQuestionIdx = 0;
    const resRound = QUIZ_DATA.reserve_round || { question_ids: [], timing_sec: 30 };
    const qid = (resRound.question_ids && resRound.question_ids.length > 0) ? resRound.question_ids[0] : null;

    // Start with Reserve Round Intro & Overview Slide!
    QuizState.setState({
        viewMode: 'stage',
        isRoundIntro: true,
        currentRoundIndex: -2,
        currentQuestionIndex: 0,
        currentQuestionId: qid,
        revealed: false,
        activeTeamTurn: 'team_1',
        timer: {
            duration: resRound.timing_sec || 30,
            remaining: resRound.timing_sec || 30,
            isRunning: false
        }
    });
}
window.switchToReserveRound = switchToReserveRound;

function startRoundQuestions() {
    const isTieBreaker = activeRoundIdx === -1;
    const isReserve = activeRoundIdx === -2;
    const round = isTieBreaker 
        ? { question_ids: QUIZ_DATA.stage_tie_breakers, timing_sec: 30 } 
        : isReserve
        ? (QUIZ_DATA.reserve_round || { question_ids: [], timing_sec: 30 })
        : QUIZ_DATA.rounds[activeRoundIdx];
    activeQuestionIdx = 0;
    const qid = round.question_ids[0];
    const isClueR = (round.type === 'Clue Round' || round.round_num === 4);
    const duration = isClueR ? 15 : (QuizState.state.defaultTimerDuration || round.timing_sec || 30);

    QuizState.setState({
        isRoundIntro: false,
        currentQuestionIndex: 0,
        currentQuestionId: qid,
        revealed: false,
        timer: {
            duration: duration,
            remaining: duration,
            targetEndTime: Date.now() + (duration * 1000),
            isRunning: true
        }
    });
    startTimer();
}

function toggleRoundIntroSlide() {
    QuizState.setState({
        isRoundIntro: !QuizState.state.isRoundIntro,
        revealed: false
    });
}

function nextQuestion() {
    stopCurrentAudio();
    const state = QuizState.state;

    // Handle Prelims Navigation
    if (state.viewMode === 'prelims') {
        const isTiebreaker = state.prelimsMode === 'tiebreaker';
        const questions = QUIZ_DATA.prelims ? QUIZ_DATA.prelims.filter(q => isTiebreaker ? q.is_tiebreaker : !q.is_tiebreaker) : [];
        const curIdx = state.activePrelimIndex || 0;
        if (curIdx < questions.length - 1) {
            selectPrelimQuestion(curIdx + 1);
        } else {
            QuizState.setState({ prelimsCompleted: true });
            showQMNotification('🏁 All Preliminary questions completed.', 'info');
        }
        return;
    }

    // If on Round Intro Slide, clicking next launches Question 1!
    if (state.isRoundIntro) {
        startRoundQuestions();
        return;
    }

    const isTieBreaker = activeRoundIdx === -1;
    const isReserve = activeRoundIdx === -2;
    const round = isTieBreaker 
        ? { question_ids: QUIZ_DATA.stage_tie_breakers } 
        : isReserve 
        ? (QUIZ_DATA.reserve_round || { question_ids: [] })
        : QUIZ_DATA.rounds[activeRoundIdx];
    if (activeQuestionIdx < round.question_ids.length - 1) {
        activeQuestionIdx++;
        const qid = round.question_ids[activeQuestionIdx];
        const nextTeamIdx = activeQuestionIdx % QUIZ_DATA.teams.length;
        const nextTeam = QUIZ_DATA.teams[nextTeamIdx].id;

        const isClueR = (round.type === 'Clue Round' || round.round_num === 4);
        const duration = isClueR ? 15 : (QuizState.state.defaultTimerDuration || round.timing_sec || 30);
        QuizState.setState({
            isRoundIntro: false,
            currentQuestionIndex: activeQuestionIdx,
            currentQuestionId: qid,
            revealed: false,
            revealedClueCount: 1,
            activeTeamTurn: nextTeam,
            timer: {
                duration: duration,
                remaining: duration,
                targetEndTime: Date.now() + (duration * 1000),
                isRunning: true
            }
        });
        startTimer();
    } else {
        // Last question reached!
        if (isReserve) {
            showQMNotification('📦 All 24 Reserve questions browsed.', 'info');
        } else if (!isTieBreaker && activeRoundIdx < QUIZ_DATA.rounds.length - 1) {
            switchRound(activeRoundIdx + 1);
        } else if (!isTieBreaker && activeRoundIdx === QUIZ_DATA.rounds.length - 1) {
            // End of active rounds -> Proceed to champions podium
            setAppViewMode('winner');
        } else if (isTieBreaker) {
            setAppViewMode('winner');
        }
    }
}
window.nextQuestion = nextQuestion;

function prevQuestion() {
    stopCurrentAudio();
    const state = QuizState.state;

    // Handle Prelims Navigation
    if (state.viewMode === 'prelims') {
        const curIdx = state.activePrelimIndex || 0;
        if (curIdx > 0) {
            selectPrelimQuestion(curIdx - 1);
        }
        return;
    }

    if (state.isRoundIntro) {
        // If on round intro and not on round 0, can go to previous round's last question
        if (activeRoundIdx > 0) {
            const prevRoundIdx = activeRoundIdx - 1;
            const prevRound = QUIZ_DATA.rounds[prevRoundIdx];
            activeRoundIdx = prevRoundIdx;
            activeQuestionIdx = prevRound.question_ids.length - 1;
            const qid = prevRound.question_ids[activeQuestionIdx];
            const teamIdx = activeQuestionIdx % QUIZ_DATA.teams.length;
            QuizState.setState({
                viewMode: 'stage',
                currentRoundIndex: prevRoundIdx,
                currentQuestionIndex: activeQuestionIdx,
                currentQuestionId: qid,
                isRoundIntro: false,
                revealed: false,
                activeTeamTurn: QUIZ_DATA.teams[teamIdx].id
            });
        }
        return;
    }

    const isTieBreaker = activeRoundIdx === -1;
    const isReserve = activeRoundIdx === -2;
    const round = isTieBreaker 
        ? { question_ids: QUIZ_DATA.stage_tie_breakers } 
        : isReserve 
        ? (QUIZ_DATA.reserve_round || { question_ids: [] })
        : QUIZ_DATA.rounds[activeRoundIdx];
    if (activeQuestionIdx > 0) {
        activeQuestionIdx--;
        const qid = round.question_ids[activeQuestionIdx];
        const prevTeamIdx = activeQuestionIdx % QUIZ_DATA.teams.length;
        const prevTeam = QUIZ_DATA.teams[prevTeamIdx].id;

        const isClueR = (round.type === 'Clue Round' || round.round_num === 4);
        const duration = isClueR ? 15 : (QuizState.state.defaultTimerDuration || round.timing_sec || 30);
        QuizState.setState({
            isRoundIntro: false,
            currentQuestionIndex: activeQuestionIdx,
            currentQuestionId: qid,
            revealed: false,
            activeTeamTurn: prevTeam,
            timer: {
                duration: duration,
                remaining: duration,
                targetEndTime: Date.now() + (duration * 1000),
                isRunning: true
            }
        });
        startTimer();
    } else {
        // Going back from Question 1 shows the Round Intro Slide!
        QuizState.setState({
            isRoundIntro: true,
            revealed: false
        });
    }
}
window.prevQuestion = prevQuestion;

function toggleReveal() {
    const nextRevealed = !QuizState.state.revealed;
    if (nextRevealed) {
        pauseTimer();
    }
    QuizState.setState({
        revealed: nextRevealed
    });
}

function setAppViewMode(mode, prelimsMode = 'single') {
    if (mode === 'stage') {
        activeRoundIdx = 0;
        activeQuestionIdx = 0;
        const round = QUIZ_DATA.rounds[0];
        QuizState.setState({
            viewMode: 'stage',
            isRoundIntro: true, // Always start Round 1 with its Rules Slide!
            currentRoundIndex: 0,
            currentQuestionIndex: 0,
            currentQuestionId: round.question_ids[0],
            revealed: false,
            activeTeamTurn: 'team_1',
            timer: {
                duration: round.timing_sec,
                remaining: round.timing_sec,
                isRunning: false
            }
        });
    } else if (mode === 'prelims') {
        const isTiebreaker = prelimsMode === 'tiebreaker';
        const questions = QUIZ_DATA.prelims ? QUIZ_DATA.prelims.filter(q => isTiebreaker ? q.is_tiebreaker : !q.is_tiebreaker) : [];
        let curIdx = 0;
        if (QuizState.state.prelimsMode === prelimsMode) {
            curIdx = Math.max(0, Math.min(QuizState.state.activePrelimIndex || 0, questions.length - 1));
        }
        const activeQ = questions[curIdx];
        const isSingleOrTB = prelimsMode === 'single' || prelimsMode === 'tiebreaker';
        const duration = !isSingleOrTB ? 900 : (QuizState.state.prelimTimerDuration || 30);

        QuizState.setState({
            viewMode: 'prelims',
            prelimsMode: prelimsMode,
            activePrelimIndex: curIdx,
            currentQuestionId: activeQ ? (activeQ.serial_no || activeQ.num) : 1,
            revealed: false,
            prelimsCompleted: false,
            timer: {
                duration: duration,
                remaining: duration,
                targetEndTime: null,
                isRunning: false
            }
        });
    } else {
        QuizState.setState({
            viewMode: mode,
            revealed: false,
            timer: {
                duration: 30,
                remaining: 30,
                isRunning: false
            }
        });
    }

    // Update Top View Mode Buttons
    const btnModeWelcome = document.getElementById('btnModeWelcome');
    const btnModePrelims = document.getElementById('btnModePrelims');
    const btnModePrelimsAll = document.getElementById('btnModePrelimsAll');
    const btnModePrelimsTB = document.getElementById('btnModePrelimsTB');
    const btnModeStage = document.getElementById('btnModeStage');
    const btnModeWinner = document.getElementById('btnModeWinner');

    if (btnModeWelcome) btnModeWelcome.classList.toggle('round-tab-active', mode === 'welcome');
    if (btnModePrelims) btnModePrelims.classList.toggle('round-tab-active', mode === 'prelims' && prelimsMode === 'single');
    if (btnModePrelimsAll) btnModePrelimsAll.classList.toggle('round-tab-active', mode === 'prelims' && prelimsMode === 'all');
    if (btnModePrelimsTB) btnModePrelimsTB.classList.toggle('round-tab-active', mode === 'prelims' && prelimsMode === 'tiebreaker');
    if (btnModeStage) btnModeStage.classList.toggle('round-tab-active', mode === 'stage');
    if (btnModeWinner) btnModeWinner.classList.toggle('round-tab-active', mode === 'winner');
}

function renderQmBranding() {
    const meta = (window.QUIZ_DATA && QUIZ_DATA.meta) || {};
    const showLogos = meta.show_logos !== false;
    const logo1 = meta.logo_primary ? meta.logo_primary.trim() : '';
    const logo2 = meta.logo_secondary ? meta.logo_secondary.trim() : '';

    const logo1El = document.getElementById('qmLogo1');
    const logo2El = document.getElementById('qmLogo2');
    const brandLogos = document.getElementById('qmBrandLogos');

    if (brandLogos) {
        if (showLogos && (logo1 || logo2)) {
            brandLogos.style.display = 'flex';
            if (logo1El) {
                if (logo1) {
                    logo1El.src = logo1;
                    logo1El.style.display = 'inline-block';
                } else {
                    logo1El.style.display = 'none';
                }
            }
            if (logo2El) {
                if (logo2) {
                    logo2El.src = logo2;
                    logo2El.style.display = 'inline-block';
                } else {
                    logo2El.style.display = 'none';
                }
            }
        } else {
            brandLogos.style.display = 'none';
        }
    }

    const titleEl = document.getElementById('qmQuizTitleText');
    if (titleEl && meta.title) {
        titleEl.textContent = meta.title.toUpperCase();
    }

    const instDeptEl = document.getElementById('qmInstDeptText');
    if (instDeptEl) {
        const parts = [meta.department, meta.institution || meta.curator].filter(Boolean);
        if (parts.length > 0) {
            instDeptEl.textContent = parts.join(' • ');
            instDeptEl.style.display = '';
        } else {
            instDeptEl.style.display = 'none';
        }
    }
}

function renderQMState(state) {
    if (!state) return;

    renderQmBranding();

    // Ensure Top View Mode Buttons always reflect current state
    const btnModeWelcome = document.getElementById('btnModeWelcome');
    const btnModePrelims = document.getElementById('btnModePrelims');
    const btnModePrelimsAll = document.getElementById('btnModePrelimsAll');
    const btnModePrelimsTB = document.getElementById('btnModePrelimsTB');
    const btnModeStage = document.getElementById('btnModeStage');
    const btnModeWinner = document.getElementById('btnModeWinner');

    if (btnModeWelcome) btnModeWelcome.classList.toggle('round-tab-active', state.viewMode === 'welcome');
    if (btnModePrelims) btnModePrelims.classList.toggle('round-tab-active', state.viewMode === 'prelims' && state.prelimsMode === 'single');
    if (btnModePrelimsAll) btnModePrelimsAll.classList.toggle('round-tab-active', state.viewMode === 'prelims' && state.prelimsMode === 'all');
    if (btnModePrelimsTB) btnModePrelimsTB.classList.toggle('round-tab-active', state.viewMode === 'prelims' && state.prelimsMode === 'tiebreaker');
    if (btnModeStage) btnModeStage.classList.toggle('round-tab-active', state.viewMode === 'stage');
    if (btnModeWinner) btnModeWinner.classList.toggle('round-tab-active', state.viewMode === 'winner');

    // Auto-advance button sync in timer pill
    const btnAutoAdv = document.getElementById('btnPrelimAutoAdvance');
    if (btnAutoAdv) {
        if (state.viewMode === 'prelims' && (state.prelimsMode === 'single' || state.prelimsMode === 'tiebreaker')) {
            btnAutoAdv.style.display = 'inline-block';
            const isOn = state.prelimAutoAdvance !== false;
            btnAutoAdv.className = `btn-timer ${isOn ? 'btn-auto-on' : 'btn-auto-off'}`;
            btnAutoAdv.innerHTML = isOn ? '⚡ Auto: ON' : '⏸️ Auto: OFF';
        } else {
            btnAutoAdv.style.display = 'none';
        }
    }
    // 0. Synchronize & apply UI theme
    const activeTheme = state.theme || (window.QUIZ_DATA && QUIZ_DATA.meta && QUIZ_DATA.meta.theme) || 'emerald';
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.body.setAttribute('data-theme', activeTheme);
    const themeSelect = document.getElementById('qmThemeSelect');
    if (themeSelect && themeSelect.value !== activeTheme) {
        themeSelect.value = activeTheme;
    }

    // Synchronize Projector Zoom select in QM header
    const zoomSelect = document.getElementById('qmProjectorZoomSelect');
    if (zoomSelect && state.projectorZoom !== undefined) {
        const curZoom = parseFloat(state.projectorZoom);
        let matched = false;
        for (let i = 0; i < zoomSelect.options.length; i++) {
            if (Math.abs(parseFloat(zoomSelect.options[i].value) - curZoom) < 0.02) {
                zoomSelect.selectedIndex = i;
                matched = true;
                break;
            }
        }
        if (!matched) {
            zoomSelect.value = curZoom.toFixed(2);
        }
    }

    // 1. Timer display formatted with wall-clock precision
    let remaining = state.timer ? state.timer.remaining : 30;
    if (state.timer && state.timer.isRunning && state.timer.targetEndTime) {
        remaining = Math.max(0, Math.ceil((state.timer.targetEndTime - Date.now()) / 1000));
    }
    const displayTime = remaining >= 60 
        ? `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`
        : remaining;
    const qmTimerElem = document.getElementById('qmTimerDisplay');
    if (qmTimerElem) qmTimerElem.textContent = displayTime;
    // Sync Timer Duration preset selector
    const presetSelect = document.getElementById('qmTimerPresetSelect');
    if (presetSelect) {
        const isSingleOrTB = (state.viewMode === 'prelims' && (state.prelimsMode === 'single' || state.prelimsMode === 'tiebreaker'));
        const currentDur = isSingleOrTB 
            ? (state.prelimTimerDuration || 30) 
            : (state.defaultTimerDuration || (state.timer ? state.timer.duration : 30));
        if (Number(presetSelect.value) !== currentDur && [15, 20, 30, 45, 60, 90, 120].includes(currentDur)) {
            presetSelect.value = String(currentDur);
        }
    }


    // 2. Reveal button label & Audio button visibility
    const btnReveal = document.getElementById('btnRevealToggle');
    const btnPlayAudio = document.getElementById('btnPlayAudio');

    const isStageQuestion = state.viewMode === 'stage' && !state.isRoundIntro;
    const qData = isStageQuestion ? getResolvedQuestion(state.currentQuestionId) : null;
    const hasAudio = !!(qData && (qData.has_audio || qData.audio));

    // Audio button: ONLY visible when the active question is actually audio-based!
    if (btnPlayAudio) {
        if (hasAudio) {
            btnPlayAudio.style.display = 'inline-flex';
            btnPlayAudio.style.alignItems = 'center';
            btnPlayAudio.style.gap = '6px';
            btnPlayAudio.style.background = 'rgba(59, 130, 246, 0.25)';
            btnPlayAudio.style.border = '1.5px solid #3B82F6';
            btnPlayAudio.style.color = '#93C5FD';
            if (state.audioPlaying) {
                btnPlayAudio.innerHTML = '⏹️ Stop Stage Audio';
                btnPlayAudio.style.background = 'rgba(239, 68, 68, 0.3)';
                btnPlayAudio.style.borderColor = '#EF4444';
                btnPlayAudio.style.color = '#FCA5A5';
            } else {
                btnPlayAudio.innerHTML = '🔊 Play Stage Audio';
            }
        } else {
            btnPlayAudio.style.display = 'none';
        }
    }

    // Reveal button: hidden on welcome, winner, or round intro slides
    if (btnReveal) {
        if (state.viewMode === 'welcome' || state.viewMode === 'winner' || state.isRoundIntro) {
            btnReveal.style.display = 'none';
        } else {
            btnReveal.style.display = 'inline-flex';
            if (state.revealed) {
                btnReveal.textContent = "🙈 Hide Answers";
                btnReveal.style.background = "#DC2626";
                btnReveal.style.color = "#FFF";
            } else {
                btnReveal.textContent = (state.viewMode === 'prelims' && state.prelimsMode === 'all')
                    ? "👁️ Reveal All Answers on Screen" 
                    : "👁️ Reveal Answer & Photo";
                btnReveal.style.background = "linear-gradient(135deg, #F59E0B, #D97706)";
                btnReveal.style.color = "#000";
            }
        }
    }

    // 3. Question tracker text & tabs
    if (state.currentRoundIndex !== undefined) {
        activeRoundIdx = state.currentRoundIndex;
    }
    if (state.currentQuestionIndex !== undefined) {
        activeQuestionIdx = state.currentQuestionIndex;
    }

    updateNavigationTabs(state);

    const roundJumpPill = document.getElementById('qmRoundJumpPill');
    if (roundJumpPill) {
        roundJumpPill.style.display = state.viewMode === 'stage' ? 'flex' : 'none';
    }
    const roundDropdown = document.getElementById('qmRoundDropdown');
    if (roundDropdown && state.currentRoundIndex !== undefined) {
        roundDropdown.value = String(state.currentRoundIndex);
    }

    const isTieBreaker = state.currentRoundIndex === -1;
    const isReserve = state.currentRoundIndex === -2;
    const round = isTieBreaker 
        ? { round_num: "TB", title: "Stage Tie-Breakers", question_ids: QUIZ_DATA.stage_tie_breakers } 
        : isReserve
        ? (QUIZ_DATA.reserve_round || { round_num: "RES", title: "Reserve & Pool Questions", question_ids: [] })
        : (QUIZ_DATA.rounds[state.currentRoundIndex] || QUIZ_DATA.rounds[0]);
    const totalQ = round && round.question_ids ? round.question_ids.length : 8;

    const tracker = document.getElementById('qTrackerText');
    if (tracker) {
        if (state.viewMode === 'welcome') {
            tracker.textContent = "Welcome Stage Active";
        } else if (state.viewMode === 'prelims') {
            const isTiebreaker = state.prelimsMode === 'tiebreaker';
            const isSingle = state.prelimsMode === 'single';
            if (isTiebreaker) {
                tracker.textContent = isSingle 
                    ? `Prelims TB: Q ${(state.activePrelimIndex || 0) + 1} of 5` 
                    : "5 Tie-Breakers Projected on Screen";
            } else if (isSingle) {
                const targetQ = QUIZ_DATA.prelims ? QUIZ_DATA.prelims.filter(q => !q.is_tiebreaker)[state.activePrelimIndex || 0] : null;
                const sNo = targetQ ? (targetQ.serial_no || '') : '';
                tracker.textContent = `Prelims Q ${(state.activePrelimIndex || 0) + 1} of 20 ${sNo ? '[' + sNo + ']' : ''}`;
            } else {
                tracker.textContent = "All 20 Questions Projected on Screen";
            }
        } else if (state.viewMode === 'winner') {
            tracker.textContent = "Championship Podium";
        } else if (state.isRoundIntro) {
            tracker.textContent = isReserve 
                ? `Reserve Round: Question Pool Active` 
                : isTieBreaker 
                ? `Tie-Breaker: Rules Slide Active` 
                : `Round ${round.round_num}: Rules Slide Active`;
        } else {
            tracker.textContent = isReserve
                ? `Reserve Q ${state.currentQuestionIndex + 1} of ${totalQ} [ID #${state.currentQuestionId}]`
                : `Q ${state.currentQuestionIndex + 1} of ${totalQ} [ID #${state.currentQuestionId}]`;
        }
    }

    // Dynamic Next / Advance Button Text & Glow
    const btnNext = document.getElementById('btnNextQuestion');
    const btnPrev = document.getElementById('btnPrevQuestion');
    if (btnPrev && state.viewMode === 'prelims' && state.prelimsMode === 'single') {
        const curIdx = state.activePrelimIndex || 0;
        btnPrev.innerHTML = curIdx > 0 ? `◀ Prev Q${curIdx}` : '◀ Prev';
    } else if (btnPrev) {
        btnPrev.innerHTML = '◀ Prev';
    }

    if (btnNext) {
        if (state.viewMode === 'prelims' && state.prelimsMode === 'single') {
            const isTiebreaker = state.prelimsMode === 'tiebreaker';
            const total = isTiebreaker ? 5 : 20;
            const curIdx = state.activePrelimIndex || 0;
            if (curIdx >= total - 1) {
                btnNext.innerHTML = 'Finish Prelims 🎯';
                btnNext.className = 'btn-primary';
            } else {
                btnNext.innerHTML = `Q${curIdx + 2} Next ▶`;
                btnNext.className = 'btn-secondary';
            }
            btnNext.style.boxShadow = 'none';
        } else if (state.viewMode !== 'stage') {
            btnNext.innerHTML = 'Next ▶';
            btnNext.className = 'btn-secondary';
            btnNext.style.boxShadow = 'none';
        } else if (state.isRoundIntro) {
            btnNext.innerHTML = 'Start Q1 ▶';
            btnNext.className = 'btn-primary';
            btnNext.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.4)';
        } else if (state.currentQuestionIndex >= totalQ - 1) {
            if (isReserve) {
                btnNext.innerHTML = 'End of Reserve 📦';
                btnNext.className = 'btn-secondary';
                btnNext.style.boxShadow = 'none';
            } else if (!isTieBreaker && activeRoundIdx < QUIZ_DATA.rounds.length - 1) {
                btnNext.innerHTML = `Launch Round ${activeRoundIdx + 2} 👉`;
                btnNext.className = 'btn-primary';
                btnNext.style.boxShadow = '0 0 14px rgba(245, 158, 11, 0.6)';
            } else {
                btnNext.innerHTML = 'Champions Podium 🏆';
                btnNext.className = 'btn-primary';
                btnNext.style.boxShadow = '0 0 14px rgba(245, 158, 11, 0.6)';
            }
        } else {
            btnNext.innerHTML = 'Next ▶';
            btnNext.className = 'btn-secondary';
            btnNext.style.boxShadow = 'none';
        }
    }

    // 4. Render Center Main Details
    renderQMMainDetails(state);

    // 5. Render Scorekeeper Sidebar
    renderQMScorekeeper(state);

    // 6. Render History Log
    renderQMHistoryLog(state);
}

function renderQMMainDetails(state) {
    const detailsContainer = document.getElementById('qmQuestionDetails');

    // Case 1: Welcome Mode
    if (state.viewMode === 'welcome') {
        detailsContainer.innerHTML = `
            <div class="qm-welcome-hero">
                <span style="font-size: 2.8rem;">🌿 🎛️</span>
                <h3 style="font-size: 1.8rem; color: #FFF; font-weight: 900; margin: 0;">
                    THE SAHYADRI WILDLIFE QUIZ 2026
                </h3>
                <p style="font-size: 1.05rem; color: var(--text-gold); max-width: 650px; line-height: 1.5; margin: 0;">
                    Welcome screen is currently active on the stage projector display. Choose how to run the preliminary screening test below:
                </p>
                <div style="display: flex; gap: 12px; margin-top: 10px; flex-wrap: wrap;">
                    <button class="qm-stage-launch-btn" onclick="startPrelimsSingle()" style="font-size: 1.05rem; padding: 12px 24px;">
                        ▶ START PRELIMS (1 BY 1 WITH TIMER) 👉
                    </button>
                    <button class="btn-primary" onclick="startPrelimsTest()" style="padding: 12px 20px; font-weight: 700;">
                        📋 Prelims (All 20 Grid)
                    </button>
                    <button class="btn-secondary" onclick="setAppViewMode('stage')" style="padding: 12px 18px;">
                        🎯 Skip to Stage Finals
                    </button>
                </div>
            </div>
        `;
        return;
    }

    // Case 2: Prelims Mode
    if (state.viewMode === 'prelims') {
        const isTiebreaker = state.prelimsMode === 'tiebreaker';
        const isSingle = state.prelimsMode === 'single';
        const questions = isTiebreaker 
            ? QUIZ_DATA.prelims.filter(q => q.is_tiebreaker) 
            : QUIZ_DATA.prelims.filter(q => !q.is_tiebreaker);

        // Subcase 2A: Completed Screen in Single Mode
        if (isSingle && state.prelimsCompleted) {
            detailsContainer.innerHTML = `
                <div style="background: rgba(6, 78, 59, 0.35); border: 2px solid #10B981; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
                    <div style="font-size: 3rem; margin-bottom: 6px;">🎉 🏁</div>
                    <h3 style="color: #10B981; font-size: 1.6rem; font-weight: 900; margin: 0 0 8px 0;">
                        ${isTiebreaker ? 'All 5 Tie-Breakers Completed!' : 'All 20 Preliminary Questions Completed!'}
                    </h3>
                    <p style="color: #E2E8F0; font-size: 0.98rem; max-width: 620px; margin: 0 auto 16px auto; line-height: 1.5;">
                        The public display is now showing the <strong>Answer Sheet Submission & Scoring</strong> slide. Collect the student team test papers now.
                    </p>
                    <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
                        <button class="btn-secondary" onclick="selectPrelimQuestion(0)" style="padding: 9px 18px; font-weight: 700;">
                            🔄 Review from Q1 (1-by-1)
                        </button>
                        <button class="btn-secondary" onclick="setAppViewMode('prelims', 'all')" style="padding: 9px 18px; font-weight: 700;">
                            📋 Project All 20 Grid
                        </button>
                        <button onclick="window.open('prelims_print.html', '_blank')" style="background: linear-gradient(135deg, #059669, #10b981); color: white; border: none; border-radius: 6px; padding: 9px 18px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                            🖨️ Print Master Answer Key
                        </button>
                        <button class="qm-stage-launch-btn" onclick="setAppViewMode('stage')" style="padding: 9px 22px; font-size: 0.95rem; font-weight: 800;">
                            🎯 Launch Stage Finals (R1) 👉
                        </button>
                    </div>

                    <div style="text-align: left; background: rgba(0,0,0,0.4); border-radius: 8px; padding: 12px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-weight: 800; color: var(--text-gold); margin-bottom: 10px; font-size: 0.92rem; display: flex; justify-content: space-between;">
                            <span>📋 Master Answer Key Reference</span>
                            <span style="color: #94A3B8; font-size: 0.82rem;">${questions.length} Questions</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px; max-height: 260px; overflow-y: auto; padding-right: 4px;">
                            ${questions.map((q, idx) => `
                                <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 6px; padding: 8px 10px; font-size: 0.82rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                        <strong style="color: #93C5FD;">${q.serial_no || (isTiebreaker ? `TB ${idx + 1}` : `Q${idx + 1}`)}</strong>
                                        <span style="color: #10B981; font-weight: 800;">Ans: ${q.answer_en}</span>
                                    </div>
                                    <div style="color: #CBD5E1; font-size: 0.78rem; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                                        ${q.question_en || q.prompt_en}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        // Subcase 2B: Single Question Cockpit
        if (isSingle) {
            const activeIdx = Math.max(0, Math.min(state.activePrelimIndex || 0, questions.length - 1));
            const rawQ = questions[activeIdx] || questions[0];
            const q = getResolvedQuestion(rawQ.serial_no || rawQ.num) || rawQ;
            const serialBadge = q.serial_no || (isTiebreaker ? `TB ${activeIdx + 1}` : `Q${activeIdx + 1}`);
            const totalQs = questions.length;
            const qEn = q.question_en || q.prompt_en || '';
            const qMl = q.question_ml || q.prompt_ml || '';
            const ansEn = q.answer_en || '';
            const ansMl = q.answer_ml || '';
            const isAutoOn = state.prelimAutoAdvance !== false;
            const dur = state.prelimTimerDuration || 30;

            detailsContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <!-- Top Control Bar -->
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="badge ${isTiebreaker ? 'badge-gold' : 'badge-emerald'}" style="font-size: 0.85rem; padding: 4px 10px;">
                                ${serialBadge} • Question ${activeIdx + 1} of ${totalQs}
                            </span>
                            <span class="badge ${isAutoOn ? 'badge-emerald' : 'badge-gold'}" style="font-size: 0.75rem; padding: 3px 8px; cursor: pointer;" onclick="togglePrelimAutoAdvance()" title="Click to toggle auto-advance">
                                ${isAutoOn ? '⚡ Auto-Advance: ' + dur + 's' : '⏸️ Manual Advance'}
                            </span>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button class="btn-secondary" onclick="setAppViewMode('prelims', 'all')" style="padding: 4px 12px; font-size: 0.82rem;" title="Switch to view all 20 questions grid">
                                📋 Switch to All-20 Grid
                            </button>
                            <button onclick="window.open('prelims_print.html', '_blank')" style="background: linear-gradient(135deg, #059669, #10b981); color: white; border: none; border-radius: 6px; padding: 4px 12px; font-size: 0.82rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                                🖨️ Print Paper (A4)
                            </button>
                            <button class="btn-secondary btn-edit" onclick="openEditQuestionModal('${q.serial_no || q.num}')" style="padding: 4px 12px; font-size: 0.82rem;" title="Edit this prelim question text, answer or photo">
                                ✏️ Edit This Question
                            </button>
                        </div>
                    </div>

                    <!-- Question Body (Text Only) -->
                    <div style="background: rgba(4, 18, 12, 0.75); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 14px 18px; display: flex; flex-direction: column; gap: 10px;">
                        <p style="margin: 0; font-size: 1.15rem; color: #FFFFFF; font-weight: 700; line-height: 1.45;">
                            ${qEn}
                        </p>
                        <p class="ml-text" style="margin: 0; font-size: 1.05rem; color: #6EE7B7; line-height: 1.45;">
                            ${qMl}
                        </p>
                    </div>

                    <!-- QM Master Answer Spotlight Card (Shows Official Answer & Image for QM Review) -->
                    <div style="background: linear-gradient(135deg, rgba(5, 150, 105, 0.25), rgba(4, 120, 87, 0.15)); border: 1.5px solid #10B981; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div style="flex: 1; min-width: 260px;">
                            <span style="font-size: 0.72rem; text-transform: uppercase; color: #34D399; font-weight: 800; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">
                                🎯 Master Answer Key (Official Answer)
                            </span>
                            <div style="display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;">
                                <span style="font-size: 1.25rem; font-weight: 900; color: #FFFFFF;">${ansEn}</span>
                                <span class="ml-text" style="font-size: 1.1rem; font-weight: 700; color: var(--text-gold);">(${ansMl})</span>
                            </div>
                            ${q.fact_en ? `
                                <div style="font-size: 0.8rem; color: #CBD5E1; margin-top: 4px;">
                                    💡 <em>${q.fact_en}</em>
                                </div>
                            ` : ''}
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            ${q.image ? `
                                <div style="display: flex; flex-direction: column; align-items: center; gap: 3px; background: rgba(0,0,0,0.3); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 6px; padding: 4px 6px;">
                                    <img src="${safeImageSrc(q.image, 48)}" style="width: 76px; height: 54px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none'" />
                                    <span style="font-size: 0.65rem; color: #6EE7B7; font-weight: 600;">Answer Photo</span>
                                </div>
                            ` : ''}
                            <span class="badge ${state.revealed ? 'badge-emerald' : 'badge-gold'}" style="font-size: 0.75rem; padding: 5px 10px;">
                                ${state.revealed ? '👁️ Answer & Photo Visible on Public Screen' : '🔒 Question Only on Screen (Answer & Photo Hidden)'}
                            </span>
                        </div>
                    </div>

                    <!-- Quick Navigation & Timer HUD Strip -->
                    <div class="qm-prelim-timer-bar">
                        <div class="qm-prelim-timer-controls">
                            <span class="qm-prelim-timer-label">⏱️ Question Timer:</span>
                            <div class="qm-prelim-timer-presets">
                                ${[15, 20, 30, 45, 60, 90, 120].map(s => `
                                    <button class="qm-timer-preset-btn ${dur === s ? 'is-active' : ''}" onclick="setQuestionTimerPreset(${s})">
                                        ${s}s
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div style="display: flex; gap: 6px; align-items: center;">
                            <button class="btn-timer ${isAutoOn ? 'btn-auto-on' : 'btn-auto-off'}" onclick="togglePrelimAutoAdvance()" title="Toggle auto-advance when timer completes">
                                ${isAutoOn ? '⚡ Auto-Advance: ON' : '⏸️ Auto-Advance: OFF'}
                            </button>
                            <button class="btn-secondary" onclick="prevQuestion()" ${activeIdx === 0 ? 'disabled style="opacity: 0.5;"' : ''}>
                                ◀ Prev Q
                            </button>
                            <button class="${activeIdx === totalQs - 1 ? 'btn-primary' : 'btn-secondary'}" onclick="nextQuestion()">
                                ${activeIdx === totalQs - 1 ? 'Finish Prelims 🎯' : 'Next Q ▶'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        // Subcase 2C: All 20 Grid Checklist (Existing behavior preserved with enhanced banner)
        detailsContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                <div>
                    <span class="badge ${isTiebreaker ? 'badge-gold' : 'badge-emerald'}">
                        ${isTiebreaker ? '🚨 5 TIE-BREAKERS' : '📋 ALL 20 QUESTIONS DISPLAYED ON SCREEN'}
                    </span>
                    <span style="margin-left: 8px; font-weight: 800; color: #FFF; font-size: 0.9rem;">
                        Master Answer Key & Checklist
                    </span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-secondary" onclick="setAppViewMode('prelims', 'single')" style="padding: 5px 14px; font-size: 0.82rem; font-weight: 700; color: #34D399; border-color: #10B981;">
                        🔍 Switch to 1-by-1 View
                    </button>
                    <button onclick="window.open('prelims_print.html', '_blank')" style="background: linear-gradient(135deg, #059669, #10b981); color: white; border: none; border-radius: 6px; padding: 5px 14px; font-size: 0.82rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(16,185,129,0.3);">🖨️ Print Question Paper (A4)</button>
                    <button class="qm-stage-launch-btn" onclick="setAppViewMode('stage')" style="padding: 5px 14px; font-size: 0.82rem;">
                        🎯 Finish Prelims & Start Stage Finals 👉
                    </button>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px; max-height: calc(100vh - 290px); overflow-y: auto; padding-right: 6px; margin-top: 6px;">
                ${questions.map((q, idx) => `
                    <div style="background: rgba(4, 18, 12, 0.75); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 6px; padding: 8px 12px; display: flex; flex-direction: column; gap: 3px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="exam-card-badge ${isTiebreaker ? 'tb-badge' : ''}" style="font-size: 0.72rem; ${q.serial_no ? 'background: #4338ca; color: #fff;' : ''}">
                                ${q.serial_no || (isTiebreaker ? `TB ${idx + 1}` : `Q${q.num}`)}
                            </span>
                            <strong style="color: var(--emerald-primary); font-size: 0.85rem;">
                                Ans: ${q.answer_en} <span class="ml-text" style="color: var(--text-gold);">(${q.answer_ml})</span>
                            </strong>
                        </div>
                        <div style="display: flex; gap: 12px; align-items: flex-start;">
                            ${q.image ? `<img src="${safeImageSrc(q.image, 48)}" style="width: 75px; height: 55px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-gold); flex-shrink: 0; margin-top: 2px;" onerror="this.style.display='none'" />` : ''}
                            <div>
                                <p style="margin: 0; font-size: 0.85rem; color: #F1F5F9; font-weight: 600;">
                                    ${q.question_en || q.prompt_en}
                                </p>
                                <p class="ml-text" style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--text-mint);">
                                    ${q.question_ml || q.prompt_ml}
                                </p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        return;
    }

    // Case 3: Stage Mode - Round Intro & Rules Slide View (Synchronized with Public Display)
    if (state.isRoundIntro) {
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
                scoring: { direct: 0, penalty: 0 },
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
                scoring: { direct: 10, penalty: 0 },
                description: "Backup question bank reserved for additional tie-breakers, substitutions, or reserve rounds.",
                description_ml: "ആവശ്യാനുസരണം ഉപയോഗിക്കാവുന്ന റിസർവ്വ് ചോദ്യശേഖരം."
            })
            : (QUIZ_DATA.rounds[state.currentRoundIndex] || QUIZ_DATA.rounds[0]);

        const isBuzzer = round.type === "Buzzer Round";
        const isClue = round.type === "Clue Round";

        const directPtsText = isClue ? '+15 / +10 / +5' : '+10 pts';
        const pounceText = isBuzzer ? 'Open Buzzer' : '+10 pts';
        const pounceSub = isBuzzer ? 'First team to buzz gets 10s oral turn' : 'Other teams write answer slip before timer ends';
        const penaltyText = '-5 pts';
        const penaltySub = isBuzzer ? 'Wrong answer on buzzer incurs -5 penalty' : 'Wrong written pounce slip incurs -5 penalty';

        detailsContainer.innerHTML = `
            <div style="background: rgba(6, 26, 17, 0.95); border: 2px solid var(--border-gold); border-radius: 8px; padding: 20px; display: flex; flex-direction: column; gap: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                    <div>
                        <span class="badge badge-gold" style="font-size: 0.88rem;">
                            ${isTieBreaker ? '🚨 STAGE TIE-BREAKER KNOCKOUT ACTIVE' : (isReserve ? '📦 RESERVE QUESTIONS POOL ACTIVE' : '🌿 STAGE SCREEN: ROUND INTRO & RULES ACTIVE')}
                        </span>
                        <h3 style="color: #FFF; font-size: 1.4rem; margin: 4px 0 0 0;">
                            ${round.round_num && round.round_num !== 'TB' && round.round_num !== 'RES' ? `Round ${round.round_num}: ` : ''}${round.title}
                        </h3>
                        <span class="ml-text" style="color: var(--text-gold); font-size: 0.95rem; font-weight: 600;">${round.title_ml || ''}</span>
                    </div>
                    <button class="qm-stage-launch-btn" onclick="startRoundQuestions()" style="font-size: 1.05rem; padding: 10px 24px;">
                        ▶ START ROUND QUESTIONS (Q 1) 👉
                    </button>
                </div>

                ${isTieBreaker ? `
                    <!-- TB2 Sudden-Death: No Regular Scoring Rules, First to Answer Advances -->
                    <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.22), rgba(245, 158, 11, 0.22)); border: 2px solid var(--border-gold); padding: 24px; border-radius: 8px; text-align: center; box-shadow: 0 0 20px rgba(245, 158, 11, 0.25);">
                        <div style="font-size: 2.2rem; margin-bottom: 6px;">⚡ 🚨 🏆</div>
                        <h3 style="color: #FFF; font-size: 1.5rem; margin: 0 0 8px 0; font-weight: 800; letter-spacing: 0.5px;">
                            SUDDEN-DEATH TIE-BREAKER KNOCKOUT
                        </h3>
                        <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-gold); margin-bottom: 8px;">
                            Whoever answers correctly goes straight to the front!
                        </div>
                        <div class="ml-text" style="font-size: 1.15rem; font-weight: 600; color: var(--text-mint);">
                            ആദ്യം ശരിയുത്തരം പറയുന്ന ടീം മുന്നിലെത്തുന്നു / വിജയിക്കുന്നു
                        </div>
                        <p style="margin: 14px 0 0 0; font-size: 0.88rem; color: #CBD5E1;">
                            Standard round scoring rules do not apply • No pounce • Direct sudden-death decider between tied teams
                        </p>
                    </div>
                ` : isReserve ? `
                    <!-- Reserve Pool: 24 Backup Questions Overview -->
                    <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2)); border: 2px solid #3B82F6; padding: 22px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 2.2rem; margin-bottom: 6px;">📦 🌿</div>
                        <h3 style="color: #FFF; font-size: 1.45rem; margin: 0 0 6px 0; font-weight: 800;">
                            RESERVE & BACKUP QUESTION POOL
                        </h3>
                        <div style="font-size: 1.2rem; font-weight: 700; color: #93C5FD; margin-bottom: 6px;">
                            24 Questions Preserved from Endemics, Sanctuaries & Living Fossils
                        </div>
                        <div class="ml-text" style="font-size: 1.05rem; color: var(--text-mint);">
                            റിസർവ്വ് ചോദ്യശേഖരം (24 ചോദ്യങ്ങൾ) • ആവശ്യാനുസരണം ഉപയോഗിക്കാവുന്ന ബാക്കപ്പ് ചോദ്യങ്ങൾ
                        </div>
                        <p style="margin: 10px 0 0 0; font-size: 0.86rem; color: #CBD5E1;">
                            Use freely for backup, audience rounds, extra tie-breakers, or question substitutions.
                        </p>
                    </div>
                ` : `
                    <!-- 4 Official Synchronized Rules Cards (Matches Public Display 100%) -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                        <div style="background: rgba(0,0,0,0.35); border: 1.5px solid var(--border-gold); padding: 12px 10px; border-radius: 6px; text-align: center;">
                            <span style="font-size: 1.3rem;">🎯</span>
                            <h4 style="margin: 4px 0 2px 0; font-size: 0.85rem; color: #E2E8F0;">${isBuzzer ? 'Correct Answer' : 'Direct Oral Turn'}</h4>
                            <div style="font-size: 1.3rem; font-weight: 900; color: var(--text-gold);">${directPtsText}</div>
                            <span style="font-size: 0.74rem; color: #CBD5E1; line-height: 1.3; display: block; margin-top: 3px;">
                                ${isBuzzer ? '10s oral answer on buzzer' : `${round.timing_sec || 30}s oral answer • 0 if miss (No negative)`}
                            </span>
                        </div>

                        <div style="background: rgba(0,0,0,0.35); border: 1.5px solid #10B981; padding: 12px 10px; border-radius: 6px; text-align: center;">
                            <span style="font-size: 1.3rem;">🐾</span>
                            <h4 style="margin: 4px 0 2px 0; font-size: 0.85rem; color: #E2E8F0;">${isBuzzer ? 'Buzzer Race' : 'Pounce (Written Slips)'}</h4>
                            <div style="font-size: 1.3rem; font-weight: 900; color: #34D399;">${pounceText}</div>
                            <span style="font-size: 0.74rem; color: #CBD5E1; line-height: 1.3; display: block; margin-top: 3px;">
                                ${pounceSub}
                            </span>
                        </div>

                        <div style="background: rgba(0,0,0,0.35); border: 1.5px solid #EF4444; padding: 12px 10px; border-radius: 6px; text-align: center;">
                            <span style="font-size: 1.3rem;">⚠️</span>
                            <h4 style="margin: 4px 0 2px 0; font-size: 0.85rem; color: #E2E8F0;">${isBuzzer ? 'Buzzer Penalty' : 'Pounce Risk'}</h4>
                            <div style="font-size: 1.3rem; font-weight: 900; color: #F87171;">${penaltyText}</div>
                            <span style="font-size: 0.74rem; color: #CBD5E1; line-height: 1.3; display: block; margin-top: 3px;">
                                ${penaltySub}
                            </span>
                        </div>

                        <div style="background: rgba(0,0,0,0.35); border: 1.5px solid #38BDF8; padding: 12px 10px; border-radius: 6px; text-align: center;">
                            <span style="font-size: 1.3rem;">⚖️</span>
                            <h4 style="margin: 4px 0 2px 0; font-size: 0.85rem; color: #E2E8F0;">Unbiased Fair Play</h4>
                            <div style="font-size: 1.25rem; font-weight: 900; color: #38BDF8;">All Teams</div>
                            <span style="font-size: 0.74rem; color: #CBD5E1; line-height: 1.3; display: block; margin-top: 3px;">
                                ${round.question_ids ? round.question_ids.length : 8} Questions • Every team can score
                            </span>
                        </div>
                    </div>
                `}

                <div style="background: rgba(0,0,0,0.3); border-left: 3px solid var(--gold-primary); padding: 12px 16px; border-radius: 6px;">
                    <p style="margin: 0 0 6px 0; font-size: 0.95rem; color: #F1F5F9; line-height: 1.45;"><strong>${isTieBreaker ? 'Decider Rule:' : isReserve ? 'Pool Info:' : 'Round Rules:'}</strong> ${round.description}</p>
                    <p class="ml-text" style="margin: 0; font-size: 0.90rem; color: var(--text-mint); line-height: 1.45;"><strong>${isTieBreaker ? 'ടൈ-ബ്രേക്കർ നിയമം:' : 'വിവരണം:'}</strong> ${round.description_ml}</p>
                </div>
            </div>
        `;
        return;
    }

    // Case 4: Stage Mode - Question Active
    let qData = getResolvedQuestion(state.currentQuestionId);
    if (!qData || (!qData.question_en && !qData.question)) {
        const isTieBreaker = state.currentRoundIndex === -1;
        const curRound = isTieBreaker 
            ? { question_ids: QUIZ_DATA.stage_tie_breakers } 
            : (QUIZ_DATA.rounds[state.currentRoundIndex] || QUIZ_DATA.rounds[0]);
        if (curRound && curRound.question_ids && curRound.question_ids[state.currentQuestionIndex]) {
            qData = getResolvedQuestion(curRound.question_ids[state.currentQuestionIndex]);
        }
    }
    if (!qData) {
        detailsContainer.innerHTML = `<p>No question loaded</p>`;
        return;
    }

    const isTieBreaker = state.currentRoundIndex === -1;
    const round = isTieBreaker 
        ? { round_num: "TB", title: "Stage Tie-Breaker", type: "Tie Breaker", scoring: { direct: 10, pass: 0, penalty: 0 } }
        : (QUIZ_DATA.rounds[state.currentRoundIndex] || QUIZ_DATA.rounds[0]);
    const activeTeam = QUIZ_DATA.teams.find(t => t.id === state.activeTeamTurn) || QUIZ_DATA.teams[0];

    const isClueRound = round.type === "Clue Round" || qData.is_clue_question || (qData.clues && qData.clues.length > 0);
    const currentClueTier = state.revealedClueCount || 1;
    const currentCluePts = currentClueTier === 1 ? 15 : (currentClueTier === 2 ? 10 : 5);

    // Clean question without labels
    const fullQuestionEn = qData.question_en || qData.prompt_en || '';
    const fullQuestionMl = qData.question_ml || qData.prompt_ml || '';

    let audioPreview = '';
    if (qData.has_audio) {
        audioPreview = `
            <div style="background: rgba(59, 130, 246, 0.15); border: 1px solid #3B82F6; padding: 10px 14px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <strong style="color: #93C5FD;">🎧 Audio Preview:</strong>
                    <p style="font-size: 0.8rem; color: #94A3B8;">${qData.media_desc || "Acoustic Cue"}</p>
                </div>
                <audio src="${qData.audio}" controls style="height: 32px;"></audio>
            </div>
        `;
    }

    detailsContainer.innerHTML = `
        <!-- Top Status Bar with Rules Slide toggle & Edit Question Button -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge badge-gold">${round.title}</span>
                ${qData.serial_no ? `<span class="badge" style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; font-weight: 800; font-size: 0.85rem; padding: 3px 9px; border-radius: 4px; letter-spacing: 0.5px;">🏷️ ${qData.serial_no}</span>` : ''}
            </div>
            ${isTieBreaker ? `
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="badge" style="background: linear-gradient(135deg, #ef4444, #f59e0b); color: #FFF; font-weight: 800; font-size: 0.82rem; padding: 4px 10px; border-radius: 4px; letter-spacing: 0.5px;">
                        🚨 SUDDEN-DEATH: Tied Teams • Whoever answers goes to the front!
                    </span>
                </div>
            ` : `
                <div style="font-weight: 700; color: ${activeTeam.color}; display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 0.82rem; color: #CBD5E1;">Direct Turn:</span>
                    <strong style="font-size: 0.92rem;">${activeTeam.name.split('/')[0]} (${activeTeam.icon})</strong>
                </div>
            `}
        </div>

        <!-- PRIVATE OFFICIAL ANSWER KEY -->
        <div class="qm-answer-key-box">
            <div class="qm-answer-key-title">🔑 Answer Key:</div>
            <div class="qm-answer-key-val">${qData.answer_en}</div>
            <div class="qm-answer-key-ml ml-text">${qData.answer_ml}</div>
        </div>

        ${isClueRound && qData.clues && qData.clues.length > 0 ? `
            <!-- Progressive Clue Hunter Controller (Mission Control) -->
            <div class="qm-clue-director-box">
                <div class="qm-clue-director-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.15rem;">🕵️‍♂️</span>
                        <strong style="color: var(--text-gold); font-size: 0.95rem;">CLUE HUNTER PROGRESSION CONTROLLER</strong>
                        <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid #10B981; font-size: 0.74rem;">🎯 TARGET: LIVING ORGANISM</span>
                    </div>
                    <span class="badge ${currentClueTier === 1 ? 'badge-gold' : (currentClueTier === 2 ? 'badge-emerald' : 'badge-ruby')}" style="font-size: 0.78rem;">
                        STAGE DISPLAY: CLUE ${currentClueTier} OF 3 (+${currentCluePts} PTS)
                    </span>
                </div>

                <!-- Oral Prompt for Quizmaster -->
                <div style="margin-bottom: 10px; padding: 8px 12px; background: rgba(0,0,0,0.35); border-radius: 4px; border-left: 3px solid var(--gold-primary);">
                    ${qData.serial_no ? `<div style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; font-size: 0.75rem; font-weight: 800; padding: 2px 7px; border-radius: 4px; margin-bottom: 6px; letter-spacing: 0.5px;">SERIAL: ${qData.serial_no}</div>` : ''}
                    <div style="font-size: 0.88rem; color: #FFFFFF; font-weight: 600;">🗣️ ${qData.question_en}</div>
                    <div class="ml-text" style="font-size: 0.84rem; color: var(--text-mint); margin-top: 2px;">${qData.question_ml}</div>
                </div>

                <!-- Stepper Buttons to reveal Clue 1, Clue 2, Clue 3 -->
                <div class="qm-clue-action-bar">
                    <button class="qm-clue-btn-step ${currentClueTier === 1 ? 'step-active' : 'step-unlocked'}" onclick="setClueStage(1)">
                        ① Clue 1 (+15 Pts)
                    </button>
                    <button class="qm-clue-btn-step ${currentClueTier === 2 ? 'step-active' : (currentClueTier > 2 ? 'step-unlocked' : 'step-locked')}" onclick="setClueStage(2)">
                        ② Clue 2 (+10 Pts) ${currentClueTier < 2 ? '🔓 Unlock' : ''}
                    </button>
                    <button class="qm-clue-btn-step ${currentClueTier === 3 ? 'step-active' : 'step-locked'}" onclick="setClueStage(3)">
                        ③ Clue 3 (+5 Pts) ${currentClueTier < 3 ? '🔓 Unlock' : ''}
                    </button>
                </div>

                <!-- Clues list with English & Malayalam -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${qData.clues.map((c) => {
                        const isRevealed = currentClueTier >= c.tier;
                        const isCurrent = currentClueTier === c.tier;
                        return `
                            <div class="qm-clue-item ${isCurrent ? 'is-current-active' : ''}" style="background: ${isCurrent ? 'rgba(245, 158, 11, 0.12)' : (isRevealed ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.18)')}; border: 1.5px solid ${isCurrent ? 'var(--border-gold)' : (isRevealed ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)')};">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                    <span style="font-weight: 800; font-size: 0.76rem; color: ${isCurrent ? 'var(--text-gold)' : (isRevealed ? 'var(--emerald-primary)' : '#94A3B8')};">
                                        ${isRevealed ? (isCurrent ? '⚡ CURRENT STAGE:' : '✓ VISIBLE:') : '🔒 LOCKED:'} CLUE ${c.tier} (+${c.pts} PTS)
                                    </span>
                                    ${!isRevealed ? `<button onclick="setClueStage(${c.tier})" class="btn-secondary" style="font-size: 0.72rem; padding: 2px 8px; background: #065F46;">▶ Reveal This Clue</button>` : ''}
                                </div>
                                <p style="margin: 0; font-size: 0.86rem; color: ${isRevealed ? '#FFFFFF' : '#94A3B8'}; line-height: 1.35; font-weight: ${isCurrent ? '700' : '500'};"><strong style="color: #F59E0B;">Clue ${c.tier}:</strong> ${c.clue_en}</p>
                                <p class="ml-text" style="margin: 2px 0 0 0; font-size: 0.82rem; color: ${isRevealed ? 'var(--text-mint)' : '#64748B'}; line-height: 1.35;">${c.clue_ml}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        ` : `
        <!-- Question Prompt (Clean, with Serial Ref) -->
        <div style="background: rgba(245, 158, 11, 0.08); border: 1.5px solid var(--border-gold); padding: 14px 18px; border-radius: 6px;">
            ${qData.serial_no ? `<div style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; font-size: 0.78rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px; letter-spacing: 0.5px;">SERIAL: ${qData.serial_no}</div>` : ''}
            <p style="font-size: 1.12rem; color: #FFF; font-weight: 600; line-height: 1.45; margin: 0 0 6px 0;">
                ${fullQuestionEn}
            </p>
            <p class="ml-text" style="font-size: 1.05rem; color: var(--text-mint); font-weight: 500; line-height: 1.5; margin: 0;">
                ${fullQuestionMl}
            </p>
        </div>
        `}

        ${audioPreview}

        <!-- Specimen Preview & Fact Box -->
        <div style="display: flex; gap: 14px; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 6px;">
            ${qData.image ? `<img src="${safeImageSrc(qData.image, 30)}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-gold);" />` : ''}
            <div style="font-size: 0.85rem; color: #CBD5E1; line-height: 1.4;">
                <strong style="color: var(--text-gold);">Fun Fact</strong><br>
                ${qData.fact_en || 'Keystone ecological and conservation significance.'}<br>
                <span class="ml-text" style="color: var(--text-mint);">${qData.fact_ml || 'പാരിസ്ഥിതിക സംരക്ഷണ പ്രാധാന്യമുള്ള ജീവിവർഗ്ഗം.'}</span>
            </div>
        </div>

        ${(() => {
            const isLastQuestionOfRound = activeQuestionIdx === (round.question_ids ? round.question_ids.length - 1 : 7);
            if (isLastQuestionOfRound && !isTieBreaker) {
                const nextRoundNum = round.round_num + 1;
                const nextRound = QUIZ_DATA.rounds[round.round_num];
                const nextRoundTitle = nextRound ? nextRound.title : "Championship Finals";
                return `
                    <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(16, 185, 129, 0.2)); border: 1.5px solid var(--border-gold); padding: 12px 16px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 0 15px rgba(245, 158, 11, 0.25); margin-top: 10px;">
                        <div>
                            <span style="background: var(--gold-primary); color: #000; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 10px; text-transform: uppercase;">
                                🏁 Round ${round.round_num} Final Question (Q8)
                            </span>
                            <strong style="color: #FFF; font-size: 0.96rem; display: block; margin-top: 4px;">
                                Ready to proceed to Round ${nextRoundNum}: ${nextRoundTitle}?
                            </strong>
                            <span style="color: #CBD5E1; font-size: 0.78rem;">
                                Click 'Launch Round ${nextRoundNum} 👉' or click 'Next' above
                            </span>
                        </div>
                        <button class="btn-primary" onclick="switchRound(${activeRoundIdx + 1})" style="padding: 8px 18px; font-size: 0.88rem; font-weight: 800; cursor: pointer; white-space: nowrap; box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);">
                            Launch Round ${nextRoundNum} 👉
                        </button>
                    </div>
                `;
            } else if (isLastQuestionOfRound && isTieBreaker) {
                return `
                    <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(239, 68, 68, 0.2)); border: 1.5px solid var(--border-gold); padding: 12px 16px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 0 15px rgba(245, 158, 11, 0.25); margin-top: 10px;">
                        <div>
                            <strong style="color: #FFF; font-size: 0.96rem; display: block;">
                                🏁 All Tie-Breaker Questions Complete!
                            </strong>
                            <span style="color: #CBD5E1; font-size: 0.78rem;">
                                Scores are final. View the champions podium!
                            </span>
                        </div>
                        <button class="btn-primary" onclick="setAppViewMode('winner')" style="padding: 8px 18px; font-size: 0.88rem; font-weight: 800; cursor: pointer; white-space: nowrap;">
                            View Champions Podium 🏆
                        </button>
                    </div>
                `;
            }
            return '';
        })()}
    `;
}

function renderQMScorekeeper(state) {
    const container = document.getElementById('qmTeamScoreRows');
    if (!container) return;
    container.innerHTML = '';

    const isTieBreaker = state.currentRoundIndex === -1;
    const round = isTieBreaker 
        ? { type: "Tie Breaker", scoring: { direct: 10, pass: 0, penalty: 0 } }
        : (QUIZ_DATA.rounds[state.currentRoundIndex] || QUIZ_DATA.rounds[0]);
    const isClueRound = round.type === "Clue Round";
    const currentClueTier = state.revealedClueCount || 1;
    const currentCluePts = currentClueTier === 1 ? 15 : (currentClueTier === 2 ? 10 : 5);

    QUIZ_DATA.teams.forEach(team => {
        const score = state.scores[team.id] !== undefined ? state.scores[team.id] : 0;
        const isTurn = state.activeTeamTurn === team.id;

        const row = document.createElement('div');
        row.className = `qm-team-row ${isTurn ? 'is-turn' : ''}`;
        row.style.borderLeftColor = team.color;

        if (isTurn) {
            // Direct Oral Turn Team Card (+10 / 0 Pass)
            row.innerHTML = `
                <div class="qm-team-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.35rem;">${team.icon}</span>
                        <div>
                            <span style="color: ${team.color}; font-weight: 800; font-size: 0.95rem;">${team.name.split('/')[0]}</span>
                            <span style="background: rgba(245, 158, 11, 0.25); color: var(--text-gold); font-size: 0.68rem; font-weight: 800; padding: 2px 7px; border-radius: 10px; margin-left: 6px; text-transform: uppercase;">
                                🎯 DIRECT TURN (Oral)
                            </span>
                        </div>
                    </div>
                    <span class="qm-team-score" style="color: var(--text-gold); font-size: 1.35rem; font-weight: 900;">${score}</span>
                </div>

                ${isClueRound ? `
                <div class="qm-score-btns" style="display: flex; gap: 6px; margin-top: 6px;">
                    <button class="score-btn btn-direct-correct" onclick="addScore('${team.id}', ${currentCluePts}, 'Clue ${currentClueTier} Correct (+${currentCluePts})')" style="flex: 1.4; background: var(--gold-primary); color: #000; font-weight: 900;">
                        🎯 +${currentCluePts} (Clue ${currentClueTier} Correct)
                    </button>
                    <button class="score-btn btn-direct-pass" onclick="recordDirectPass('${team.id}')" style="flex: 1;" title="Direct team missed or passed (0 pts, no negative)">
                        0 Direct Miss (No Neg)
                    </button>
                </div>
                <div style="display: flex; gap: 4px; margin-top: 4px;">
                    <button class="score-btn" onclick="addScore('${team.id}', 15, 'Clue 1 Correct (+15)')" style="flex: 1; font-size: 0.72rem; padding: 4px 2px; ${currentClueTier === 1 ? 'border: 1.5px solid var(--border-gold);' : ''}">+15 (C1)</button>
                    <button class="score-btn" onclick="addScore('${team.id}', 10, 'Clue 2 Correct (+10)')" style="flex: 1; font-size: 0.72rem; padding: 4px 2px; ${currentClueTier === 2 ? 'border: 1.5px solid var(--border-gold);' : ''}">+10 (C2)</button>
                    <button class="score-btn" onclick="addScore('${team.id}', 5, 'Clue 3 Correct (+5)')" style="flex: 1; font-size: 0.72rem; padding: 4px 2px; ${currentClueTier === 3 ? 'border: 1.5px solid var(--border-gold);' : ''}">+5 (C3)</button>
                </div>
                ` : `
                <div class="qm-score-btns" style="display: flex; gap: 8px; margin-top: 6px;">
                    <button class="score-btn btn-direct-correct" onclick="addScore('${team.id}', 10, 'Direct Oral Correct (+10)')" style="flex: 1.2;">
                        🎯 +10 Direct Correct
                    </button>
                    <button class="score-btn btn-direct-pass" onclick="recordDirectPass('${team.id}')" style="flex: 1;" title="Direct team missed or passed (0 pts, no negative)">
                        0 Direct Miss (No Neg)
                    </button>
                </div>
                `}
            `;
        } else {
            // Other Teams: Pounce / Pass Card with full Clue Hunter support
            row.innerHTML = `
                <div class="qm-team-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.2rem;">${team.icon}</span>
                        <div>
                            <span style="color: ${team.color}; font-weight: 700; font-size: 0.88rem;">${team.name.split('/')[0]}</span>
                            <span style="background: rgba(14, 165, 233, 0.18); color: #38BDF8; font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 10px; margin-left: 6px; text-transform: uppercase;">
                                ${isClueRound ? '🐾 CLUE POUNCE' : '🐾 POUNCE SLIP'}
                            </span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button class="score-btn btn-turn" onclick="setActiveTurn('${team.id}')" title="Make this team direct turn" style="background: transparent; border: 1px solid var(--border-card); color: #94A3B8; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; cursor: pointer;">
                            👉 Set Direct
                        </button>
                        <span class="qm-team-score" style="font-size: 1.25rem; font-weight: 800; min-width: 32px; text-align: right;">${score}</span>
                    </div>
                </div>

                ${isClueRound ? `
                <div class="qm-score-btns" style="display: flex; gap: 6px; margin-top: 6px;">
                    <button class="score-btn btn-pounce-correct" onclick="addScore('${team.id}', ${currentCluePts}, 'Clue ${currentClueTier} Pounce (+${currentCluePts})')" style="flex: 1.3; background: #059669; color: #FFF; font-weight: 800;" title="Award active clue points (+${currentCluePts})">
                        🐾 +${currentCluePts} (C${currentClueTier} Pounce)
                    </button>
                    <button class="score-btn btn-pounce-wrong" onclick="addScore('${team.id}', -5, 'Clue ${currentClueTier} Wrong Pounce (-5)')" style="flex: 1; background: rgba(220, 38, 38, 0.25); color: #FCA5A5; border: 1px solid #DC2626;" title="Deduct -5 for wrong pounce slip on clue">
                        -5 Wrong ✗
                    </button>
                    <button class="score-btn btn-zero-pass" onclick="recordPassMiss('${team.id}')" style="flex: 0.9;" title="No pounce slip submitted">
                        0 Pass
                    </button>
                </div>
                <div style="display: flex; gap: 4px; margin-top: 4px;">
                    <button class="score-btn" onclick="addScore('${team.id}', 15, 'Clue 1 Pounce (+15)')" style="flex: 1; font-size: 0.72rem; padding: 4px 2px; ${currentClueTier === 1 ? 'border: 1.5px solid #10B981; font-weight: 800;' : ''}" title="Award +15 for answering on Clue 1">+15 (C1)</button>
                    <button class="score-btn" onclick="addScore('${team.id}', 10, 'Clue 2 Pounce (+10)')" style="flex: 1; font-size: 0.72rem; padding: 4px 2px; ${currentClueTier === 2 ? 'border: 1.5px solid #10B981; font-weight: 800;' : ''}" title="Award +10 for answering on Clue 2">+10 (C2)</button>
                    <button class="score-btn" onclick="addScore('${team.id}', 5, 'Clue 3 Pounce (+5)')" style="flex: 1; font-size: 0.72rem; padding: 4px 2px; ${currentClueTier === 3 ? 'border: 1.5px solid #10B981; font-weight: 800;' : ''}" title="Award +5 for answering on Clue 3">+5 (C3)</button>
                    <button class="score-btn" onclick="addScore('${team.id}', -5, 'Wrong Clue Pounce (-5)')" style="flex: 1; font-size: 0.72rem; padding: 4px 2px; color: #FCA5A5; background: rgba(220, 38, 38, 0.15);" title="Deduct -5 for wrong answer">-5 (✗)</button>
                </div>
                ` : `
                <div class="qm-score-btns" style="display: flex; gap: 6px; margin-top: 6px;">
                    <button class="score-btn btn-pounce-correct" onclick="addScore('${team.id}', 10, 'Pounce / Pass Correct (+10)')" style="flex: 1.1;" title="Award +10 for correct answer (Pounce Slip or Oral Pass)">
                        🐾 +10 Correct
                    </button>
                    <button class="score-btn btn-pounce-wrong" onclick="addScore('${team.id}', -5, 'Pounce Slip Wrong (-5)')" style="flex: 1;" title="Deduct -5 for wrong written pounce slip">
                        -5 Pounce ✗
                    </button>
                    <button class="score-btn btn-zero-pass" onclick="recordPassMiss('${team.id}')" style="flex: 1;" title="Team did not submit a pounce slip (0 pts, no penalty)">
                        0 No Pounce / Skip
                    </button>
                </div>
                `}
            `;
        }

        container.appendChild(row);
    });
}

function renderQMHistoryLog(state) {
    const logBox = document.getElementById('qmHistoryLog');
    if (!state.scoreHistory || !state.scoreHistory.length) {
        logBox.innerHTML = '<span style="font-style: italic;">No scores recorded yet</span>';
        return;
    }

    logBox.innerHTML = state.scoreHistory.map(entry => {
        const team = QUIZ_DATA.teams.find(t => t.id === entry.teamId) || { name: entry.teamId };
        const sign = entry.delta > 0 ? `+${entry.delta}` : entry.delta;
        return `
            <div class="log-entry">
                <strong>${entry.timestamp}</strong>: ${team.name.split('/')[0]} <span style="color: var(--text-gold); font-weight:800;">(${sign})</span> - <em>${entry.reason}</em> [${entry.oldScore} -> ${entry.newScore}]
            </div>
        `;
    }).join('');
}

function addScore(teamId, delta, reason) {
    QuizState.addScore(teamId, delta, reason);
}

function setActiveTurn(teamId) {
    QuizState.setState({ activeTeamTurn: teamId });
}

function confirmResetScores() {
    if (confirm("Are you sure you want to reset all team scores to 0?")) {
        QuizState.resetScores();
    }
}

// Timer Functions
function setTimerDuration(seconds) {
    QuizState.setTimerDuration(seconds);
}

function startTimer() {
    QuizState.startTimer(
        remaining => {
            if (remaining <= 5 && remaining > 0) {
                SFX.playTick();
            }
        },
        () => {
            SFX.playTimeUp();
            handleTimerComplete();
        }
    );
}

function pauseTimer() {
    QuizState.pauseTimer();
}

function resetTimer() {
    QuizState.resetTimer();
}

let qmLocalAudio = null;

function triggerAudioPublic() {
    const qData = getResolvedQuestion(QuizState.state.currentQuestionId);
    if (!qData || !(qData.has_audio || qData.audio)) return;

    if (qmLocalAudio && !qmLocalAudio.paused) {
        qmLocalAudio.pause();
        qmLocalAudio.currentTime = 0;
        QuizState.setState({ audioTriggerTimestamp: 0, audioPlaying: false });
        return;
    }

    if (!qmLocalAudio) {
        qmLocalAudio = new Audio();
    }
    qmLocalAudio.src = qData.audio;
    qmLocalAudio.currentTime = 0;
    qmLocalAudio.play().catch(e => console.log('QM local audio play note:', e));

    QuizState.setState({ audioTriggerTimestamp: Date.now(), audioPlaying: true });

    qmLocalAudio.onended = () => {
        QuizState.setState({ audioPlaying: false });
    };
}

function stopCurrentAudio() {
    if (qmLocalAudio) {
        qmLocalAudio.pause();
        qmLocalAudio.currentTime = 0;
    }
    QuizState.setState({ audioTriggerTimestamp: 0, audioPlaying: false });
}

function openPublicWindow() {
    if (!currentPublicWin || currentPublicWin.closed) {
        currentPublicWin = window.open('index.html', 'SahyadriPublicDisplay', 'width=1280,height=720');
    } else {
        currentPublicWin.focus();
    }
}

function setProjectorZoomRemote(val) {
    if (window.QuizState && typeof QuizState.setProjectorZoom === 'function') {
        QuizState.setProjectorZoom(val);
        showQMNotification('📽️ Projector Scale set to ' + Math.round(val * 100) + '%', 'info');
    }
}
window.setProjectorZoomRemote = setProjectorZoomRemote;

function adjustProjectorZoomRemote(delta) {
    const cur = (QuizState.state && QuizState.state.projectorZoom) || 1.0;
    setProjectorZoomRemote(cur + delta);
}
window.adjustProjectorZoomRemote = adjustProjectorZoomRemote;

function resetProjectorZoomRemote() {
    setProjectorZoomRemote(1.0);
}
window.resetProjectorZoomRemote = resetProjectorZoomRemote;


function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case ' ':
                e.preventDefault();
                if (QuizState.state.timer && QuizState.state.timer.isRunning) {
                    pauseTimer();
                } else {
                    startTimer();
                }
                break;
            case 'r':
            case 'R':
                toggleReveal();
                break;
            case 'n':
            case 'N':
                nextQuestion();
                break;
            case 'p':
            case 'P':
                prevQuestion();
                break;
            case '1':
                addScore('team_1', 10, 'Direct Q (+10)');
                break;
            case '2':
                addScore('team_2', 10, 'Direct Q (+10)');
                break;
            case '3':
                addScore('team_3', 10, 'Direct Q (+10)');
                break;
            case '4':
                addScore('team_4', 10, 'Direct Q (+10)');
                break;
        }
    });
}

window.switchRound = switchRound;
window.switchToStageTieBreakers = switchToStageTieBreakers;
window.startRoundQuestions = startRoundQuestions;


function setClueStage(stage) {
    const targetStage = Math.min(3, Math.max(1, stage));
    QuizState.setState({
        revealedClueCount: targetStage,
        timer: {
            duration: 15,
            remaining: 15,
            isRunning: true
        }
    });
    setTimerDuration(15);
    startTimer();
    showQMNotification('⏱️ <b>Clue ' + targetStage + ' Active:</b> 15s Timer Started!', 'info');
}
window.setClueStage = setClueStage;
