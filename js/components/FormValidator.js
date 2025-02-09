import { ValidationRules, validateValue, validateRequired, validateMaxLength } from '../utils/validation.js';
import { FormUtils } from '../utils/dom.js';

/**
 * バリデーションルールの型定義
 * @typedef {Object} ValidationRule
 * @property {boolean} [required] - 必須項目かどうか
 * @property {number} [maxLength] - 最大文字数
 * @property {ValidationRules} [rule] - バリデーションパターン
 * @property {Function} [custom] - カスタムバリデーション関数
 */

/**
 * バリデーション結果の型定義
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - 検証結果
 * @property {string} [message] - エラーメッセージ
 */

/**
 * フォームのバリデーションを管理するクラス
 */
export class FormValidator {
  /**
   * フォームのフィールド定義
   * @type {Object.<string, ValidationRule>}
   */
  static FIELDS = {
    name: {
      required: true,
      maxLength: 30,
      rule: ValidationRules.NAME,
      custom: (value) => {
        // スペースが含まれているか確認
        if (!value.includes(' ')) {
          return {
            isValid: false,
            message: '姓と名の間にスペースを入れてください'
          };
        }
        return { isValid: true };
      }
    },
    furigana: {
      required: true,
      maxLength: 30,
      rule: ValidationRules.FURIGANA,
      custom: (value) => {
        // スペースが含まれているか確認
        if (!value.includes(' ')) {
          return {
            isValid: false,
            message: 'セイとメイの間にスペースを入れてください'
          };
        }
        return { isValid: true };
      }
    },
    email: {
      required: true,
      rule: ValidationRules.EMAIL,
      custom: (value) => {
        // よくある間違いドメインをチェック
        const commonMistakes = {
          'gmail.co.jp': 'gmail.com',
          'yahoo.co.jp': 'yahoo.co.jp',
          'outlook.co.jp': 'outlook.com'
        };
        
        const domain = value.split('@')[1];
        const correctDomain = commonMistakes[domain];
        
        if (correctDomain) {
          return {
            isValid: false,
            message: `もしかして: ${value.split('@')[0]}@${correctDomain}?`
          };
        }
        return { isValid: true };
      }
    },
    password: {
      required: true,
      rule: ValidationRules.PASSWORD,
      custom: (value) => {
        // パスワードの強度チェック
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumbers = /\d/.test(value);
        const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        
        const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSymbols]
          .filter(Boolean).length;
        
        if (strength < 3) {
          return {
            isValid: false,
            message: '大文字、小文字、数字、記号のうち3種類以上を含めてください'
          };
        }
        return { isValid: true };
      }
    },
    phone: {
      required: true,
      rule: ValidationRules.PHONE
    },
    postcode: {
      required: true,
      rule: ValidationRules.POSTCODE,
      custom: async (value) => {
        // 郵便番号の存在チェック（実装例）
        try {
          const response = await fetch(`https://api.zipaddress.net/?zipcode=${value}`);
          const data = await response.json();
          if (!data.success) {
            return {
              isValid: false,
              message: '存在しない郵便番号です'
            };
          }
        } catch {
          // APIエラーの場合は検証をスキップ
          console.warn('郵便番号検証APIにアクセスできません');
        }
        return { isValid: true };
      }
    },
    prefecture: {
      required: true
    },
    city: {
      required: true,
      maxLength: 30
    },
    address: {
      required: true,
      maxLength: 50
    },
    remarks: {
      required: false,
      maxLength: 255
    }
  };

  constructor() {
    /** @type {Object.<string, string[]>} */
    this.errors = {};
    /** @type {Set<string>} */
    this.touchedFields = new Set();
  }

  /**
   * フィールドの値を検証する
   * @param {string} fieldName - フィールド名
   * @param {string} value - 検証する値
   * @param {boolean} [isTouched=false] - フィールドがタッチされたかどうか
   * @returns {Promise<boolean>} 検証結果
   */
  async validateField(fieldName, value, isTouched = false) {
    const field = FormValidator.FIELDS[fieldName];
    if (!field) return true;

    // フィールドがタッチされていない場合はスキップ
    if (!this.touchedFields.has(fieldName) && !isTouched) {
      return true;
    }

    if (isTouched) {
      this.touchedFields.add(fieldName);
    }

    // エラーメッセージをクリア
    FormUtils.hideError(fieldName);
    this.errors[fieldName] = [];

    try {
      // 必須チェック
      if (field.required) {
        const requiredResult = validateRequired(value);
        if (!requiredResult.isValid) {
          this.addError(fieldName, requiredResult.message);
          return false;
        }
      }

      // 空値で必須でない場合はここで検証終了
      if (!value && !field.required) {
        return true;
      }

      // 文字数制限チェック
      if (field.maxLength) {
        const maxLengthResult = validateMaxLength(value, field.maxLength);
        if (!maxLengthResult.isValid) {
          this.addError(fieldName, maxLengthResult.message);
          return false;
        }
      }

      // パターンチェック
      if (field.rule) {
        const patternResult = validateValue(value, field.rule);
        if (!patternResult.isValid) {
          this.addError(fieldName, patternResult.message);
          return false;
        }
      }

      // カスタムバリデーション
      if (field.custom) {
        const customResult = await Promise.resolve(field.custom(value));
        if (!customResult.isValid) {
          this.addError(fieldName, customResult.message);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(`バリデーションエラー (${fieldName}):`, error);
      this.addError(fieldName, '検証中にエラーが発生しました');
      return false;
    }
  }

  /**
   * フォーム全体を検証する
   * @param {Object} formData - フォームデータ
   * @returns {Promise<boolean>} 検証結果
   */
  async validateForm(formData) {
    let isValid = true;
    this.errors = {};

    // 全フィールドをタッチ済みとしてマーク
    for (const fieldName of Object.keys(FormValidator.FIELDS)) {
      this.touchedFields.add(fieldName);
    }

    // 全フィールドを検証
    const validationResults = await Promise.all(
      Object.entries(FormValidator.FIELDS).map(async ([fieldName]) => {
        const value = formData[fieldName];
        const fieldValid = await this.validateField(fieldName, value, true);
        return { fieldName, isValid: fieldValid };
      })
    );

    // 検証結果の集計
    for (const result of validationResults) {
      if (!result.isValid) {
        isValid = false;
      }
    }

    // エラーがある場合は表示
    if (!isValid) {
      this.displayErrors();
    }

    return isValid;
  }

  /**
   * エラーを追加する
   * @param {string} fieldName - フィールド名
   * @param {string} message - エラーメッセージ
   * @private
   */
  addError(fieldName, message) {
    if (!this.errors[fieldName]) {
      this.errors[fieldName] = [];
    }
    this.errors[fieldName].push(message);

    // 入力フィールドにエラークラスを追加
    const input = document.getElementById(fieldName);
    if (input) {
      input.classList.add('error');
    }
  }

  /**
   * エラーを表示する
   * @private
   */
  displayErrors() {
    for (const [fieldName, messages] of Object.entries(this.errors)) {
      if (messages.length > 0) {
        FormUtils.showError(fieldName, messages[0]);
      }
    }
  }

  /**
   * 全てのエラー表示をクリアする
   */
  clearErrors() {
    for (const fieldName of Object.keys(FormValidator.FIELDS)) {
      FormUtils.hideError(fieldName);
      const input = document.getElementById(fieldName);
      if (input) {
        input.classList.remove('error');
      }
    }
    this.errors = {};
    this.touchedFields.clear();
  }

  /**
   * 特定のフィールドのエラーを取得する
   * @param {string} fieldName - フィールド名
   * @returns {string[]} エラーメッセージの配列
   */
  getFieldErrors(fieldName) {
    return this.errors[fieldName] || [];
  }

  /**
   * 全てのエラーを取得する
   * @returns {Object.<string, string[]>} フィールド名をキーとするエラーメッセージの連想配列
   */
  getAllErrors() {
    return { ...this.errors };
  }
}