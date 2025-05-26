import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet-async'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar'
import { useAuth } from '../hooks/useAuth'

const MainLayout = ({ children }) => {
  const { user } = useAuth()
  return (
    <>
      <Helmet>
        <title>{`Zalo - ${user?.fullName}`}</title>
      </Helmet>
      <div className="flex max-h-screen">
        <Sidebar />

        <main className="w-full overflow-hidden">
          {children}
          <Outlet />
        </main>
      </div>
    </>
  )
}

MainLayout.propTypes = {
  children: PropTypes.node,
}

MainLayout.defaultProps = {
  children: null,
}

export default MainLayout
