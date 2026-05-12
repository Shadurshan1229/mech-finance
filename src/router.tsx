import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Auth from '@/pages/Auth'
import Dashboard from '@/pages/Dashboard'
import Transactions from '@/pages/Transactions'
import Budgets from '@/pages/Budgets'
import Accounts from '@/pages/Accounts'
import AccountDetail from '@/pages/AccountDetail'
import CreditCards from '@/pages/CreditCards'
import CreditsDebts from '@/pages/CreditsDebts'
import Goals from '@/pages/Goals'
import Recurring from '@/pages/Recurring'
import Portfolio from '@/pages/Portfolio'
import PortfolioAssetDetail from '@/pages/PortfolioAssetDetail'
import PortfolioLiabilityDetail from '@/pages/PortfolioLiabilityDetail'
import Transfers from '@/pages/Transfers'
import Settings from '@/pages/Settings'

/** App router — protected routes nested under AppLayout (Shell), auth route standalone. */
export const router = createBrowserRouter([
  { path: '/auth', element: <Auth /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/',                          element: <Dashboard /> },
      { path: '/transactions',              element: <Transactions /> },
      { path: '/budgets',                   element: <Budgets /> },
      { path: '/accounts',                  element: <Accounts /> },
      { path: '/accounts/:id',              element: <AccountDetail /> },
      { path: '/credit-cards',             element: <CreditCards /> },
      { path: '/credits-debts',            element: <CreditsDebts /> },
      { path: '/transfers',                element: <Transfers /> },
      { path: '/goals',                     element: <Goals /> },
      { path: '/recurring',                 element: <Recurring /> },
      { path: '/portfolio',                 element: <Portfolio /> },
      { path: '/portfolio/assets/:id',      element: <PortfolioAssetDetail /> },
      { path: '/portfolio/liabilities/:id', element: <PortfolioLiabilityDetail /> },
      { path: '/settings',                  element: <Settings /> },
    ],
  },
])
