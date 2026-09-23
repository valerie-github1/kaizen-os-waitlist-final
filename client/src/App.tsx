import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Legal from "./pages/Legal";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/privacy">{() => <Legal kind="privacy" />}</Route><Route path="/terms">{() => <Legal kind="terms" />}</Route><Route path="/thank-you" component={ThankYou} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
