import type { PartialTranslations } from "./en"

// Missing keys fall back to English (fallbackLng in ./index.ts)
const ko: PartialTranslations = {
  common: {
    ok: "확인!",
    cancel: "취소",
    back: "뒤로",
    logOut: "로그아웃",
  },
  errorScreen: {
    title: "뭔가 잘못되었습니다!",
    friendlySubtitle:
      "죄송합니다. HydroHype에 예기치 않은 오류가 발생했습니다. 아래를 눌러 앱을 다시 시작하세요. 기록과 펫은 저장되어 있습니다.",
    reset: "초기화",
    traceTitle: "%{name} 스택에서의 오류",
  },
  emptyStateComponent: {
    generic: {
      heading: "너무 텅 비어서.. 너무 슬퍼요..",
      content: "데이터가 없습니다. 버튼을 눌러서 리프레쉬 하시거나 앱을 리로드하세요.",
      button: "다시 시도해봅시다",
    },
  },
  loginScreen: {
    logIn: "로그인",
    emailFieldLabel: "이메일",
    passwordFieldLabel: "비밀번호",
    emailFieldPlaceholder: "이메일을 입력하세요",
    passwordFieldPlaceholder: "엄청 비밀스러운 암호를 입력하세요",
    tapToLogIn: "눌러서 로그인 하기!",
  },
}

export default ko
