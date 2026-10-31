import type { PartialTranslations } from "./en"

// Missing keys fall back to English (fallbackLng in ./index.ts)
const hi: PartialTranslations = {
  common: {
    ok: "ठीक है!",
    cancel: "रद्द करें",
    back: "वापस",
    logOut: "लॉग आउट",
  },
  errorScreen: {
    title: "कुछ गलत हो गया!",
    friendlySubtitle:
      "माफ़ करें, HydroHype में एक अनपेक्षित त्रुटि हुई। ऐप फिर से शुरू करने के लिए नीचे टैप करें। आपके ड्रिंक्स और पालतू सुरक्षित हैं।",
    reset: "ऐप रीसेट करें",
    traceTitle: "%{name} स्टैक से त्रुटि",
  },
  emptyStateComponent: {
    generic: {
      heading: "इतना खाली... इतना उदास",
      content: "अभी तक कोई डेटा नहीं मिला। रीफ्रेश करने या ऐप को पुनः लोड करने के लिए बटन दबाएं।",
      button: "चलो फिर से कोशिश करते हैं",
    },
  },
  loginScreen: {
    logIn: "लॉग इन करें",
    emailFieldLabel: "ईमेल",
    passwordFieldLabel: "पासवर्ड",
    emailFieldPlaceholder: "अपना ईमेल पता दर्ज करें",
    passwordFieldPlaceholder: "सुपर सीक्रेट पासवर्ड यहाँ",
    tapToLogIn: "लॉग इन करने के लिए टैप करें!",
  },
}

export default hi
