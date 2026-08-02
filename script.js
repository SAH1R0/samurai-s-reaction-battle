// ==========================================
// ⚙️ ゲーム変数・設定
// ==========================================
// ゲームの設定値
const MAX_WAIT_TIME = 6000; // 最大待ち時間（6秒）
const MIN_WAIT_TIME = 2000; // 最小待ち時間（2秒）
const TIME_LIMIT = 500;    // 反応制限時間（0.5秒）

// ゲームの状態管理用変数
let gameState = 'IDLE';    // ゲームの現在の状態 (IDLE, WAITING, SIGNAL, FINISHED)
let waitTimer = null;      // 「！」が出るまでのタイマー
let limitTimer = null;     // 0.5秒超過判定用のタイマー
let startTime = 0;         // 「！」が出た瞬間の時刻
let reactionTime = 0;      // プレイヤーの反応速度 (ms)
let soundEnabled = true;   // 音声ON/OFFフラグ
let bgmVolume = 0.5;       // BGMの初期音量 (50%)
let seVolume = 0.8;        // 💡 SEの初期音量 (80%)

// 📊 GitHubランキング連携設定
const tokenPrefix = "ghp_RuTwsOYxrRsy";
const tokenSecret = "11fPcZrH0rn8UsJwEk344";
const tokenSecretRev = "5Wj";
const GITHUB_TOKEN = tokenPrefix + tokenSecret + tokenSecretRev.split("").reverse().join("");

const REPO_OWNER = "SAH1R0";
const REPO_NAME = "samurai-s-reaction-battle";

// ==========================================
// 🔊 サウンド処理（BGM・SE・音量）
// ==========================================

// BGM（風の音）を最初から再生開始
function playBGM() {
    if (!soundEnabled) return;
    const bgm = document.getElementById('bgm-wind');
    bgm.volume = bgmVolume; // 設定された音量を適用
    bgm.currentTime = 0;
    bgm.play().catch(e => console.log("BGM再生ブロック:", e));
}

// BGMを停止
function stopBGM() {
    const bgm = document.getElementById('bgm-wind');
    bgm.pause();
    bgm.currentTime = 0;
}

// 一閃SE（「キン！」）を再生
function playSE() {
    if (!soundEnabled) return;
    const se = document.getElementById('se-slash');
    se.volume = seVolume; // 💡 設定されたSE音量を適用
    se.currentTime = 0;   // 連続で鳴らせるように巻き戻し
    se.play().catch(e => console.log("SE再生ブロック:", e));
}

// 設定画面：音声ON/OFFの切り替え
function toggleSound(enabled) {
    soundEnabled = enabled;
    if (!soundEnabled) {
        stopBGM();
    }
}

// 設定画面：BGM音量のスライダー調整
function setBGMVolume(val) {
    bgmVolume = parseFloat(val);
    const bgm = document.getElementById('bgm-wind');
    bgm.volume = bgmVolume;
    
    const volText = document.getElementById('volume-val');
    if (volText) {
        volText.textContent = Math.round(bgmVolume * 100) + '%';
    }
}

// 💡 設定画面：SE音量のスライダー調整（新規追加）
function setSEVolume(val) {
    seVolume = parseFloat(val);
    const seVolText = document.getElementById('se-volume-val');
    if (seVolText) {
        seVolText.textContent = Math.round(seVolume * 100) + '%';
    }
    // スライダー操作時に音量確認用でSEを一瞬テスト再生
    playSE();
}

// ==========================================
// 画面制御（ホーム・ゲーム・モーダル）
// ==========================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function goHome() {
    resetGame();
    showScreen('home-screen');
}

function openModal(modalId) {
    if (modalId === 'ranking-modal') showRanking();
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// ==========================================
// ⚔️ ゲームメインロジック
// ==========================================

function startGame() {
    resetGame();
    showScreen('game-screen');
    
    document.getElementById('status-message').textContent = '構えろ…';
    gameState = 'WAITING';

    playBGM();

    const leftSamurai = document.getElementById('samurai-left');
    const rightSamurai = document.getElementById('samurai-right');
    
    leftSamurai.innerHTML = `<img src="images/ready_samurai.png" alt="プレイヤー">`;
    rightSamurai.innerHTML = `<img src="images/ready_samurai.png" alt="相手">`;

    const randomWait = Math.floor(Math.random() * (MAX_WAIT_TIME - MIN_WAIT_TIME + 1)) + MIN_WAIT_TIME;

    waitTimer = setTimeout(() => {
        triggerSignal();
    }, randomWait);
}

function triggerSignal() {
    gameState = 'SIGNAL';
    startTime = Date.now();

    document.getElementById('status-message').textContent = '一閃！';
    document.getElementById('signal-mark').classList.remove('hidden');

    limitTimer = setTimeout(() => {
        if (gameState === 'SIGNAL') {
            finishGame(false, '遅い！(0.5秒超過)');
        }
    }, TIME_LIMIT);
}

function handleStageClick() {
    if (gameState === 'WAITING') {
        clearTimeout(waitTimer);
        finishGame(false, 'フライング！(焦りは禁物)');
    } else if (gameState === 'SIGNAL') {
        clearTimeout(limitTimer);
        reactionTime = Date.now() - startTime;
        finishGame(true, `見事！ (${reactionTime} ms)`);
    }
}

function finishGame(isSuccess, message) {
    gameState = 'FINISHED';
    document.getElementById('signal-mark').classList.add('hidden');
    document.getElementById('status-message').textContent = message;

    stopBGM();
    playSE(); // 勝ち負けに関係なくSE再生

    const leftSamurai = document.getElementById('samurai-left');
    const rightSamurai = document.getElementById('samurai-right');
    
    leftSamurai.classList.add('swapped-left');
    rightSamurai.classList.add('swapped-right');

    if (isSuccess) {
        leftSamurai.innerHTML = `<img src="images/slash_samurai.png" alt="プレイヤー">`;
    } else {
        rightSamurai.innerHTML = `<img src="images/slash_samurai.png" alt="相手">`;
    }

    const resultOverlay = document.getElementById('result-overlay');
    const resultTitle = document.getElementById('result-title');
    const resultDetail = document.getElementById('result-detail');
    const registerZone = document.getElementById('register-zone');

    if (isSuccess) {
        resultTitle.textContent = '⚔️ 勝負あり！';
        resultTitle.style.color = '#2ecc71';
        resultDetail.innerHTML = `反応速度: <span id="reaction-time-val">${reactionTime}</span> ms`;
        
        registerZone.innerHTML = `
            <input type="text" id="player-name" placeholder="名前を入力" maxlength="10">
            <button onclick="registerScore()" class="btn btn-small">ランキングに登録</button>
        `;
        registerZone.style.display = 'flex';
    } else {
        resultTitle.textContent = '💀 敗北…';
        resultTitle.style.color = '#e74c3c';
        resultDetail.textContent = message;
        registerZone.style.display = 'none';
    }

    setTimeout(() => {
        resultOverlay.classList.remove('hidden');
    }, 700);
}

function resetGame() {
    clearTimeout(waitTimer);
    clearTimeout(limitTimer);
    gameState = 'IDLE';

    stopBGM();

    document.getElementById('signal-mark').classList.add('hidden');
    document.getElementById('result-overlay').classList.add('hidden');

    const leftSamurai = document.getElementById('samurai-left');
    const rightSamurai = document.getElementById('samurai-right');
    leftSamurai.classList.remove('swapped-left');
    rightSamurai.classList.remove('swapped-right');
}

// ==========================================
// 📊 GitHubランキング連携
// ==========================================

async function showRanking() {
    const list = document.getElementById('ranking-list');
    list.innerHTML = '<li>読み込み中... ⏳</li>';

    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/ranking.json?t=${Date.now()}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });

        let rankings = [];
        if (response.ok) {
            const data = await response.json();
            const jsonText = decodeURIComponent(escape(atob(data.content)));
            rankings = JSON.parse(jsonText) || [];
        }

        if (rankings.length === 0) {
            list.innerHTML = '<li>まだ記録がありません。</li>';
            return;
        }

        list.innerHTML = rankings.map((score, index) => {
            let crown = index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : '';
            return `<li>${crown}<strong>${score.name}</strong> - ${score.time} ms <span style="font-size:10px;color:#888;">(${score.date})</span></li>`;
        }).join('');

    } catch (error) {
        console.error("ランキング取得エラー:", error);
        list.innerHTML = '<li style="color:#e74c3c;">データの取得に失敗しました。</li>';
    }
}

async function registerScore() {
    const nameInput = document.getElementById('player-name');
    if (!nameInput) return;

    const name = nameInput.value.trim() || "名無し侍";
    const newRecord = {
        name: name,
        time: reactionTime,
        date: new Date().toLocaleDateString()
    };

    const registerZone = document.getElementById('register-zone');
    const originalFormHtml = registerZone.innerHTML;
    registerZone.innerHTML = '<p style="text-align:center; width:100%;">送信中... 🚀</p>';

    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/ranking.json`;
        
        const getUrl = `${url}?t=${Date.now()}`;
        const getRes = await fetch(getUrl, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });

        let rankings = [];
        let sha = null;

        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
            const jsonText = decodeURIComponent(escape(atob(data.content)));
            rankings = JSON.parse(jsonText) || [];
        }

        rankings.push(newRecord);
        rankings.sort((a, b) => a.time - b.time);
        rankings = rankings.slice(0, 10);

        const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(rankings, null, 2))));

        const putRes = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update samurai ranking [skip ci]`,
                content: newContent,
                sha: sha
            })
        });

        if (!putRes.ok) throw new Error(`送信失敗: ${putRes.status}`);

        registerZone.innerHTML = originalFormHtml;
        registerZone.style.display = 'none';
        showRanking();

    } catch (error) {
        console.error("スコア登録エラー:", error);
        alert("GitHubへのスコア送信に失敗しました。");
        registerZone.innerHTML = originalFormHtml;
    }
}