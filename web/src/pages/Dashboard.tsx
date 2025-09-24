import { useQuery } from "@tanstack/react-query";
import { creditosApi, paymentsApi } from "../services/api";
import { TrendingUp, CreditCard, Users, AlertTriangle } from "lucide-react";

const Dashboard = () => {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => creditosApi.getAnalytics().then((res) => res.data),
  });

  const { data: paymentsAnalytics, isLoading: paymentsLoading } = useQuery({
    queryKey: ["paymentsAnalytics"],
    queryFn: () => paymentsApi.getAnalytics().then((res) => res.data),
  });

  const { data: overduePayments } = useQuery({
    queryKey: ["overduePayments"],
    queryFn: () => paymentsApi.getOverdue(1).then((res) => res.data),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      name: "Total Créditos",
      value: analytics?.total_creditos || 0,
      icon: CreditCard,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Total Inversión",
      value: formatCurrency(analytics?.total_inversion || 0),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Créditos Vigentes",
      value: analytics?.creditos_vigentes || 0,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      name: "Pagos Vencidos",
      value: overduePayments?.length || 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  if (analyticsLoading || paymentsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-roda-lime"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Resumen general del sistema de cronogramas de pago
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución por Producto
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">E-Bikes</span>
              <span className="text-lg font-bold text-roda-lime">
                {analytics?.productos.e_bikes || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                E-Mopeds
              </span>
              <span className="text-lg font-bold text-roda-green">
                {analytics?.productos.e_mopeds || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Análisis de Pagos
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Total Pagos
              </span>
              <span className="text-lg font-bold text-blue-600">
                {paymentsAnalytics?.total_payments || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Monto Total
              </span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(paymentsAnalytics?.total_amount || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Promedio por Pago
              </span>
              <span className="text-lg font-bold text-purple-600">
                {formatCurrency(paymentsAnalytics?.average_amount || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {overduePayments && overduePayments.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Pagos Vencidos Recientes
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crédito
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cuota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Días Vencido
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overduePayments.slice(0, 5).map((payment) => (
                  <tr key={payment.schedule_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{payment.credito_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.num_cuota}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.fecha_vencimiento).toLocaleDateString(
                        "es-CO"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(payment.valor_cuota)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="status-overdue">
                        {payment.dias_vencimiento} días
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
