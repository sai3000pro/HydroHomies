import type { PartialTranslations } from "./en"

// Missing keys fall back to English (fallbackLng in ./index.ts)
const ar: PartialTranslations = {
  common: {
    ok: "نعم",
    cancel: "حذف",
    back: "خلف",
    logOut: "تسجيل خروج",
  },
  errorScreen: {
    title: "هناك خطأ ما",
    friendlySubtitle:
      "عذرًا، حدث خطأ غير متوقع في HydroHype. اضغط أدناه لإعادة تشغيل التطبيق. مشروباتك وحيوانك الأليف محفوظة.",
    reset: "اعادة تعيين التطبيق",
    traceTitle: "خطأ من مجموعة %{name}",
  },
  emptyStateComponent: {
    generic: {
      heading: "فارغة جداً....حزين",
      content: "لا توجد بيانات حتى الآن. حاول النقر فوق الزر لتحديث التطبيق او اعادة تحميله.",
      button: "لنحاول هذا مرّة أخرى",
    },
  },
  loginScreen: {
    logIn: "تسجيل الدخول",
    emailFieldLabel: "البريد الالكتروني",
    passwordFieldLabel: "كلمة السر",
    emailFieldPlaceholder: "ادخل بريدك الالكتروني",
    passwordFieldPlaceholder: "كلمة السر هنا فائقة السر",
    tapToLogIn: "انقر لتسجيل الدخول!",
  },
}

export default ar
