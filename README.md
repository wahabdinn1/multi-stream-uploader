# Multi-Provider Video Uploader

A secure, fullstack Next.js application for uploading videos to multiple providers simultaneously. Features server-side API key management, Neobrutalism UI design, real-time upload progress tracking, and comprehensive folder management for all providers.

## 🚀 Features

- **Multi-Provider Uploads**: Upload to DoodStream, StreamTape, VidGuard, and BigWarp simultaneously
- **Folder Management**: Complete folder and file management with thumbnails, metadata, and navigation
- **File Operations**: Move, rename, create, and delete files and folders across all providers
- **Provider Navigation**: Dedicated provider pages with consistent UI and quick access dropdown
- **Secure Key Management**: Server-side API key storage with no browser exposure
- **Neobrutalism UI**: Modern, bold design with shadcn/ui components
- **Real-time Progress**: Track upload progress and view detailed results
- **Upload History**: Persistent history with filtering and status tracking
- **Type Safety**: Full TypeScript support with strict typing

## 🏗️ Architecture

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 + Neobrutalism theme
- **State Management**: Zustand with persistence
- **UI Components**: shadcn/ui with Neobrutalism registry
- **API**: Next.js API Routes for server-side operations
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Security**: Bcrypt password hashing, JWT sessions

## 📁 Project Structure

```
├── prisma/
│   ├── migrations/           # Database migrations
│   ├── schema.prisma         # Database schema
│   └── dev.db               # SQLite database (development)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/         # NextAuth authentication
│   │   │   ├── account/      # Account info endpoint
│   │   │   ├── keys/         # API key management
│   │   │   └── upload/       # File upload endpoint
│   │   ├── account/          # User account page
│   │   ├── admin/            # Admin dashboard
│   │   ├── login/            # Login page
│   │   ├── register/         # Registration page
│   │   └── page.tsx          # Main upload page
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (Neobrutalism)
│   │   ├── FileUploader.tsx  # Drag & drop upload component
│   │   ├── AccountContent.tsx # Account information display
│   │   └── Navbar.tsx        # Navigation component
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client configuration
│   │   ├── keyStorage.ts     # Database key management
│   │   └── providers.ts      # Provider abstraction layer
│   └── types/
│       └── next-auth.d.ts    # NextAuth type definitions
├── middleware.ts             # Route protection middleware
└── README.md
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm/yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd multi-stream-uploader
   pnpm install
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add:
   ```bash
   # Database
   DATABASE_URL="file:./dev.db"
   
   # NextAuth Configuration
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

3. **Generate NextAuth Secret:**
   ```bash
   # Generate a secure random secret
   openssl rand -base64 32
   # OR using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   Copy the generated secret to your `NEXTAUTH_SECRET` in `.env.local`

4. **Setup database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server:**
   ```bash
   pnpm dev
   ```

6. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### User Registration & API Key Configuration

1. **Create an account:**
   - Navigate to `/register` to create a new user account
   - Or login at `/login` if you already have an account

2. **Configure your provider API keys:**
   Navigate to your account settings and add your provider API keys:
   - **DoodStream**: Get your API key from DoodStream.com dashboard → API settings
   - **StreamTape**: Get your login and API key from StreamTape.com → API (format: "login:key")
   - **VidGuard**: Get your API key from VidGuard.to dashboard → API settings
   - **BigWarp**: Get your API token from BigWarp.com → Account → API

3. **Keys are securely stored** in the database per user with encryption

**Example API Keys Format:**
- **DoodStream**: `d1234567890abcdef1234567890abcdef`
- **StreamTape**: `mylogin:1234567890abcdef1234567890abcdef`
- **VidGuard**: `1234567890abcdef1234567890abcdef`
- **BigWarp**: `1234567890abcdef1234567890abcdef`

## 🔒 Security Features

### Database Security
- API keys stored encrypted in SQLite database per user
- User passwords hashed with bcrypt
- JWT sessions with secure secret
- Keys never exposed to browser/client-side code

### Authentication & Authorization
- NextAuth.js integration with credentials provider
- Role-based access control (USER vs SUPER_ADMIN)
- Protected API routes with session validation
- Middleware-based route protection

### API Route Security
- Input validation and sanitization
- Provider whitelist enforcement
- File type and size validation
- Error handling without key exposure
- User-specific API key isolation

### Development vs Production
- **Development**: Uses local SQLite database
- **Production**: Recommend PostgreSQL or MySQL with proper connection pooling
- **Environment Variables**: All secrets stored in environment variables

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/session` - Get current session

### Account Management
- `GET /api/account` - Get account info from all configured providers
- `GET /api/keys` - Get user's API key status
- `PUT /api/keys` - Add/update provider API key
- `DELETE /api/keys` - Remove provider API key

### File Upload
- `POST /api/upload` - Upload files to selected providers
  - Requires authentication
  - Supports multiple files and providers
  - Returns detailed results per provider

## 🎨 UI Components

### Neobrutalism Design System
- **Bold borders** and **high contrast** colors
- **Sharp corners** with no border radius
- **Thick shadows** and **vibrant accents**
- **Playful typography** with strong hierarchy

### Key Components
- **FileUploader**: Drag & drop with progress tracking
- **AccountContent**: Provider account information display
- **Navbar**: Navigation with authentication status
- **Login/Register**: User authentication forms
- **Admin Dashboard**: Super admin user management

## 🔧 Development

### Available Scripts
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Adding New Providers

1. **Update allowed providers** in `src/lib/keyStorage.ts`:
   ```typescript
   export const ALLOWED_PROVIDERS = ['vidguard', 'bigwarp', 'doodstream', 'streamtape', 'newprovider'] as const;
   ```

2. **Implement provider class** in `src/lib/providers.ts`:
   ```typescript
   export class NewProviderProvider implements IProvider {
     name = 'newprovider';
     
     async upload(fileBuffer: Buffer, filename: string, options?: UploadOptions): Promise<UploadResult> {
       // Implementation
     }
     
     async getAccountInfo(): Promise<AccountInfo> {
       // Implementation
     }
     
     // Other required methods...
   }
   ```

3. **Add to provider factory**:
   ```typescript
   export function getProvider(providerName: string): IProvider {
     switch (providerName) {
       case 'newprovider':
         return new NewProviderProvider();
       // ...
     }
   }
   ```

## ⚠️ Important Security Notes

1. **Local Development Only**: Current setup intended for local development
2. **Production Deployment**: Use environment variables or proper secrets management
3. **File Permissions**: Ensure `config/apiKeys.json` has appropriate server-side permissions
4. **HTTPS Required**: Always use HTTPS in production for API key transmission
5. **Rate Limiting**: Consider implementing rate limiting for API endpoints

## 🐛 Troubleshooting

### Common Issues

**Authentication issues:**
- Ensure `NEXTAUTH_SECRET` is set in `.env.local`
- Check database connection and Prisma client generation
- Verify user registration/login process

**API keys not working:**
- Ensure user is logged in
- Check API key configuration in account settings
- Verify provider API key format (especially StreamTape: `login:key`)

**Database errors:**
- Run `npx prisma generate` after schema changes
- Run `npx prisma db push` to sync database
- Check SQLite database permissions

**Upload failures:**
- Verify API keys are correctly configured for logged-in user
- Check file size limits (varies by provider)
- Ensure supported file types (MP4, AVI, MOV, etc.)

**Build errors:**
- Run `pnpm install` to ensure all dependencies
- Check TypeScript errors with `pnpm build`
- Verify Prisma client is generated

## 📄 License

This project is for educational and development purposes. Ensure compliance with provider terms of service when using their APIs.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Built with ❤️ using Next.js, TypeScript, and Neobrutalism design principles.**
