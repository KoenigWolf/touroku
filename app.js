/**
 * フォームバリデーションを行う関数
 * @returns {boolean} フォームが有効な場合true、無効な場合falseを返す
 */
function validateForm() {
    // 必須フィールドのIDリスト
    var fields = ['name', 'furigana', 'email', 'password', 'phone', 'postcode', 'prefecture', 'city', 'address'];

    // 各フィールドをチェック
    for (var i = 0; i < fields.length; i++) {
        var field = document.getElementById(fields[i]).value;
        if (field === "") {
            alert(fields[i] + "を入力してください。");
            return false;  // 無効な場合、フォーム送信を防ぐ
        }
    }
    return true;  // フォームが有効な場合
}

// 他の追加バリデーションが必要な場合、ここに記述
// 例: メールアドレスのフォーマットチェック、パスワードの強度チェックなど
