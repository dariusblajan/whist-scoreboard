import { BrowserRouter } from 'react-router-dom'
import { ThemeModeProvider } from './theme/ThemeModeProvider.jsx'
import { GameStoreProvider } from './state/gameStore.jsx'
import { AppRoutes } from './routes.jsx'
import { PwaUpdatePrompt } from './pwa/PwaUpdatePrompt.jsx'

function App() {
  return (
    <ThemeModeProvider>
      <GameStoreProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppRoutes />
        </BrowserRouter>
        <PwaUpdatePrompt />
      </GameStoreProvider>
    </ThemeModeProvider>
  )
}

export default App
