export interface Cliente {
  cliente_id: number;
  tipo_doc: string;
  num_doc: string;
  nombre: string;
  ciudad?: string;
  created_at: string;
}

export interface Credito {
  credito_id: number;
  cliente_id: number;
  producto: "e-bike" | "e-moped";
  inversion: number;
  cuotas_totales: number;
  tea: number;
  fecha_desembolso: string;
  fecha_inicio_pago: string;
  estado: "vigente" | "cancelado" | "castigado";
}

export interface PaymentSchedule {
  schedule_id: number;
  credito_id: number;
  num_cuota: number;
  fecha_vencimiento: string;
  valor_cuota: number;
  estado: "pendiente" | "parcial" | "pagada" | "vencida";
  monto_pagado?: number;
  saldo_pendiente?: number;
  dias_vencimiento?: number;
  pagos?: Pago[];
}

export interface Pago {
  pago_id: number;
  schedule_id: number;
  fecha_pago: string;
  monto: number;
  medio?: "app" | "efectivo" | "link";
}

export interface CreditoSummary {
  credito_id: number;
  producto: string;
  inversion: number;
  cuotas_totales: number;
  cuotas_pagadas: number;
  cuotas_vencidas: number;
  cuotas_pendientes: number;
  monto_pagado: number;
  saldo_pendiente: number;
  estado: string;
}

export interface CreditoWithSchedule extends Credito {
  payment_schedule: PaymentSchedule[];
  summary?: CreditoSummary;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AnalyticsOverview {
  total_creditos: number;
  total_inversion: number;
  creditos_vigentes: number;
  creditos_cancelados: number;
  productos: {
    e_bikes: number;
    e_mopeds: number;
  };
}

export interface PaymentsAnalytics {
  total_payments: number;
  total_amount: number;
  average_amount: number;
  payment_methods: {
    app: number;
    efectivo: number;
    link: number;
  };
}
