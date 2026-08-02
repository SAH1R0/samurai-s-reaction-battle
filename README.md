# ⚔️ 侍たちの見切り (Samurai Reaction Battle)

「！」が出た瞬間に画面をクリック！コンマ秒の反応速度を競う、和風コンバット・リアクションゲームです。

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?style=flat-square&logo=github&logoColor=white)

---

## 🎮 プレイ（Webで遊ぶ）

以下のリンクからブラウザ上で直接プレイできます。（PC / スマホ両対応）

👉 **[ゲームをプレイする](https://sah1r0.github.io/samurai-s-reaction-battle/)**

---

## 🕹️ ルール・遊び方

1. **「ゲーム開始」** をクリックすると勝負が始まります。
2. 画面中央に **「！」** マークが出現するまで「構え…」の状態で待ちます。（2秒〜6秒のランダム）
3. **「！」が出た瞬間にすばやく画面をクリック！**
4. **勝利条件**: **0.5秒（500ms）以内**に反応できれば見事勝利！
5. **敗北条件**:
   * 「！」が出る前にクリックしてしまった場合（**フライング**）
   * 「！」が出現してから0.5秒以上かかってしまった場合（**遅延**）

---

## ✨ 主な機能

- **⚔️ リアルタイム反応速度測定**
  - ミリ秒（ms）単位であなたの反応速度を計測します。
- **🏆 オンラインランキング**
  - 勝利時のタイムを名前と一緒にグローバルランキングに登録可能（TOP 10）。
  - GitHub REST API を活用し、`ranking.json` への即時読み書きを行っています。
- **⚙️ 詳細なサウンド設定**
  - **BGM（環境音）** と **SE（一閃音）** の音量をそれぞれ独立したスライダーで調整可能。
- **🎨 ダイナミックな演出**
  - 勝負が決すると、侍同士がすれ違い斬り結ぶアニメーション演出が入ります。

---

## 🛠️ 技術構成

* **フロントエンド**: HTML5 / CSS3 / JavaScript (Vanilla JS)
* **デザイン**: CSS アニメーション / Standard Layout
* **データ連携**: GitHub REST API (JSONデータ更新)
* **ホスティング**: GitHub Pages

---

## 📁 フォルダ構成

```text
samurai-s-reaction-battle/
├── index.html        # メインHTML
├── style.css         # スタイル・アニメーション定義
├── script.js        # ゲームロジック・GitHub API連携
├── ranking.json      # ランキングデータ保存用JSON
├── images/           # ゲーム用画像素材
│   ├── ready_samurai.png
│   ├── slash_samurai.png
│   └── bg.png
└── audio/            # 音声素材
    ├── wind_bgm.mp3
    └── slash_se.mp3
