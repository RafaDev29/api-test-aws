
import { AppointmentService } from '../src/shared/services/appointment.service';
import { DynamoDBRepository } from '../src/shared/repositories/dynamodb.repository';
import { SNSService } from '../src/shared/services/sns.service';
import {
  CountryISO,
  AppointmentStatus,
  CreateAppointmentRequest
} from '../src/shared/interfaces/appointment.interface';

jest.mock('../src/shared/repositories/dynamodb.repository');
jest.mock('../src/shared/services/sns.service');

describe('AppointmentService', () => {
  let appointmentService: AppointmentService;
  let mockDynamoRepository: jest.Mocked<DynamoDBRepository>;
  let mockSNSService: jest.Mocked<SNSService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDynamoRepository = new DynamoDBRepository() as jest.Mocked<DynamoDBRepository>;
    mockSNSService = new SNSService() as jest.Mocked<SNSService>;

    mockDynamoRepository.createAppointment = jest.fn().mockResolvedValue(undefined);
    mockSNSService.publishToCountryTopic = jest.fn().mockResolvedValue('message-id-123');

    appointmentService = new AppointmentService(mockDynamoRepository, mockSNSService);
  });

  describe('createAppointment', () => {
    it('should create appointment successfully for PE', async () => {
      const request: CreateAppointmentRequest = {
        insuredId: '00123',
        scheduleId: 100,
        countryISO: CountryISO.PE
      };

      const result = await appointmentService.createAppointment(request);

      expect(result).toBeDefined();
      expect(result.appointmentId).toBeDefined();
      expect(result.insuredId).toBe('00123');
      expect(result.scheduleId).toBe(100);
      expect(result.countryISO).toBe(CountryISO.PE);
      expect(result.status).toBe(AppointmentStatus.PENDING);

      expect(mockDynamoRepository.createAppointment).toHaveBeenCalledTimes(1);
      expect(mockDynamoRepository.createAppointment).toHaveBeenCalledWith(
        expect.objectContaining({
          insuredId: '00123',
          scheduleId: 100,
          countryISO: CountryISO.PE,
          status: AppointmentStatus.PENDING
        })
      );

      expect(mockSNSService.publishToCountryTopic).toHaveBeenCalledTimes(1);
      expect(mockSNSService.publishToCountryTopic).toHaveBeenCalledWith(
        expect.objectContaining({
          insuredId: '00123',
          scheduleId: 100,
          countryISO: CountryISO.PE
        }),
        CountryISO.PE
      );
    });

    it('should create appointment successfully for CL', async () => {
      const request: CreateAppointmentRequest = {
        insuredId: '99999',
        scheduleId: 200,
        countryISO: CountryISO.CL
      };

      const result = await appointmentService.createAppointment(request);

      expect(result.countryISO).toBe(CountryISO.CL);
      expect(mockSNSService.publishToCountryTopic).toHaveBeenCalledWith(
        expect.any(Object),
        CountryISO.CL
      );
    });

    it('should update status to failed if SNS publish fails', async () => {
      const request: CreateAppointmentRequest = {
        insuredId: '00123',
        scheduleId: 100,
        countryISO: CountryISO.PE
      };

      mockSNSService.publishToCountryTopic = jest.fn().mockRejectedValue(
        new Error('SNS publish failed')
      );
      mockDynamoRepository.updateAppointmentStatus = jest.fn().mockResolvedValue(undefined);

      await expect(appointmentService.createAppointment(request)).rejects.toThrow();

      expect(mockDynamoRepository.updateAppointmentStatus).toHaveBeenCalledWith(
        expect.any(String),
        AppointmentStatus.FAILED,
        'Failed to publish to SNS'
      );
    });
  });

  describe('getAppointmentsByInsuredId', () => {
    it('should return appointments for insuredId', async () => {
      const mockAppointments = [
        {
          appointmentId: 'apt-1',
          insuredId: '00123',
          scheduleId: 100,
          countryISO: CountryISO.PE,
          status: AppointmentStatus.COMPLETED,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      mockDynamoRepository.getAppointmentsByInsuredId = jest.fn().mockResolvedValue(mockAppointments);

      const result = await appointmentService.getAppointmentsByInsuredId('00123');

      expect(result).toEqual(mockAppointments);
      expect(mockDynamoRepository.getAppointmentsByInsuredId).toHaveBeenCalledWith('00123');
    });
  });

  describe('completeAppointment', () => {
    it('should mark appointment as completed', async () => {
      mockDynamoRepository.updateAppointmentStatus = jest.fn().mockResolvedValue(undefined);

      await appointmentService.completeAppointment('apt-123');

      expect(mockDynamoRepository.updateAppointmentStatus).toHaveBeenCalledWith(
        'apt-123',
        AppointmentStatus.COMPLETED
      );
    });
  });

  describe('isValidCountry', () => {
    it('should return true for valid countries', () => {
      expect(appointmentService.isValidCountry('PE')).toBe(true);
      expect(appointmentService.isValidCountry('CL')).toBe(true);
    });

    it('should return false for invalid countries', () => {
      expect(appointmentService.isValidCountry('US')).toBe(false);
      expect(appointmentService.isValidCountry('AR')).toBe(false);
      expect(appointmentService.isValidCountry('')).toBe(false);
    });
  });
});