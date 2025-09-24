import { Link, useLocation } from "react-router-dom";
import { Home, CreditCard, Users, DollarSign } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Créditos", href: "/creditos", icon: CreditCard },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Pagos", href: "/pagos", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-roda-black border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-roda-lime">Roda</h1>
                <span className="ml-2 text-sm text-gray-300">
                  Sistema de cronogramas de pago
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? "border-yellow-400 text-yellow-400"
                          : "border-transparent text-gray-300 hover:border-gray-300 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
