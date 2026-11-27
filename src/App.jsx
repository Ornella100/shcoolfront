import { Route, Routes } from 'react-router-dom'

import AppShell from '@/components/layout/AppShell'
import ProtectedRoute from '@/components/ProtectedRoute'
import ParentRoute from '@/components/ParentRoute'
import AdminSchoolsPage from '@/pages/admin/AdminSchoolsPage'
import AttendancePage from '@/pages/AttendancePage'
import AnneesPage from '@/pages/annees/AnneesPage'
import BillingPage from '@/pages/BillingPage'
import DashboardPage from '@/pages/DashboardPage'
import StudentsPage from '@/pages/eleves-classes/StudentsPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ImportPage from '@/pages/ImportPage'
import LoginPage from '@/pages/LoginPage'
import LandingPage from '@/pages/LandingPage'
import MessageDetailPage from '@/pages/MessageDetailPage'
import MessagesPage from '@/pages/MessagesPage'
import ParentsPage from '@/pages/ParentsPage'
import ProfilePage from '@/pages/ProfilePage'
import ResultsPage from '@/pages/ResultsPage'
import TimetablePage from '@/pages/TimetablePage'
import DisciplinePage from '@/pages/DisciplinePage'
import AssignmentsPage from '@/pages/AssignmentsPage'
import ParentPortalPage from '@/pages/ParentPortalPage'
import ReportsPage from '@/pages/ReportsPage'
import FeesPage from '@/pages/FeesPage'
import TeachersPage from '@/pages/TeachersPage'
import RegisterPage from '@/pages/RegisterPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import SuperuserRoute from '@/components/SuperuserRoute'
import TenantRoute from '@/components/TenantRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/connexion" element={<LoginPage />} />
      <Route path="/inscription" element={<RegisterPage />} />
      <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
      <Route path="/reinitialiser-mot-de-passe/:uid/:token" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route element={<TenantRoute />}>
            <Route path="tableau-de-bord" element={<DashboardPage />} />
            <Route path="eleves-classes" element={<StudentsPage />} />
            <Route path="annees" element={<AnneesPage />} />
            <Route path="presences" element={<AttendancePage />} />
            <Route path="notes-bulletins" element={<ResultsPage />} />
            <Route path="emploi-du-temps" element={<TimetablePage />} />
            <Route path="discipline" element={<DisciplinePage />} />
            <Route path="devoirs" element={<AssignmentsPage />} />
            <Route path="rapports" element={<ReportsPage />} />
            <Route path="frais-scolaires" element={<FeesPage />} />
            <Route path="enseignants" element={<TeachersPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="parents" element={<ParentsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="messages/:id" element={<MessageDetailPage />} />
            <Route path="facturation" element={<BillingPage />} />
          </Route>
          <Route element={<ParentRoute />}>
            <Route path="portail-parent" element={<ParentPortalPage />} />
          </Route>
          <Route path="profil" element={<ProfilePage />} />
          <Route element={<SuperuserRoute />}>
            <Route path="admin/ecoles" element={<AdminSchoolsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
