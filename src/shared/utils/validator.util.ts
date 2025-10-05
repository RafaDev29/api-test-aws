
import { CountryISO, CreateAppointmentRequest } from '../interfaces/appointment.interface';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ValidatorUtil {
  static validateCreateAppointmentRequest(data: unknown): CreateAppointmentRequest {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Request body is required');
    }

    const request = data as Partial<CreateAppointmentRequest>;

    // Validate insuredId
    if (!request.insuredId) {
      throw new ValidationError('insuredId is required');
    }

    if (typeof request.insuredId !== 'string') {
      throw new ValidationError('insuredId must be a string');
    }

    if (!/^\d{5}$/.test(request.insuredId)) {
      throw new ValidationError('insuredId must be a 5-digit string');
    }

    // Validate scheduleId
    if (request.scheduleId === undefined || request.scheduleId === null) {
      throw new ValidationError('scheduleId is required');
    }

    if (typeof request.scheduleId !== 'number' || request.scheduleId <= 0) {
      throw new ValidationError('scheduleId must be a positive number');
    }

    // Validate countryISO
    if (!request.countryISO) {
      throw new ValidationError('countryISO is required');
    }

    if (!Object.values(CountryISO).includes(request.countryISO as CountryISO)) {
      throw new ValidationError('countryISO must be either PE or CL');
    }

    return {
      insuredId: request.insuredId,
      scheduleId: request.scheduleId,
      countryISO: request.countryISO as CountryISO
    };
  }

  static validateInsuredId(insuredId: string): void {
    if (!insuredId) {
      throw new ValidationError('insuredId parameter is required');
    }

    if (!/^\d{5}$/.test(insuredId)) {
      throw new ValidationError('insuredId must be a 5-digit string');
    }
  }
}