import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { creditosApi } from "../services/api";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

const CreditoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const creditoId = parseInt(id || "0");

  const { data: credito, isLoading } = useQuery({
    queryKey: ["credito", creditoId],
    queryFn: () => creditosApi.getById(creditoId).then((res) => res.data),
    enabled: !!creditoId,
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
      case "pagada":
        return <span className="status-paid">Pagada</span>;
      case "pendiente":
        return <span className="status-pending">Pendiente</span>;
      case "vencida":
        return <span className="status-overdue">Vencida</span>;
      case "parcial":
        return <span className="status-partial">Parcial</span>;
      default:
        return <span className="status-pending">{estado}</span>;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "pagada":
        return "bg-green-50 border-green-200";
      case "vencida":
        return "bg-red-50 border-red-200";
      case "parcial":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-yellow-50 border-yellow-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-roda-lime"></div>
      </div>
    );
  }

  if (!credito) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">
          Crédito no encontrado
        </h2>
        <Link to="/creditos" className="btn-primary mt-4 inline-block">
          Volver a Créditos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/creditos"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a Créditos
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Crédito #{credito.credito_id}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Cronograma de pagos detallado
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información del Crédito
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Producto</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {credito.producto.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Inversión Total
                </p>
                <p className="mt-1 text-lg font-semibold text-roda-lime">
                  {formatCurrency(credito.inversion)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Cuotas Totales
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {credito.cuotas_totales}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">TEA</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {(credito.tea * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Fecha Desembolso
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {new Date(credito.fecha_desembolso).toLocaleDateString(
                    "es-CO"
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Inicio de Pagos
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {new Date(credito.fecha_inicio_pago).toLocaleDateString(
                    "es-CO"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          {credito.summary && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Resumen
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">
                      Cuotas Pagadas
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {credito.summary.cuotas_pagadas}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">
                      Cuotas Pendientes
                    </span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">
                    {credito.summary.cuotas_pendientes}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">
                      Cuotas Vencidas
                    </span>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    {credito.summary.cuotas_vencidas}
                  </span>
                </div>
                <hr />
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">
                      Monto Pagado
                    </span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(credito.summary.monto_pagado)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Saldo Pendiente
                  </span>
                  <span className="text-lg font-bold text-orange-600">
                    {formatCurrency(credito.summary.saldo_pendiente)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Cronograma de Pagos
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Cuota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto Pagado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo Pendiente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Días
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {credito.payment_schedule?.map((payment) => (
                <tr
                  key={payment.schedule_id}
                  className={`${getStatusColor(payment.estado)} border-l-4`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.num_cuota}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.fecha_vencimiento).toLocaleDateString(
                      "es-CO"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(payment.valor_cuota)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(payment.monto_pagado || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(
                      payment.saldo_pendiente || payment.valor_cuota
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.dias_vencimiento !== undefined && (
                      <span
                        className={
                          payment.dias_vencimiento > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {payment.dias_vencimiento > 0
                          ? `+${payment.dias_vencimiento}`
                          : payment.dias_vencimiento}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payment.estado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CreditoDetail;
