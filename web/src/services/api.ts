import axios from "axios";
import type {
  Cliente,
  Credito,
  CreditoWithSchedule,
  PaymentSchedule,
  Pago,
  PaginatedResponse,
  APIResponse,
  AnalyticsOverview,
  PaymentsAnalytics,
} from "../types/api";

const API_BASE_URL = "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const clientesApi = {
  getAll: (page = 1, size = 20, search?: string, ciudad?: string) =>
    api.get<PaginatedResponse<Cliente>>("/clientes/", {
      params: { page, size, search, ciudad },
    }),

  getById: (id: number, include_creditos = true) =>
    api.get<Cliente>(`/clientes/${id}`, {
      params: { include_creditos },
    }),
};

export const creditosApi = {
  getAll: (
    page = 1,
    size = 20,
    cliente_id?: number,
    producto?: string,
    estado?: string
  ) =>
    api.get<PaginatedResponse<Credito>>("/creditos/", {
      params: { page, size, cliente_id, producto, estado },
    }),

  getById: (id: number, include_schedule = true, include_payments = true) =>
    api.get<CreditoWithSchedule>(`/creditos/${id}`, {
      params: { include_schedule, include_payments },
    }),

  getSchedule: (id: number, include_payments = true, estado?: string) =>
    api.get<PaymentSchedule[]>(`/creditos/${id}/schedule`, {
      params: { include_payments, estado },
    }),

  getSummary: (id: number) => api.get(`/creditos/${id}/summary`),

  getNextPayment: (id: number) =>
    api.get<PaymentSchedule>(`/creditos/${id}/next-payment`),

  getAnalytics: () =>
    api.get<AnalyticsOverview>("/creditos/analytics/overview"),
};

export const paymentsApi = {
  getAll: (
    page = 1,
    size = 20,
    schedule_id?: number,
    credito_id?: number,
    medio?: string
  ) =>
    api.get<PaginatedResponse<Pago>>("/payments/", {
      params: { page, size, schedule_id, credito_id, medio },
    }),

  create: (data: { schedule_id: number; monto: number; medio?: string }) =>
    api.post<APIResponse<Pago>>("/payments/", data),

  getAnalytics: (credito_id?: number) =>
    api.get<PaymentsAnalytics>("/payments/analytics/summary", {
      params: { credito_id },
    }),

  getOverdue: (days_overdue = 0) =>
    api.get<PaymentSchedule[]>("/payments/overdue", {
      params: { days_overdue },
    }),
};

export const healthApi = {
  check: () => api.get("/health"),
};

export default api;
