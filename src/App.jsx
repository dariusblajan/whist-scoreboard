import { BrowserRouter } from 'react-router-dom'
import { ThemeModeProvider } from './theme/ThemeModeProvider.jsx'
import { AppRoutes } from './routes.jsx'

function App() {
  return (
    <ThemeModeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
    </ThemeModeProvider>
  )
}

export default App
