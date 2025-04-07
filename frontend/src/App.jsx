import { Outlet } from 'react-router-dom'
import CallManager from './components/video-call/CallManager'

const App = () => {
  return (
    <>
      <CallManager />
      <Outlet />
    </>
  )
}

export default App
