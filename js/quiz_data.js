/**
 * Active Quiz Data Loader & Registry
 * Loads active quiz package from localStorage, server.py, or bundled presets
 */

(function () {
    // Default initial starter package
    let activeData = null;

    // Check localStorage for active saved quiz package
    if (typeof localStorage !== 'undefined') {
        try {
            const saved = localStorage.getItem('QUIZZMASTER_ACTIVE_PACKAGE');
            if (saved) {
                activeData = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('[QuizData] Failed to parse custom package from localStorage:', e);
        }
    }

    // Fallback to sample multimedia preset if not set
    if (!activeData && typeof PRESET_SAMPLE_MULTIMEDIA !== 'undefined') {
        activeData = PRESET_SAMPLE_MULTIMEDIA;
    }

    // Fallback template if neither is loaded yet
    if (!activeData) {
        activeData = {
            version: '2.0.0',
            meta: {
                title: 'QuizzMaster Pro',
                title_ml: 'ക്വിസ്മാസ്റ്റർ പ്രോ',
                subtitle: 'Universal Modular Quizzing Platform',
                subtitle_ml: 'മൾട്ടിമീഡിയ ക്വിസിംഗ് പ്ലാറ്റ്ഫോം',
                curator: 'Quizmaster',
                institution: 'National Science & Arts League',
                department: 'Inter-Collegiate Quiz Board',
                logo_primary: 'assets/branding/gvc_college_emblem_512.png',
                logo_secondary: 'assets/branding/gvc_botany_logo.png',
                show_logos: true,
                theme: 'emerald'
            },
            teams: [
                { id: 'team_1', num: 1, name: 'Team Alpha', name_ml: 'ടീം ആൽഫ', color: '#EF4444', color_dark: '#7F1D1D', icon: '🔥', score: 0 },
                { id: 'team_2', num: 2, name: 'Team Beta', name_ml: 'ടീം ബീറ്റ', color: '#F59E0B', color_dark: '#78350F', icon: '⚡', score: 0 },
                { id: 'team_3', num: 3, name: 'Team Gamma', name_ml: 'ടീം ഗാമ', color: '#3B82F6', color_dark: '#1E3A8A', icon: '🌊', score: 0 },
                { id: 'team_4', num: 4, name: 'Team Delta', name_ml: 'ടീം ഡെൽറ്റ', color: '#10B981', color_dark: '#064E3B', icon: '🌿', score: 0 }
            ],
            rounds: [],
            all_stage_questions: {}
        };
    }

    // Ensure all_stage_questions index exists
    if (!activeData.all_stage_questions) {
        activeData.all_stage_questions = {};
    }

    // Export globally
    if (typeof window !== 'undefined') {
        window.QUIZ_DATA = activeData;
    }
    if (typeof module !== 'undefined') {
        module.exports = activeData;
    }
})();
