

import mysql from 'mysql2/promise';
import { AppointmentRDS } from '../interfaces/appointment.interface';

export class RDSRepository {
  private connection: mysql.Connection | null = null;
  private config: mysql.ConnectionOptions;

  constructor() {
    this.config = {
      host: process.env.RDS_HOST || 'localhost',
      port: parseInt(process.env.RDS_PORT || '3306'),
      database: process.env.RDS_DATABASE || 'appointments',
      user: process.env.RDS_USER || 'admin',
      password: process.env.RDS_PASSWORD || 'password',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
  }

 
  private async connect(): Promise<mysql.Connection> {
    if (!this.connection) {
      try {
        this.connection = await mysql.createConnection(this.config);
        console.log('Connected to RDS MySQL database');
      } catch (error) {
        console.error('Error connecting to RDS:', error);
        throw new Error('Database connection failed');
      }
    }
    return this.connection;
  }


  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      console.log('Disconnected from RDS MySQL database');
    }
  }


  async createAppointment(appointment: AppointmentRDS): Promise<number> {
    const connection = await this.connect();

    const query = `
      INSERT INTO appointments (
        appointmentId,
        insuredId,
        scheduleId,
        centerId,
        specialtyId,
        medicId,
        appointmentDate,
        status,
        createdAt,
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      appointment.appointmentId,
      appointment.insuredId,
      appointment.scheduleId,
      appointment.centerId || null,
      appointment.specialtyId || null,
      appointment.medicId || null,
      appointment.appointmentDate || null,
      appointment.status
    ];

    try {
      const [result] = await connection.execute<mysql.ResultSetHeader>(query, values);
      return result.insertId;
    } catch (error) {
      console.error('Error creating appointment in RDS:', error);
      throw new Error('Failed to create appointment in database');
    }
  }

 
  async getAppointmentById(appointmentId: string): Promise<AppointmentRDS | null> {
    const connection = await this.connect();

    const query = 'SELECT * FROM appointments WHERE appointmentId = ?';

    try {
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(query, [appointmentId]);
      return rows.length > 0 ? (rows[0] as AppointmentRDS) : null;
    } catch (error) {
      console.error('Error getting appointment from RDS:', error);
      throw new Error('Failed to get appointment');
    }
  }

  async updateAppointmentStatus(appointmentId: string, status: string): Promise<void> {
    const connection = await this.connect();

    const query = `
      UPDATE appointments 
      SET status = ?, updatedAt = NOW() 
      WHERE appointmentId = ?
    `;

    try {
      await connection.execute(query, [status, appointmentId]);
    } catch (error) {
      console.error('Error updating appointment status in RDS:', error);
      throw new Error('Failed to update appointment status');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const connection = await this.connect();
      await connection.ping();
      return true;
    } catch (error) {
      console.error('RDS health check failed:', error);
      return false;
    }
  }
}