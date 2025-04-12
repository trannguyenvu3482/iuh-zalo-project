import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet-async'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/sidebar/Sidebar'
import ContactSidebar from '../components/sidebar/SidebarContacts'

const MainLayout = ({ children }) => {
  const location = useLocation()

  const isContactsPage = location.pathname.startsWith('/contacts')

  return (
    <div className="flex max-h-screen">
      <Helmet>
        <title>Zalo</title>
      </Helmet>

      {isContactsPage ? <ContactSidebar /> : <Sidebar />}

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