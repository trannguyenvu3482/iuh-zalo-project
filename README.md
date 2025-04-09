# Zalo Project

A full-stack application with a mobile app, web frontend, and backend API. The project uses modern technologies and follows best practices for development.

## Project Structure

```
├── mobile/          # React Native mobile app
├── frontend/        # Web frontend
└── backend/         # Node.js backend API
```

## Features

- **Mobile App**:

  - Modern UI with NativeWind (Tailwind CSS)
  - Authentication flow
  - Real-time updates with Socket.IO
  - Secure storage with AsyncStorage
  - Type-safe development with TypeScript
- **Frontend**:

  - Modern web interface
  - Real-time updates
  - Responsive design
  - Type-safe development
- **Backend**:

  - RESTful API
  - JWT authentication
  - PostgreSQL database with Sequelize ORM
  - Real-time updates with Socket.IO
  - File upload support
  - QR code generation

## Prerequisites

- Node.js (v18 or higher)
- Bun (for frontend)
- PostgreSQL
- Expo CLI (for mobile development)

## Getting Started

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Create a `.env` file in the backend directory with the following variables:

   ```
   PORT=3000
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   JWT_SECRET=your_jwt_secret
   ```
4. Start the backend server:

   ```bash
   npm start
   ```

The backend server will run on `http://localhost:3000` by default.

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```
2. Install dependencies using Bun:

   ```bash
   bun install
   ```
3. Start the development server:

   ```bash
   bun run dev
   ```

The frontend will be available at `http://localhost:5176`.

### Mobile App Setup

1. Navigate to the mobile directory:

   ```bash
   cd mobile
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Start the Expo development server:

   ```bash
   npm start
   ```
4. Run on your preferred platform:

   - iOS: `npm run ios`
   - Android: `npm run android`
   - Web: `npm run web`

## Development

### Code Style

The project uses ESLint and Prettier for code formatting. To format code:

```bash
# In mobile directory
npm run format

# In frontend directory
bun run format
```

### Linting

To check for linting errors:

```bash
# In mobile directory
npm run lint

# In frontend directory
bun run lint
```

## Environment Variables

Make sure to set up the following environment variables:

### Backend

- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens

### Frontend

- `VITE_API_URL`: Backend API URL

### Mobile

- `EXPO_PUBLIC_API_URL`: Backend API URL

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

This project is private and confidential.
