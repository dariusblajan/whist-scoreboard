import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout.jsx'
import { Home } from './screens/Home.jsx'
import { NewGame } from './screens/NewGame.jsx'
import { HandPlay } from './screens/HandPlay.jsx'
import { Scoreboard } from './screens/Scoreboard.jsx'
import { GameOver } from './screens/GameOver.jsx'
import { PrintScoreboard } from './screens/PrintScoreboard/PrintScoreboard.jsx'

export function AppRoutes() {
  return (
    <Routes>
      {/* No AppLayout: the print sheet is self-contained, with none of the app chrome. */}
      <Route path="print" element={<PrintScoreboard />} />
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="new" element={<NewGame />} />
        <Route path="play" element={<HandPlay />} />
        <Route path="scoreboard" element={<Scoreboard />} />
        <Route path="over" element={<GameOver />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
