// ドキュメント読み込み後に実行
document.addEventListener('DOMContentLoaded', function() {
  // 各ボタンのイベントリスナーを設定
  document.getElementById('registrationForm').addEventListener('submit', showRegisterConfirmation);
  document.getElementById('back-btn').addEventListener('click', goBackToForm);
  document.getElementById('register-btn').addEventListener('click', completeRegistration);
  document.getElementById('home-btn').addEventListener('click', goToHomePage);
});

/**
 * フォームデータを確認ページに表示する関数
 * @param {Event} event
 */
function showRegisterConfirmation(event) {
  event.preventDefault(); // フォームのデフォルト送信を防ぐ
  const formData = getFormData();
  displayConfirmationData(formData);
  toggleVisibility('register-form', 'register-confirmation');
}

/**
 * フォームの入力データを取得する関数
 * @returns {Object} formData
 */
function getFormData() {
  return {
    name: document.getElementById('name').value,
    furigana: document.getElementById('furigana').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    postcode: document.getElementById('postcode').value,
    prefecture: document.getElementById('prefecture').value,
    city: document.getElementById('city').value,
    address: document.getElementById('address').value,
    remarks: document.getElementById('remarks').value
  };
}

/**
 * 確認ページにデータを表示する関数
 * @param {Object} data
 */
function displayConfirmationData(data) {
  document.getElementById('confirm-name').innerText = data.name;
  document.getElementById('confirm-furigana').innerText = data.furigana;
  document.getElementById('confirm-email').innerText = data.email;
  document.getElementById('confirm-phone').innerText = data.phone;
  document.getElementById('confirm-postcode').innerText = data.postcode;
  document.getElementById('confirm-prefecture').innerText = data.prefecture;
  document.getElementById('confirm-city').innerText = data.city;
  document.getElementById('confirm-address').innerText = data.address;
  document.getElementById('confirm-remarks').innerText = data.remarks;
}

/**
 * 指定された2つの要素の表示を切り替える関数
 * @param {string} hideElementId
 * @param {string} showElementId
 */
function toggleVisibility(hideElementId, showElementId) {
  document.getElementById(hideElementId).classList.add('hidden');
  document.getElementById(showElementId).classList.remove('hidden');
}

/**
 * フォーム画面に戻る関数
 */
function goBackToForm() {
  toggleVisibility('register-confirmation', 'register-form');
}

/**
 * 登録を完了する関数
 */
function completeRegistration() {
  // ここにサーバーへの送信処理を追加する
  // 例えば、fetch APIを使ってサーバーにデータを送信する

  toggleVisibility('register-confirmation', 'register-complete');
}

/**
 * トップページに戻る関数
 */
function goToHomePage() {
  window.location.href = '/';
}
