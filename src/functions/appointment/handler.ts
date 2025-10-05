
import { APIGatewayProxyHandler } from 'aws-lambda';
import { AppointmentService } from '../../shared/services/appointment.service';
import { ValidatorUtil, ValidationError } from '../../shared/utils/validator.util';
import { ResponseUtil } from '../../shared/utils/response.util';

const appointmentService = new AppointmentService();


export const main: APIGatewayProxyHandler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const method = event.httpMethod;

  try {
    if (method === 'POST') {
      return await handleCreateAppointment(event);
    }

    if (method === 'GET') {
      return await handleGetAppointments(event);
    }

    return ResponseUtil.badRequest('Method not allowed');
  } catch (error) {
    console.error('Error in appointment handler:', error);
    
    if (error instanceof ValidationError) {
      return ResponseUtil.badRequest(error.message);
    }

    return ResponseUtil.error(
      error instanceof Error ? error.message : 'Internal server error'
    );
  }
};


async function handleCreateAppointment(event: any) {
  if (!event.body) {
    return ResponseUtil.badRequest('Request body is required');
  }

  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (error) {
    return ResponseUtil.badRequest('Invalid JSON in request body');
  }


  const validatedRequest = ValidatorUtil.validateCreateAppointmentRequest(requestBody);


  const appointment = await appointmentService.createAppointment(validatedRequest);

  return ResponseUtil.success(
    {
      appointmentId: appointment.appointmentId,
      status: appointment.status,
      message: 'Appointment request is being processed'
    },
    'Appointment created successfully',
    201
  );
}


async function handleGetAppointments(event: any) {
  const insuredId = event.pathParameters?.insuredId;

  if (!insuredId) {
    return ResponseUtil.badRequest('insuredId path parameter is required');
  }


  ValidatorUtil.validateInsuredId(insuredId);

  const appointments = await appointmentService.getAppointmentsByInsuredId(insuredId);

  return ResponseUtil.success(
    {
      insuredId,
      count: appointments.length,
      appointments: appointments.map(apt => ({
        appointmentId: apt.appointmentId,
        scheduleId: apt.scheduleId,
        countryISO: apt.countryISO,
        status: apt.status,
        createdAt: apt.createdAt,
        updatedAt: apt.updatedAt,
        errorMessage: apt.errorMessage
      }))
    },
    'Appointments retrieved successfully'
  );
}