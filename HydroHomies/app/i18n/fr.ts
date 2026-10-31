import type { PartialTranslations } from "./en"

// Missing keys fall back to English (fallbackLng in ./index.ts)
const fr: PartialTranslations = {
  common: {
    ok: "OK !",
    cancel: "Annuler",
    back: "Retour",
    logOut: "Déconnexion",
  },
  errorScreen: {
    title: "Quelque chose s'est mal passé !",
    friendlySubtitle:
      "Désolé, HydroHype a rencontré une erreur inattendue. Touchez ci-dessous pour redémarrer l'application. Vos boissons et votre animal sont enregistrés.",
    reset: "RÉINITIALISER L'APPLICATION",
    traceTitle: "Erreur depuis %{name}",
  },
  emptyStateComponent: {
    generic: {
      heading: "Si vide... si triste",
      content:
        "Aucune donnée trouvée pour le moment. Essayez de cliquer sur le bouton pour rafraîchir ou recharger l'application.",
      button: "Essayons à nouveau",
    },
  },
  loginScreen: {
    logIn: "Se connecter",
    emailFieldLabel: "E-mail",
    passwordFieldLabel: "Mot de passe",
    emailFieldPlaceholder: "Entrez votre adresse e-mail",
    passwordFieldPlaceholder: "Mot de passe super secret ici",
    tapToLogIn: "Appuyez pour vous connecter!",
  },
}

export default fr
