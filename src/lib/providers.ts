import { getApiKey, AllowedProvider } from './keyStorage';

export interface UploadOptions {
  filename?: string;
  folder?: string;
  description?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  id?: string;
  error?: string;
  provider: string;
}

export interface VideoInfo {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  size?: number;
  uploadDate?: string;
}

export interface AccountInfo {
  username?: string;
  email?: string;
  storage?: {
    used: number;
    total: number;
  };
  bandwidth?: {
    used: number;
    total: number;
  };
  balance?: number;
  currency?: string;
  role?: string;
  createdAt?: string;
  filesTotal?: number;
  premiumExpire?: string;
}

export interface IProvider {
  name: string;
  upload(fileBuffer: Buffer, filename: string, options?: UploadOptions): Promise<UploadResult>;
  uploadRemote(url: string, options?: UploadOptions): Promise<UploadResult>;
  getVideos(options?: { page?: number; limit?: number }): Promise<VideoInfo[]>;
  getAccountInfo(): Promise<AccountInfo>;
  deleteVideo(id: string): Promise<boolean>;
}

export class VidGuardProvider implements IProvider {
  name = 'vidguard';

  private async getApiKey(): Promise<string> {
    const key = await getApiKey('vidguard');
    if (!key) {
      throw new Error('VidGuard API key not configured');
    }
    return key;
  }

  async upload(fileBuffer: Buffer, filename: string, options?: UploadOptions): Promise<UploadResult> {
    try {
      const apiKey = await this.getApiKey();
      
      console.log('VidGuard upload started for:', filename);
      
      // Step 1: Get upload server URL
      const serverResponse = await fetch(`https://api.vidguard.to/v1/upload/server?key=${apiKey}`);
      
      if (!serverResponse.ok) {
        const errorText = await serverResponse.text();
        console.error('VidGuard server request failed:', serverResponse.status, errorText);
        throw new Error(`VidGuard server request failed: ${serverResponse.statusText} - ${errorText}`);
      }
      
      const serverResult = await serverResponse.json();
      console.log('VidGuard server response:', serverResult);
      
      if (serverResult.status !== 200 || !serverResult.result?.url) {
        console.error('Invalid server response:', serverResult);
        throw new Error(`Failed to get upload server URL: ${serverResult.msg || 'Unknown error'}`);
      }
      
      // Step 2: Upload file to the server
      const formData = new FormData();
      formData.append('file', new Blob([new Uint8Array(fileBuffer)], { type: 'video/mp4' }), filename);
      formData.append('key', apiKey);
      
      if (options?.folder) {
        formData.append('folder', options.folder);
      } else {
        formData.append('folder', '0'); // Default to root folder
      }
      
      console.log('Uploading to:', serverResult.result.url);
      console.log('File size:', fileBuffer.length, 'bytes');
      
      const uploadResponse = await fetch(serverResult.result.url, {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('VidGuard upload failed:', uploadResponse.status, errorText);
        throw new Error(`VidGuard upload failed: ${uploadResponse.statusText} - ${errorText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      console.log('VidGuard upload response:', uploadResult);
      
      if (uploadResult.status !== 200) {
        console.error('Upload failed with status:', uploadResult.status, uploadResult.msg);
        throw new Error(uploadResult.msg || 'Upload failed');
      }
      
      return {
        success: true,
        url: `https://vidguard.to${uploadResult.result.URL}`,
        id: uploadResult.result.HashID,
        provider: this.name,
      };
    } catch (error) {
      console.error('VidGuard upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
      };
    }
  }

  async uploadRemote(url: string, options?: UploadOptions): Promise<UploadResult> {
    try {
      const apiKey = await this.getApiKey();
      
      const formData = new FormData();
      formData.append('key', apiKey);
      formData.append('url', url);
      
      if (options?.folder) {
        formData.append('folder', options.folder);
      }

      const response = await fetch('https://api.vidguard.to/v1/remote/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('VidGuard remote upload response:', data);

      if (data.status !== 200) {
        throw new Error(data.msg || 'Remote upload failed');
      }

      return {
        success: true,
        provider: this.name,
        id: data.result?.[0]?.id,
        url: data.result?.[0]?.URL || `https://vidguard.to/v/${data.result?.[0]?.id}`
      };
    } catch (error) {
      console.error('VidGuard remote upload error:', error);
      return {
        success: false,
        provider: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getVideos(options?: { page?: number; limit?: number }): Promise<VideoInfo[]> {
    try {
      const apiKey = await this.getApiKey();
      
      const params = new URLSearchParams({
        api_key: apiKey,
        page: (options?.page || 1).toString(),
        limit: (options?.limit || 20).toString(),
      });
      
      const response = await fetch(`https://api.vidguard.to/videos?${params}`);
      
      if (!response.ok) {
        throw new Error(`VidGuard get videos failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.videos || [];
    } catch (error) {
      console.error('VidGuard getVideos error:', error);
      return [];
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    const apiKey = await getApiKey('vidguard');
    if (!apiKey) {
      throw new Error('VidGuard API key not configured');
    }

    try {
      const response = await fetch(`https://api.vidguard.to/v1/user/info?key=${apiKey}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('VidGuard account info response:', data);

      if (data.status !== 200) {
        throw new Error(data.msg || 'Failed to get account info');
      }

      const result = data.result;

      return {
        email: result.Email,
        username: result.Email, // VidGuard uses email as username
        balance: result.Balance || 0,
        currency: result.Currency || '$',
        role: result.Role || 'user',
        createdAt: result.CreatedAt
      };
    } catch (error) {
      console.error('Error getting VidGuard account info:', error);
      throw error;
    }
  }

  async deleteVideo(id: string): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey();
      
      const response = await fetch('https://api.vidguard.to/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          id,
        }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('VidGuard deleteVideo error:', error);
      return false;
    }
  }
}

export class DoodStreamProvider implements IProvider {
  name = 'doodstream';

  private async getApiKey(): Promise<string> {
    const key = await getApiKey('doodstream');
    if (!key) {
      throw new Error('DoodStream API key not configured');
    }
    return key;
  }

  async upload(fileBuffer: Buffer, filename: string, options?: UploadOptions): Promise<UploadResult> {
    try {
      const apiKey = await this.getApiKey();
      
      console.log('DoodStream upload started for:', filename);
      
      // Step 1: Get upload server URL
      const serverResponse = await fetch(`https://doodstream.com/api/upload/server?key=${apiKey}`);
      
      if (!serverResponse.ok) {
        const errorText = await serverResponse.text();
        console.error('DoodStream server request failed:', serverResponse.status, errorText);
        throw new Error(`DoodStream server request failed: ${serverResponse.statusText} - ${errorText}`);
      }
      
      const serverResult = await serverResponse.json();
      console.log('DoodStream server response:', serverResult);
      
      if (serverResult.status !== 200 || !serverResult.result) {
        console.error('Invalid server response:', serverResult);
        throw new Error(`Failed to get upload server URL: ${serverResult.msg || 'Unknown error'}`);
      }
      
      // Step 2: Upload file to the server
      const formData = new FormData();
      formData.append('file', new Blob([new Uint8Array(fileBuffer)], { type: 'video/mp4' }), filename);
      formData.append('api_key', apiKey);
      
      if (options?.folder) {
        formData.append('fld_id', options.folder);
      } else {
        formData.append('fld_id', '0'); // Default to root folder
      }
      
      console.log('Uploading to:', `${serverResult.result}?${apiKey}`);
      console.log('File size:', fileBuffer.length, 'bytes');
      
      const uploadResponse = await fetch(`${serverResult.result}?${apiKey}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('DoodStream upload failed:', uploadResponse.status, errorText);
        throw new Error(`DoodStream upload failed: ${uploadResponse.statusText} - ${errorText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      console.log('DoodStream upload response:', uploadResult);
      
      if (uploadResult.status !== 200) {
        console.error('Upload failed with status:', uploadResult.status, uploadResult.msg);
        throw new Error(uploadResult.msg || 'Upload failed');
      }
      
      // Get the first file from the result array
      const firstFile = uploadResult.result?.[0];
      if (!firstFile) {
        throw new Error('Upload completed but no file data returned');
      }
      
      return {
        success: true,
        url: firstFile.download_url,
        id: firstFile.filecode,
        provider: this.name,
      };
    } catch (error) {
      console.error('DoodStream upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
      };
    }
  }

  async uploadRemote(url: string, options?: UploadOptions): Promise<UploadResult> {
    try {
      const apiKey = await this.getApiKey();
      
      const params = new URLSearchParams({
        key: apiKey,
        url: url,
      });
      
      if (options?.folder) {
        params.append('fld_id', options.folder);
      }
      
      if (options?.description) {
        params.append('new_title', options.description);
      }
      
      const response = await fetch(`https://doodstream.com/api/upload/url?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('DoodStream remote upload failed:', response.status, errorText);
        throw new Error(`DoodStream remote upload failed: ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.status !== 200) {
        throw new Error(result.msg || 'Remote upload failed');
      }
      
      return {
        success: true,
        url: `https://dood.to/d/${result.result.filecode}`,
        id: result.result.filecode,
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
      };
    }
  }

  async getVideos(options?: { page?: number; limit?: number }): Promise<VideoInfo[]> {
    try {
      const apiKey = await this.getApiKey();
      
      const params = new URLSearchParams({
        key: apiKey,
        fld_id: '0', // Root folder
      });
      
      const response = await fetch(`https://doodstream.com/api/file/list?${params}`);
      
      if (!response.ok) {
        throw new Error(`DoodStream get files failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.status !== 200) {
        throw new Error(result.msg || 'Failed to get files');
      }
      
      return (result.result?.files || []).map((file: any) => ({
        id: file.file_code,
        title: file.title,
        url: file.download_url,
        thumbnail: file.single_img,
        duration: parseInt(file.length) || 0,
        size: parseInt(file.size) || 0,
        uploadDate: file.uploaded,
      }));
    } catch (error) {
      console.error('DoodStream getVideos error:', error);
      return [];
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    const apiKey = await getApiKey('doodstream');
    if (!apiKey) {
      throw new Error('DoodStream API key not configured');
    }

    try {
      const response = await fetch(`https://doodapi.co/api/account/info?key=${apiKey}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('DoodStream account info response:', data);

      if (data.status !== 200) {
        throw new Error(data.msg || 'Failed to get account info');
      }

      const result = data.result;
      const storageUsed = parseInt(result.storage_used) || 0;
      const storageLeft = parseInt(result.storage_left) || 0;
      const totalStorage = storageUsed + storageLeft;

      return {
        email: result.email,
        username: result.email, // DoodStream uses email as username
        balance: parseFloat(result.balance) || 0,
        role: result.premim_expire && new Date(result.premim_expire) > new Date() ? 'premium' : 'free',
        storage: {
          used: storageUsed,
          total: totalStorage
        },
        premiumExpire: result.premim_expire || undefined
      };
    } catch (error) {
      console.error('Error getting DoodStream account info:', error);
      throw error;
    }
  }

  async deleteVideo(id: string): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey();
      
      const response = await fetch(`https://doodstream.com/api/file/delete?key=${apiKey}&file_code=${id}`);
      
      if (!response.ok) {
        return false;
      }
      
      const result = await response.json();
      return result.status === 200;
    } catch (error) {
      console.error('DoodStream deleteVideo error:', error);
      return false;
    }
  }
}

export class BigWarpProvider implements IProvider {
  name = 'bigwarp';

  private async getApiKey(): Promise<string> {
    const key = await getApiKey('bigwarp');
    if (!key) {
      throw new Error('BigWarp API key not configured');
    }
    return key;
  }

  async upload(fileBuffer: Buffer, filename: string, options?: UploadOptions): Promise<UploadResult> {
    try {
      const apiKey = await this.getApiKey();
      
      console.log('BigWarp upload started for:', filename);
      
      // Step 1: Get upload server URL - retry logic for BigWarp
      let serverResult;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const serverResponse = await fetch(`https://bigwarp.io/api/upload/server?key=${apiKey}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (!serverResponse.ok) {
            const errorText = await serverResponse.text();
            console.error(`BigWarp server request failed (attempt ${attempts + 1}):`, serverResponse.status, errorText);
            
            if (attempts === maxAttempts - 1) {
              throw new Error(`BigWarp servers are temporarily overloaded. Please try again in a few minutes.`);
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000 * (attempts + 1)));
            attempts++;
            continue;
          }
          
          serverResult = await serverResponse.json();
          console.log('BigWarp server response:', serverResult);
          
          if (serverResult.status !== 200 || !serverResult.result) {
            console.error('Invalid server response:', serverResult);
            if (attempts === maxAttempts - 1) {
              throw new Error(`BigWarp upload servers unavailable: ${serverResult.msg || 'Please try again later'}`);
            }
            attempts++;
            continue;
          }
          
          break; // Success, exit retry loop
        } catch (error) {
          if (attempts === maxAttempts - 1) {
            throw error;
          }
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
        }
      }
      
      // Step 2: Upload file to the server with correct form structure
      const formData = new FormData();
      formData.append('file', new Blob([new Uint8Array(fileBuffer)], { type: 'video/mp4' }), filename);
      formData.append('key', apiKey);
      
      // Add optional parameters based on API docs
      if (options?.description) {
        formData.append('file_title', options.description);
      }
      
      // Set HTML redirect to get JSON response
      formData.append('html_redirect', '0');
      
      console.log('Uploading to:', serverResult.result);
      console.log('File size:', fileBuffer.length, 'bytes');
      
      const uploadResponse = await fetch(serverResult.result, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('BigWarp upload failed:', uploadResponse.status, errorText);
        
        // Check if it's a 500 error with HTML response (server overload)
        if (uploadResponse.status === 500 && errorText.includes('<html>')) {
          throw new Error('Service Temporarily Unavailable - Server overloaded, please try again later');
        }
        
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      console.log('BigWarp upload response:', uploadResult);
      
      if (uploadResult.status !== 200) {
        console.error('Upload failed with status:', uploadResult.status, uploadResult.msg);
        throw new Error(uploadResult.msg || 'Upload processing failed');
      }
      
      // Get the first file from the files array
      const firstFile = uploadResult.files?.[0];
      if (!firstFile || firstFile.status !== 'OK') {
        throw new Error('Upload completed but file processing failed');
      }
      
      return {
        success: true,
        url: `https://bigwarp.io/${firstFile.filecode}.html`,
        id: firstFile.filecode,
        provider: this.name,
      };
    } catch (error) {
      console.error('BigWarp upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
      };
    }
  }

  async uploadRemote(url: string, options?: UploadOptions): Promise<UploadResult> {
    try {
      const apiKey = await this.getApiKey();
      
      const response = await fetch(`https://bigwarp.io/api/upload/url?key=${apiKey}&url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('BigWarp remote upload failed:', response.status, errorText);
        throw new Error(`BigWarp remote upload failed: ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.status !== 200) {
        throw new Error(result.msg || 'Remote upload failed');
      }
      
      return {
        success: true,
        url: `https://bigwarp.io/${result.result.filecode}.html`,
        id: result.result.filecode,
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
      };
    }
  }

  async getVideos(options?: { page?: number; limit?: number }): Promise<VideoInfo[]> {
    try {
      const apiKey = await this.getApiKey();
      
      const params = new URLSearchParams({
        token: apiKey,
        page: (options?.page || 1).toString(),
        per_page: (options?.limit || 20).toString(),
      });
      
      const response = await fetch(`https://api.bigwarp.com/files?${params}`);
      
      if (!response.ok) {
        throw new Error(`BigWarp get files failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.files || [];
    } catch (error) {
      console.error('BigWarp getVideos error:', error);
      return [];
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    try {
      const apiKey = await this.getApiKey();
      
      const response = await fetch(`https://bigwarp.io/api/account/info?key=${apiKey}`);
      
      if (!response.ok) {
        throw new Error(`BigWarp get account info failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.status !== 200) {
        throw new Error(result.msg || 'Failed to get account info');
      }
      
      return {
        email: result.result.email,
        username: result.result.login,
        storage: {
          used: parseInt(result.result.storage_used) || 0,
          total: (parseInt(result.result.storage_used) || 0) + (parseInt(result.result.storage_left) || 0),
        },
        bandwidth: {
          used: 0, // BigWarp doesn't provide bandwidth info in this endpoint
          total: 0,
        },
        balance: parseFloat(result.result.balance) || 0,
        currency: '$',
        role: result.result.premium === 1 ? 'premium' : 'free',
        createdAt: undefined, // Not provided by BigWarp API
        filesTotal: parseInt(result.result.files_total) || 0,
        premiumExpire: result.result.premium_expire,
      };
    } catch (error) {
      console.error('BigWarp getAccountInfo error:', error);
      return {};
    }
  }

  async deleteVideo(id: string): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey();
      
      const response = await fetch('https://api.bigwarp.com/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: apiKey,
          file_id: id,
        }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('BigWarp deleteVideo error:', error);
      return false;
    }
  }
}

export function getProvider(providerName: string): IProvider {
  switch (providerName) {
    case 'vidguard':
      return new VidGuardProvider();
    case 'bigwarp':
      return new BigWarpProvider();
    case 'doodstream':
      return new DoodStreamProvider();
    case 'streamtape':
      return new StreamTapeProvider();
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}

class StreamTapeProvider implements IProvider {
  name = 'streamtape';
  displayName = 'StreamTape';
  
  private async getApiKey(): Promise<string> {
    const apiKey = await getApiKey('streamtape');
    if (!apiKey) {
      throw new Error('StreamTape API key not configured');
    }
    return apiKey;
  }

  async upload(fileBuffer: Buffer, filename: string, options?: UploadOptions): Promise<UploadResult> {
    try {
      const apiKey = await this.getApiKey();
      
      // Get login from API key (format: login:key)
      const [login, key] = apiKey.split(':');
      if (!login || !key) {
        throw new Error('StreamTape API key must be in format "login:key"');
      }

      // Get upload URL
      const uploadUrlResponse = await fetch(`https://api.streamtape.com/file/ul?login=${login}&key=${key}`);
      
      if (!uploadUrlResponse.ok) {
        throw new Error(`Failed to get upload URL: ${uploadUrlResponse.status}`);
      }

      const uploadUrlResult = await uploadUrlResponse.json();
      
      if (uploadUrlResult.status !== 200) {
        throw new Error(`StreamTape API error: ${uploadUrlResult.msg}`);
      }

      const uploadUrl = uploadUrlResult.result.url;

      // Upload file
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'video/*' });
      formData.append('file1', blob, filename);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const uploadResult = await uploadResponse.text();
      
      // StreamTape returns HTML with JavaScript, extract the file ID
      const fileIdMatch = uploadResult.match(/https:\/\/streamtape\.com\/v\/([^\/]+)/);
      if (!fileIdMatch) {
        throw new Error('Failed to extract file URL from upload response');
      }

      const fileUrl = fileIdMatch[0];

      return {
        success: true,
        url: fileUrl,
        provider: this.name,
      };
    } catch (error) {
      console.error('StreamTape upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        provider: this.name,
      };
    }
  }

  async getAccountInfo(): Promise<Partial<AccountInfo>> {
    try {
      const apiKey = await this.getApiKey();
      const [login, key] = apiKey.split(':');
      
      if (!login || !key) {
        throw new Error('StreamTape API key must be in format "login:key"');
      }

      const response = await fetch(`https://api.streamtape.com/account/info?login=${login}&key=${key}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status !== 200) {
        throw new Error(result.msg || 'API request failed');
      }
      
      return {
        email: result.result.email,
        username: login,
        storage: {
          used: 0, // StreamTape doesn't provide storage info in account/info
          total: 0,
        },
        bandwidth: {
          used: 0,
          total: 0,
        },
        balance: 0,
        currency: '$',
        role: 'user',
        createdAt: result.result.signup_at,
        filesTotal: 0,
      };
    } catch (error) {
      console.error('StreamTape getAccountInfo error:', error);
      return {};
    }
  }

  async uploadRemote(url: string, options?: UploadOptions): Promise<UploadResult> {
    try {
      const apiKey = await this.getApiKey();
      const [login, key] = apiKey.split(':');
      
      if (!login || !key) {
        throw new Error('StreamTape API key must be in format "login:key"');
      }

      const response = await fetch(`https://api.streamtape.com/remotedl/add?login=${login}&key=${key}&url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error(`Remote upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status !== 200) {
        throw new Error(`StreamTape API error: ${result.msg}`);
      }

      return {
        success: true,
        id: result.result.id,
        provider: this.name,
      };
    } catch (error) {
      console.error('StreamTape uploadRemote error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        provider: this.name,
      };
    }
  }

  async getVideos(options?: { page?: number; limit?: number }): Promise<VideoInfo[]> {
    try {
      const apiKey = await this.getApiKey();
      const [login, key] = apiKey.split(':');
      
      if (!login || !key) {
        throw new Error('StreamTape API key must be in format "login:key"');
      }

      const response = await fetch(`https://api.streamtape.com/file/listfolder?login=${login}&key=${key}&folder=0`);
      
      if (!response.ok) {
        throw new Error(`Failed to get videos: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status !== 200) {
        throw new Error(`StreamTape API error: ${result.msg}`);
      }

      const videos: VideoInfo[] = result.result.files.map((file: any) => ({
        id: file.linkid,
        title: file.name,
        url: file.link,
        size: file.size,
        uploadDate: new Date(file.created_at).toISOString(),
      }));

      return videos;
    } catch (error) {
      console.error('StreamTape getVideos error:', error);
      return [];
    }
  }

  async deleteVideo(id: string): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey();
      const [login, key] = apiKey.split(':');
      
      if (!login || !key) {
        throw new Error('StreamTape API key must be in format "login:key"');
      }

      const response = await fetch(`https://api.streamtape.com/file/delete?login=${login}&key=${key}&file=${id}`);
      
      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.status === 200 && result.result === true;
    } catch (error) {
      console.error('StreamTape deleteVideo error:', error);
      return false;
    }
  }
}

export function getAllProviders(): IProvider[] {
  return [
    new VidGuardProvider(),
    new BigWarpProvider(),
    new DoodStreamProvider(),
    new StreamTapeProvider(),
  ];
}
