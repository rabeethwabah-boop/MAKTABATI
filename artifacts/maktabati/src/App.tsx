import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import LevelPage from "@/pages/level";
import GradePage from "@/pages/grade";
import GradeBooksPage from "@/pages/grade-books";
import SubjectPage from "@/pages/subject";
import BookViewerPage from "@/pages/book-viewer";
import GradeUploadPage from "@/pages/grade-upload";
import AppLayout from "@/components/layout/AppLayout";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/book/:id" component={BookViewerPage} />
      <Route>
        <AppLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/level/:id" component={LevelPage} />
            <Route path="/grade/:id" component={GradePage} />
            <Route path="/grade/:id/books" component={GradeBooksPage} />
            <Route path="/grade/:id/upload" component={GradeUploadPage} />
            <Route path="/subject/:id" component={SubjectPage} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
