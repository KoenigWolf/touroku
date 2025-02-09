/**
 * バリデーションルールの型定義
 * @typedef {Object} ValidationRule
 * @property {RegExp} pattern - 検証用の正規表現
 * @property {string} message - エラーメッセージ
 * @property {Function} [normalize] - 入力値の正規化関数
 */

/**
 * バリデーション結果の型定義
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - 検証結果
 * @property {string} message - メッセージ
 * @property {string} [normalizedValue] - 正規化された値
 */

/**
 * バリデーションルール
 * @type {Object.<string, ValidationRule>}
 */
export const ValidationRules = {
  NAME: {
    pattern: /^[ぁ-んァ-ン一-龥a-zA-Z]{1,30}[\s　][ぁ-んァ-ン一-龥a-zA-Z]{1,30}$/,
    message: '姓と名の間にスペースを入れて入力してください',
    normalize: (value) => {
      // 全角スペースを半角に変換
      return value.replace(/　/g, ' ').trim();
    }
  },
  FURIGANA: {
    pattern: /^[ァ-ン]{1,30}[\s　][ァ-ン]{1,30}$/,
    message: '姓と名の間にスペースを入れて、カタカナで入力してください',
    normalize: (value) => {
      // ひらがなをカタカナに変換し、全角スペースを半角に変換
      return value
        .replace(/[ぁ-ん]/g, char => String.fromCharCode(char.charCodeAt(0) + 0x60))
        .replace(/　/g, ' ')
        .trim();
    }
  },
  EMAIL: {
    pattern: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    message: '正しいメールアドレスの形式で入力してください',
    normalize: (value) => {
      // メールアドレスを小文字に変換して空白を除去
      return value.toLowerCase().trim();
    }
  },
  PASSWORD: {
    pattern: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/,
    message: '8文字以上で、大文字・小文字・数字・記号を含めてください',
    normalize: (value) => value
  },
  PHONE: {
    pattern: /^0\d{9,10}$/,
    message: '正しい電話番号の形式で入力してください（ハイフンなし）',
    normalize: (value) => {
      // ハイフンと空白を除去
      return value.replace(/[-\s]/g, '');
    }
  },
  POSTCODE: {
    pattern: /^\d{7}$/,
    message: '7桁の数字で入力してください（ハイフンなし）',
    normalize: (value) => {
      // ハイフンと空白を除去
      return value.replace(/[-\s]/g, '');
    }
  }
};

/**
 * パスワード強度を評価する
 * @param {string} password - パスワード
 * @returns {{score: number, message: string}} 強度評価結果
 */
export const evaluatePasswordStrength = (password) => {
  let score = 0;
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  // 各要件を満たすごとにスコアを加算
  if (requirements.length) score++;
  if (requirements.uppercase) score++;
  if (requirements.lowercase) score++;
  if (requirements.numbers) score++;
  if (requirements.symbols) score++;

  // スコアに応じたメッセージを返す
  const messages = {
    0: '非常に弱い: パスワードの要件を満たしていません',
    1: '弱い: より複雑なパスワードを設定してください',
    2: '普通: まだ改善の余地があります',
    3: '強い: 良好なパスワードです',
    4: '非常に強い: 非常に安全なパスワードです',
    5: '完璧: 最高レベルの安全性です'
  };

  return {
    score,
    message: messages[score]
  };
};

/**
 * 入力値を検証する
 * @param {string} value - 検証する値
 * @param {ValidationRule} rule - 検証ルール
 * @returns {ValidationResult} 検証結果
 */
export const validateValue = (value, rule) => {
  // 値の正規化
  const normalizedValue = rule.normalize ? rule.normalize(value) : value;

  const result = {
    isValid: true,
    message: '',
    normalizedValue
  };

  if (!rule.pattern.test(normalizedValue)) {
    result.isValid = false;
    result.message = rule.message;
  }

  return result;
};

/**
 * 必須項目の検証
 * @param {string} value - 検証する値
 * @returns {ValidationResult} 検証結果
 */
export const validateRequired = (value) => {
  const result = {
    isValid: true,
    message: '',
    normalizedValue: value
  };

  if (!value || value.trim() === '') {
    result.isValid = false;
    result.message = 'この項目は必須です';
  }

  return result;
};

/**
 * 文字数制限の検証
 * @param {string} value - 検証する値
 * @param {number} maxLength - 最大文字数
 * @returns {ValidationResult} 検証結果
 */
export const validateMaxLength = (value, maxLength) => {
  const result = {
    isValid: true,
    message: '',
    normalizedValue: value
  };

  if (value && value.length > maxLength) {
    result.isValid = false;
    result.message = `${maxLength}文字以内で入力してください（現在${value.length}文字）`;
  }

  return result;
};

/**
 * 複合バリデーションを実行
 * @param {string} value - 検証する値
 * @param {Object} options - バリデーションオプション
 * @param {boolean} [options.required] - 必須項目かどうか
 * @param {number} [options.maxLength] - 最大文字数
 * @param {ValidationRule} [options.rule] - バリデーションルール
 * @returns {ValidationResult} 検証結果
 */
export const validateField = (value, options) => {
  // 必須チェック
  if (options.required) {
    const requiredResult = validateRequired(value);
    if (!requiredResult.isValid) {
      return requiredResult;
    }
  }

  // 空値で必須でない場合は検証をスキップ
  if (!value && !options.required) {
    return {
      isValid: true,
      message: '',
      normalizedValue: value
    };
  }

  // 文字数制限チェック
  if (options.maxLength) {
    const maxLengthResult = validateMaxLength(value, options.maxLength);
    if (!maxLengthResult.isValid) {
      return maxLengthResult;
    }
  }

  // パターンチェック
  if (options.rule) {
    return validateValue(value, options.rule);
  }

  return {
    isValid: true,
    message: '',
    normalizedValue: value
  };
};