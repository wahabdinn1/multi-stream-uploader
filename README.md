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
- **File Storage**: Server-side JSON for API keys (development only)

## 📁 Project Structure

```
├── config/
│   └── apiKeys.json          # Server-side API keys (gitignored)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── keys/         # API key management endpoints
│   │   │   ├── upload/       # File upload endpoint
│   │   │   └── provider/     # Provider-specific API routes
│   │   │       └── [provider]/
│   │   │           ├── folders/     # Folder listing and management
│   │   │           │   └── [id]/
│   │   │           │       └── rename/  # Folder rename endpoint
│   │   │           └── files/       # File management
│   │   │               └── [id]/
│   │   │                   ├── move/    # File move endpoint
│   │   │                   └── rename/  # File rename endpoint
│   │   ├── history/          # Upload history page
│   │   ├── provider/         # Provider-specific pages
│   │   │   └── [slug]/       # Dynamic provider folder management
│   │   ├── settings/         # API key configuration page
│   │   └── page.tsx          # Main upload page
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (Neobrutalism)
│   │   ├── FileUploader.tsx  # Drag & drop upload component
│   │   ├── ProviderManager.tsx # Provider folder/file management
│   │   ├── Navbar.tsx        # Navigation with provider dropdown
│   │   └── ProviderSelector.tsx # Provider selection component
│   └── lib/
│       ├── keyStorage.ts     # Server-side key management utilities
│       ├── providers.ts      # Provider abstraction layer
│       └── store.ts          # Zustand state management
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
   cd multi-provider-uploader
   pnpm install
   ```

2. **Start the development server:**
   ```bash
   pnpm dev
   ```

3. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### API Key Configuration

1. **Navigate to Settings** (`/settings`) in the application
2. **Add your provider API keys:**
   - **DoodStream**: Get your API key from DoodStream.com dashboard → API settings
   - **StreamTape**: Get your login and API key from StreamTape.com → API (format: "login:key")
   - **VidGuard**: Get your API key from VidGuard.to dashboard → API settings
   - **BigWarp**: Get your API token from BigWarp.com → Account → API

3. **Keys are automatically saved** to `config/apiKeys.json` server-side

**Example API Keys Structure:**
```json
{
  "doodstream": "YOUR_DOODSTREAM_API_KEY",
  "streamtape": "YOUR_LOGIN:YOUR_API_KEY",
  "vidguard": "YOUR_VIDGUARD_API_KEY",
  "bigwarp": "YOUR_BIGWARP_API_TOKEN"
}
```

## 🔒 Security Features

### Server-Side Key Storage
- API keys stored in `config/apiKeys.json` (server-side only)
- Keys never exposed to browser/client-side code
- Atomic file writes prevent corruption
- File added to `.gitignore` to prevent commits

### API Route Security
- Input validation and sanitization
- Provider whitelist enforcement
- File type and size validation
- Error handling without key exposure

### Development vs Production
- **Development**: Uses local JSON file storage
- **Production**: Recommend environment variables or secrets manager
- **File Permissions**: Ensure proper server-side access controls

## 📡 API Endpoints

### Key Management
- `GET /api/keys` - Get provider configuration status (masked)
- `PUT /api/keys` - Add/update provider API key
- `DELETE /api/keys` - Remove provider API key
- `GET /api/keys/allowed` - Get list of supported providers

### File Upload
- `POST /api/upload` - Upload files to selected providers
  - Supports multiple files and providers
  - Returns detailed results per provider
  - Validates file types and sizes

### Provider Management
- `GET /api/provider/[provider]/folders` - List folders and files for a provider
- `POST /api/provider/[provider]/folders` - Create new folder
- `DELETE /api/provider/[provider]/folders/[id]` - Delete folder
- `PUT /api/provider/[provider]/folders/[id]/rename` - Rename folder
- `PUT /api/provider/[provider]/files/[id]/move` - Move file to different folder
- `PUT /api/provider/[provider]/files/[id]/rename` - Rename file
- `DELETE /api/provider/[provider]/files/[id]` - Delete file

## 🎨 UI Components

### Neobrutalism Design System
- **Bold borders** and **high contrast** colors
- **Sharp corners** with no border radius
- **Thick shadows** and **vibrant accents**
- **Playful typography** with strong hierarchy

### Key Components
- **FileUploader**: Drag & drop with progress tracking
- **ProviderSelector**: Multi-select with status indicators  
- **ProviderManager**: Complete folder/file management with thumbnails and metadata
- **Navbar**: Navigation with provider dropdown for quick access
- **Settings Page**: Secure key management interface
- **History Page**: Upload tracking with filtering

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
   export const ALLOWED_PROVIDERS = ['vidguard', 'bigwarp', 'newprovider'] as const;
   ```

2. **Implement provider class** in `src/lib/providers.ts`:
   ```typescript
   export class NewProviderProvider implements IProvider {
     // Implement required methods
   }
   ```

3. **Add to provider factory**:
   ```typescript
   export function getProvider(providerName: AllowedProvider): IProvider {
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

**API keys not saving:**
- Check file permissions on `config/` directory
- Ensure server has write access to project root
- Verify JSON format in browser network tab

**Upload failures:**
- Verify API keys are correctly configured
- Check file size limits (100MB max)
- Ensure supported file types (MP4, AVI, MOV, etc.)

**Build errors:**
- Run `pnpm install` to ensure all dependencies
- Check TypeScript errors with `pnpm build`
- Verify all imports and component props

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
