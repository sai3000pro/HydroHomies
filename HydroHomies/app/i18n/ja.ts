import type { PartialTranslations } from "./en"

// Missing keys fall back to English (fallbackLng in ./index.ts)
const ja: PartialTranslations = {
  common: {
    ok: "OK",
    cancel: "キャンセル",
    back: "戻る",
    logOut: "ログアウト",
  },
  errorScreen: {
    title: "問題が発生しました",
    friendlySubtitle:
      "申し訳ありません。HydroHype で予期しないエラーが発生しました。下をタップしてアプリを再起動してください。記録とペットは保存されています。",
    reset: "リセット",
    traceTitle: "エラーのスタック: %{name}",
  },
  emptyStateComponent: {
    generic: {
      heading: "静かだ...悲しい。",
      content:
        "データが見つかりません。ボタンを押してアプリをリロード、またはリフレッシュしてください。",
      button: "もう一度やってみよう",
    },
  },
  loginScreen: {
    logIn: "ログイン",
    emailFieldLabel: "メールアドレス",
    passwordFieldLabel: "パスワード",
    emailFieldPlaceholder: "メールアドレスを入力してください",
    passwordFieldPlaceholder: "パスワードを入力してください",
    tapToLogIn: "タップしてログインしよう！",
  },
}

export default ja
