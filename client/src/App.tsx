import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { useEffect } from "react";
import { captureAwin } from "./lib/awin";
import { captureRef } from "./lib/ref";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SessionProvider } from "./contexts/SessionContext";
import Home from "./pages/Home";
import Studio from "./pages/Studio";
import Account from "./pages/Account";
import Pricing from "./pages/Pricing";
import Verify from "./pages/Verify";
import QSeal from "./pages/QSeal";
import TripleSeal from "./pages/TripleSeal";
import RemoveBg from "./pages/RemoveBg";
import Developers from "./pages/Developers";
import Affiliates from "./pages/Affiliates";
import About from "./pages/About";
import Partners from "./pages/Partners";
import Authenticity from "./pages/Authenticity";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/app"} component={Studio} />
      <Route path={"/account"} component={Account} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/verify"} component={Verify} />
      <Route path={"/qseal"} component={QSeal} />
      <Route path={"/triple-seal"} component={TripleSeal} />
      <Route path={"/remove-bg"} component={RemoveBg} />
      <Route path={"/developers"} component={Developers} />
      <Route path={"/affiliates"} component={Affiliates} />
      <Route path={"/about"} component={About} />
      <Route path={"/partners"} component={Partners} />
      <Route path={"/authenticity"} component={Authenticity} />
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
  useEffect(() => { captureAwin(); captureRef(); }, []);
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
