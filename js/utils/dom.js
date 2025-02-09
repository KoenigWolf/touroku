/**
 * DOM操作用ユーティリティ関数群
 */

/**
 * アニメーションの設定
 * @type {Object}
 */
const ANIMATION_CONFIG = {
  DURATION: 300,
  EASING: 'ease-in-out',
  FADE_CLASS: 'fade'
};

/**
 * DOMエラーをハンドリングするクラス
 */
class DOMError extends Error {
  constructor(message, elementId) {
    super(message);
    this.name = 'DOMError';
    this.elementId = elementId;
  }
}

/**
 * 要素のclass属性を操作する
 */
export const ElementClass = {
  /**
   * 要素にクラスを追加
   * @param {HTMLElement} element - 対象要素
   * @param {string|string[]} className - 追加するクラス名
   * @throws {DOMError} 要素が存在しない場合
   */
  add(element, className) {
    if (!element) {
      throw new DOMError('要素が見つかりません', element?.id);
    }
    const classes = Array.isArray(className) ? className : [className];
    element.classList.add(...classes);
  },

  /**
   * 要素からクラスを削除
   * @param {HTMLElement} element - 対象要素
   * @param {string|string[]} className - 削除するクラス名
   * @throws {DOMError} 要素が存在しない場合
   */
  remove(element, className) {
    if (!element) {
      throw new DOMError('要素が見つかりません', element?.id);
    }
    const classes = Array.isArray(className) ? className : [className];
    element.classList.remove(...classes);
  },

  /**
   * 要素のクラスの有無を切り替え
   * @param {HTMLElement} element - 対象要素
   * @param {string} className - 切り替えるクラス名
   * @param {boolean} [force] - 強制的に設定する値
   * @throws {DOMError} 要素が存在しない場合
   */
  toggle(element, className, force) {
    if (!element) {
      throw new DOMError('要素が見つかりません', element?.id);
    }
    element.classList.toggle(className, force);
  },

  /**
   * 要素が特定のクラスを持っているか確認
   * @param {HTMLElement} element - 対象要素
   * @param {string} className - 確認するクラス名
   * @returns {boolean} クラスを持っているかどうか
   */
  has(element, className) {
    return element?.classList.contains(className) ?? false;
  }
};

/**
 * 要素の表示/非表示を制御する
 */
export const ElementVisibility = {
  /**
   * 要素を表示する
   * @param {HTMLElement} element - 対象要素
   * @param {Object} [options] - オプション
   * @param {boolean} [options.animate=true] - アニメーションを使用するかどうか
   * @returns {Promise<void>}
   */
  async show(element, options = { animate: true }) {
    if (!element) return;

    if (options.animate) {
      element.style.opacity = '0';
      ElementClass.remove(element, 'hidden');
      
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          element.style.transition = `opacity ${ANIMATION_CONFIG.DURATION}ms ${ANIMATION_CONFIG.EASING}`;
          element.style.opacity = '1';
          setTimeout(resolve, ANIMATION_CONFIG.DURATION);
        });
      });
    } else {
      ElementClass.remove(element, 'hidden');
    }

    element.setAttribute('aria-hidden', 'false');
  },

  /**
   * 要素を非表示にする
   * @param {HTMLElement} element - 対象要素
   * @param {Object} [options] - オプション
   * @param {boolean} [options.animate=true] - アニメーションを使用するかどうか
   * @returns {Promise<void>}
   */
  async hide(element, options = { animate: true }) {
    if (!element) return;

    if (options.animate) {
      element.style.transition = `opacity ${ANIMATION_CONFIG.DURATION}ms ${ANIMATION_CONFIG.EASING}`;
      element.style.opacity = '0';
      
      await new Promise(resolve => setTimeout(resolve, ANIMATION_CONFIG.DURATION));
      ElementClass.add(element, 'hidden');
    } else {
      ElementClass.add(element, 'hidden');
    }

    element.setAttribute('aria-hidden', 'true');
  },

  /**
   * 要素の表示/非表示を切り替える
   * @param {HTMLElement} hideElement - 非表示にする要素
   * @param {HTMLElement} showElement - 表示する要素
   * @param {Object} [options] - オプション
   * @param {boolean} [options.animate=true] - アニメーションを使用するかどうか
   * @returns {Promise<void>}
   */
  async toggle(hideElement, showElement, options = { animate: true }) {
    if (!hideElement || !showElement) return;

    await Promise.all([
      this.hide(hideElement, options),
      this.show(showElement, options)
    ]);
  }
};

/**
 * フォーム要素を操作する
 */
export const FormUtils = {
  /**
   * フォーム要素の値を取得
   * @param {string} id - 要素のID
   * @returns {string} 要素の値
   * @throws {DOMError} 要素が存在しない場合
   */
  getValue(id) {
    const element = document.getElementById(id);
    if (!element) {
      throw new DOMError(`要素が見つかりません: ${id}`, id);
    }
    return element.value;
  },

  /**
   * フォーム要素の値を設定
   * @param {string} id - 要素のID
   * @param {string} value - 設定する値
   * @throws {DOMError} 要素が存在しない場合
   */
  setValue(id, value) {
    const element = document.getElementById(id);
    if (!element) {
      throw new DOMError(`要素が見つかりません: ${id}`, id);
    }
    element.value = value;

    // 入力イベントを発火させる
    const event = new Event('input', { bubbles: true });
    element.dispatchEvent(event);
  },

  /**
   * フォーム要素の値をクリア
   * @param {string} id - 要素のID
   */
  clearValue(id) {
    try {
      this.setValue(id, '');
    } catch (error) {
      console.warn(`値のクリアに失敗しました: ${id}`, error);
    }
  },

  /**
   * エラーメッセージを表示
   * @param {string} id - 要素のID
   * @param {string} message - エラーメッセージ
   */
  showError(id, message) {
    const errorElement = document.getElementById(`${id}-error`);
    const inputElement = document.getElementById(id);

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      errorElement.setAttribute('role', 'alert');
    }

    if (inputElement) {
      inputElement.setAttribute('aria-invalid', 'true');
      inputElement.classList.add('error');
    }
  },

  /**
   * エラーメッセージを非表示
   * @param {string} id - 要素のID
   */
  hideError(id) {
    const errorElement = document.getElementById(`${id}-error`);
    const inputElement = document.getElementById(id);

    if (errorElement) {
      errorElement.style.display = 'none';
      errorElement.removeAttribute('role');
    }

    if (inputElement) {
      inputElement.removeAttribute('aria-invalid');
      inputElement.classList.remove('error');
    }
  },

  /**
   * フォーム要素を無効化
   * @param {string} id - 要素のID
   */
  disable(id) {
    const element = document.getElementById(id);
    if (element) {
      element.disabled = true;
      element.setAttribute('aria-disabled', 'true');
    }
  },

  /**
   * フォーム要素を有効化
   * @param {string} id - 要素のID
   */
  enable(id) {
    const element = document.getElementById(id);
    if (element) {
      element.disabled = false;
      element.removeAttribute('aria-disabled');
    }
  },

  /**
   * フォームの送信を制御
   * @param {HTMLFormElement} form - フォーム要素
   * @param {Function} callback - 送信時のコールバック
   */
  handleSubmit(form, callback) {
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      try {
        await callback(event);
      } catch (error) {
        console.error('フォーム送信エラー:', error);
      }
    });
  }
};