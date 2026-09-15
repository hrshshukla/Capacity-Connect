import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminConsolePage } from "@/pages/admin";
import { AuthPage, PendingPage, ProtectedRoute } from "@/pages/auth";
import { ProfilePage } from "@/pages/profile";
import { Home } from "@/pages/home";
import { Dashboard } from "@/pages/dashboard";
import { Catalog, CourseDetailPage } from "@/pages/courses";
import { LearningPage, LearningExperiencePage } from "@/pages/learning";
import { AssessmentsPage, AssessmentPage, ResultsPage, CertificatesPage } from "@/pages/assessments";
import { CompetenciesPage, RecommendationsPage } from "@/pages/competencies";
import { NotificationsPage } from "@/pages/notifications";
import { TopNav } from "@/components/layout";
import { ArrowRight, CircleAlert } from "lucide-react";
import {
  Link, Route, Switch, Router as WouterRouter, useLocation,
} from "wouter";
import { ReactNode } from "react";
import "./index.css";
import { queryClient } from "@/lib/query-client";
import { SuperAdminPage } from "@/pages/super-admin";
import { AdminAccountSetupPage } from "@/pages/admin-account-setup";
import { TrainerConsolePage, TrainerLibraryForLearnersPage } from "@/pages/trainer";

function NotFound() {
  return (
    <div className="app-shell">
      <TopNav />
      <main className="page-canvas">
        <div className="page-wrap">
          <div className="empty-state" style={{ marginTop: 70 }}>
            <CircleAlert size={30} />
            <div className="eyebrow">404 / out of range</div>
            <h3>This page is not on the map.</h3>
            <p>
              The address may have moved, but your next learning step has not.
            </p>
            <Link
              href="/"
              className="btn btn-dark"
              data-testid="link-not-found-home"
            >
              Return to Capacity Connect <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/admin/account-setup" component={AdminAccountSetupPage} />
        <Route path="/super-admin" component={() => <ProtectedRoute roles={["ADMIN"]}><SuperAdminPage /></ProtectedRoute>} />
        <Route path="/admin/users/pending" component={() => <ProtectedRoute roles={["ADMIN"]}><AdminConsolePage /></ProtectedRoute>} />
        <Route path="/courses" component={Catalog} />
        <Route path="/courses/:id" component={CourseDetailPage} />
        <Route path="/trainee/trainer-library" component={() => <ProtectedRoute roles={["TRAINEE"]}><TrainerLibraryForLearnersPage /></ProtectedRoute>} />
        <Route
          path="/account/profile"
          component={() => (
            <ProtectedRoute allowPending>
              <ProfilePage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/:rest*"
          component={() => (
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminConsolePage />
            </ProtectedRoute>
          )}
        />
        <Route path="/trainer/:rest*" component={() => <ProtectedRoute roles={["TRAINER"]}><TrainerConsolePage /></ProtectedRoute>} />
        <Route
          path="/trainee/dashboard"
          component={() => (
            <ProtectedRoute roles={["TRAINEE"]}>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/trainee/my-courses"
          component={() => (
            <ProtectedRoute roles={["TRAINEE"]}>
              <LearningPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/trainee/my-learning"
          component={() => (
            <ProtectedRoute roles={["TRAINEE"]}>
              <LearningPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/trainee/courses/:courseId"
          component={() => (
            <ProtectedRoute roles={["TRAINEE"]}>
              <LearningExperiencePage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/trainee/assessments"
          component={() => (
            <ProtectedRoute roles={["TRAINEE"]}>
              <AssessmentsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/trainee/assessments/:id"
          component={() => (
            <ProtectedRoute roles={["TRAINEE"]}>
              <AssessmentPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/trainee/results"
          component={() => (
            <ProtectedRoute roles={["TRAINEE"]}>
              <ResultsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/trainee/certificates"
          component={() => (
            <ProtectedRoute roles={["TRAINEE"]}>
              <CertificatesPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/trainee/competencies"
          component={() => (
            <ProtectedRoute roles={["TRAINEE"]}>
              <CompetenciesPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/trainee/recommendations"
          component={() => (
            <ProtectedRoute roles={["TRAINEE"]}>
              <RecommendationsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/trainee/notifications"
          component={() => (
            <ProtectedRoute roles={["TRAINEE"]}>
              <NotificationsPage />
            </ProtectedRoute>
          )}
        />
        <Route path="/not-found" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
