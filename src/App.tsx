import { AppProvider, useApp } from "./context/AppContext";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { LostAndFoundBoard } from "./components/LostAndFoundBoard";
import { ReportItemForm } from "./components/ReportItemForm";
import { ClaimItemForm } from "./components/ClaimItemForm";
import { AdminDashboard } from "./components/AdminDashboard";
import { ProfilePage } from "./components/ProfilePage";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Toaster } from "./components/ui/sonner";

function AppContent() {
  const { currentPage, currentUser } = useApp();

  const renderPage = () => {
    if (!currentUser) {
      switch (currentPage) {
        case "login":
          return <LoginPage />;
        case "register":
          return <RegisterPage />;
        case "forgot-password":
          return <ForgotPasswordPage />;
        default:
          return <LandingPage />;
      }
    }

    if (currentUser.role === "admin") {
      switch (currentPage) {
        case "admin-dashboard":
          return <AdminDashboard />;
        default:
          return <AdminDashboard />;
      }
    }

    switch (currentPage) {
      case "board":
        return <LostAndFoundBoard />;
      case "report":
        return <ReportItemForm />;
      case "claim":
        return <ClaimItemForm />;
      case "profile":
        return <ProfilePage />;
      default:
        return <LostAndFoundBoard />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {currentUser && <Header />}
      <main className="flex-1">{renderPage()}</main>
      {currentUser && <Footer />}
      <Toaster position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}