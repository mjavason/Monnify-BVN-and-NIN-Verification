import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import 'express-async-errors';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { setupSwagger } from './swagger.config';
import { ApiHelper } from './api.helper';

//#region App Setup
const app = express();

dotenv.config({ path: './.env' });
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY || 'xxxx';
const MONNIFY_CLIENT_SECRET = process.env.MONNIFY_SECRET_KEY || 'xxxx';
const monifyApi = new ApiHelper('https://sandbox.monnify.com/api/v1');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));
setupSwagger(app, BASE_URL);

//#endregion App Setup

//#region Code here

/**
 * @swagger
 * /auth:
 *   post:
 *     summary: Authenticate with Monnify API
 *     description: Generates an authentication token from the Monnify API using API Key and Client Secret.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: The access token provided by Monnify.
 *                 expiresIn:
 *                   type: number
 *                   description: Token expiration time in seconds.
 *       401:
 *         description: Unauthorized, invalid API key or client secret.
 *       500:
 *         description: Server error during authentication process.
 */
app.post('/auth', async (req: any, res: any) => {
  const MONNIFY_API_KEY = 'yourApiKey'; // replace with actual API key
  const MONNIFY_CLIENT_SECRET = 'yourClientSecret'; // replace with actual client secret
  const monifyApiUrl = 'https://sandbox.monnify.com/api/v1/auth/login';

  try {
    // Encode API key and secret in Base64
    const base64EncodedString = Buffer.from(
      `${MONNIFY_API_KEY}:${MONNIFY_CLIENT_SECRET}`
    ).toString('base64');

    // Make a POST request to Monnify API
    const response = await monifyApi.post(
      '/auth/login',
      {}, // Empty body as per your sample curl command
      {
        headers: {
          authorization: `Basic ${base64EncodedString}`,
        },
      }
    );

    // Send back the response data
    return res.send(response);
  } catch (error: any) {
    // Handle errors
    res.status(error.response ? error.response.status : 500).json({
      message: 'Error authenticating with Monnify API',
      error: error.message,
    });
  }
});

//#endregion

//#region Server Setup

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Call a demo external API (httpbin.org)
 *     description: Returns an object containing demo content
 *     tags: [Default]
 *     responses:
 *       '200':
 *         description: Successful.
 *       '400':
 *         description: Bad request.
 */
app.get('/api', async (req: any, res: any) => {
  try {
    const result = await axios.get('https://httpbin.org');
    return res.send({
      message: 'Demo API called (httpbin.org)',
      data: result.status,
    });
  } catch (error: any) {
    console.error('Error calling external API:', error.message);
    return res.status(500).send({ error: 'Failed to call external API' });
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Health check
 *     description: Returns an object containing demo content
 *     tags: [Default]
 *     responses:
 *       '200':
 *         description: Successful.
 *       '400':
 *         description: Bad request.
 */
app.get('/', (req: any, res: any) => {
  return res.send({ message: 'API is Live!' });
});

/**
 * @swagger
 * /obviously/this/route/cant/exist:
 *   get:
 *     summary: API 404 Response
 *     description: Returns a non-crashing result when you try to run a route that doesn't exist
 *     tags: [Default]
 *     responses:
 *       '404':
 *         description: Route not found
 */
app.use((req: any, res: any) => {
  return res
    .status(404)
    .json({ success: false, message: 'API route does not exist' });
});

app.use((err: any, req: any, res: any, next: NextFunction) => {
  // throw Error('This is a sample error');
  console.log(`${'\x1b[31m'}`); // start color red
  console.log(`${err.message}`);
  console.log(`${'\x1b][0m]'}`); //stop color

  return res
    .status(500)
    .send({ success: false, status: 500, message: err.message });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});

// (for render services) Keep the API awake by pinging it periodically
// setInterval(pingSelf(BASE_URL), 600000);

//#endregion
