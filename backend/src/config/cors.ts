import cors from 'cors';

export const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin, callback) => {
    // Allow all origins including file:// (which sends Origin: 'null') and local tools
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-super-admin-key', 'X-Requested-With', 'Accept'],
};
