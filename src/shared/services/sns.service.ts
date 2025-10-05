

import { SNS } from 'aws-sdk';
import { CountryISO, SNSMessage } from '../interfaces/appointment.interface';


export class SNSService {
  private sns: SNS;
  private topicArnPE: string;
  private topicArnCL: string;

  constructor() {
    this.sns = new SNS();
    this.topicArnPE = process.env.SNS_TOPIC_PE_ARN || '';
    this.topicArnCL = process.env.SNS_TOPIC_CL_ARN || '';
  }

 
  async publishToCountryTopic(message: SNSMessage, country: CountryISO): Promise<string> {
    const topicArn = this.getTopicArnByCountry(country);

    if (!topicArn) {
      throw new Error(`SNS Topic ARN not configured for country: ${country}`);
    }

    const params: SNS.PublishInput = {
      TopicArn: topicArn,
      Message: JSON.stringify(message),
      Subject: `Medical Appointment - ${country}`,
      MessageAttributes: {
        country: {
          DataType: 'String',
          StringValue: country
        },
        appointmentId: {
          DataType: 'String',
          StringValue: message.appointmentId
        }
      }
    };

    try {
      const result = await this.sns.publish(params).promise();
      console.log(`Message published to SNS topic ${country}:`, result.MessageId);
      return result.MessageId || '';
    } catch (error) {
      console.error(`Error publishing to SNS topic ${country}:`, error);
      throw new Error(`Failed to publish message to SNS topic ${country}`);
    }
  }


  private getTopicArnByCountry(country: CountryISO): string {
    const topicMap: Record<CountryISO, string> = {
      [CountryISO.PE]: this.topicArnPE,
      [CountryISO.CL]: this.topicArnCL
    };

    return topicMap[country];
  }
}