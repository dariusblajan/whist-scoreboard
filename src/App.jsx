import { BrowserRouter } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nProvider.jsx'
import { ThemeModeProvider } from './theme/ThemeModeProvider.jsx'
import { GameStoreProvider } from './state/gameStore.jsx'
import { AppRoutes } from './routes.jsx'
import { PwaUpdatePrompt } from './pwa/PwaUpdatePrompt.jsx'

function App() {
  return (
    <I18nProvider>
      <ThemeModeProvider>
        <GameStoreProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppRoutes />
          </BrowserRouter>
          <PwaUpdatePrompt />
        </GameStoreProvider>
      </ThemeModeProvider>
    </I18nProvider>
  )
}

export default App
