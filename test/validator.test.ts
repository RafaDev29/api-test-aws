
import { ValidatorUtil, ValidationError } from '../src/shared/utils/validator.util';
import { CountryISO } from '../src/shared/interfaces/appointment.interface';

describe('ValidatorUtil', () => {
  describe('validateCreateAppointmentRequest', () => {
    it('should validate a correct request', () => {
      const validRequest = {
        insuredId: '00123',
        scheduleId: 100,
        countryISO: 'PE'
      };

      const result = ValidatorUtil.validateCreateAppointmentRequest(validRequest);

      expect(result).toEqual({
        insuredId: '00123',
        scheduleId: 100,
        countryISO: CountryISO.PE
      });
    });

    it('should throw error if request body is null', () => {
      expect(() => {
        ValidatorUtil.validateCreateAppointmentRequest(null);
      }).toThrow(ValidationError);
      
      expect(() => {
        ValidatorUtil.validateCreateAppointmentRequest(null);
      }).toThrow('Request body is required');
    });

    it('should throw error if insuredId is missing', () => {
      const invalidRequest = {
        scheduleId: 100,
        countryISO: 'PE'
      };

      expect(() => {
        ValidatorUtil.validateCreateAppointmentRequest(invalidRequest);
      }).toThrow('insuredId is required');
    });

    it('should throw error if insuredId is not 5 digits', () => {
      const invalidRequest = {
        insuredId: '123',
        scheduleId: 100,
        countryISO: 'PE'
      };

      expect(() => {
        ValidatorUtil.validateCreateAppointmentRequest(invalidRequest);
      }).toThrow('insuredId must be a 5-digit string');
    });

    it('should throw error if scheduleId is missing', () => {
      const invalidRequest = {
        insuredId: '00123',
        countryISO: 'PE'
      };

      expect(() => {
        ValidatorUtil.validateCreateAppointmentRequest(invalidRequest);
      }).toThrow('scheduleId is required');
    });

    it('should throw error if scheduleId is not a positive number', () => {
      const invalidRequest = {
        insuredId: '00123',
        scheduleId: -1,
        countryISO: 'PE'
      };

      expect(() => {
        ValidatorUtil.validateCreateAppointmentRequest(invalidRequest);
      }).toThrow('scheduleId must be a positive number');
    });

    it('should throw error if countryISO is missing', () => {
      const invalidRequest = {
        insuredId: '00123',
        scheduleId: 100
      };

      expect(() => {
        ValidatorUtil.validateCreateAppointmentRequest(invalidRequest);
      }).toThrow('countryISO is required');
    });

    it('should throw error if countryISO is invalid', () => {
      const invalidRequest = {
        insuredId: '00123',
        scheduleId: 100,
        countryISO: 'US'
      };

      expect(() => {
        ValidatorUtil.validateCreateAppointmentRequest(invalidRequest);
      }).toThrow('countryISO must be either PE or CL');
    });

    it('should accept CL as valid country', () => {
      const validRequest = {
        insuredId: '99999',
        scheduleId: 200,
        countryISO: 'CL'
      };

      const result = ValidatorUtil.validateCreateAppointmentRequest(validRequest);

      expect(result.countryISO).toBe(CountryISO.CL);
    });
  });

  describe('validateInsuredId', () => {
    it('should validate correct insuredId', () => {
      expect(() => {
        ValidatorUtil.validateInsuredId('00123');
      }).not.toThrow();
    });

    it('should throw error if insuredId is empty', () => {
      expect(() => {
        ValidatorUtil.validateInsuredId('');
      }).toThrow('insuredId parameter is required');
    });

    it('should throw error if insuredId format is invalid', () => {
      expect(() => {
        ValidatorUtil.validateInsuredId('ABC12');
      }).toThrow('insuredId must be a 5-digit string');
    });
  });
});