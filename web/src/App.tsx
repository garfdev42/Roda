import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Creditos from "./pages/Creditos";
import CreditoDetail from "./pages/CreditoDetail";
import Clientes from "./pages/Clientes";
import Pagos from "./pages/Pagos";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/creditos" element={<Creditos />} />
            <Route path="/creditos/:id" element={<CreditoDetail />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/pagos" element={<Pagos />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
