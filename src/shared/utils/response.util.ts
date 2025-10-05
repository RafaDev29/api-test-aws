
import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiResponse } from '../interfaces/appointment.interface';

export class ResponseUtil {
  static success<T>(
    data: T,
    message = 'Success',
    statusCode = 200
  ): APIGatewayProxyResult {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data
    };

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(response)
    };
  }

  static error(
    error: string,
    message = 'Error occurred',
    statusCode = 500
  ): APIGatewayProxyResult {
    const response: ApiResponse = {
      success: false,
      message,
      error
    };

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(response)
    };
  }

  static badRequest(error: string, message = 'Bad Request'): APIGatewayProxyResult {
    return this.error(error, message, 400);
  }

  static notFound(error: string, message = 'Not Found'): APIGatewayProxyResult {
    return this.error(error, message, 404);
  }
}