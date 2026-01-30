import axios from 'axios';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import morgan from 'morgan';
import { BASE_URL, MONNIFY_API_KEY, MONNIFY_CLIENT_SECRET, monnifyApi, PORT } from './constants';
import { setupSwagger } from './swagger.config';

//#region App Setup
const app = express();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(cors());
app.use(morgan('dev'));
setupSwagger(app, BASE_URL);

//#endregion App Setup

//#region Code here
/**
 * @swagger
 * /nin-details:
 *   post:
 *     summary: Authenticate and retrieve NIN with Monnify API
 *     description: Generates an authentication token then retrieves nin details from the Monnify API using the API Key and Client Secret.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       description: Optional request body
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nin:
 *                 type: string
 *                 description: The NIN to retrieve details for (used in subsequent API calls).
 *     responses:
 *       200:
 *         description: Successfully authenticated and NIN details retrieved.
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
 *                 ninDetails:
 *                   type: object
 *                   description: NIN details retrieved using the access token.
 *       401:
 *         description: Unauthorized, invalid API key or client secret.
 *       500:
 *         description: Server error during authentication process.
 */
app.post('/nin-details', async (req: any, res: any) => {
  // Encode API key and client secret in Base64
  const base64EncodedCredentials = btoa(`${MONNIFY_API_KEY}:${MONNIFY_CLIENT_SECRET}`);

  // Authenticate with Monnify to retrieve access token
  const authResponse = await monnifyApi.post<any>(
    '/auth/login',
    {},
    {
      headers: {
        authorization: `Basic ${base64EncodedCredentials}`,
      },
    },
  );

  const accessToken = authResponse?.responseBody?.accessToken;

  if (!accessToken) {
    return res.status(401).send({ message: 'Authentication failed, no access token received.' });
  }

  // Optional: Use NIN provided in the request body to fetch NIN details
  const { nin } = req.body;
  let ninDetails = null;
  if (nin) {
    const ninResponse = await monnifyApi.post<any>(
      '/vas/nin-details',
      { nin },
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      },
    );
    ninDetails = ninResponse;
  }

  // Send back access token and optional NIN details
  res.status(200).send({
    accessToken,
    expiresIn: authResponse?.responseBody?.expiresIn,
    ninDetails,
  });
}); //#endregion

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
app.get('/api', async (req: Request, res: Response) => {
  try {
    const result = await axios.get('https://httpbin.org');
    return res.send({
      message: 'Demo API called (httpbin.org)',
      data: result.status,
    });
  } catch (error: any) {
    console.error('Error calling external API:', error.message);
    return res.status(500).send({
      error: 'Failed to call external API',
    });
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
app.get('/', (req: Request, res: Response) => {
  return res.send({
    message: 'API is Live!',
  });
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
app.use((req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    message: 'API route does not exist',
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // throw Error('This is a sample error');
  console.log(`${'\x1b[31m'}`); // start color red
  console.log(`${err.message}`);
  console.log(`${'\x1b][0m]'}`); //stop color

  return res.status(500).send({
    success: false,
    status: 500,
    message: err.message,
  });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});

// (for render services) Keep the API awake by pinging it periodically
// setInterval(pingSelf(BASE_URL), 600000);

//#endregion
