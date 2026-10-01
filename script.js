/* ==========================================================================
   BRAINBYTE — MULTI-PAGE NEON BRAIN ARCADE (SCRIPT.JS)
   Tailored for college students (18+)
   Features:
   - Centralized Reusable Web Audio `soundManager`
   - Client-Side Multi-Page Router with Browser History (Back/Forward/Refresh)
   - Randomized Funny Feedback Engine (College Slang / Gaming Humor)
   - 8 Complete Games:
     1. 🧠 Memory Matrix
     2. 🧮 Quick Calc
     3. 🔢 Number Rush
     4. 📈 Number Sequence
     5. 🧩 Logic Grid
     6. 🎯 Pattern Breaker
     7. ⚡ Fast Tap (NEW)
     8. 🪤 Brain Trap (NEW)
   - Campus Leaderboard, Profile Passport, Game History, and Achievements.
   ========================================================================== */

/* ==========================================================================
   1. CONSTANTS & STORAGE CONFIGURATION
   ========================================================================== */

const STORAGE_KEYS = {
  PROFILE: 'bb_profile_v2',
  LEADERBOARD: 'bb_campus_leaderboard_v2',
  SETTINGS: 'bb_settings_v2',
  DAILY: 'bb_daily_v2'
};

const GAME_METADATA = {
  matrix:    { name: 'MEMORY MATRIX',    cat: 'MEMORY',             slug: 'memory-matrix' },
  calc:      { name: 'QUICK CALC',        cat: 'CALCULATION',        slug: 'quick-calc' },
  rush:      { name: 'NUMBER RUSH',       cat: 'SPEED & RECALL',     slug: 'number-rush' },
  sequence:  { name: 'NUMBER SEQUENCE',   cat: 'LOGIC & PATTERNS',   slug: 'number-sequence' },
  logic:     { name: 'LOGIC GRID',        cat: 'LOGIC & DEDUCTION',  slug: 'logic-grid' },
  breaker:   { name: 'PATTERN BREAKER',   cat: 'ATTENTION',          slug: 'pattern-breaker' },
  fasttap:   { name: 'FAST TAP',          cat: 'SPEED & ATTENTION',  slug: 'fast-tap' },
  braintrap: { name: 'BRAIN TRAP',        cat: 'TRICK & FOCUS',      slug: 'brain-trap' }
};

const SLUG_TO_GAME_ID = {
  'memory-matrix':   'matrix',
  'quick-calc':      'calc',
  'number-rush':     'rush',
  'number-sequence': 'sequence',
  'logic-grid':      'logic',
  'pattern-breaker': 'breaker',
  'fast-tap':        'fasttap',
  'brain-trap':      'braintrap'
};

/* Seeded Collegiate Campus Leaderboard */
const DEFAULT_LEADERBOARD = [
  { rank: 1, name: 'ALEX_V',    campus: 'MIT',          xp: 6420, score: 2840, games: 154, isUser: false },
  { rank: 2, name: 'SAM_K',     campus: 'Stanford',     xp: 5910, score: 2710, games: 142, isUser: false },
  { rank: 3, name: 'RIYA_M',    campus: 'Waterloo',     xp: 5350, score: 2490, games: 128, isUser: false },
  { rank: 4, name: 'YOU',       campus: 'Campus Lab',   xp: 4820, score: 2310, games: 126, isUser: true },
  { rank: 5, name: 'CYBER_NEO', campus: 'UC Berkeley',  xp: 4500, score: 2180, games: 110, isUser: false },
  { rank: 6, name: 'JORDAN_T',  campus: 'UT Austin',    xp: 4120, score: 1960, games: 98,  isUser: false },
  { rank: 7, name: 'ELENA_P',   campus: 'Oxford',       xp: 3890, score: 1820, games: 85,  isUser: false },
  { rank: 8, name: 'CHRIS_D',   campus: 'Georgia Tech', xp: 3640, score: 1740, games: 79,  isUser: false }
];

/* Funny Feedback Voice Engine */
const FUNNY_FEEDBACK = {
  correct: [
    "BIG BRAIN 🧠",
    "You're cooking 🔥",
    "Clean!",
    "Too easy?",
    "Brain cells +1",
    "Nice one!",
    "Calculated ⚡",
    "BIG BRAIN ENERGY 🧠🔥",
    "No diff!"
  ],
  wrong: [
    "Bro 💀",
    "Nice try 😂",
    "Brain.exe crashed",
    "That was... interesting.",
    "The answer was RIGHT THERE 😭",
    "Bro fell for the trap 💀",
    "Emotional damage 💀",
    "Lag? Definitely lag 😂"
  ],
  streak: [
    "ON FIRE 🔥",
    "Keep cooking!",
    "Combo GOAT!",
    "Unstoppable!",
    "Okay genius, calm down 😭",
    "Aura +1000 🔥"
  ],
  win: [
    "YOU DID IT 🎉",
    "Certified Big Brain 🧠",
    "Brain officially upgraded.",
    "That was clean!"
  ],
  trapFail: [
    "Bro fell for the trap 💀",
    "Brain.exe has stopped responding.",
    "Bamboozled 😂",
    "You really thought! 😭",
    "The trap caught another victim 💀"
  ]
};

/* ==========================================================================
   2. REUSABLE SOUND MANAGER (`soundManager`)
   ========================================================================== */

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.lastPlayTime = 0;
    this.minIntervalMs = 38; // Throttle to prevent distorted sound spam
  }

  init() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  isSoundEnabled() {
    return settings && settings.soundOn;
  }

  canPlay() {
    if (!this.isSoundEnabled()) return false;
    const now = Date.now();
    if (now - this.lastPlayTime < this.minIntervalMs) return false;
    this.lastPlayTime = now;
    this.init();
    return !!this.audioCtx;
  }

  playClick() {
    if (!this.canPlay()) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  playCorrect() {
    if (!this.canPlay()) return;
    try {
      const notes = [659.25, 987.77]; // E5, B5 "Ding!"
      notes.forEach((freq, idx) => {
        const now = this.audioCtx.currentTime + (idx * 0.065);
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      });
    } catch (e) {}
  }

  playWrong() {
    if (!this.canPlay()) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.22);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  playCombo() {
    if (!this.canPlay()) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const now = this.audioCtx.currentTime + (idx * 0.05);
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      });
    } catch (e) {}
  }

  playLevelUp() {
    if (!this.canPlay()) return;
    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const now = this.audioCtx.currentTime + (idx * 0.06);
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      });
    } catch (e) {}
  }

  playVictory() {
    if (!this.canPlay()) return;
    try {
      const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      chords.forEach((freq, idx) => {
        const now = this.audioCtx.currentTime + (idx * 0.08);
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.38);
      });
    } catch (e) {}
  }

  playGameOver() {
    // Funny Cartoon Sad Trombone (Wah-Wah-Wah-Waaah)
    if (!this.canPlay()) return;
    try {
      const notes = [349.23, 329.63, 311.13, 293.66]; // F4, E4, Eb4, D4
      notes.forEach((freq, idx) => {
        const now = this.audioCtx.currentTime + (idx * 0.16);
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        if (idx === 3) {
          // Slide down on final note
          osc.frequency.exponentialRampToValueAtTime(240, now + 0.45);
        }
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx === 3 ? 0.45 : 0.16));
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + (idx === 3 ? 0.45 : 0.16));
      });
    } catch (e) {}
  }

  playTimerWarning() {
    if (!this.canPlay()) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }
}

const soundManager = new SoundManager();

/* ==========================================================================
   3. GLOBAL STATE
   ========================================================================== */

let profile = defaultProfile();
let leaderboard = DEFAULT_LEADERBOARD;
let settings = defaultSettings();

let currentRoute = '/home';
let activeGameId = null;
let gameSession = null;
let engine = null;
let activeTimeouts = [];
let confettiAnimId = null;
let toastTimeoutId = null;

/* ==========================================================================
   4. INITIALIZATION & ROUTING
   ========================================================================== */

function initializeApp() {
  loadProfile();
  loadLeaderboard();
  loadSettings();

  wireRouterLinks();
  wireGlobalControls();
  wireArenaControls();
  wireFinishModal();
  wireCategoryTabs();
  wireSettingsPage();

  updateSoundButtonStates();
  renderLeaderboard('all');
  renderHomeLeaderboardPreview();
  updateProfileViews();
  updateBestScoresOnCards();
  checkDailyStatus();

  // Initialize Route from URL / Hash
  handleInitialRoute();

  // Listen to browser Back and Forward history buttons
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('popstate', onPopState);
    window.addEventListener('hashchange', onHashChange);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
}

/* Client-Side Multi-Page Router */
function parseCurrentPath() {
  if (typeof window === 'undefined' || !window.location) return '/home';
  const hash = (window.location.hash || '').replace(/^#/, '');
  if (hash && hash.startsWith('/')) {
    return hash;
  }
  const path = window.location.pathname;
  if (path && path !== '/' && path !== '/index.html') {
    return path;
  }
  return '/home';
}

function handleInitialRoute() {
  const path = parseCurrentPath();
  navigateTo(path, false);
}

function onPopState(e) {
  const path = (e && e.state && e.state.route) ? e.state.route : parseCurrentPath();
  navigateTo(path, false);
}

function onHashChange() {
  const path = parseCurrentPath();
  navigateTo(path, false);
}

function navigateTo(route, push = true) {
  soundManager.playClick();
  currentRoute = route || '/home';

  // Synchronize browser history and hash
  if (push && typeof window !== 'undefined') {
    if (window.location && window.location.protocol === 'file:') {
      window.location.hash = currentRoute;
    } else if (window.history && typeof window.history.pushState === 'function') {
      window.history.pushState({ route: currentRoute }, '', currentRoute);
    }
  }

  // If navigating away from an in-progress game, clean it up
  if (!currentRoute.startsWith('/games/') && gameSession && !gameSession.ended) {
    cleanupActiveGame();
  }

  // Match Route & Show Page
  if (currentRoute === '/' || currentRoute === '/home') {
    showPage('page-home');
  } else if (currentRoute === '/games') {
    showPage('page-games');
  } else if (currentRoute === '/leaderboard') {
    renderLeaderboard('all');
    showPage('page-leaderboard');
  } else if (currentRoute === '/profile') {
    updateProfileViews();
    showPage('page-profile');
  } else if (currentRoute === '/settings') {
    showPage('page-settings');
  } else if (currentRoute.startsWith('/games/')) {
    const slug = currentRoute.replace('/games/', '');
    const gameId = SLUG_TO_GAME_ID[slug];
    if (gameId) {
      launchGameArena(gameId);
      showPage('page-arena');
    } else {
      showPage('page-games');
    }
  } else {
    showPage('page-home');
  }

  // Update active states on Desktop and Mobile nav bars
  updateNavActiveState(currentRoute);
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');
}

function updateNavActiveState(route) {
  const rootRoute = route.startsWith('/games') ? '/games' : route;
  
  document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(link => {
    const linkRoute = link.getAttribute('data-route');
    if (linkRoute === rootRoute || (rootRoute === '/home' && linkRoute === '/')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function wireRouterLinks() {
  document.addEventListener('click', e => {
    const link = e.target.closest('.router-link');
    if (link) {
      e.preventDefault();
      const route = link.getAttribute('data-route') || link.getAttribute('href')?.replace('#', '');
      if (route) navigateTo(route, true);
    }
  });
}

/* ==========================================================================
   5. FUNNY FEEDBACK ENGINE
   ========================================================================== */

function showFunnyFeedback(type, customText = null) {
  const container = document.getElementById('funny-toast');
  const textEl = document.getElementById('toast-text');
  const emojiEl = document.getElementById('toast-emoji');
  if (!container || !textEl || !emojiEl) return;

  let text = customText;
  let emoji = '🧠';

  if (!text) {
    if (type === 'correct') {
      text = randomChoice(FUNNY_FEEDBACK.correct);
      emoji = '⚡';
    } else if (type === 'wrong') {
      text = randomChoice(FUNNY_FEEDBACK.wrong);
      emoji = '💀';
    } else if (type === 'streak') {
      text = randomChoice(FUNNY_FEEDBACK.streak);
      emoji = '🔥';
    } else if (type === 'win') {
      text = randomChoice(FUNNY_FEEDBACK.win);
      emoji = '🎉';
    } else if (type === 'trapFail') {
      text = randomChoice(FUNNY_FEEDBACK.trapFail);
      emoji = '🪤';
    }
  }

  textEl.textContent = text;
  emojiEl.textContent = emoji;

  container.className = 'funny-toast';
  if (type === 'wrong' || type === 'trapFail') container.classList.add('wrong-toast');
  if (type === 'streak') container.classList.add('streak-toast');

  container.classList.remove('hidden');

  if (toastTimeoutId) clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    container.classList.add('hidden');
  }, 1400);
}

/* ==========================================================================
   6. GLOBAL CONTROLS & SOUND TOGGLES
   ========================================================================== */

function wireGlobalControls() {
  const navSoundBtn = document.getElementById('nav-sound-btn');
  if (navSoundBtn) navSoundBtn.addEventListener('click', toggleSound);

  const arenaSoundBtn = document.getElementById('arena-sound-btn');
  if (arenaSoundBtn) arenaSoundBtn.addEventListener('click', toggleSound);

  // Callsign edit on Profile page
  const editHandleBtn = document.getElementById('edit-handle-btn');
  if (editHandleBtn) {
    editHandleBtn.addEventListener('click', () => {
      soundManager.playClick();
      const newHandle = prompt('Enter your gaming callsign (Max 12 chars):', profile.handle);
      if (newHandle && newHandle.trim()) {
        profile.handle = newHandle.trim().toUpperCase().slice(0, 12);
        persistProfile();
        updateProfileViews();
        showFunnyFeedback('streak', `Callsign set to ${profile.handle}!`);
      }
    });
  }

  // Keyboard shortcut for audio toggle ('M')
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('keydown', e => {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleSound();
      }
    });
  }
}

function toggleSound() {
  settings.soundOn = !settings.soundOn;
  persistSettings();
  updateSoundButtonStates();
  if (settings.soundOn) {
    soundManager.playClick();
    showFunnyFeedback('correct', 'Sound: ON 🔊');
  } else {
    showFunnyFeedback('wrong', 'Sound: MUTED 🔇');
  }
}

function updateSoundButtonStates() {
  const icon = settings.soundOn ? '🔊' : '🔇';
  const navBtn = document.getElementById('nav-sound-btn');
  if (navBtn) navBtn.textContent = icon;
  const arenaBtn = document.getElementById('arena-sound-btn');
  if (arenaBtn) arenaBtn.textContent = icon;
  const settingToggle = document.getElementById('setting-sound-toggle');
  if (settingToggle) settingToggle.checked = settings.soundOn;
}

/* ==========================================================================
   7. CATEGORY FILTER TABS
   ========================================================================== */

function wireCategoryTabs() {
  document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      soundManager.playClick();
      document.querySelectorAll('.cat-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const cat = tab.getAttribute('data-category');
      filterGamesByCategory(cat);
    });
  });
}

function filterGamesByCategory(cat) {
  document.querySelectorAll('.arcade-card').forEach(card => {
    const cardCat = card.getAttribute('data-category');
    if (cat === 'all' || cardCat === cat) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

function updateBestScoresOnCards() {
  if (!profile) return;
  document.querySelectorAll('[data-best-for]').forEach(el => {
    const gId = el.getAttribute('data-best-for');
    if (profile.bestScores && profile.bestScores[gId] !== undefined) {
      el.textContent = profile.bestScores[gId].toLocaleString();
    }
  });
}

/* ==========================================================================
   8. GAME ARENA COMMON LIFECYCLE
   ========================================================================== */

function launchGameArena(gameId) {
  cleanupActiveGame();
  activeGameId = gameId;

  const meta = GAME_METADATA[gameId] || { name: 'BRAIN CHALLENGE', cat: 'COGNITIVE' };
  document.getElementById('arena-game-title').textContent = meta.name;
  document.getElementById('arena-cat-tag').textContent = meta.cat;

  gameSession = {
    id: gameId,
    score: 0,
    streak: 0,
    bestStreak: 0,
    combo: 1.0,
    lives: 3,
    level: 1,
    timeRemaining: 60,
    timerHandle: null,
    paused: false,
    ended: false,
    startedAt: Date.now(),
    correctCount: 0,
    totalCount: 0
  };

  engine = {};
  updateArenaHUD();

  // Launch specific game module
  if (gameId === 'matrix') initMemoryMatrix();
  else if (gameId === 'calc') initQuickCalc();
  else if (gameId === 'rush') initNumberRush();
  else if (gameId === 'sequence') initNumberSequence();
  else if (gameId === 'logic') initLogicGrid();
  else if (gameId === 'breaker') initPatternBreaker();
  else if (gameId === 'fasttap') initFastTap();
  else if (gameId === 'braintrap') initBrainTrap();
}

function updateArenaHUD() {
  if (!gameSession) return;

  const scoreEl = document.getElementById('arena-score');
  if (scoreEl) scoreEl.textContent = gameSession.score.toLocaleString();

  const timerEl = document.getElementById('arena-timer');
  if (timerEl) timerEl.textContent = `${gameSession.timeRemaining}s`;

  const streakEl = document.getElementById('arena-streak');
  if (streakEl) streakEl.textContent = `🔥 ${gameSession.streak}`;

  const comboEl = document.getElementById('arena-combo');
  if (comboEl) comboEl.textContent = `${gameSession.combo.toFixed(1)}×`;

  const livesEl = document.getElementById('arena-lives');
  if (livesEl) {
    if (activeGameId === 'matrix' || activeGameId === 'braintrap') {
      let hearts = '';
      for (let i = 0; i < 3; i++) {
        hearts += i < gameSession.lives ? '♥ ' : '♡ ';
      }
      livesEl.textContent = hearts.trim();
      document.getElementById('hud-lives-container').style.display = 'flex';
    } else {
      document.getElementById('hud-lives-container').style.display = 'none';
    }
  }

  const levelEl = document.getElementById('arena-level');
  if (levelEl) levelEl.textContent = gameSession.level;
}

function wireArenaControls() {
  document.getElementById('arena-restart-btn').addEventListener('click', () => {
    soundManager.playClick();
    if (activeGameId) launchGameArena(activeGameId);
  });

  document.getElementById('arena-pause-btn').addEventListener('click', () => {
    if (!gameSession || gameSession.ended) return;
    soundManager.playClick();
    gameSession.paused = true;
    document.getElementById('pause-overlay').classList.remove('hidden');
  });

  document.getElementById('resume-btn').addEventListener('click', () => {
    if (!gameSession) return;
    soundManager.playClick();
    gameSession.paused = false;
    document.getElementById('pause-overlay').classList.add('hidden');
  });

  document.getElementById('pause-restart-btn').addEventListener('click', () => {
    soundManager.playClick();
    document.getElementById('pause-overlay').classList.add('hidden');
    if (activeGameId) launchGameArena(activeGameId);
  });
}

function cleanupActiveGame() {
  clearAllTimeouts();
  stopConfetti();
  if (gameSession && gameSession.timerHandle) {
    clearInterval(gameSession.timerHandle);
    gameSession.timerHandle = null;
  }
  if (gameSession) gameSession.ended = true;

  document.getElementById('pause-overlay').classList.add('hidden');
  document.getElementById('finish-modal').classList.add('hidden');
}

function trackTimeout(id) {
  activeTimeouts.push(id);
  return id;
}

function clearAllTimeouts() {
  activeTimeouts.forEach(id => clearTimeout(id));
  activeTimeouts = [];
}

/* ==========================================================================
   9. UNIVERSAL FINISH MODAL, XP SYSTEM & ACHIEVEMENTS
   ========================================================================== */

function finishGameRound(finalScore, customAccuracy = null) {
  if (!gameSession || gameSession.ended) return;
  gameSession.ended = true;
  clearAllTimeouts();
  if (gameSession.timerHandle) clearInterval(gameSession.timerHandle);

  const accuracy = customAccuracy !== null
    ? customAccuracy
    : (gameSession.totalCount > 0 ? Math.round((gameSession.correctCount / gameSession.totalCount) * 100) : 100);

  // Play Victory or Game Over sound
  if (finalScore > 0 && (gameSession.lives === undefined || gameSession.lives > 0)) {
    soundManager.playVictory();
    launchConfetti();
    showFunnyFeedback('win');
  } else {
    soundManager.playGameOver();
    showFunnyFeedback('wrong', 'Brain.exe stopped responding 💀');
  }

  // Determine Rank
  let rank = 'B';
  if (finalScore >= 1800 || accuracy >= 95) rank = 'S';
  else if (finalScore >= 1100 || accuracy >= 80) rank = 'A';
  else if (finalScore < 500) rank = 'C';

  const xpEarned = Math.round(finalScore * 0.12) + 50;

  // Update Profile
  profile.xp += xpEarned;
  profile.gamesPlayed += 1;
  const currentBest = profile.bestScores[activeGameId] || 0;
  if (finalScore > currentBest) {
    profile.bestScores[activeGameId] = finalScore;
  }
  if (finalScore > profile.bestOverallScore) {
    profile.bestOverallScore = finalScore;
  }

  // Log to Game History
  const historyEntry = {
    game: GAME_METADATA[activeGameId].name,
    score: finalScore,
    accuracy: `${accuracy}%`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    rank: rank
  };
  profile.history.unshift(historyEntry);
  if (profile.history.length > 15) profile.history.pop();

  // Check Achievements
  checkAchievements(finalScore, accuracy);

  persistProfile();
  updateProfileViews();
  updateBestScoresOnCards();

  // Populate Finish Modal
  document.getElementById('finish-rank').textContent = rank;
  document.getElementById('finish-score').textContent = finalScore.toLocaleString();
  document.getElementById('finish-xp').textContent = `+${xpEarned} XP`;
  document.getElementById('finish-accuracy').textContent = `${accuracy}%`;
  document.getElementById('finish-streak').textContent = `🔥 ${gameSession.bestStreak}`;

  document.getElementById('finish-modal').classList.remove('hidden');
}

function checkAchievements(finalScore, accuracy) {
  let unlockedNew = false;

  const unlock = (id, name) => {
    if (!profile.achievements[id]) {
      profile.achievements[id] = true;
      unlockedNew = true;
      soundManager.playLevelUp();
      showFunnyFeedback('streak', `Achievement Unlocked: ${name}! 🏆`);
    }
  };

  unlock('first_game', 'First Game');
  if (gameSession.bestStreak >= 10) unlock('streak_10', '10 Game Streak');
  if ((activeGameId === 'fasttap' || activeGameId === 'calc') && finalScore >= 1500) unlock('speed_demon', 'Speed Demon');
  if (accuracy >= 90 && gameSession.totalCount >= 5) unlock('accuracy_90', '90% Accuracy');
  if (finalScore >= 2000) unlock('high_scorer', 'High Scorer');
  if (activeGameId === 'braintrap' && gameSession.score >= 1000) unlock('trap_survivor', 'Trap Survivor');
}

function wireFinishModal() {
  document.getElementById('finish-play-again-btn').addEventListener('click', () => {
    soundManager.playClick();
    document.getElementById('finish-modal').classList.add('hidden');
    stopConfetti();
    if (activeGameId) launchGameArena(activeGameId);
  });
}

/* ==========================================================================
   10. GAME 1: MEMORY MATRIX (PROGRESSIVE GRIDS)
   ========================================================================== */

function initMemoryMatrix() {
  const stage = document.getElementById('game-stage');
  engine = {
    gridSize: 3,
    targetCount: 3,
    targets: [],
    playerPicks: [],
    showingPattern: true
  };
  playMatrixRound();
}

function playMatrixRound() {
  const stage = document.getElementById('game-stage');
  engine.playerPicks = [];
  engine.showingPattern = true;

  if (gameSession.level === 1) engine.gridSize = 3;
  else if (gameSession.level === 2) engine.gridSize = 4;
  else if (gameSession.level === 3) engine.gridSize = 5;
  else engine.gridSize = 6;

  engine.targetCount = Math.min(engine.gridSize + gameSession.level, (engine.gridSize * engine.gridSize) - 3);
  const totalCells = engine.gridSize * engine.gridSize;
  engine.targets = pickUniqueRandomIndices(totalCells, engine.targetCount);

  const tilesHtml = Array.from({ length: totalCells }, (_, i) => 
    `<button class="matrix-tile disabled" data-idx="${i}" aria-label="Tile ${i + 1}"></button>`
  ).join('');

  stage.innerHTML = `
    <p class="matrix-instruction" id="matrix-inst">MEMORIZE HIGHLIGHTED TILES (LEVEL ${gameSession.level})</p>
    <div class="matrix-grid" style="grid-template-columns: repeat(${engine.gridSize}, minmax(0, 1fr));">
      ${tilesHtml}
    </div>
  `;

  trackTimeout(setTimeout(() => {
    engine.targets.forEach(idx => {
      const tile = stage.querySelector(`.matrix-tile[data-idx="${idx}"]`);
      if (tile) tile.classList.add('lit');
    });
    soundManager.playCorrect();

    const revealTime = Math.max(900, 1600 - (gameSession.level * 150));
    trackTimeout(setTimeout(() => {
      stage.querySelectorAll('.matrix-tile').forEach(t => {
        t.classList.remove('lit');
        t.classList.remove('disabled');
      });
      engine.showingPattern = false;
      const inst = document.getElementById('matrix-inst');
      if (inst) inst.textContent = `REPRODUCE ${engine.targets.length} TILES`;

      stage.querySelectorAll('.matrix-tile').forEach(tile => {
        tile.addEventListener('click', () => onMatrixTileClick(parseInt(tile.getAttribute('data-idx'), 10)));
      });
    }, revealTime));
  }, 400));
}

function onMatrixTileClick(idx) {
  if (gameSession.paused || gameSession.ended || engine.showingPattern) return;
  if (engine.playerPicks.includes(idx)) return;

  const stage = document.getElementById('game-stage');
  const tile = stage.querySelector(`.matrix-tile[data-idx="${idx}"]`);
  const isTarget = engine.targets.includes(idx);

  if (isTarget) {
    tile.classList.add('picked-correct');
    engine.playerPicks.push(idx);
    soundManager.playClick();

    if (engine.playerPicks.length === engine.targets.length) {
      gameSession.streak += 1;
      if (gameSession.streak > gameSession.bestStreak) gameSession.bestStreak = gameSession.streak;
      gameSession.combo = Math.min(3.0, 1.0 + (gameSession.streak * 0.2));

      const points = Math.round((engine.targetCount * 80) * gameSession.combo);
      gameSession.score += points;
      gameSession.level += 1;
      gameSession.correctCount += 1;
      gameSession.totalCount += 1;
      updateArenaHUD();

      soundManager.playLevelUp();
      showFunnyFeedback('correct');
      trackTimeout(setTimeout(playMatrixRound, 800));
    }
  } else {
    tile.classList.add('picked-wrong');
    soundManager.playWrong();
    showFunnyFeedback('wrong');
    gameSession.lives -= 1;
    gameSession.streak = 0;
    gameSession.combo = 1.0;
    gameSession.totalCount += 1;
    updateArenaHUD();

    if (gameSession.lives <= 0) {
      finishGameRound(gameSession.score);
    } else {
      trackTimeout(setTimeout(playMatrixRound, 900));
    }
  }
}

/* ==========================================================================
   11. GAME 2: QUICK CALC (60-SECOND BLITZ)
   ========================================================================== */

function initQuickCalc() {
  gameSession.timeRemaining = 60;
  engine = { currentAnswer: null };

  gameSession.timerHandle = setInterval(() => {
    if (gameSession.paused || gameSession.ended) return;
    gameSession.timeRemaining -= 1;
    updateArenaHUD();
    if (gameSession.timeRemaining <= 10) soundManager.playTimerWarning();
    if (gameSession.timeRemaining <= 0) finishGameRound(gameSession.score);
  }, 1000);

  nextCalcQuestion();
}

function nextCalcQuestion() {
  const stage = document.getElementById('game-stage');
  const operations = ['+', '-', '×', '÷'];
  const op = randomChoice(operations);
  let a, b, answer;

  if (op === '+') {
    a = Math.floor(Math.random() * 65) + 12;
    b = Math.floor(Math.random() * 55) + 15;
    answer = a + b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 85) + 30;
    b = Math.floor(Math.random() * (a - 10)) + 5;
    answer = a - b;
  } else if (op === '×') {
    a = Math.floor(Math.random() * 14) + 4;
    b = Math.floor(Math.random() * 12) + 3;
    answer = a * b;
  } else {
    b = Math.floor(Math.random() * 10) + 3;
    answer = Math.floor(Math.random() * 12) + 2;
    a = b * answer;
  }

  engine.currentAnswer = answer;

  const options = new Set([answer]);
  while (options.size < 4) {
    const delta = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 8) + 1);
    options.add(Math.max(1, answer + delta));
  }
  const shuffled = shuffleArray(Array.from(options));

  stage.innerHTML = `
    <div class="calc-arena">
      <div class="calc-timer-bar-wrap">
        <div class="calc-timer-bar" style="width: ${(gameSession.timeRemaining / 60) * 100}%;"></div>
      </div>
      <div class="calc-equation">${a} ${op} ${b} = ?</div>
      <div class="calc-options-grid">
        ${shuffled.map(val => `<button class="calc-opt-btn" data-val="${val}">${val}</button>`).join('')}
      </div>
    </div>
  `;

  stage.querySelectorAll('.calc-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = parseInt(btn.getAttribute('data-val'), 10);
      onCalcAnswer(selected, btn);
    });
  });
}

function onCalcAnswer(selected, btn) {
  if (gameSession.paused || gameSession.ended) return;
  gameSession.totalCount += 1;

  if (selected === engine.currentAnswer) {
    btn.classList.add('correct-burst');
    soundManager.playCorrect();
    gameSession.correctCount += 1;
    gameSession.streak += 1;
    if (gameSession.streak > gameSession.bestStreak) gameSession.bestStreak = gameSession.streak;
    gameSession.combo = Math.min(3.5, 1.0 + (gameSession.streak * 0.25));

    if (gameSession.streak % 5 === 0) {
      soundManager.playCombo();
      showFunnyFeedback('streak');
    }

    gameSession.score += Math.round(100 * gameSession.combo);
    updateArenaHUD();
    trackTimeout(setTimeout(nextCalcQuestion, 200));
  } else {
    btn.classList.add('wrong-burst');
    soundManager.playWrong();
    showFunnyFeedback('wrong');
    gameSession.streak = 0;
    gameSession.combo = 1.0;
    updateArenaHUD();
    trackTimeout(setTimeout(nextCalcQuestion, 350));
  }
}

/* ==========================================================================
   12. GAME 3: NUMBER RUSH
   ========================================================================== */

function initNumberRush() {
  playNumberRushRound();
}

function playNumberRushRound() {
  const stage = document.getElementById('game-stage');
  const count = 4 + Math.min(4, Math.floor(gameSession.level / 2));
  engine.numbers = Array.from({ length: count }, () => Math.floor(Math.random() * 89) + 10);

  stage.innerHTML = `
    <div class="rush-arena">
      <div class="rush-stage-display" id="rush-display">
        <span class="rush-flash-number">READY</span>
      </div>
    </div>
  `;

  let idx = 0;
  const flashInterval = Math.max(380, 700 - (gameSession.level * 40));

  const flashNext = () => {
    if (gameSession.paused || gameSession.ended) return;
    const disp = document.getElementById('rush-display');
    if (!disp) return;

    if (idx < engine.numbers.length) {
      disp.innerHTML = `<span class="rush-flash-number">${engine.numbers[idx]}</span>`;
      soundManager.playClick();
      idx += 1;
      trackTimeout(setTimeout(flashNext, flashInterval));
    } else {
      disp.innerHTML = '';
      presentRushQuestion();
    }
  };

  trackTimeout(setTimeout(flashNext, 600));
}

function presentRushQuestion() {
  const stage = document.getElementById('game-stage');
  const questions = [
    { text: 'Which number was the LARGEST?', ans: Math.max(...engine.numbers) },
    { text: 'Which number was the SMALLEST?', ans: Math.min(...engine.numbers) },
    { text: 'What was the FIRST number?', ans: engine.numbers[0] },
    { text: 'What was the SECOND number?', ans: engine.numbers[1] }
  ];

  const q = randomChoice(questions);
  const correctVal = q.ans;
  const options = new Set([correctVal]);
  while (options.size < 4) options.add(Math.floor(Math.random() * 89) + 10);
  const shuffled = shuffleArray(Array.from(options));

  stage.innerHTML = `
    <div class="rush-arena">
      <h3 class="rush-question">${q.text}</h3>
      <div class="calc-options-grid">
        ${shuffled.map(v => `<button class="calc-opt-btn" data-val="${v}">${v}</button>`).join('')}
      </div>
    </div>
  `;

  stage.querySelectorAll('.calc-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.getAttribute('data-val'), 10);
      gameSession.totalCount += 1;

      if (val === correctVal) {
        soundManager.playCorrect();
        showFunnyFeedback('correct');
        gameSession.correctCount += 1;
        gameSession.streak += 1;
        if (gameSession.streak > gameSession.bestStreak) gameSession.bestStreak = gameSession.streak;
        gameSession.score += 150 * gameSession.level;
        gameSession.level += 1;
        updateArenaHUD();
        trackTimeout(setTimeout(playNumberRushRound, 500));
      } else {
        soundManager.playWrong();
        showFunnyFeedback('wrong');
        finishGameRound(gameSession.score);
      }
    });
  });
}

/* ==========================================================================
   13. GAME 4: NUMBER SEQUENCE
   ========================================================================== */

function initNumberSequence() {
  nextSequenceChallenge();
}

function nextSequenceChallenge() {
  const stage = document.getElementById('game-stage');
  const types = ['arithmetic', 'geometric', 'squares', 'alternating'];
  const type = randomChoice(types);

  let seq = [];
  let nextVal;

  if (type === 'arithmetic') {
    const start = Math.floor(Math.random() * 20) + 2;
    const diff = Math.floor(Math.random() * 8) + 2;
    seq = [start, start + diff, start + diff * 2, start + diff * 3];
    nextVal = start + diff * 4;
  } else if (type === 'geometric') {
    const start = Math.floor(Math.random() * 5) + 2;
    const factor = Math.random() > 0.5 ? 2 : 3;
    seq = [start, start * factor, start * (factor ** 2), start * (factor ** 3)];
    nextVal = start * (factor ** 4);
  } else if (type === 'squares') {
    const start = Math.floor(Math.random() * 4) + 1;
    seq = [start ** 2, (start + 1) ** 2, (start + 2) ** 2, (start + 3) ** 2];
    nextVal = (start + 4) ** 2;
  } else {
    let cur = Math.floor(Math.random() * 10) + 1;
    seq = [cur];
    let step = 3;
    for (let i = 0; i < 3; i++) {
      cur += step;
      seq.push(cur);
      step += 2;
    }
    nextVal = cur + step;
  }

  const options = new Set([nextVal]);
  while (options.size < 4) {
    const delta = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 10) + 2);
    options.add(Math.max(1, nextVal + delta));
  }
  const shuffled = shuffleArray(Array.from(options));

  stage.innerHTML = `
    <div class="calc-arena">
      <div class="sequence-row">
        ${seq.map(num => `<span class="seq-item">${num}</span>`).join('')}
        <span class="seq-item missing">?</span>
      </div>
      <div class="calc-options-grid">
        ${shuffled.map(v => `<button class="calc-opt-btn" data-val="${v}">${v}</button>`).join('')}
      </div>
    </div>
  `;

  stage.querySelectorAll('.calc-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.getAttribute('data-val'), 10);
      gameSession.totalCount += 1;

      if (val === nextVal) {
        soundManager.playCorrect();
        showFunnyFeedback('correct');
        gameSession.correctCount += 1;
        gameSession.streak += 1;
        if (gameSession.streak > gameSession.bestStreak) gameSession.bestStreak = gameSession.streak;
        gameSession.score += 200;
        gameSession.level += 1;
        updateArenaHUD();
        trackTimeout(setTimeout(nextSequenceChallenge, 400));
      } else {
        soundManager.playWrong();
        showFunnyFeedback('wrong');
        finishGameRound(gameSession.score);
      }
    });
  });
}

/* ==========================================================================
   14. GAME 5: LOGIC GRID
   ========================================================================== */

function initLogicGrid() {
  nextLogicPuzzle();
}

function nextLogicPuzzle() {
  const stage = document.getElementById('game-stage');
  const puzzles = [
    {
      premise: 'Alex is faster than Jordan. Sam is faster than Alex. Chris is slower than Jordan.',
      question: 'Who finished in FIRST place?',
      options: ['Sam', 'Alex', 'Jordan', 'Chris'],
      ans: 'Sam'
    },
    {
      premise: 'Box A is heavier than Box B. Box C is lighter than Box B. Box D is heavier than Box A.',
      question: 'Which box is the LIGHTEST?',
      options: ['Box C', 'Box B', 'Box A', 'Box D'],
      ans: 'Box C'
    },
    {
      premise: 'All software architects know Python. Leo is not a software architect.',
      question: 'Can we logically conclude that Leo does NOT know Python?',
      options: ['No, he might still know Python', 'Yes, definitely', 'Only if he knows C++', 'Never'],
      ans: 'No, he might still know Python'
    },
    {
      premise: 'Maya sits north of Liam. Noah sits east of Maya. Olivia sits south of Noah.',
      question: 'In what direction is Maya from Noah?',
      options: ['West', 'East', 'North', 'South'],
      ans: 'West'
    }
  ];

  const p = randomChoice(puzzles);

  stage.innerHTML = `
    <div class="logic-puzzle-card">
      <p class="logic-premise">${p.premise}</p>
      <h3 class="logic-question">${p.question}</h3>
    </div>
    <div class="logic-options">
      ${p.options.map(opt => `<button class="logic-opt-btn" data-val="${opt}">${opt}</button>`).join('')}
    </div>
  `;

  stage.querySelectorAll('.logic-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-val');
      gameSession.totalCount += 1;

      if (selected === p.ans) {
        soundManager.playCorrect();
        showFunnyFeedback('correct');
        gameSession.correctCount += 1;
        gameSession.score += 250;
        gameSession.streak += 1;
        if (gameSession.streak > gameSession.bestStreak) gameSession.bestStreak = gameSession.streak;
        updateArenaHUD();
        trackTimeout(setTimeout(nextLogicPuzzle, 500));
      } else {
        soundManager.playWrong();
        showFunnyFeedback('wrong');
        finishGameRound(gameSession.score);
      }
    });
  });
}

/* ==========================================================================
   15. GAME 6: PATTERN BREAKER
   ========================================================================== */

function initPatternBreaker() {
  playPatternBreakerRound();
}

function playPatternBreakerRound() {
  const stage = document.getElementById('game-stage');
  const size = gameSession.level > 2 ? 4 : 3;
  const total = size * size;
  const oddIndex = Math.floor(Math.random() * total);

  const baseSymbols = ['◆', '▲', '●', '✦', '◼', '★', '✚'];
  const symbol = randomChoice(baseSymbols);

  let tilesHtml = '';
  for (let i = 0; i < total; i++) {
    if (i === oddIndex) {
      tilesHtml += `<button class="breaker-tile" data-odd="true" style="transform: rotate(25deg); color: #00f5ff;">${symbol}</button>`;
    } else {
      tilesHtml += `<button class="breaker-tile" data-odd="false">${symbol}</button>`;
    }
  }

  stage.innerHTML = `
    <p class="matrix-instruction">SPOT THE ANOMALOUS TILE (LEVEL ${gameSession.level})</p>
    <div class="breaker-grid" style="grid-template-columns: repeat(${size}, minmax(0, 1fr));">
      ${tilesHtml}
    </div>
  `;

  stage.querySelectorAll('.breaker-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const isOdd = tile.getAttribute('data-odd') === 'true';
      gameSession.totalCount += 1;

      if (isOdd) {
        soundManager.playCorrect();
        showFunnyFeedback('correct');
        gameSession.correctCount += 1;
        gameSession.score += 180 * gameSession.level;
        gameSession.streak += 1;
        if (gameSession.streak > gameSession.bestStreak) gameSession.bestStreak = gameSession.streak;
        gameSession.level += 1;
        updateArenaHUD();
        trackTimeout(setTimeout(playPatternBreakerRound, 300));
      } else {
        soundManager.playWrong();
        showFunnyFeedback('wrong');
        finishGameRound(gameSession.score);
      }
    });
  });
}

/* ==========================================================================
   16. GAME 7: FAST TAP (NEW SPEED & ATTENTION GAME)
   ========================================================================== */

function initFastTap() {
  gameSession.timeRemaining = 45;
  engine = {
    qualifyingIndices: [],
    tappedIndices: [],
    roundRule: ''
  };

  gameSession.timerHandle = setInterval(() => {
    if (gameSession.paused || gameSession.ended) return;
    gameSession.timeRemaining -= 1;
    updateArenaHUD();
    if (gameSession.timeRemaining <= 10) soundManager.playTimerWarning();
    if (gameSession.timeRemaining <= 0) finishGameRound(gameSession.score);
  }, 1000);

  nextFastTapRound();
}

function nextFastTapRound() {
  const stage = document.getElementById('game-stage');
  if (!stage) return;
  engine.tappedIndices = [];

  const ruleTypes = [
    'even_numbers',
    'odd_numbers',
    'greater_50',
    'multiples_5',
    'smiling_emojis',
    'rockets',
    'cyan_tiles',
    'pink_tiles'
  ];

  const chosenType = randomChoice(ruleTypes);
  const tiles = [];
  const colorMap = [
    { name: 'blue', hex: '#3b82f6' },
    { name: 'cyan', hex: '#00f5ff' },
    { name: 'purple', hex: '#a855f7' },
    { name: 'pink', hex: '#ff0055' },
    { name: 'gold', hex: '#fbbf24' }
  ];

  if (chosenType === 'even_numbers') {
    engine.roundRule = 'TAP ONLY EVEN NUMBERS';
    const evenCount = Math.floor(Math.random() * 2) + 3;
    const indices = pickUniqueRandomIndices(12, 12);
    const qualifyingSet = new Set(indices.slice(0, evenCount));

    for (let i = 0; i < 12; i++) {
      const isTarget = qualifyingSet.has(i);
      const num = isTarget ? (Math.floor(Math.random() * 45) + 5) * 2 : (Math.floor(Math.random() * 45) + 5) * 2 + 1;
      const c = randomChoice(colorMap);
      tiles.push({ idx: i, display: num, colorHex: c.hex, isQualifying: isTarget });
    }
  } else if (chosenType === 'odd_numbers') {
    engine.roundRule = 'TAP ONLY ODD NUMBERS';
    const oddCount = Math.floor(Math.random() * 2) + 3;
    const indices = pickUniqueRandomIndices(12, 12);
    const qualifyingSet = new Set(indices.slice(0, oddCount));

    for (let i = 0; i < 12; i++) {
      const isTarget = qualifyingSet.has(i);
      const num = isTarget ? (Math.floor(Math.random() * 45) + 5) * 2 + 1 : (Math.floor(Math.random() * 45) + 5) * 2;
      const c = randomChoice(colorMap);
      tiles.push({ idx: i, display: num, colorHex: c.hex, isQualifying: isTarget });
    }
  } else if (chosenType === 'greater_50') {
    engine.roundRule = 'TAP NUMBERS GREATER THAN 50';
    const count = Math.floor(Math.random() * 2) + 3;
    const indices = pickUniqueRandomIndices(12, 12);
    const qualifyingSet = new Set(indices.slice(0, count));

    for (let i = 0; i < 12; i++) {
      const isTarget = qualifyingSet.has(i);
      const num = isTarget ? Math.floor(Math.random() * 45) + 51 : Math.floor(Math.random() * 40) + 10;
      const c = randomChoice(colorMap);
      tiles.push({ idx: i, display: num, colorHex: c.hex, isQualifying: isTarget });
    }
  } else if (chosenType === 'multiples_5') {
    engine.roundRule = 'TAP MULTIPLES OF 5';
    const count = Math.floor(Math.random() * 2) + 3;
    const indices = pickUniqueRandomIndices(12, 12);
    const qualifyingSet = new Set(indices.slice(0, count));

    for (let i = 0; i < 12; i++) {
      const isTarget = qualifyingSet.has(i);
      let num;
      if (isTarget) {
        num = (Math.floor(Math.random() * 18) + 2) * 5;
      } else {
        num = Math.floor(Math.random() * 88) + 11;
        if (num % 5 === 0) num += 1;
      }
      const c = randomChoice(colorMap);
      tiles.push({ idx: i, display: num, colorHex: c.hex, isQualifying: isTarget });
    }
  } else if (chosenType === 'smiling_emojis') {
    engine.roundRule = 'TAP ALL SMILING EMOJIS 😀';
    const smileys = ['😀', '😄', '😎', '😆', '😁'];
    const others = ['🤖', '💀', '👽', '👾', '👻', '🍕', '🎮', '⚡', '🔥'];
    const count = Math.floor(Math.random() * 2) + 3;
    const indices = pickUniqueRandomIndices(12, 12);
    const qualifyingSet = new Set(indices.slice(0, count));

    for (let i = 0; i < 12; i++) {
      const isTarget = qualifyingSet.has(i);
      const em = isTarget ? randomChoice(smileys) : randomChoice(others);
      const c = randomChoice(colorMap);
      tiles.push({ idx: i, display: em, colorHex: c.hex, isQualifying: isTarget });
    }
  } else if (chosenType === 'rockets') {
    engine.roundRule = 'TAP ALL ROCKET TILES 🚀';
    const others = ['🛸', '✈️', '🛰️', '⚡', '🔥', '🎯', '💫', '🌟'];
    const count = Math.floor(Math.random() * 2) + 3;
    const indices = pickUniqueRandomIndices(12, 12);
    const qualifyingSet = new Set(indices.slice(0, count));

    for (let i = 0; i < 12; i++) {
      const isTarget = qualifyingSet.has(i);
      const em = isTarget ? '🚀' : randomChoice(others);
      const c = randomChoice(colorMap);
      tiles.push({ idx: i, display: em, colorHex: c.hex, isQualifying: isTarget });
    }
  } else if (chosenType === 'cyan_tiles') {
    engine.roundRule = 'TAP ALL ELECTRIC CYAN TILES ⚡';
    const count = Math.floor(Math.random() * 2) + 3;
    const indices = pickUniqueRandomIndices(12, 12);
    const qualifyingSet = new Set(indices.slice(0, count));
    const nonCyanColors = colorMap.filter(c => c.name !== 'cyan');
    const symbols = ['◆', '▲', '●', '✦', '★', '■'];

    for (let i = 0; i < 12; i++) {
      const isTarget = qualifyingSet.has(i);
      const hex = isTarget ? '#00f5ff' : randomChoice(nonCyanColors).hex;
      const sym = randomChoice(symbols);
      tiles.push({ idx: i, display: sym, colorHex: hex, isQualifying: isTarget });
    }
  } else {
    engine.roundRule = 'TAP ALL NEON RED TILES 🔥';
    const count = Math.floor(Math.random() * 2) + 3;
    const indices = pickUniqueRandomIndices(12, 12);
    const qualifyingSet = new Set(indices.slice(0, count));
    const nonRedColors = colorMap.filter(c => c.name !== 'pink');
    const symbols = ['◆', '▲', '●', '✦', '★', '■'];

    for (let i = 0; i < 12; i++) {
      const isTarget = qualifyingSet.has(i);
      const hex = isTarget ? '#ff0055' : randomChoice(nonRedColors).hex;
      const sym = randomChoice(symbols);
      tiles.push({ idx: i, display: sym, colorHex: hex, isQualifying: isTarget });
    }
  }

  engine.qualifyingIndices = tiles.filter(t => t.isQualifying).map(t => t.idx);

  stage.innerHTML = `
    <div class="fasttap-arena">
      <div class="fasttap-rule-banner">
        <div class="fasttap-rule-text">${engine.roundRule}</div>
      </div>
      <div class="fasttap-grid">
        ${tiles.map((t, idx) => `
          <button class="fasttap-tile" data-idx="${idx}" style="border-color: ${t.colorHex}; color: ${t.colorHex};">
            ${t.display}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  stage.querySelectorAll('.fasttap-tile').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      onFastTapClick(idx, btn);
    });
  });
}

function onFastTapClick(idx, btn) {
  if (gameSession.paused || gameSession.ended) return;
  if (engine.tappedIndices.includes(idx)) return;

  const isQualifying = engine.qualifyingIndices.includes(idx);
  gameSession.totalCount += 1;

  if (isQualifying) {
    btn.classList.add('tapped-correct');
    engine.tappedIndices.push(idx);
    soundManager.playClick();
    gameSession.correctCount += 1;
    gameSession.score += 80;

    // Checked all qualifying tiles?
    if (engine.tappedIndices.length === engine.qualifyingIndices.length) {
      soundManager.playCorrect();
      gameSession.streak += 1;
      if (gameSession.streak > gameSession.bestStreak) gameSession.bestStreak = gameSession.streak;
      gameSession.combo = Math.min(3.5, 1.0 + (gameSession.streak * 0.25));
      gameSession.score += Math.round(200 * gameSession.combo);
      gameSession.level += 1;
      updateArenaHUD();

      if (gameSession.streak % 3 === 0) {
        soundManager.playCombo();
        showFunnyFeedback('streak');
      } else {
        showFunnyFeedback('correct');
      }

      trackTimeout(setTimeout(nextFastTapRound, 280));
    }
  } else {
    btn.classList.add('tapped-wrong');
    soundManager.playWrong();
    showFunnyFeedback('wrong', 'Wrong tile, bro! 💀');
    gameSession.streak = 0;
    gameSession.combo = 1.0;
    if (gameSession.timeRemaining > 2) {
      gameSession.timeRemaining -= 2;
    }
    updateArenaHUD();
  }
}

/* ==========================================================================
   17. GAME 8: BRAIN TRAP (NEW TRICK & COGNITIVE TRAP GAME)
   ========================================================================== */

function initBrainTrap() {
  gameSession.lives = 3;
  engine = {
    currentTrap: null
  };
  nextBrainTrapQuestion();
}

function nextBrainTrapQuestion() {
  const stage = document.getElementById('game-stage');
  if (!stage) return;

  const traps = [
    {
      inst: 'Click the word that says RED.',
      options: [
        { text: 'BLUE', color: '#ff0055', isCorrect: false, isTrap: true },
        { text: 'RED', color: '#10b981', isCorrect: true, isTrap: false },
        { text: 'GREEN', color: '#ff0055', isCorrect: false, isTrap: false },
        { text: 'YELLOW', color: '#a855f7', isCorrect: false, isTrap: false }
      ]
    },
    {
      inst: 'Do NOT click the biggest number.',
      options: [
        { text: '98', color: '#fff', isCorrect: false, isTrap: true },
        { text: '42', color: '#00f5ff', isCorrect: true, isTrap: false },
        { text: '99', color: '#fff', isCorrect: false, isTrap: true },
        { text: '105', color: '#fff', isCorrect: false, isTrap: true }
      ]
    },
    {
      inst: 'Select the actual color of bananas:',
      options: [
        { text: 'PURPLE', color: '#fbbf24', isCorrect: false, isTrap: true },
        { text: 'YELLOW', color: '#3b82f6', isCorrect: true, isTrap: false },
        { text: 'RED', color: '#fbbf24', isCorrect: false, isTrap: true },
        { text: 'GREEN', color: '#fff', isCorrect: false, isTrap: false }
      ]
    },
    {
      inst: 'How many letters in "THE ALPHABET"?',
      options: [
        { text: '26', color: '#fff', isCorrect: false, isTrap: true },
        { text: '11', color: '#00f5ff', isCorrect: true, isTrap: false },
        { text: '24', color: '#fff', isCorrect: false, isTrap: false },
        { text: '8', color: '#fff', isCorrect: false, isTrap: false }
      ]
    },
    {
      inst: 'Whatever you do, DO NOT tap this button:',
      options: [
        { text: 'DO NOT TAP', color: '#ff0055', isCorrect: false, isTrap: true },
        { text: 'CONTINUE →', color: '#00f5ff', isCorrect: true, isTrap: false },
        { text: 'CLICK HERE', color: '#a855f7', isCorrect: false, isTrap: false },
        { text: 'CONFIRM', color: '#fff', isCorrect: false, isTrap: false }
      ]
    },
    {
      inst: 'Which weighs more: 1 kg of bricks or 1 kg of feathers?',
      options: [
        { text: '1 kg of bricks', color: '#fff', isCorrect: false, isTrap: true },
        { text: 'They weigh the same', color: '#00f5ff', isCorrect: true, isTrap: false },
        { text: '1 kg of feathers', color: '#fff', isCorrect: false, isTrap: false },
        { text: 'Depends on gravity', color: '#fff', isCorrect: false, isTrap: false }
      ]
    },
    {
      inst: 'A bat & ball cost $1.10. Bat costs $1.00 more than ball. How much is the ball?',
      options: [
        { text: '$0.10', color: '#fff', isCorrect: false, isTrap: true },
        { text: '$0.05', color: '#00f5ff', isCorrect: true, isTrap: false },
        { text: '$0.15', color: '#fff', isCorrect: false, isTrap: false },
        { text: '$1.00', color: '#fff', isCorrect: false, isTrap: false }
      ]
    },
    {
      inst: 'If you overtake the person in 2nd place, what place are you in?',
      options: [
        { text: '1st place', color: '#fbbf24', isCorrect: false, isTrap: true },
        { text: '2nd place', color: '#00f5ff', isCorrect: true, isTrap: false },
        { text: '3rd place', color: '#fff', isCorrect: false, isTrap: false },
        { text: 'Last place', color: '#fff', isCorrect: false, isTrap: false }
      ]
    },
    {
      inst: 'How many months in a year have 28 days?',
      options: [
        { text: 'Only 1 (February)', color: '#fff', isCorrect: false, isTrap: true },
        { text: 'All 12 of them', color: '#00f5ff', isCorrect: true, isTrap: false },
        { text: 'None of them', color: '#fff', isCorrect: false, isTrap: false },
        { text: '6 months', color: '#fff', isCorrect: false, isTrap: false }
      ]
    },
    {
      inst: 'Click the word that is spelled INCORRECTLY:',
      options: [
        { text: 'Definitely', color: '#fff', isCorrect: false, isTrap: false },
        { text: 'Incorrectly', color: '#00f5ff', isCorrect: true, isTrap: false },
        { text: 'Receive', color: '#fff', isCorrect: false, isTrap: false },
        { text: 'Separate', color: '#fff', isCorrect: false, isTrap: false }
      ]
    },
    {
      inst: 'If 5 machines take 5 mins to make 5 widgets, how long for 100 machines for 100 widgets?',
      options: [
        { text: '100 minutes', color: '#fff', isCorrect: false, isTrap: true },
        { text: '5 minutes', color: '#00f5ff', isCorrect: true, isTrap: false },
        { text: '20 minutes', color: '#fff', isCorrect: false, isTrap: false },
        { text: '1 minute', color: '#fff', isCorrect: false, isTrap: false }
      ]
    },
    {
      inst: 'A doctor gives you 3 pills, 1 every 30 mins. How long do they last?',
      options: [
        { text: '90 minutes', color: '#fff', isCorrect: false, isTrap: true },
        { text: '60 minutes', color: '#00f5ff', isCorrect: true, isTrap: false },
        { text: '30 minutes', color: '#fff', isCorrect: false, isTrap: false },
        { text: '120 minutes', color: '#fff', isCorrect: false, isTrap: false }
      ]
    },
    {
      inst: 'Tap the option with GREEN text (ignore what it spells):',
      options: [
        { text: 'GREEN', color: '#ff0055', isCorrect: false, isTrap: true },
        { text: 'BLUE', color: '#10b981', isCorrect: true, isTrap: false },
        { text: 'YELLOW', color: '#fbbf24', isCorrect: false, isTrap: false },
        { text: 'RED', color: '#a855f7', isCorrect: false, isTrap: false }
      ]
    },
    {
      inst: 'A plane crashes on the border of US & Canada. Where do they bury survivors?',
      options: [
        { text: 'United States', color: '#fff', isCorrect: false, isTrap: true },
        { text: 'Canada', color: '#fff', isCorrect: false, isTrap: true },
        { text: "You don't bury survivors!", color: '#00f5ff', isCorrect: true, isTrap: false },
        { text: 'Neutral territory', color: '#fff', isCorrect: false, isTrap: false }
      ]
    }
  ];

  const rawTrap = randomChoice(traps);
  const shuffledOptions = shuffleArray(rawTrap.options);
  engine.currentTrap = { ...rawTrap, options: shuffledOptions };

  stage.innerHTML = `
    <div class="trap-arena">
      <div class="trap-card-prompt">
        <span class="trap-warning-tag">⚠️ BRAIN TRAP</span>
        <h2 class="trap-instruction">${rawTrap.inst}</h2>
      </div>
      <div class="trap-options-grid">
        ${shuffledOptions.map((opt, i) => `
          <button class="trap-opt-btn" data-idx="${i}" style="color: ${opt.color};">
            ${opt.text}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  stage.querySelectorAll('.trap-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const chosen = engine.currentTrap.options[idx];
      onBrainTrapAnswer(chosen);
    });
  });
}

function onBrainTrapAnswer(chosen) {
  if (gameSession.paused || gameSession.ended) return;
  gameSession.totalCount += 1;

  if (chosen.isCorrect) {
    soundManager.playCorrect();
    showFunnyFeedback('correct', 'BIG BRAIN ENERGY 🧠🔥');
    gameSession.correctCount += 1;
    gameSession.streak += 1;
    if (gameSession.streak > gameSession.bestStreak) gameSession.bestStreak = gameSession.streak;
    gameSession.combo = Math.min(3.0, 1.0 + (gameSession.streak * 0.2));
    gameSession.score += Math.round(250 * gameSession.combo);
    gameSession.level += 1;
    updateArenaHUD();

    trackTimeout(setTimeout(nextBrainTrapQuestion, 450));
  } else {
    soundManager.playWrong();
    if (chosen.isTrap) {
      showFunnyFeedback('trapFail');
    } else {
      showFunnyFeedback('wrong');
    }

    gameSession.lives -= 1;
    gameSession.streak = 0;
    gameSession.combo = 1.0;
    updateArenaHUD();

    if (gameSession.lives <= 0) {
      finishGameRound(gameSession.score);
    } else {
      trackTimeout(setTimeout(nextBrainTrapQuestion, 600));
    }
  }
}

/* ==========================================================================
   18. PROFILE & GAME HISTORY VIEWS
   ========================================================================== */

function defaultProfile() {
  return {
    handle: 'CYBER_STUDENT',
    xp: 4820,
    gamesPlayed: 126,
    streakDays: 7,
    bestOverallScore: 2840,
    bestScores: {
      matrix: 1240,
      calc: 1890,
      rush: 980,
      sequence: 1120,
      logic: 850,
      breaker: 1410,
      fasttap: 1650,
      braintrap: 1380
    },
    history: [
      { game: 'Brain Trap', score: 1380, accuracy: '90%', date: 'Oct 1, 07:15 PM', rank: 'S' },
      { game: 'Fast Tap', score: 1650, accuracy: '95%', date: 'Oct 1, 06:40 PM', rank: 'S' },
      { game: 'Quick Calc', score: 1890, accuracy: '88%', date: 'Oct 1, 05:10 PM', rank: 'A' },
      { game: 'Memory Matrix', score: 1240, accuracy: '84%', date: 'Sep 30, 09:20 PM', rank: 'A' }
    ],
    achievements: {
      first_game: true,
      streak_10: true,
      speed_demon: false,
      accuracy_90: true,
      high_scorer: true,
      trap_survivor: false
    }
  };
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    profile = raw ? JSON.parse(raw) : defaultProfile();
    if (!profile.history) profile.history = defaultProfile().history;
    if (!profile.achievements) profile.achievements = defaultProfile().achievements;
  } catch (e) {
    profile = defaultProfile();
  }
}

function persistProfile() {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {}
}

function updateProfileViews() {
  if (!profile) return;
  const level = Math.floor(profile.xp / 400) + 1;
  const xpInLevel = profile.xp % 400;
  const xpPercent = Math.round((xpInLevel / 400) * 100);

  // Home preview elements
  const hHandle = document.getElementById('home-player-handle');
  if (hHandle) hHandle.textContent = profile.handle;
  const hLvl = document.getElementById('home-player-lvl');
  if (hLvl) hLvl.textContent = `LVL ${level}`;
  const hBest = document.getElementById('home-best-score');
  if (hBest) hBest.textContent = profile.bestOverallScore.toLocaleString();
  const hStreak = document.getElementById('home-streak');
  if (hStreak) hStreak.textContent = `🔥 ${profile.streakDays} DAYS`;
  const hGames = document.getElementById('home-games-played');
  if (hGames) hGames.textContent = profile.gamesPlayed.toLocaleString();

  // Profile Page elements
  const pHandle = document.getElementById('profile-handle');
  if (pHandle) pHandle.textContent = profile.handle;
  const pLvl = document.getElementById('profile-lvl-num');
  if (pLvl) pLvl.textContent = `LVL ${level}`;
  const pFill = document.getElementById('profile-xp-fill');
  if (pFill && pFill.style) pFill.style.width = `${xpPercent}%`;
  const pCaption = document.getElementById('profile-xp-caption');
  if (pCaption) pCaption.textContent = `${profile.xp.toLocaleString()} XP`;

  const profBest = document.getElementById('prof-best-score');
  if (profBest) profBest.textContent = profile.bestOverallScore.toLocaleString();
  const profStreak = document.getElementById('prof-streak');
  if (profStreak) profStreak.textContent = `🔥 ${profile.streakDays} DAYS`;
  const profGames = document.getElementById('prof-total-games');
  if (profGames) profGames.textContent = profile.gamesPlayed.toLocaleString();

  // Render Achievements
  renderAchievements();

  // Render Game History
  renderHistoryTable();
}

function renderAchievements() {
  const container = document.getElementById('achievements-container');
  if (!container) return;

  const list = [
    { id: 'first_game', icon: '🧠', name: 'First Game', desc: 'Played your initial brain trial.' },
    { id: 'streak_10', icon: '🔥', name: '10 Game Streak', desc: 'Maintained 10 correct answers in a row.' },
    { id: 'speed_demon', icon: '⚡', name: 'Speed Demon', desc: 'Score 1,500+ in Fast Tap or Quick Calc.' },
    { id: 'accuracy_90', icon: '🎯', name: '90% Accuracy', desc: 'Completed a round with elite precision.' },
    { id: 'high_scorer', icon: '🏆', name: 'High Scorer', desc: 'Crossed 2,000 points in any game.' },
    { id: 'trap_survivor', icon: '🪤', name: 'Trap Survivor', desc: 'Score 1,000+ in Brain Trap without failing.' }
  ];

  container.innerHTML = list.map(a => {
    const isUnlocked = profile.achievements && profile.achievements[a.id];
    return `
      <div class="achieve-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <span class="achieve-icon">${a.icon}</span>
        <strong class="achieve-name">${a.name}</strong>
        <p class="achieve-desc">${a.desc}</p>
      </div>
    `;
  }).join('');
}

function renderHistoryTable() {
  const container = document.getElementById('history-rows-container');
  if (!container) return;

  if (!profile.history || profile.history.length === 0) {
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No game history recorded yet. Start playing!</div>';
    return;
  }

  container.innerHTML = profile.history.map(item => `
    <div class="history-row">
      <span class="history-game-name">${escapeHtml(item.game)}</span>
      <span class="history-score">${item.score.toLocaleString()}</span>
      <span class="history-acc">${item.accuracy}</span>
      <span class="history-time">${escapeHtml(item.date)}</span>
    </div>
  `).join('');
}

/* ==========================================================================
   19. CAMPUS LEADERBOARD VIEWS
   ========================================================================== */

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
    leaderboard = raw ? JSON.parse(raw) : DEFAULT_LEADERBOARD;
  } catch (e) {
    leaderboard = DEFAULT_LEADERBOARD;
  }
}

function renderLeaderboard(timeframe = 'all') {
  const container = document.getElementById('full-leaderboard-rows');
  if (!container) return;

  let list = [...leaderboard];
  if (timeframe === 'week') {
    list.sort((a, b) => b.score - a.score);
  } else if (timeframe === 'month') {
    list.sort((a, b) => b.xp - a.xp);
  }

  container.innerHTML = list.map((entry, idx) => {
    let rankClass = '';
    if (idx === 0) rankClass = 'lb-row-gold';
    else if (idx === 1) rankClass = 'lb-row-silver';
    else if (idx === 2) rankClass = 'lb-row-bronze';

    const userClass = entry.isUser ? 'lb-user-row' : '';

    return `
      <div class="lb-row ${rankClass} ${userClass}">
        <span class="lb-col-rank">#${idx + 1}</span>
        <span class="lb-col-player">
          ${escapeHtml(entry.name)}
          ${entry.isUser ? '<span class="lb-user-badge">YOU</span>' : ''}
        </span>
        <span class="lb-col-campus">${escapeHtml(entry.campus)}</span>
        <span class="lb-col-xp">${entry.xp.toLocaleString()} XP</span>
        <span class="lb-col-score">${entry.score.toLocaleString()}</span>
        <span class="lb-col-games">${entry.games}</span>
      </div>
    `;
  }).join('');

  // Wire timeframe pills on Leaderboard page
  document.querySelectorAll('.lb-tf-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      soundManager.playClick();
      document.querySelectorAll('.lb-tf-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderLeaderboard(tab.getAttribute('data-timeframe'));
    });
  });
}

function renderHomeLeaderboardPreview() {
  const container = document.getElementById('home-leaderboard-list');
  if (!container) return;

  const top3 = leaderboard.slice(0, 3);
  container.innerHTML = top3.map((entry, idx) => `
    <div class="hlb-row ${entry.isUser ? 'lb-user-row' : ''}">
      <span class="lb-col-rank">#${idx + 1}</span>
      <span class="lb-col-player">${escapeHtml(entry.name)}</span>
      <span class="lb-col-campus">${escapeHtml(entry.campus)}</span>
      <span class="lb-col-score">${entry.score.toLocaleString()}</span>
    </div>
  `).join('');
}

/* ==========================================================================
   20. SETTINGS & LOCAL STORAGE MANAGEMENT
   ========================================================================== */

function defaultSettings() {
  return { soundOn: true, animationsOn: true };
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    settings = raw ? JSON.parse(raw) : defaultSettings();
  } catch (e) {
    settings = defaultSettings();
  }
}

function persistSettings() {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {}
}

function wireSettingsPage() {
  const soundToggle = document.getElementById('setting-sound-toggle');
  if (soundToggle) {
    soundToggle.checked = settings.soundOn;
    soundToggle.addEventListener('change', () => {
      settings.soundOn = soundToggle.checked;
      persistSettings();
      updateSoundButtonStates();
      soundManager.playClick();
    });
  }

  const animToggle = document.getElementById('setting-anim-toggle');
  if (animToggle) {
    animToggle.checked = settings.animationsOn;
    animToggle.addEventListener('change', () => {
      settings.animationsOn = animToggle.checked;
      persistSettings();
      soundManager.playClick();
      showFunnyFeedback('correct', settings.animationsOn ? 'Animations: ON' : 'Animations: OFF');
    });
  }

  const resetBtn = document.getElementById('reset-data-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      soundManager.playClick();
      const confirmed = confirm('Permanently reset all player XP, game history, and scores on this device?');
      if (confirmed) {
        localStorage.clear();
        profile = defaultProfile();
        settings = defaultSettings();
        leaderboard = DEFAULT_LEADERBOARD;
        persistProfile();
        persistSettings();
        updateProfileViews();
        updateSoundButtonStates();
        showFunnyFeedback('wrong', 'All local game data has been wiped.');
      }
    });
  }
}

function checkDailyStatus() {
  const dailyEl = document.getElementById('home-daily-score');
  if (!dailyEl) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.date === new Date().toDateString()) {
        dailyEl.textContent = `${data.score} pts`;
      }
    }
  } catch (e) {}
}

/* ==========================================================================
   21. LIGHTWEIGHT CANVAS CONFETTI
   ========================================================================== */

function launchConfetti() {
  if (!settings || !settings.animationsOn) return;
  const canvas = document.getElementById('victory-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#00f5ff', '#a855f7', '#fbbf24', '#10b981', '#ffffff', '#ff0055'];
  const particles = Array.from({ length: 65 }, () => ({
    x: rect.width * (0.3 + Math.random() * 0.4),
    y: rect.height * 0.35,
    vx: (Math.random() - 0.5) * 11,
    vy: -(Math.random() * 8 + 4),
    size: Math.random() * 8 + 4,
    color: randomChoice(colors),
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 14
  }));

  const start = Date.now();
  function loop() {
    const elapsed = Date.now() - start;
    if (elapsed > 3000) {
      stopConfetti();
      return;
    }
    ctx.clearRect(0, 0, rect.width, rect.height);
    const fade = elapsed > 2000 ? 1 - (elapsed - 2000) / 1000 : 1;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28;
      p.rotation += p.rotSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, fade);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      ctx.restore();
    });

    confettiAnimId = requestAnimationFrame(loop);
  }

  stopConfetti();
  confettiAnimId = requestAnimationFrame(loop);
}

function stopConfetti() {
  if (confettiAnimId) {
    cancelAnimationFrame(confettiAnimId);
    confettiAnimId = null;
  }
  const canvas = document.getElementById('victory-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

/* ==========================================================================
   22. UTILITIES
   ========================================================================== */

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickUniqueRandomIndices(total, count) {
  const pool = Array.from({ length: total }, (_, i) => i);
  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, count);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   23. EXPORTS & GLOBAL COMPATIBILITY
   ========================================================================== */

if (typeof globalThis !== 'undefined') {
  globalThis.soundManager = soundManager;
  globalThis.navigateTo = navigateTo;
  globalThis.cleanupActiveGame = cleanupActiveGame;
  globalThis.GAME_METADATA = GAME_METADATA;
  globalThis.profile = profile;
  globalThis.getRoute = () => currentRoute;
  globalThis.getEngine = () => engine;
  globalThis.getGameSession = () => gameSession;
  try {
    Object.defineProperty(globalThis, 'currentRoute', {
      get() { return currentRoute; },
      set(v) { currentRoute = v; },
      configurable: true
    });
  } catch (e) {
    globalThis.currentRoute = currentRoute;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    soundManager,
    navigateTo,
    getCurrentRoute: () => currentRoute,
    getEngine: () => engine,
    getGameSession: () => gameSession,
    GAME_METADATA,
    profile,
    launchGameArena,
    cleanupActiveGame,
    initFastTap,
    initBrainTrap,
    initMemoryMatrix,
    initQuickCalc,
    initNumberRush,
    initNumberSequence,
    initLogicGrid,
    initPatternBreaker
  };
}
