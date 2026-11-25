// Initialize Telegram WebApp SDK
const tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) {
    tg.ready();
    tg.expand();
    if (tg.setHeaderColor) tg.setHeaderColor('#09090d');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#09090d');
}

// Game Constants
const MINING_DURATION_SECONDS = 24 * 60 * 60; // 24 hours
const MINING_REWARD_AMOUNT = 100; // 100 $GTA per cycle

// State Management
let state = {
    balance: parseFloat(localStorage.getItem('gta_balance')) || 0,
    totalMined: parseFloat(localStorage.getItem('gta_total_mined')) || 0,
    miningStartTime: parseInt(localStorage.getItem('gta_mining_start')) || null,
    isClaimReady: false
};

let timerInterval = null;

// Load User Profile from Telegram
function initUserProfile() {
    const nameEl = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar');

    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
        nameEl.textContent = user.username ? `@${user.username}` : fullName;

        if (user.photo_url) {
            avatarEl.src = user.photo_url;
        }
    } else {
        nameEl.textContent = 'Vice City Miner';
    }
}

// Calculate User Rank / Level
function updateUserLevel() {
    const levelEl = document.getElementById('user-level');
    const total = state.totalMined;
    let levelText = 'Lvl 1 • Beginner Miner';

    if (total >= 10000) {
        levelText = 'Lvl 5 • Master Miner';
    } else if (total >= 5000) {
        levelText = 'Lvl 4 • Expert Miner';
    } else if (total >= 1500) {
        levelText = 'Lvl 3 • Pro Miner';
    } else if (total >= 500) {
        levelText = 'Lvl 2 • Junior Miner';
    }

    levelEl.textContent = levelText;
}

// Update Balance UI
function updateBalanceUI() {
    document.getElementById('coin-balance').textContent = state.balance.toFixed(2);
    document.getElementById('total-mined').textContent = state.totalMined.toFixed(0);
    updateUserLevel();
}

// Save State locally
function saveState() {
    localStorage.setItem('gta_balance', state.balance.toString());
    localStorage.setItem('gta_total_mined', state.totalMined.toString());
    if (state.miningStartTime) {
        localStorage.setItem('gta_mining_start', state.miningStartTime.toString());
    } else {
        localStorage.removeItem('gta_mining_start');
    }
}

// Format Seconds into HH:MM:SS
function formatTime(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);

    return [
        hrs.toString().padStart(2, '0'),
        mins.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0')
    ].join(':');
}

// Main Mining Timer Loop
function updateMiningLoop() {
    const timerEl = document.getElementById('countdown-timer');
    const progressEl = document.getElementById('mining-progress');
    const statusEl = document.getElementById('mining-status');
    const digBtn = document.getElementById('dig-btn');
    const coinRing = document.querySelector('.coin-glow-ring');

    if (!state.miningStartTime) {
        state.isClaimReady = false;
        timerEl.textContent = '24:00:00';
        progressEl.style.width = '0%';
        statusEl.textContent = 'READY';
        statusEl.className = 'stat-value status-ready';
        digBtn.textContent = 'START MINING';
        digBtn.className = 'dig-button';
        coinRing.classList.remove('mining-active');
        return;
    }

    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - state.miningStartTime;
    const remaining = MINING_DURATION_SECONDS - elapsed;

    if (remaining <= 0) {
        state.isClaimReady = true;
        timerEl.textContent = '00:00:00';
        progressEl.style.width = '100%';
        statusEl.textContent = 'COMPLETED';
        statusEl.className = 'stat-value status-ready';
        digBtn.textContent = `CLAIM (+${MINING_REWARD_AMOUNT} $GTA)`;
        digBtn.className = 'dig-button claim-ready';
        coinRing.classList.remove('mining-active');
    } else {
        state.isClaimReady = false;
        timerEl.textContent = formatTime(remaining);
        const percent = Math.min(100, (elapsed / MINING_DURATION_SECONDS) * 100);
        progressEl.style.width = `${percent}%`;
        statusEl.textContent = 'MINING...';
        statusEl.className = 'stat-value status-mining';
        digBtn.textContent = 'MINING IN PROGRESS...';
        digBtn.className = 'dig-button mining-in-progress';
        coinRing.classList.add('mining-active');
    }
}

// Handle Primary Button Click
function handleDigAction() {
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }

    if (!state.miningStartTime) {
        state.miningStartTime = Math.floor(Date.now() / 1000);
        saveState();
        updateMiningLoop();
    } else if (state.isClaimReady) {
        state.balance += MINING_REWARD_AMOUNT;
        state.totalMined += MINING_REWARD_AMOUNT;
        state.miningStartTime = null;
        state.isClaimReady = false;
        saveState();
        updateBalanceUI();
        updateMiningLoop();

        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
    }
}

// Bottom Navigation Tab Switcher
function switchTab(tabName, buttonEl) {
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.selectionChanged();
    }

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });

    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    if (buttonEl) {
        buttonEl.classList.add('active');
    }
}

// Initialize App on Load
document.addEventListener('DOMContentLoaded', () => {
    initUserProfile();
    updateBalanceUI();
    updateMiningLoop();
    timerInterval = setInterval(updateMiningLoop, 1000);
});
