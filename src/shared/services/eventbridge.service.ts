
import { EventBridge } from 'aws-sdk';
import { EventBridgeMessage } from '../interfaces/appointment.interface';


export class EventBridgeService {
  private eventBridge: EventBridge;
  private eventBusName: string;

  constructor() {
    this.eventBridge = new EventBridge();
    this.eventBusName = 'default'; 
  }

  /**
   * 
   * @param message 
   */
  async publishAppointmentProcessed(message: EventBridgeMessage): Promise<string> {
    const params: EventBridge.PutEventsRequest = {
      Entries: [
        {
          Source: 'medical.appointment',
          DetailType: 'appointment.processed',
          Detail: JSON.stringify(message),
          EventBusName: this.eventBusName,
          Time: new Date()
        }
      ]
    };

    try {
      const result = await this.eventBridge.putEvents(params).promise();
      
      if (result.FailedEntryCount && result.FailedEntryCount > 0) {
        const errorMessage = result.Entries?.[0]?.ErrorMessage || 'Unknown error';
        throw new Error(`Failed to publish event: ${errorMessage}`);
      }

      const eventId = result.Entries?.[0]?.EventId || '';
      console.log('Event published to EventBridge:', eventId);
      return eventId;
    } catch (error) {
      console.error('Error publishing event to EventBridge:', error);
      throw new Error('Failed to publish event to EventBridge');
    }
  }



  async publishBatch(messages: EventBridgeMessage[]): Promise<string[]> {
    const entries: EventBridge.PutEventsRequestEntryList = messages.map(message => ({
      Source: 'medical.appointment',
      DetailType: 'appointment.processed',
      Detail: JSON.stringify(message),
      EventBusName: this.eventBusName,
      Time: new Date()
    }));

    const params: EventBridge.PutEventsRequest = {
      Entries: entries
    };

    try {
      const result = await this.eventBridge.putEvents(params).promise();

      if (result.FailedEntryCount && result.FailedEntryCount > 0) {
        console.error('Some events failed to publish:', result.Entries);
        throw new Error(`${result.FailedEntryCount} events failed to publish`);
      }

      const eventIds = result.Entries?.map(entry => entry.EventId || '') || [];
      console.log('Batch events published to EventBridge:', eventIds);
      return eventIds;
    } catch (error) {
      console.error('Error publishing batch events to EventBridge:', error);
      throw new Error('Failed to publish batch events');
    }
  }
}