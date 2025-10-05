

import { DynamoDB } from 'aws-sdk';
import { 
  AppointmentDynamoDB, 
  AppointmentStatus 
} from '../interfaces/appointment.interface';

export class DynamoDBRepository {
  private dynamoDB: DynamoDB.DocumentClient;
  private tableName: string;

  constructor() {
    this.dynamoDB = new DynamoDB.DocumentClient();
    this.tableName = process.env.DYNAMODB_TABLE || 'appointments';
  }


  async createAppointment(appointment: AppointmentDynamoDB): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: appointment
    };

    try {
      await this.dynamoDB.put(params).promise();
    } catch (error) {
      console.error('Error creating appointment in DynamoDB:', error);
      throw new Error('Failed to create appointment');
    }
  }

 
  async getAppointmentById(appointmentId: string): Promise<AppointmentDynamoDB | null> {
    const params = {
      TableName: this.tableName,
      Key: { appointmentId }
    };

    try {
      const result = await this.dynamoDB.get(params).promise();
      return result.Item as AppointmentDynamoDB || null;
    } catch (error) {
      console.error('Error getting appointment from DynamoDB:', error);
      throw new Error('Failed to get appointment');
    }
  }

 
  async updateAppointmentStatus(
    appointmentId: string, 
    status: AppointmentStatus,
    errorMessage?: string
  ): Promise<void> {
    const updateExpression = errorMessage 
      ? 'SET #status = :status, updatedAt = :updatedAt, errorMessage = :errorMessage'
      : 'SET #status = :status, updatedAt = :updatedAt';

    const expressionAttributeValues: Record<string, unknown> = {
      ':status': status,
      ':updatedAt': new Date().toISOString()
    };

    if (errorMessage) {
      expressionAttributeValues[':errorMessage'] = errorMessage;
    }

    const params = {
      TableName: this.tableName,
      Key: { appointmentId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: expressionAttributeValues
    };

    try {
      await this.dynamoDB.update(params).promise();
    } catch (error) {
      console.error('Error updating appointment status in DynamoDB:', error);
      throw new Error('Failed to update appointment status');
    }
  }

 
  async getAppointmentsByInsuredId(insuredId: string): Promise<AppointmentDynamoDB[]> {
    const params = {
      TableName: this.tableName,
      IndexName: 'insuredId-index',
      KeyConditionExpression: 'insuredId = :insuredId',
      ExpressionAttributeValues: {
        ':insuredId': insuredId
      }
    };

    try {
      const result = await this.dynamoDB.query(params).promise();
      return (result.Items as AppointmentDynamoDB[]) || [];
    } catch (error) {
      console.error('Error querying appointments by insuredId:', error);
      throw new Error('Failed to query appointments');
    }
  }
}