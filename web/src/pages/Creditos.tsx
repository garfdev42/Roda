import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { creditosApi } from "../services/api";
import { Eye, Filter, ChevronLeft, ChevronRight } from "lucide-react";

const Creditos = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    producto: "",
    estado: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["creditos", page, filters],
    queryFn: () =>
      creditosApi
        .getAll(
          page,
          20,
          undefined,
          filters.producto || undefined,
          filters.estado || undefined
        )
        .then((res) => res.data),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "vigente":
        return <span className="status-paid">Vigente</span>;
      case "cancelado":
        return <span className="status-overdue">Cancelado</span>;
      case "castigado":
        return <span className="status-overdue">Castigado</span>;
      default:
        return <span className="status-pending">{estado}</span>;
    }
  };

  const getProductBadge = (producto: string) => {
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          producto === "e-bike"
            ? "bg-blue-100 text-blue-800"
            : "bg-purple-100 text-purple-800"
        }`}
      >
        {producto.toUpperCase()}
      </span>
    );
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Créditos</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestión de créditos para e-bikes y e-mopeds
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>

          <select
            value={filters.producto}
            onChange={(e) =>
              setFilters({ ...filters, producto: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-roda-lime focus:border-roda-lime"
          >
            <option value="">Todos los productos</option>
            <option value="e-bike">E-Bike</option>
            <option value="e-moped">E-Moped</option>
          </select>

          <select
            value={filters.estado}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-roda-lime focus:border-roda-lime"
          >
            <option value="">Todos los estados</option>
            <option value="vigente">Vigente</option>
            <option value="cancelado">Cancelado</option>
            <option value="castigado">Castigado</option>
          </select>

          {(filters.producto || filters.estado) && (
            <button
              onClick={() => setFilters({ producto: "", estado: "" })}
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
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inversión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuotas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TEA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inicio Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.items.map((credito) => (
                <tr key={credito.credito_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{credito.credito_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getProductBadge(credito.producto)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(credito.inversion)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {credito.cuotas_totales}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(credito.tea * 100).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(credito.fecha_inicio_pago).toLocaleDateString(
                      "es-CO"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(credito.estado)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/creditos/${credito.credito_id}`}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-roda-black bg-roda-lime hover:bg-roda-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-roda-lime"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Cronograma
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!data.has_next}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
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
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
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

export default Creditos;
