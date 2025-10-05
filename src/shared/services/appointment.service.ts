

import { v4 as uuidv4 } from 'uuid';
import {
  CreateAppointmentRequest,
  AppointmentDynamoDB,
  AppointmentStatus,
  SNSMessage,
  CountryISO
} from '../interfaces/appointment.interface';
import { DynamoDBRepository } from '../repositories/dynamodb.repository';
import { SNSService } from './sns.service';

/**
 * Servicio de Appointments - Implementa patrón Facade
 * Coordina las operaciones entre DynamoDB, SNS y la lógica de negocio
 * 
 * Principios SOLID aplicados:
 * - S (Single Responsibility): Solo maneja la lógica de negocio de appointments
 * - O (Open/Closed): Abierto para extensión (nuevos países) cerrado para modificación
 * - D (Dependency Inversion): Depende de abstracciones (repositorios/servicios)
 */
export class AppointmentService {
  private dynamoRepository: DynamoDBRepository;
  private snsService: SNSService;

  constructor(
    dynamoRepository?: DynamoDBRepository,
    snsService?: SNSService
  ) {
    // Inyección de dependencias (Patrón Dependency Injection)
    this.dynamoRepository = dynamoRepository || new DynamoDBRepository();
    this.snsService = snsService || new SNSService();
  }

  /**
   * Crea una nueva solicitud de cita
   * Guarda en DynamoDB y publica en SNS
   */
  async createAppointment(request: CreateAppointmentRequest): Promise<AppointmentDynamoDB> {
    const appointmentId = uuidv4();
    const now = new Date().toISOString();

    // Crear registro en DynamoDB con estado "pending"
    const appointment: AppointmentDynamoDB = {
      appointmentId,
      insuredId: request.insuredId,
      scheduleId: request.scheduleId,
      countryISO: request.countryISO,
      status: AppointmentStatus.PENDING,
      createdAt: now,
      updatedAt: now
    };

    // Guardar en DynamoDB
    await this.dynamoRepository.createAppointment(appointment);
    console.log(`Appointment created in DynamoDB: ${appointmentId}`);

    // Preparar mensaje para SNS
    const snsMessage: SNSMessage = {
      appointmentId,
      insuredId: request.insuredId,
      scheduleId: request.scheduleId,
      countryISO: request.countryISO
    };

    // Publicar en SNS según el país
    try {
      await this.snsService.publishToCountryTopic(snsMessage, request.countryISO);
      console.log(`Message published to SNS for country ${request.countryISO}`);
    } catch (error) {
      console.error('Error publishing to SNS:', error);
      // Actualizar estado a failed
      await this.dynamoRepository.updateAppointmentStatus(
        appointmentId,
        AppointmentStatus.FAILED,
        'Failed to publish to SNS'
      );
      throw error;
    }

    return appointment;
  }

  /**
   * Obtiene una cita por ID
   */
  async getAppointmentById(appointmentId: string): Promise<AppointmentDynamoDB | null> {
    return await this.dynamoRepository.getAppointmentById(appointmentId);
  }

  /**
   * Obtiene todas las citas de un asegurado
   */
  async getAppointmentsByInsuredId(insuredId: string): Promise<AppointmentDynamoDB[]> {
    return await this.dynamoRepository.getAppointmentsByInsuredId(insuredId);
  }

  /**
   * Actualiza el estado de una cita a "completed"
   */
  async completeAppointment(appointmentId: string): Promise<void> {
    await this.dynamoRepository.updateAppointmentStatus(
      appointmentId,
      AppointmentStatus.COMPLETED
    );
    console.log(`Appointment ${appointmentId} marked as completed`);
  }

  /**
   * Marca una cita como fallida
   */
  async failAppointment(appointmentId: string, errorMessage: string): Promise<void> {
    await this.dynamoRepository.updateAppointmentStatus(
      appointmentId,
      AppointmentStatus.FAILED,
      errorMessage
    );
    console.log(`Appointment ${appointmentId} marked as failed: ${errorMessage}`);
  }

  /**
   * Valida que el país sea válido (Patrón Strategy podría aplicarse aquí)
   */
  isValidCountry(country: string): boolean {
    return Object.values(CountryISO).includes(country as CountryISO);
  }
}