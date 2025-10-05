
import { SQSHandler } from 'aws-lambda';
import { RDSRepository } from '../../shared/repositories/rds.repository';
import { EventBridgeService } from '../../shared/services/eventbridge.service';
import {
  SNSMessage,
  AppointmentRDS,
  AppointmentStatus,
  EventBridgeMessage,
  CountryISO
} from '../../shared/interfaces/appointment.interface';

const rdsRepository = new RDSRepository();
const eventBridgeService = new EventBridgeService();


export const main: SQSHandler = async (event) => {
  console.log('PE - Processing appointment requests:', JSON.stringify(event, null, 2));

  const successfulMessages: string[] = [];
  const failedMessages: string[] = [];

  for (const record of event.Records) {
    try {
      const snsMessage = JSON.parse(record.body);
      const message: SNSMessage = JSON.parse(snsMessage.Message);

      console.log('PE - Processing appointment:', message.appointmentId);

      await processAppointmentPE(message);

      const eventMessage: EventBridgeMessage = {
        appointmentId: message.appointmentId,
        status: AppointmentStatus.COMPLETED,
        countryISO: CountryISO.PE,
        processedAt: new Date().toISOString()
      };

      await eventBridgeService.publishAppointmentProcessed(eventMessage);

      successfulMessages.push(message.appointmentId);
      console.log(`PE - Appointment ${message.appointmentId} processed successfully`);
    } catch (error) {
      console.error('PE - Error processing appointment:', error);
      console.error('Record:', JSON.stringify(record, null, 2));
      failedMessages.push(record.messageId);

      try {
        const snsMessage = JSON.parse(record.body);
        const message: SNSMessage = JSON.parse(snsMessage.Message);

        const eventMessage: EventBridgeMessage = {
          appointmentId: message.appointmentId,
          status: AppointmentStatus.FAILED,
          countryISO: CountryISO.PE,
          processedAt: new Date().toISOString()
        };

        await eventBridgeService.publishAppointmentProcessed(eventMessage);
      } catch (publishError) {
        console.error('PE - Error publishing failure event:', publishError);
      }
    }
  }

  console.log(`PE - Processing complete. Success: ${successfulMessages.length}, Failed: ${failedMessages.length}`);

  if (failedMessages.length > 0) {
    throw new Error(`PE - Failed to process ${failedMessages.length} messages`);
  }
};


async function processAppointmentPE(message: SNSMessage): Promise<void> {
  console.log('PE - Saving appointment to RDS:', message.appointmentId);


  const scheduleDetails = getScheduleDetails(message.scheduleId);

  const appointmentRDS: AppointmentRDS = {
    appointmentId: message.appointmentId,
    insuredId: message.insuredId,
    scheduleId: message.scheduleId,
    centerId: scheduleDetails.centerId,
    specialtyId: scheduleDetails.specialtyId,
    medicId: scheduleDetails.medicId,
    appointmentDate: scheduleDetails.appointmentDate,
    status: AppointmentStatus.COMPLETED
  };

  await rdsRepository.createAppointment(appointmentRDS);


  console.log('PE - Applying Peru-specific business rules...');
 
  console.log('PE - Appointment saved successfully in RDS');
}


function getScheduleDetails(scheduleId: number) {
  return {
    centerId: 1,
    specialtyId: 2,
    medicId: 3,
    appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}