import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SessionProvider } from "./contexts/SessionContext";
import Home from "./pages/Home";
import Studio from "./pages/Studio";
import Account from "./pages/Account";
import Pricing from "./pages/Pricing";
import Verify from "./pages/Verify";
import QSeal from "./pages/QSeal";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/app"} component={Studio} />
      <Route path={"/account"} component={Account} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/verify"} component={Verify} />
      <Route path={"/qseal"} component={QSeal} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <SessionProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SessionProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
