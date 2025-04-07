import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet-async'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components'

const MainLayout = ({ children }) => {
  return (
    <div className="flex max-h-screen">
      <Helmet>
        <title>Zalo</title>
      </Helmet>
      <Sidebar />
      <main className="w-full overflow-hidden">
        {children}
        <Outlet />
      </main>
    </div>
  )
}

MainLayout.propTypes = {
  children: PropTypes.node,
}

MainLayout.defaultProps = {
  children: null,
}

export default MainLayout
