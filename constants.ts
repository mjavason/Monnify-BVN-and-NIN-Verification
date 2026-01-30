import dotenv from 'dotenv';

dotenv.config({
  path: './.env',
});

export const PORT = process.env.PORT || 5000;
export const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
export const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY || 'xxxx';
export const MONNIFY_CLIENT_SECRET = process.env.MONNIFY_SECRET_KEY || 'xxxx';

export const monnifyApi = new ApiHelper('https://sandbox.monnify.com/api/v1');
