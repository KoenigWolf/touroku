import { FormManager } from './components/FormManager.js';
import { ViewManager } from './components/ViewManager.js';
import { FormUtils } from './utils/dom.js';

/**
 * アプリケーションのメインクラス
 */
class App {
  /**
   * コンストラクタ
   */
  constructor() {
    this.formManager = new FormManager();
    this.viewManager = new ViewManager();
    this.isInitialized = false;
  }

  /**
   * アプリケーションの初期化
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn('アプリケーションは既に初期化されています');
      return;
    }

    try {
      console.log('アプリケーションの初期化を開始します');

      // ビューマネージャーの初期化
      this.viewManager.initialize();

      // フォームマネージャーの初期化
      this.setupFormManager();

      // エラーハンドリングの設定
      this.setupErrorHandling();

      // ページ遷移の制御
      this.setupPageTransition();

      this.isInitialized = true;
      console.log('アプリケーションの初期化が完了しました');
    } catch (error) {
      console.error('初期化エラー:', error);
      this.showError('アプリケーションの初期化中にエラーが発生しました。');
    }
  }

  /**
   * フォームマネージャーの設定
   * @private
   */
  setupFormManager() {
    this.formManager.initialize(async (formData) => {
      try {
        // 入力内容の確認画面に遷移
        await this.viewManager.goToConfirmation();
        
        // 確認画面にデータを表示
        this.formManager.displayConfirmation();

        // 登録ボタンのイベントリスナーを設定
        this.setupRegisterButton();
      } catch (error) {
        console.error('確認画面表示エラー:', error);
        this.showError('確認画面の表示中にエラーが発生しました。');
      }
    });
  }

  /**
   * 登録ボタンの設定
   * @private
   */
  setupRegisterButton() {
    const registerButton = document.getElementById('register-btn');
    if (!registerButton) return;

    registerButton.addEventListener('click', async () => {
      await this.handleRegistration();
    }, { once: true }); // イベントリスナーは1回だけ実行
  }

  /**
   * ページ遷移の制御設定
   * @private
   */
  setupPageTransition() {
    // ブラウザバック時の処理
    window.addEventListener('popstate', () => {
      const currentView = this.viewManager.getCurrentView();
      
      if (currentView === ViewManager.Views.CONFIRMATION) {
        // 確認画面から戻る場合は入力内容を保持
        this.viewManager.goToForm();
      } else if (currentView === ViewManager.Views.COMPLETE) {
        // 完了画面から戻る場合はリロード
        window.location.reload();
      }
    });

    // 画面を閉じる前の警告
    window.addEventListener('beforeunload', (event) => {
      const currentView = this.viewManager.getCurrentView();
      
      if (currentView === ViewManager.Views.FORM && this.formManager.hasUnsavedChanges()) {
        event.preventDefault();
        event.returnValue = '';
      }
    });
  }

  /**
   * エラーハンドリングの設定
   * @private
   */
  setupErrorHandling() {
    // グローバルエラーハンドリング
    window.addEventListener('error', (event) => {
      console.error('グローバルエラー:', event.error);
      this.showError('予期せぬエラーが発生しました。');
    });

    // Promise エラーハンドリング
    window.addEventListener('unhandledrejection', (event) => {
      console.error('未処理のPromiseエラー:', event.reason);
      this.showError('予期せぬエラーが発生しました。');
    });
  }

  /**
   * 登録処理の実行
   * @private
   */
  async handleRegistration() {
    const registerButton = document.getElementById('register-btn');
    
    try {
      if (registerButton) {
        // ボタンを無効化し、ローディング表示
        FormUtils.disable('register-btn');
        registerButton.classList.add('loading');
      }

      // 少なくとも1秒間はローディングを表示
      await Promise.all([
        this.formManager.submitToServer(),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
      
      // 成功のフィードバック
      const successMessage = document.createElement('div');
      successMessage.className = 'Form-Success';
      successMessage.setAttribute('role', 'alert');
      successMessage.textContent = '登録が完了しました！';
      document.body.appendChild(successMessage);

      // サーバーにデータを送信
      await this.formManager.submitToServer();

      // フォームをリセット
      this.formManager.resetForm();

      // 完了画面に遷移
      await this.viewManager.goToComplete();
    } catch (error) {
      console.error('登録エラー:', error);
      this.showError('登録中にエラーが発生しました。もう一度お試しください。');

      // エラーの詳細に応じてメッセージを設定
      let errorMessage = '登録中にエラーが発生しました。';
      if (error.message.includes('ネットワーク')) {
        errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
      } else if (error.message.includes('タイムアウト')) {
        errorMessage = 'サーバーの応答がありません。しばらく時間をおいて再度お試しください。';
      }
      
      this.showError(errorMessage);

      // 登録ボタンを再度有効化
      if (registerButton) {
        FormUtils.enable('register-btn');
        registerButton.classList.remove('loading');
      }
    }
  }

  /**
   * エラーメッセージの表示
   * @param {string} message - エラーメッセージ
   * @private
   */
  showError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'Form-Error';
    errorContainer.setAttribute('role', 'alert');
    errorContainer.style.position = 'fixed';
    errorContainer.style.top = '20px';
    errorContainer.style.left = '50%';
    errorContainer.style.transform = 'translateX(-50%)';
    errorContainer.style.zIndex = '1000';
    errorContainer.textContent = message;

    document.body.appendChild(errorContainer);

    // エラーメッセージにフォーカスを移動
    errorContainer.focus();

    // 3秒後にエラーメッセージを削除
    setTimeout(() => {
      errorContainer.remove();
    }, 3000);
  }
}

// アプリケーションの起動
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.initialize().catch(error => {
    console.error('起動エラー:', error);
  });
});