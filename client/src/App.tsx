import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import KnowledgeHub from "@/pages/KnowledgeHub";
import Documents from "@/pages/Documents";
import Directory from "@/pages/Directory";
import ProfileDetails from "@/pages/ProfileDetails";
import AppShell from "@/components/AppShell";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <AppShell>
          <Switch>
            <Route path="/login" component={LoginPage} />
            <Route path="/signup" component={SignupPage} />
            <ProtectedRoute path="/" component={Dashboard} />
            <ProtectedRoute path="/knowledge-hub" component={KnowledgeHub} />
            <ProtectedRoute path="/documents" component={Documents} />
            <ProtectedRoute path="/directory" component={Directory} />
            <ProtectedRoute path="/profile" component={ProfileDetails} />
            <Route component={NotFound} />
          </Switch>
        </AppShell>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
