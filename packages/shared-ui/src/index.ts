export { ApiUrlProvider, useApiUrl } from './config/ApiUrlContext'
export { AuthProvider, useAuth, type AuthUser } from './auth/AuthContext'
export { ProtectedRoute } from './auth/ProtectedRoute'
export { PopupProvider } from './popup/PopupProvider'
export { useShowPopup } from './popup/useShowPopup'
export { ErrorReporterProvider, useErrorReporter } from './errorLog/ErrorReporterProvider'
export { createErrorReporter, ERROR_LOG_PATH, type ErrorReport } from './errorLog/errorReporter'
export { ThemeProvider } from './theme/ThemeProvider'
export { workbenchPalette as defaultPalette } from './theme/palette'
export { popupMessages, SITE_CLOSED_MESSAGE } from './popup/messages'

export {
  Modal,
  openModal,
  closeModal,
  ColorPicker,
  ColorField,
  ConfirmDeleteButton,
  Button,
  NavBar,
  PageStatus,
  useTheme,
  ThemeSelect,
  createLocalThemeStore,
  createHttpThemeStore,
  serializeColors,
  parseColors,
  isHexColor,
  randomHex,
  fetchJson,
  useDocumentTitle,
  useAsync,
  useElementSize,
  useClickOutside,
  useEscapeKey,
  type ButtonVariant,
  type LoadStatus,
  type AsyncStatus,
  type AsyncResult,
  type ElementSize,
  type ThemeColors,
  type ThemeDefinition,
  type ThemeCatalog,
  type ThemeDraft,
  type ThemeStore,
  type PopupMessages,
} from '@-reddacted-/react-ui'
