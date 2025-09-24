import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "../services/api";
import { DollarSign, Filter, ChevronLeft, ChevronRight } from "lucide-react";

const Pagos = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    medio: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["pagos", page, filters],
    queryFn: () =>
      paymentsApi
        .getAll(page, 20, undefined, undefined, filters.medio || undefined)
        .then((res) => res.data),
  });

  const { data: analytics } = useQuery({
    queryKey: ["paymentsAnalytics"],
    queryFn: () => paymentsApi.getAnalytics().then((res) => res.data),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMedioBadge = (medio?: string) => {
    if (!medio) return <span className="status-pending">N/A</span>;

    switch (medio) {
      case "app":
        return (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            App
          </span>
        );
      case "efectivo":
        return (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            Efectivo
          </span>
        );
      case "link":
        return (
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
            Link
          </span>
        );
      default:
        return <span className="status-pending">{medio}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-roda-lime"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pagos</h1>
        <p className="mt-2 text-sm text-gray-600">
          Registro de pagos realizados
        </p>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pagos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.total_payments}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monto Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.total_amount)}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.average_amount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>

          <select
            value={filters.medio}
            onChange={(e) => setFilters({ ...filters, medio: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-roda-lime focus:border-roda-lime"
          >
            <option value="">Todos los medios</option>
            <option value="app">App</option>
            <option value="efectivo">Efectivo</option>
            <option value="link">Link</option>
          </select>

          {filters.medio && (
            <button
              onClick={() => setFilters({ medio: "" })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.items.map((pago) => (
                <tr key={pago.pago_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{pago.pago_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(pago.fecha_pago).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatCurrency(pago.monto)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getMedioBadge(pago.medio)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    #{pago.schedule_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{" "}
                  <span className="font-medium">{(page - 1) * 20 + 1}</span> a{" "}
                  <span className="font-medium">
                    {Math.min(page * 20, data.total)}
                  </span>{" "}
                  de <span className="font-medium">{data.total}</span>{" "}
                  resultados
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-none focus:ring-2 focus:ring-roda-lime disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                    {page} de {data.pages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!data.has_next}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-none focus:ring-2 focus:ring-roda-lime disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagos;
