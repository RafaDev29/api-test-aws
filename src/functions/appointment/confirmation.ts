
import { SQSHandler } from 'aws-lambda';
import { AppointmentService } from '../../shared/services/appointment.service';
import { EventBridgeMessage, AppointmentStatus } from '../../shared/interfaces/appointment.interface';

const appointmentService = new AppointmentService();

export const handler: SQSHandler = async (event) => {
  console.log('Confirmation event received:', JSON.stringify(event, null, 2));

  const successfulMessages: string[] = [];
  const failedMessages: string[] = [];

  for (const record of event.Records) {
    try {

      const eventBridgeEvent = JSON.parse(record.body);
      const message: EventBridgeMessage = JSON.parse(eventBridgeEvent.detail);

      console.log('Processing confirmation for appointment:', message.appointmentId);


      if (message.status === AppointmentStatus.COMPLETED) {
        await appointmentService.completeAppointment(message.appointmentId);
        successfulMessages.push(message.appointmentId);
        console.log(`Appointment ${message.appointmentId} marked as completed`);
      } else if (message.status === AppointmentStatus.FAILED) {
        await appointmentService.failAppointment(
          message.appointmentId,
          'Processing failed in country-specific lambda'
        );
        failedMessages.push(message.appointmentId);
        console.log(`Appointment ${message.appointmentId} marked as failed`);
      }
    } catch (error) {
      console.error('Error processing confirmation message:', error);
      console.error('Record:', JSON.stringify(record, null, 2));
      failedMessages.push(record.messageId);
    }
  }

  console.log(`Confirmation processing complete. Success: ${successfulMessages.length}, Failed: ${failedMessages.length}`);


  if (failedMessages.length > 0) {
    throw new Error(`Failed to process ${failedMessages.length} messages`);
  }
};