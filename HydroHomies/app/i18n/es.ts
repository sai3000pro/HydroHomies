import type { PartialTranslations } from "./en"

// Missing keys fall back to English (fallbackLng in ./index.ts)
const es: PartialTranslations = {
  common: {
    ok: "OK",
    cancel: "Cancelar",
    back: "Volver",
    logOut: "Cerrar sesión",
  },
  errorScreen: {
    title: "¡Algo salió mal!",
    friendlySubtitle:
      "Lo sentimos, HydroHype tuvo un error inesperado. Toca abajo para reiniciar la app. Tus bebidas y tu mascota están guardadas.",
    reset: "REINICIA LA APP",
    traceTitle: "Error desde %{name}",
  },
  emptyStateComponent: {
    generic: {
      heading: "Muy vacío... muy triste",
      content:
        "No se han encontrado datos por el momento. Intenta darle clic en el botón para refrescar o recargar la app.",
      button: "Intentemos de nuevo",
    },
  },
  loginScreen: {
    logIn: "Iniciar sesión",
    emailFieldLabel: "Email",
    passwordFieldLabel: "Contraseña",
    emailFieldPlaceholder: "Ingresa tu email",
    passwordFieldPlaceholder: "Contraseña super secreta aquí",
    tapToLogIn: "¡Presiona acá para iniciar sesión!",
  },
}

export default es
