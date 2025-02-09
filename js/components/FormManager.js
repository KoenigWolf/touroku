import { FormUtils } from '../utils/dom.js';
import { FormValidator } from './FormValidator.js';

/**
 * フォームデータの型定義
 * @typedef {Object} FormData
 * @property {string} name - 会員名
 * @property {string} furigana - フリガナ
 * @property {string} email - メールアドレス
 * @property {string} phone - 電話番号
 * @property {string} postcode - 郵便番号
 * @property {string} prefecture - 都道府県
 * @property {string} city - 市区町村
 * @property {string} address - 番地・アパート名
 * @property {string} [remarks] - 備考欄
 */

/**
 * フォームの管理を担当するクラス
 */
export class FormManager {
  /**
   * コンストラクタ
   */
  constructor() {
    this.validator = new FormValidator();
    this.formData = null;
    this.isSubmitting = false;
    this.errorTimeout = null;
  }

  /**
   * フォームの初期化
   * @param {Function} onSubmit - フォーム送信時のコールバック
   */
  initialize(onSubmit) {
    this.setupForm(onSubmit);
    this.setupValidation();
    this.setupPrefectures();
  }

  /**
   * フォームのセットアップ
   * @param {Function} onSubmit - フォーム送信時のコールバック
   * @private
   */
  setupForm(onSubmit) {
    const form = document.getElementById('registrationForm');
    if (!form) {
      console.error('フォーム要素が見つかりません');
      return;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (this.isSubmitting) return;

      try {
        this.isSubmitting = true;
        await this.handleSubmit(onSubmit);
      } catch (error) {
        this.handleError(error);
      } finally {
        this.isSubmitting = false;
      }
    });
  }

  /**
   * バリデーションの設定
   * @private
   */
  setupValidation() {
    for (const fieldName of Object.keys(FormValidator.FIELDS)) {
      const input = document.getElementById(fieldName);
      if (!input) continue;

      // 入力時のバリデーション
      input.addEventListener('input', () => {
        this.validator.validateField(fieldName, input.value);
      });

      // フォーカスを失った時のバリデーション
      input.addEventListener('blur', () => {
        this.validator.validateField(fieldName, input.value, true);
      });
    }
  }

  /**
   * 都道府県選択肢の設定
   * @private
   */
  setupPrefectures() {
    const prefectureSelect = document.getElementById('prefecture');
    if (!prefectureSelect) return;

    const prefectures = [
      '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
      '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
      '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
      '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
      '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
      '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
      '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
    ];

    for (const prefecture of prefectures) {
      const option = document.createElement('option');
      option.value = prefecture;
      option.textContent = prefecture;
      prefectureSelect.appendChild(option);
    }
  }

  /**
   * フォームの送信処理
   * @param {Function} onSubmit - フォーム送信時のコールバック
   * @private
   */
  async handleSubmit(onSubmit) {
    const formData = this.getFormData();
    
    // バリデーション
    if (!this.validator.validateForm(formData)) {
      return;
    }

    // フォームデータを保存
    this.formData = formData;

    // コールバックを実行
    if (onSubmit) {
      await onSubmit(formData);
    }
  }

  /**
   * フォームデータの取得
   * @returns {FormData} フォームデータ
   * @private
   */
  getFormData() {
    const formData = {};
    for (const fieldName of Object.keys(FormValidator.FIELDS)) {
      formData[fieldName] = FormUtils.getValue(fieldName);
    }
    return formData;
  }

  /**
   * 確認画面にデータを表示
   */
  displayConfirmation() {
    if (!this.formData) {
      throw new Error('フォームデータが存在しません');
    }

    for (const [fieldName, value] of Object.entries(this.formData)) {
      const element = document.getElementById(`confirm-${fieldName}`);
      if (element) {
        element.textContent = value || '未入力';
      }
    }
  }

  /**
   * フォームをリセット
   */
  resetForm() {
    const form = document.getElementById('registrationForm');
    if (form) {
      form.reset();
    }
    this.validator.clearErrors();
    this.formData = null;
  }

  /**
   * エラー処理
   * @param {Error} error - エラーオブジェクト
   * @private
   */
  handleError(error) {
    console.error('フォームエラー:', error);
    const message = error.message || '予期せぬエラーが発生しました。もう一度お試しください。';
    this.showError(message);
  }

  /**
   * エラーメッセージを表示
   * @param {string} message - エラーメッセージ
   * @private
   */
  showError(message) {
    // 既存のエラーメッセージがあれば削除
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      const existingError = document.querySelector('.Form-Error');
      if (existingError) {
        existingError.remove();
      }
    }

    const errorElement = document.createElement('div');
    errorElement.className = 'Form-Error';
    errorElement.setAttribute('role', 'alert');
    errorElement.textContent = message;
    
    const form = document.getElementById('registrationForm');
    if (form) {
      form.insertBefore(errorElement, form.firstChild);
      
      // 3秒後にエラーメッセージを削除
      this.errorTimeout = setTimeout(() => {
        errorElement.remove();
        this.errorTimeout = null;
      }, 3000);
    }
  }

  /**
   * フォームデータをサーバーに送信
   * @returns {Promise<Object>} 送信結果のPromise
   */
  async submitToServer() {
    if (!this.formData) {
      throw new Error('フォームデータが存在しません');
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(this.formData),
        credentials: 'same-origin'
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'サーバーエラーが発生しました');
      }

      return await response.json();
    } catch (error) {
      console.error('送信エラー:', error);
      throw error;
    }
  }
}