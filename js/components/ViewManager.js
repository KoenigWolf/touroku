import { ElementVisibility } from '../utils/dom.js';

/**
 * 画面の状態を表す型定義
 * @typedef {'register-form' | 'register-confirmation' | 'register-complete'} ViewId
 */

/**
 * 画面遷移を管理するクラス
 */
export class ViewManager {
  /**
   * 画面の状態を表す列挙型
   * @readonly
   * @enum {ViewId}
   */
  static Views = {
    FORM: 'register-form',
    CONFIRMATION: 'register-confirmation',
    COMPLETE: 'register-complete'
  };

  /**
   * アニメーションの設定
   * @private
   * @readonly
   */
  static ANIMATION_CONFIG = {
    DURATION: 300,
    EASING: 'ease-in-out'
  };

  /**
   * コンストラクタ
   */
  constructor() {
    /** @type {ViewId} */
    this.currentView = ViewManager.Views.FORM;
    /** @type {ViewId[]} */
    this.history = [this.currentView];
    /** @type {boolean} */
    this.isTransitioning = false;
  }

  /**
   * 画面遷移の初期化
   */
  initialize() {
    this.setupEventListeners();
    this.setupAccessibility();
    this.restoreFromHash();
  }

  /**
   * イベントリスナーの設定
   * @private
   */
  setupEventListeners() {
    // ブラウザの戻るボタン対応
    window.addEventListener('popstate', () => {
      this.handlePopState();
    });

    // 戻るボタン
    const backButton = document.getElementById('back-btn');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.goBack();
      });
    }

    // トップページに戻るボタン
    const homeButton = document.getElementById('home-btn');
    if (homeButton) {
      homeButton.addEventListener('click', () => {
        this.goToHome();
      });
    }
  }

  /**
   * アクセシビリティの設定
   * @private
   */
  setupAccessibility() {
    // 各画面のARIAロールとラベルを設定
    for (const viewId of Object.values(ViewManager.Views)) {
      const element = document.getElementById(viewId);
      if (element) {
        element.setAttribute('role', 'region');
        element.setAttribute('aria-live', 'polite');
      }
    }
  }

  /**
   * URLハッシュから画面を復元
   * @private
   */
  restoreFromHash() {
    const hash = window.location.hash.slice(1);
    if (Object.values(ViewManager.Views).includes(/** @type {ViewId} */ (hash))) {
      this.transitTo(/** @type {ViewId} */ (hash), true);
    }
  }

  /**
   * 確認画面に遷移
   */
  goToConfirmation() {
    this.transitTo(ViewManager.Views.CONFIRMATION);
  }

  /**
   * 完了画面に遷移
   */
  goToComplete() {
    this.transitTo(ViewManager.Views.COMPLETE);
  }

  /**
   * フォーム画面に戻る
   */
  goToForm() {
    this.transitTo(ViewManager.Views.FORM);
  }

  /**
   * 前の画面に戻る
   */
  goBack() {
    if (this.history.length > 1 && !this.isTransitioning) {
      this.history.pop(); // 現在の画面を削除
      const previousView = this.history[this.history.length - 1];
      this.transitTo(previousView, true);
    }
  }

  /**
   * トップページに戻る
   */
  goToHome() {
    try {
      const url = new URL('/', window.location.origin);
      window.location.href = url.toString();
    } catch (error) {
      console.error('トップページへの遷移エラー:', error);
      window.location.href = '/';
    }
  }

  /**
   * 画面遷移を実行
   * @param {ViewId} viewId - 遷移先の画面ID
   * @param {boolean} isBack - 戻る操作かどうか
   */
  transitTo(viewId, isBack = false) {
    if (this.isTransitioning || viewId === this.currentView) return;

    const currentElement = document.getElementById(this.currentView);
    const nextElement = document.getElementById(viewId);

    if (!currentElement || !nextElement) {
      console.error('画面要素が見つかりません:', { current: this.currentView, next: viewId });
      return;
    }

    this.isTransitioning = true;

    // 遷移開始のログ
    console.log(`画面遷移: ${this.currentView} -> ${viewId}`);

    // アニメーション設定
    const { DURATION, EASING } = ViewManager.ANIMATION_CONFIG;
    
    // 現在の画面をフェードアウト
    currentElement.style.transition = `opacity ${DURATION}ms ${EASING}`;
    currentElement.style.opacity = '0';

    setTimeout(() => {
      // 画面の表示/非表示を切り替え
      ElementVisibility.toggle(currentElement, nextElement);

      // 次の画面をフェードイン
      nextElement.style.transition = `opacity ${DURATION}ms ${EASING}`;
      nextElement.style.opacity = '1';

      // 履歴の更新
      if (!isBack) {
        this.history.push(viewId);
        window.history.pushState({ view: viewId }, '', `#${viewId}`);
      }

      this.currentView = viewId;
      this.isTransitioning = false;

      // フォーカスを適切な要素に移動
      this.updateFocus(viewId);
    }, DURATION);
  }

  /**
   * フォーカスを適切な要素に移動
   * @param {ViewId} viewId - 画面ID
   * @private
   */
  updateFocus(viewId) {
    const focusMap = {
      [ViewManager.Views.FORM]: 'name',
      [ViewManager.Views.CONFIRMATION]: 'register-btn',
      [ViewManager.Views.COMPLETE]: 'home-btn'
    };

    const elementId = focusMap[viewId];
    if (elementId) {
      const element = document.getElementById(elementId);
      element?.focus();
    }
  }

  /**
   * ブラウザの戻るボタンの処理
   * @private
   */
  handlePopState() {
    const hash = window.location.hash.slice(1);
    const viewId = Object.values(ViewManager.Views).includes(/** @type {ViewId} */ (hash))
      ? /** @type {ViewId} */ (hash)
      : ViewManager.Views.FORM;
    
    this.goBack();
  }

  /**
   * 現在の画面IDを取得
   * @returns {ViewId} 現在の画面ID
   */
  getCurrentView() {
    return this.currentView;
  }

  /**
   * 指定した画面が表示されているかどうかを確認
   * @param {ViewId} viewId - 確認する画面ID
   * @returns {boolean} 表示されているかどうか
   */
  isCurrentView(viewId) {
    return this.currentView === viewId;
  }
}