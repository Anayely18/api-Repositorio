// src/db/connection.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',          // usa tu usuario actual
  password: process.env.DB_PASSWORD || '',      // tu contraseña (vacía en XAMPP)
  database: process.env.DB_NAME || 'repositorio',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
export default pool;

