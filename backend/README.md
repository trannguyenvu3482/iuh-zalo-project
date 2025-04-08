# Zalo Clone Backend

This is the backend for a Zalo clone application, providing APIs for user management, messaging, and social interactions.

## Setup

1. Install dependencies:

```
npm install
```

2. Create a `.env` file based on `example.env` and fill in your details:

```
# Server
JWT_SECRET_KEY=your-secret-key
PORT=8081
CLIENT_URL=http://localhost:3000
API_URL=http://localhost:8081

# Database
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name

# Supabase
SUPABASE_URL=your-project-url.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# Agora
AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_app_certificate_here
```

3. Set up Supabase:

   - Create a Supabase project at https://supabase.com
   - Get your project URL and anon key from the project settings
   - The application will automatically create the required storage buckets (avatars, banners, messages)
4. Start the server:

```
npm start
```

## Features

- User authentication with JWT
- Phone number verification with OTP
- QR code login support
- Real-time messaging with Socket.IO
- File uploads to Supabase storage
- Friend management system
- User profile management

## API Endpoints

### Auth

- `POST /api/auth/request-otp` - Request OTP for phone verification
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Login with phone number and password
- `GET /api/auth/generate-qr` - Generate QR code for passwordless login
- `POST /api/auth/scan-qr` - Process QR code scan from mobile app
- `GET /api/auth/qr-status/:sessionId` - Check QR login status

### User

- `GET /api/users/me` - Get current user profile
- `GET /api/users/search` - Search user by phone number
- `GET /api/users/:queryId` - Get user by ID
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/avatar` - Update user avatar
- `PUT /api/users/banner` - Update user banner
- `PUT /api/users/status` - Update user status

### File Storage

The application uses Supabase Storage for file uploads with the following buckets:

- `avatars` - For user profile pictures (max 5MB)
- `banners` - For user profile banners (max 5MB)
- `messages` - For message attachments (max 5MB)

## Supabase Storage Setup

For file storage, this project uses Supabase storage. To set up correctly:

1. Create a Supabase project at https://supabase.com
2. In the Supabase dashboard, go to Project Settings > API
3. Copy your project URL and add it to `.env` as `SUPABASE_URL`
4. Get your service role key (not the anon key) and add it to `.env` as `SUPABASE_SERVICE_KEY`

### Manual Storage Setup (Alternative)

If automatic bucket setup is not working, you can manually set up the storage buckets:

1. Go to the Storage section in your Supabase dashboard
2. Create three buckets: `avatars`, `banners`, and `messages`
3. For each bucket:
   - Go to the bucket settings
   - Toggle "Public bucket" to ON
   - Set the file size limit to 5MB
   - In the "Policies" tab, add these policies:
     - Select policy: `SELECT` with definition `true` (allows anyone to read files)
     - Insert policy: `INSERT` with definition `true` (allows uploads)
     - Update policy: `UPDATE` with definition `true` (allows updates)
     - Delete policy: `DELETE` with definition `true` (allows deletion)

This will allow your backend to manage files in these buckets without authentication errors.

## Database Regeneration

If you need to regenerate the database with the updated schema:

1. Connect to your PostgreSQL database
2. Run the SQL script:

   ```
   psql -U YOUR_USERNAME -d YOUR_DATABASE_NAME -f regenerate_db.sql
   ```

   Or you can copy and paste the contents of `regenerate_db.sql` into your PostgreSQL client.
3. Make sure to replace `YOUR_USERNAME` and `YOUR_DATABASE_NAME` with your actual PostgreSQL username and database name.
4. This script will:

   - Terminate all connections to the database
   - Drop all existing tables
   - Create new tables with the updated schema
   - Add necessary indexes
   - Insert initial roles
5. Note: This will delete all existing data. Make sure to backup any important data before running this script.

The updated schema includes:

- Nickname support for conversation members
- System message support (for events like adding members, leaving groups, etc.)
- Various improvements to the messaging system

## Agora Token Server Setup

The video calling functionality requires an Agora token server to generate secure tokens for video calls. Follow these steps to set it up:

1. Create an account on [Agora.io](https://www.agora.io/) if you don't have one
2. Create a new project in the Agora Console
3. Get your App ID and App Certificate from the project settings
4. Add these credentials to your `.env` file:

```
AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_app_certificate_here
```

5. The token server is automatically set up at the endpoint: `/api/token/rtc/:channel/:uid`
6. Test it by making a GET request to: `http://localhost:8080/api/token/rtc/test/1234`

### Secure Token Flow

1. When a call is initiated, the client requests a token from the token server
2. The token server generates a secure, time-limited token using the Agora credentials
3. The client uses this token to connect to the Agora service
4. For security, tokens expire after 24 hours

## License

[MIT](LICENSE)
