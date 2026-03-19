import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { VoterPage } from "./pages/VoterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminPanelPage } from "./pages/AdminPanelPage";
import { ResultsPage } from "./pages/ResultsPage";
import { AddCandidatePage } from "./pages/AddCandidatePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ROUTES } from "./routes";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path={ROUTES.HOME} element={<VoterPage />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
          <Route path={ROUTES.ADMIN_PANEL} element={<AdminPanelPage />} />
          <Route path={ROUTES.RESULTS} element={<ResultsPage />} />
          <Route path={ROUTES.ADD_CANDIDATE} element={<AddCandidatePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
