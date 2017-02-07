import dotenv from 'dotenv';

dotenv.config();

exports.DATABASE_URL = process.env.DATABASE_URL;
exports.PORT = process.env.PORT || 8080;
