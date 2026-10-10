# 🎯 QuizzMaster Pro (formerly Sahyadri Wildlife Quiz)
### Universal Modular Dual-Screen Quizzing Platform & In-Browser CMS Studio

An enterprise-grade, zero-latency dual-screen quiz management system and authoring platform. Designed for schools, colleges, clubs, and corporate championships. Features an in-browser visual **Quiz Studio CMS**, dynamic rounds (Direct/Pass, Visual, Audio, Video, YouTube, Clue Hunter, Buzzer), configurable teams (2–12), rich media attachments (Images, Audio, Local Video, YouTube with start/stop timestamps), live leaderboard synchronization, and instant preset management.

---

## 🚀 Quick Start (One-Click Launch)

1. **Double-click** `run_app.bat` in this folder (`D:\Wildlife Quizz`).
2. Two browser windows will open automatically:
   - **Quizmaster (QM) Control Cockpit** (`http://localhost:8000/qm_control.html`)
   - **Public Projection Screen** (`http://localhost:8000/index.html`)
3. **Visual Quiz Studio (Builder CMS)**:
   - Open `http://localhost:8000/builder.html` or click **"🛠️ Quiz Studio"** in the QM Cockpit header.
   - Configure quiz title, teams (2 to 12), custom rounds, questions, and media.
   - Click **"🚀 Save & Apply"** to broadcast changes live to the running quiz windows!
   - Switch between **"Sample Multi-Media Quiz"**, **"Sahyadri Wildlife Quiz 2026 Archive"**, or **"Clean Blank Quiz"** at any time.

*(If Python is not installed, double-click `builder.html`, `index.html`, and `qm_control.html` directly in Google Chrome or Microsoft Edge — `BroadcastChannel` synchronizes them instantly across tabs or windows!)*

---

## 🖥️ System Architecture

```
D:\Wildlife Quizz\
├── builder.html            # [NEW] QuizzMaster Studio Visual CMS & Configurator
├── index.html              # Public Projection Screen (Audience / Stage Display)
├── qm_control.html         # Quizmaster Mission Control Cockpit
├── server.py               # Lightweight zero-dependency HTTP server with REST save APIs
├── run_app.bat             # One-click Windows launcher
├── README.md               # User operational guide & documentation
├── presets/                # [NEW] Preloaded & Archived Quiz Packages
│   ├── sahyadri_wildlife_2026.json  # Full preserved Sahyadri Wildlife Quiz 2026
│   ├── sahyadri_wildlife_2026.js    # Bundled standalone JS archive
│   ├── sample_multimedia_quiz.json  # Multi-media showcase (Images, Audio, Video, YouTube)
│   └── sample_multimedia_quiz.js    # Bundled standalone JS preset
├── css/
│   ├── common.css          # Design tokens & color palettes
│   ├── builder.css         # [NEW] Studio CMS styles & responsive forms
│   ├── public.css          # Public projection styles & leaderboard HUD
│   └── qm.css              # QM dashboard styles, timer bar, scorepads
├── js/
│   ├── builder_app.js      # [NEW] Visual Quiz Studio controller & JSON/CSV engine
│   ├── media_player.js     # [NEW] Universal Media Player (Images, Audio, Video, YouTube)
│   ├── quiz_data.js        # Active quiz package loader & registry
│   ├── quiz_state.js       # Dynamic 2-12 team state sync & BroadcastChannel engine
│   ├── sound_effects.js    # Synthesized Web Audio API soundboard
│   ├── public_app.js       # Public screen rendering & reactive state listener
│   └── qm_app.js           # QM cockpit logic, question selector, and scoring
└── assets/
    ├── images/             # Verified high-resolution wildlife & plant images
    ├── audio/              # Verified acoustic audio recordings
    └── videos/             # Verified video assets
```

---

## ⏱️ Quiz Schedule & Format (1 to 1.5 Hours Pacing)

| Phase | Duration | Details |
|---|---|---|
| **Phase 1: Written Screening Prelims** | 15–20 Mins | 20 bilingual screening questions on-screen + 5 Tie-Breakers. Evaluated on paper to select top 4 stage teams. |
| **Phase 2: Stage Finals (4 Teams)** | ~60 Mins | 5 rounds with 42 curated questions + 5 Sudden-Death Tie-Breakers. |
| • Round 1: Western Ghats Ecosystems | 12 Mins | 8 Questions. Direct (+10), Pass (+5). Western Ghats endemics, flora, and biomes. |
| • Round 2: The Visual Safari | 12 Mins | 8 Questions. High-res wildlife camera traps, botanical macro shots, morphological adaptations. |
| • Round 3: Acoustic Wilderness | 12 Mins | 8 Questions. Authentic MP3 calls of birds, frogs, and mammals with audio visualizer. |
| • Round 4: Clue Hunter / Mystery Trail | 15 Mins | 8 Questions. 3 Progressive clues: Clue 1 (+15), Clue 2 (+10), Clue 3 (+5). |
| • Round 5: Silent Valley Buzzer & Rapid Fire | 10 Mins | 10 Questions. Buzzer (+10 / -5 risk). Fast-paced round. |
| • Stage Tie-Breakers (Optional) | 5 Mins | 5 Sudden-death questions if teams are tied for 1st or 2nd place. |
| **Phase 3: Grand Finale & Champions** | 5 Mins | Confetti victory screen, podium spotlight, team trophies. |

---

## 🐾 The 4 Stage Teams

1. **🦁 Lion-tailed Macaques** (*Macaca silenus*) - Emerald Badge
2. **🪶 Great Hornbills** (*Buceros bicornis*) - Amber Badge
3. **⛰️ Nilgiri Tahrs** (*Nilgiritragus hylocrius*) - Cyan Badge
4. **🐍 Malabar Pit Vipers** (*Craspedocephalus malabaricus*) - Violet Badge

---

## 🎛️ Quizmaster (QM) Controls & Features

- **Question Navigator**: Dropdown selector grouped by round, plus **Previous** and **Next** push buttons.
- **Answer Key & Clues**: Confidential preview of scientific explanation, Malayalam hints, and field notes visible only to the QM.
- **Reveal Answer**: One click reveals the answer card, authentic photograph, and species spotlight on the public screen with synchronized audio chimes.
- **Audio Control**: Preview audio privately or trigger the audio call directly to the stage with the pulsing waveform animation.
- **Timer Engine**: Start, pause, reset, or set durations (`30s`, `45s`, `15s`) with synthesized ticking and warning alarms.
- **Live Scoring Pad**:
  - `+10` (Direct Correct)
  - `+5` (Pass / Bonus)
  - `-5` (Buzzer Penalty)
  - Custom increment/decrement fields
  - Active Turn selector highlights the team on both screens
  - All scores persist across browser reloads via `localStorage`
- **Audio SFX Synthesizer**: Built-in sound effects (Correct chime, Wrong buzz, Buzzer sound, Victory fanfare, Ticking clock) powered entirely by the Web Audio API without requiring external audio files.

---

## ⌨️ Keyboard Shortcuts (QM Screen)

| Key | Action |
|---|---|
| `Space` | Start / Pause Countdown Timer |
| `R` | Reveal Answer & Photo Spotlight on Public Screen |
| `N` | Next Question |
| `P` | Previous Question |
| `1` | Award +10 to Team 1 (Lion-tailed Macaques) |
| `2` | Award +10 to Team 2 (Great Hornbills) |
| `3` | Award +10 to Team 3 (Nilgiri Tahrs) |
| `4` | Award +10 to Team 4 (Malabar Pit Vipers) |

---

## 🌿 Technical Specifications

- **Zero External Dependencies**: Pure Vanilla HTML5, CSS3, and ES6 JavaScript. No npm installs or build steps needed.
- **Dual-Screen Synchronization**: Utilizes modern W3C `BroadcastChannel` API providing instantaneous sub-millisecond inter-window communication.
- **Offline Capable**: Works completely offline without internet connection once downloaded.
- **Bilingual Typographic Support**: Complete Malayalam Unicode rendering alongside English for every question and clue.


---

## 🎙️ Quizmaster Communication & Stage Flow

The application is structured to guide the Quizmaster through every phase of the event seamlessly:

### 1. 🏠 Welcome Screen on Stage
- When the event opens, keep the display on the **Welcome Screen**.
- **Public Screen**: Displays the grand Sahyadri Wildlife Quiz 2026 title, Kerala Wildlife Week theme, introduces the 4 stage teams (Lion-tailed Macaques, Great Hornbills, Nilgiri Tahrs, Malabar Pit Vipers), and alerts students that the 20-question written screening test is about to begin.
- **QM Screen**: Displays the big launch button: **`▶ START PRELIMINARY TEST (20 QUESTIONS) 👉`**.


### 📝 Preliminary Written Screening Test (All 20 Questions Displayed at Once)
- **100% Fit on Projection Screen**: The written screening test displays **all 20 questions simultaneously** in an elegant, responsive **5 columns × 4 rows grid** that fits inside the display viewport height (`100vh`) with **zero vertical scrolling**.
- **Self-Contained Bilingual Question Cards**: Every card contains the question number, point value (`1 pt`), complete English prompt, and Malayalam prompt (*Nirmala UI*), giving students all the clues needed to answer on paper sheets.
- **Stage Master Timer**: Features a digital countdown timer (`15m` / `20m` presets) that displays minutes and seconds (`15:00`, `14:59`...) on both screens.
- **One-Click Answer Reveal**: When exam papers are collected, the Quizmaster clicks `👁️ Reveal Answers on Screen` to reveal official answers in both languages across all 20 cards at once.
- **5 Sudden-Death Tie-Breakers**: If teams tie for the 4th qualifying spot, the QM clicks `🚨 Switch to 5 Tie-Breakers` to project all 5 tie-breaker questions on screen.

- **Public Screen Presentation**: Displays all 20 questions simultaneously on a single widescreen projection view with zero vertical scrolling.
- **Pure Bilingual Question Format**: Each question card provides the question prompt in English and Malayalam (*Nirmala UI*) without artificial labels (no 'Field Narrative Clue:', 'Direct Inquiry:', etc.).
- **Stage Rules Slide**: Before each stage round begins, a dedicated rules and scoring introduction slide is projected so the QM can brief the audience.
### 3. 🎯 Stage Finals (4 Teams on Stage)
- Once the top 4 teams are seated on stage, click **`🎯 Finish Prelims & Start Stage Finals 👉`**.
- This launches **Round 1** and activates the **Dedicated Live Leaderboard** on the right side of the screen.
- Manage turns, pass questions, award points (<kbd>+10</kbd>, <kbd>+5</kbd>, <kbd>-5</kbd>), play audio bio-recordings, and reveal answers.

### 4. 🏆 Champions Podium
- Click **`🏆 Champions`** at the conclusion to celebrate the winning teams with fanfare, podium rankings, and trophy badges!
