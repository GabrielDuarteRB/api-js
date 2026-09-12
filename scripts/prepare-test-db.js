import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const nomeBanco = process.env.TEST_DB_NAME || 'app-js-database-test';

if (!/^[a-zA-Z0-9_-]+$/.test(nomeBanco)) {
    throw new Error('TEST_DB_NAME contém caracteres inválidos.');
}

const client = new Client({
    host: process.env.TEST_DB_HOST || '127.0.0.1',
    port: Number(process.env.TEST_DB_PORT || 5434),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres'
});

await client.connect();

const { rowCount } = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [nomeBanco]
);

if (rowCount === 0) {
    await client.query(`CREATE DATABASE "${nomeBanco}"`);
}

await client.end();
