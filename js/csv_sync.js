
function escapeCSV(str) {
    if (str === null || str === undefined) return '';
    str = str.toString();
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function exportQuizToCSV() {
    if ((!window.quizData && typeof quizData === "undefined") || !(window.quizData || quizData).all_stage_questions) {
        alert("Quiz data not fully loaded yet.");
        return;
    }
    
    let csv = "serial_no,question_en,question_ml,answer_en,answer_ml,fact_en,fact_ml\n";
    let qs = (window.quizData || quizData).all_stage_questions;
    
    for (let key in qs) {
        let q = qs[key];
        let row = [
            escapeCSV(q.serial_no || q.serial || key),
            escapeCSV(q.question_en),
            escapeCSV(q.question_ml),
            escapeCSV(q.answer_en),
            escapeCSV(q.answer_ml),
            escapeCSV(q.fact_en),
            escapeCSV(q.fact_ml)
        ];
        csv += row.join(',') + "\n";
    }
    
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "college_quiz_questions.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function parseCSVLine(text) {
    let ret = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < text.length; i++) {
        let c = text[i];
        if (inQuote) {
            if (c === '"') {
                if (i + 1 < text.length && text[i+1] === '"') { cur += '"'; i++; }
                else inQuote = false;
            } else {
                cur += c;
            }
        } else {
            if (c === '"') inQuote = true;
            else if (c === ',') { ret.push(cur); cur = ''; }
            else cur += c;
        }
    }
    ret.push(cur);
    return ret;
}

function importQuizFromCSV(event) {
    let file = event.target.files[0];
    if (!file) return;
    
    let reader = new FileReader();
    reader.onload = function(e) {
        let text = e.target.result;
        let lines = text.split('\n');
        let header = parseCSVLine(lines[0]);
        
        let qIndex = header.indexOf('question_en');
        let aIndex = header.indexOf('answer_en');
        let sIndex = header.indexOf('serial_no');
        
        if (qIndex === -1 || aIndex === -1 || sIndex === -1) {
            alert("Invalid CSV format. Missing required columns.");
            return;
        }
        
        let updatedCount = 0;
        let qs = (window.quizData || quizData).all_stage_questions;
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            let row = parseCSVLine(lines[i]);
            let serial = row[sIndex];
            
            if (serial && qs[serial]) {
                qs[serial].question_en = row[header.indexOf('question_en')] || "";
                qs[serial].question_ml = row[header.indexOf('question_ml')] || "";
                qs[serial].answer_en = row[header.indexOf('answer_en')] || "";
                qs[serial].answer_ml = row[header.indexOf('answer_ml')] || "";
                qs[serial].fact_en = row[header.indexOf('fact_en')] || "";
                qs[serial].fact_ml = row[header.indexOf('fact_ml')] || "";
                updatedCount++;
            }
        }
        
        // Also update the active rounds arrays
        const syncQ = (q) => {
            let serial = q.serial_no || q.serial;
            if (serial && qs[serial]) {
                q.question_en = qs[serial].question_en;
                q.question_ml = qs[serial].question_ml;
                q.answer_en = qs[serial].answer_en;
                q.answer_ml = qs[serial].answer_ml;
                q.fact_en = qs[serial].fact_en;
                q.fact_ml = qs[serial].fact_ml;
            }
        };
        
        if (quizData.prelims) quizData.prelims.forEach(syncQ);
        if (quizData.tie_breaker) quizData.tie_breaker.forEach(syncQ);
        if (quizData.rounds) quizData.rounds.forEach(r => {
            if (r.questions) r.questions.forEach(syncQ);
        });
        
        // Update UI if currently on a question
        if (typeof renderCurrentQuestionDetails === 'function') {
            renderCurrentQuestionDetails();
        }
        
        // Broadcast the change to the display screens
        if (window.QuizState && window.QuizState.broadcastState) {
            window.QuizState.broadcastState('FORCE_REFRESH');
        }
        
        alert("Successfully imported and updated " + updatedCount + " questions in memory!");
        event.target.value = ""; // Reset input
    };
    reader.readAsText(file);
}
