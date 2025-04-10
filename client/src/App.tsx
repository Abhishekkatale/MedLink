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

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <AppShell>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/knowledge-hub" component={KnowledgeHub} />
          <Route path="/documents" component={Documents} />
          <Route path="/directory" component={Directory} />
          <Route path="/profile" component={ProfileDetails} />
          <Route component={NotFound} />
        </Switch>
      </AppShell>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
