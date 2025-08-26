import sql from 'mssql';
import { logger } from '../utils/logger';

// Database configuration
const dbConfig: sql.config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'LMS',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword123!',
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: false, // For Azure use true
    trustServerCertificate: true, // For local dev / self-signed certs
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

let pool: sql.ConnectionPool | null = null;

export const connectDatabase = async (): Promise<void> => {
  try {
    // For development, skip database connection if not configured
    if (!process.env.DB_SERVER || !process.env.DB_PASSWORD) {
      logger.warn('Database not configured. Running in development mode without database.');
      logger.warn('To use database, set DB_SERVER, DB_USER, and DB_PASSWORD in .env file');
      return;
    }

    if (pool) {
      logger.info('Database already connected');
      return;
    }

    pool = await sql.connect(dbConfig);
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    logger.warn('Running in development mode without database connection');
    // Don't throw error in development mode
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
};

export const getConnection = (): sql.ConnectionPool => {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.close();
    pool = null;
    logger.info('Database connection closed');
  }
};

// Helper function to execute stored procedures
export const executeStoredProcedure = async (
  procedureName: string,
  parameters: { name: string; type: any; value: any }[] = []
): Promise<sql.IProcedureResult<any>> => {
  // Mock implementation for development without database
  if (!pool) {
    logger.warn(`Mocking stored procedure: ${procedureName}`);
    return {
      recordset: [] as any,
      recordsets: [] as any,
      rowsAffected: [0],
      output: {},
      returnValue: 0
    };
  }

  const connection = getConnection();
  const request = connection.request();
  
  // Add parameters to request
  parameters.forEach(param => {
    request.input(param.name, param.type, param.value);
  });
  
  return await request.execute(procedureName);
};

// Helper function to execute queries
export const executeQuery = async (query: string, parameters: any[] = []): Promise<sql.IResult<any>> => {
  // Mock implementation for development without database
  if (!pool) {
    logger.warn(`Mocking query: ${query}`);
    return {
      recordset: [] as any,
      recordsets: [] as any,
      rowsAffected: [0],
      output: {}
    };
  }

  const connection = getConnection();
  const request = connection.request();
  
  // Add parameters to request
  parameters.forEach((param, index) => {
    request.input(`param${index}`, param);
  });
  
  return await request.query(query);
};

// Transaction helper
export const executeTransaction = async <T>(
  callback: (transaction: sql.Transaction) => Promise<T>
): Promise<T> => {
  if (!pool) {
    throw new Error('Database not connected for transactions');
  }

  const connection = getConnection();
  const transaction = new sql.Transaction(connection);
  
  try {
    await transaction.begin();
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
