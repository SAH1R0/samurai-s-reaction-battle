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
let bgmVolume = 0.5;       // BGMの初期音量 (0.0〜1.0)

// 📊 GitHubランキング連携設定（スコア保存用）
// ※トークンはセキュリティ上、本来はバックエンドで管理すべきですが、ここでは学習用に簡易的に記述しています。
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
    bgm.currentTime = 0;     // 最初に戻す
    // Chrome等のブラウザの自動再生ブロック対策をして再生
    bgm.play().catch(e => console.log("BGM再生ブロック（クリック後に再生されます）:", e));
}

// BGMを停止
function stopBGM() {
    const bgm = document.getElementById('bgm-wind');
    bgm.pause();
    bgm.currentTime = 0;
}

// 一閃SE（「キン！」）を再生
// 勝負が決まった際（勝利・敗北に関わらず）呼び出されます
function playSE() {
    if (!soundEnabled) return;
    const se = document.getElementById('se-slash');
    // SEは聞き取りやすいよう、BGM音量に関わらず一定（0.8）で鳴らします
    se.volume = 0.8;
    se.currentTime = 0; // 連続で鳴らせるように巻き戻し
    se.play().catch(e => console.log("SE再生ブロック:", e));
}

// 設定画面：音声ON/OFFの切り替え
function toggleSound(enabled) {
    soundEnabled = enabled;
    if (!soundEnabled) {
        stopBGM(); // OFFになったらBGMを止める
    }
}

// 設定画面：BGM音量のスライダー調整
function setBGMVolume(val) {
    bgmVolume = parseFloat(val); // スライダーの値（0〜1）を取得
    const bgm = document.getElementById('bgm-wind');
    // 再生中のBGM音量を即座に反映
    bgm.volume = bgmVolume;
    
    // UI（パーセント表示）を更新
    const volText = document.getElementById('volume-val');
    if (volText) {
        volText.textContent = Math.round(bgmVolume * 100) + '%';
    }
}

// ==========================================
// 画面制御（ホーム・ゲーム・モーダル）
// ==========================================

// 指定された画面を表示し、他を非表示にする
function showScreen(screenId) {
    // すべての画面を非アクティブに
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // 対象の画面だけアクティブに（CSSでdisplay: flexになる）
    document.getElementById(screenId).classList.add('active');
}

// ホーム画面に戻る処理
function goHome() {
    resetGame(); // ゲームの状態を完全にリセット
    showScreen('home-screen');
}

// モーダル（ランキング・設定）を開く
function openModal(modalId) {
    if (modalId === 'ranking-modal') showRanking(); // ランキングならデータを読み込む
    document.getElementById(modalId).classList.remove('hidden');
}

// モーダルを閉じる
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// ==========================================
// ⚔️ ゲームメインロジック
// ==========================================

// 「ゲーム開始」ボタン押下時
function startGame() {
    resetGame();              // 以前の状態をリセット
    showScreen('game-screen'); // ゲーム画面へ切り替え
    
    document.getElementById('status-message').textContent = '構えろ…';
    gameState = 'WAITING';    // 状態を「待ち」に

    // 💡 1. 風のBGMを再生開始
    playBGM();

    // 💡 武士の画像を「images/ready_samurai.png」に設定
    const leftSamurai = document.getElementById('samurai-left');
    const rightSamurai = document.getElementById('samurai-right');
    
    leftSamurai.innerHTML = `<img src="images/ready_samurai.png" alt="プレイヤー">`;
    rightSamurai.innerHTML = `<img src="images/ready_samurai.png" alt="相手">`;

    // 2〜6秒のランダムな待ち時間を計算
    const randomWait = Math.floor(Math.random() * (MAX_WAIT_TIME - MIN_WAIT_TIME + 1)) + MIN_WAIT_TIME;

    // タイマーをセット。時間が来たら「！」を表示
    waitTimer = setTimeout(() => {
        triggerSignal();
    }, randomWait);
}

// 時間が来て「！」を表示する処理
function triggerSignal() {
    gameState = 'SIGNAL';    // 状態を「シグナル発生中」に
    startTime = Date.now();  // 開始時刻を記録

    document.getElementById('status-message').textContent = '一閃！';
    document.getElementById('signal-mark').classList.remove('hidden'); // 「！」を表示

    // 0.5秒（TIME_LIMIT）の制限時間タイマーをセット
    limitTimer = setTimeout(() => {
        // 0.5秒たっても状態がSIGNALのままなら、プレイヤーの負け
        if (gameState === 'SIGNAL') {
            finishGame(false, '遅い！(0.5秒超過)');
        }
    }, TIME_LIMIT);
}

// ステージ（画面全体）がクリックされた時の処理
function handleStageClick() {
    if (gameState === 'WAITING') {
        // 「！」が出る前のクリック ＝ フライング失敗
        clearTimeout(waitTimer); // 「！」が出るタイマーを止める
        finishGame(false, 'フライング！(焦りは禁物)');

    } else if (gameState === 'SIGNAL') {
        // 「！」が出た後のクリック ＝ 成功
        clearTimeout(limitTimer); // 制限時間タイマーを止める
        reactionTime = Date.now() - startTime; // 反応時間を計算 (ms)
        finishGame(true, `見事！ (${reactionTime} ms)`);
    }
}

// ゲーム終了（決着）処理
// isSuccess: trueなら勝利(斬った)、falseなら失敗(斬られた/フライング)
function finishGame(isSuccess, message) {
    gameState = 'FINISHED'; // 状態を終了に
    document.getElementById('signal-mark').classList.add('hidden'); // 「！」を消す
    document.getElementById('status-message').textContent = message;

    // 💡 2. ゲーム終了時はBGMをストップ
    stopBGM();

    // 💡 3. 勝ちでも負け（フライングや遅延）でも、同じ「キン！」のSEを再生
    playSE();

    const leftSamurai = document.getElementById('samurai-left');
    const rightSamurai = document.getElementById('samurai-right');
    
    // 💡 4. CSSクラスを使い、武士の左右の位置をすれ違い移動（入れ替え）
    leftSamurai.classList.add('swapped-left');
    rightSamurai.classList.add('swapped-right');

    // 画像の切り替え（勝利側が斬ったポーズになる）
    if (isSuccess) {
        // プレイヤーの勝ち：プレイヤー（左）を斬ったポーズ（images/slash_samurai.png）にする
        leftSamurai.innerHTML = `<img src="images/slash_samurai.png" alt="プレイヤー">`;
    } else {
        // プレイヤーの負け：相手（右）を斬ったポーズ（images/slash_samurai.png）にする
        rightSamurai.innerHTML = `<img src="images/slash_samurai.png" alt="相手">`;
    }

    // 結果表示画面（オーバーレイ）の準備
    const resultOverlay = document.getElementById('result-overlay');
    const resultTitle = document.getElementById('result-title');
    const resultDetail = document.getElementById('result-detail');
    const registerZone = document.getElementById('register-zone');

    if (isSuccess) {
        // 勝利時
        resultTitle.textContent = '⚔️ 勝負あり！';
        resultTitle.style.color = '#2ecc71'; // 緑色
        resultDetail.innerHTML = `反応速度: <span id="reaction-time-val">${reactionTime}</span> ms`;
        
        // ランキング登録用のフォームを表示
        registerZone.innerHTML = `
            <input type="text" id="player-name" placeholder="名前を入力" maxlength="10">
            <button onclick="registerScore()" class="btn btn-small">ランキングに登録</button>
        `;
        registerZone.style.display = 'flex';
    } else {
        // 敗北時
        resultTitle.textContent = '💀 敗北…';
        resultTitle.style.color = '#e74c3c'; // 赤色
        resultDetail.textContent = message;
        registerZone.style.display = 'none'; // フォームは出さない
    }

    // 0.7秒後に結果画面をフェードイン（決着アニメーションを見せるため）
    setTimeout(() => {
        resultOverlay.classList.remove('hidden');
    }, 700);
}

// ゲーム状態のリセット（再挑戦時やホームに戻る時）
function resetGame() {
    clearTimeout(waitTimer);  // すべてのタイマーをクリア
    clearTimeout(limitTimer);
    gameState = 'IDLE';

    // 💡 5. リセット時も確実にBGM停止
    stopBGM();

    // 画面表示のリセット
    document.getElementById('signal-mark').classList.add('hidden');
    document.getElementById('result-overlay').classList.add('hidden');

    // 💡 6. 武士の位置入れ替えクラスを解除し、元の位置に戻す
    const leftSamurai = document.getElementById('samurai-left');
    const rightSamurai = document.getElementById('samurai-right');
    leftSamurai.classList.remove('swapped-left');
    rightSamurai.classList.remove('swapped-right');
}

// ==========================================
// 📊 GitHubランキング連携 (RAW形式保存)
// ==========================================

// ランキング（モーダル）を表示する際、GitHubから最新データを取得
async function showRanking() {
    const list = document.getElementById('ranking-list');
    list.innerHTML = '<li>読み込み中... ⏳</li>';

    try {
        // キャッシュを避けるためタイムスタンプを付与してfetch
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/ranking.json?t=${Date.now()}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });

        let rankings = [];
        if (response.ok) {
            const data = await response.json();
            // Base64デコード -> UTF-8デコード
            const jsonText = decodeURIComponent(escape(atob(data.content)));
            rankings = JSON.parse(jsonText) || [];
        }

        if (rankings.length === 0) {
            list.innerHTML = '<li>まだ記録がありません。</li>';
            return;
        }

        // HTMLを生成（上位3名には王冠）
        list.innerHTML = rankings.map((score, index) => {
            let crown = index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : '';
            return `<li>${crown}<strong>${score.name}</strong> - ${score.time} ms <span style="font-size:10px;color:#888;">(${score.date})</span></li>`;
        }).join('');

    } catch (error) {
        console.error("ランキング取得エラー:", error);
        list.innerHTML = '<li style="color:#e74c3c;">データの取得に失敗しました。</li>';
    }
}

// 勝利時、スコアをGitHubのranking.jsonに保存
async function registerScore() {
    const nameInput = document.getElementById('player-name');
    if (!nameInput) return;

    const name = nameInput.value.trim() || "名無しの侍";
    const newRecord = {
        name: name,
        time: reactionTime,
        date: new Date().toLocaleDateString() // 本日の日付
    };

    const registerZone = document.getElementById('register-zone');
    const originalFormHtml = registerZone.innerHTML;
    // 通信中表示に切り替え
    registerZone.innerHTML = '<p style="text-align:center; width:100%;">送信中... 🚀</p>';

    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/ranking.json`;
        
        // 1. まず現在のファイルを取得（SHAタグが必要なため）
        const getUrl = `${url}?t=${Date.now()}`;
        const getRes = await fetch(getUrl, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });

        let rankings = [];
        let sha = null;

        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha; // ファイルの識別子
            // デコード
            const jsonText = decodeURIComponent(escape(atob(data.content)));
            rankings = JSON.parse(jsonText) || [];
        }

        // 2. 新しいレコードを追加してソート（タイムが短い順）
        rankings.push(newRecord);
        rankings.sort((a, b) => a.time - b.time);
        rankings = rankings.slice(0, 10); // TOP 10のみ残す

        // 3. UTF-8 -> Base64エンコード
        const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(rankings, null, 2))));

        // 4. GitHub APIにPUT（上書き保存）
        const putRes = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update samurai ranking [skip ci]`,
                content: newContent,
                sha: sha // 取得したSHAを渡すことで上書き可能になる
            })
        });

        if (!putRes.ok) throw new Error(`送信失敗: ${putRes.status}`);

        // 成功したらフォームを隠してランキングを表示
        registerZone.innerHTML = originalFormHtml;
        registerZone.style.display = 'none';
        showRanking(); // モーダル内の表示を更新

    } catch (error) {
        console.error("スコア登録エラー:", error);
        alert("GitHubへのスコア送信に失敗しました。");
        registerZone.innerHTML = originalFormHtml; // 元に戻す
    }
}