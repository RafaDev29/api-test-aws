

export enum CountryISO {
  PE = 'PE',
  CL = 'CL'
}

export enum AppointmentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface CreateAppointmentRequest {
  insuredId: string;
  scheduleId: number;
  countryISO: CountryISO;
}

export interface AppointmentDynamoDB {
  appointmentId: string;
  insuredId: string;
  scheduleId: number;
  countryISO: CountryISO;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

export interface AppointmentRDS {
  id?: number;
  appointmentId: string;
  insuredId: string;
  scheduleId: number;
  centerId?: number;
  specialtyId?: number;
  medicId?: number;
  appointmentDate?: string;
  status: AppointmentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SNSMessage {
  appointmentId: string;
  insuredId: string;
  scheduleId: number;
  countryISO: CountryISO;
}

export interface EventBridgeMessage {
  appointmentId: string;
  status: AppointmentStatus;
  countryISO: CountryISO;
  processedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}