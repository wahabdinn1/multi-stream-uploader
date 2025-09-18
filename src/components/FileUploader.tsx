'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { Upload, FileVideo, CheckCircle, AlertCircle, Globe, Link as LinkIcon, Loader2 } from 'lucide-react';

export function FileUploader() {
  const {
    uploadFiles,
    selectedProviders,
    isUploading,
    addUploadFiles,
    removeUploadFile,
    clearUploadFiles,
    updateUploadProgress,
    updateUploadStatus,
    setIsUploading,
    addHistoryEntry,
  } = useAppStore();

  const [remoteUrl, setRemoteUrl] = useState('');
  const [isRemoteUploading, setIsRemoteUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    addUploadFiles(acceptedFiles);
  }, [addUploadFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']
    },
    multiple: true,
  });

  const handleUpload = async () => {
    if (uploadFiles.length === 0 || selectedProviders.length === 0) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      
      uploadFiles.forEach(({ file }) => {
        formData.append('files', file);
      });
      
      formData.append('providers', JSON.stringify(selectedProviders));

      // Update all files to uploading status
      uploadFiles.forEach(({ id }) => {
        updateUploadStatus(id, 'uploading');
        updateUploadProgress(id, 0);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Update each file with its results
        result.results.forEach((fileResult: any) => {
          const uploadFile = uploadFiles.find(f => f.file.name === fileResult.filename);
          if (uploadFile) {
            updateUploadStatus(uploadFile.id, 'completed', fileResult.uploads);
            updateUploadProgress(uploadFile.id, 100);

            // Add to history
            const hasSuccess = fileResult.uploads.some((u: any) => u.success);
            const hasFailure = fileResult.uploads.some((u: any) => !u.success);
            
            let status: 'success' | 'partial' | 'failed' = 'success';
            if (hasFailure && hasSuccess) status = 'partial';
            else if (hasFailure) status = 'failed';

            addHistoryEntry({
              id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              filename: fileResult.filename,
              timestamp: new Date().toISOString(),
              providers: selectedProviders,
              status,
              results: fileResult.uploads,
            });
          }
        });
      } else {
        // Mark all as error
        uploadFiles.forEach(({ id }) => {
          updateUploadStatus(id, 'error');
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      uploadFiles.forEach(({ id }) => {
        updateUploadStatus(id, 'error');
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoteUpload = async () => {
    if (!remoteUrl.trim() || selectedProviders.length === 0) return;

    setIsRemoteUploading(true);

    try {
      const response = await fetch('/api/upload/remote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: remoteUrl.trim(),
          providers: selectedProviders,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Add to history
        const hasSuccess = result.results.some((r: any) => r.success);
        const hasFailure = result.results.some((r: any) => !r.success);
        
        let status: 'success' | 'partial' | 'failed' = 'success';
        if (hasFailure && hasSuccess) status = 'partial';
        else if (hasFailure) status = 'failed';

        addHistoryEntry({
          id: `remote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          filename: `Remote: ${remoteUrl}`,
          timestamp: new Date().toISOString(),
          providers: selectedProviders,
          status,
          results: result.results,
        });

        setRemoteUrl('');
        alert('Remote upload started successfully! Check history for progress.');
      } else {
        alert(`Remote upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Remote upload error:', error);
      alert('Remote upload failed. Please try again.');
    } finally {
      setIsRemoteUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'uploading':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
      default:
        return <FileVideo className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="bg-white border-4 border-black shadow-brutal transform rotate-1">
      <div className="p-4 border-b-4 border-black">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-black shadow-brutal -rotate-12">
            📁
          </div>
          <div>
            <h2 className="text-black font-black text-xl">UPLOAD FILES</h2>
            <p className="text-gray-700 font-bold text-sm">Drag & drop or click to UPLOAD! ✨</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {/* Drop Zone */}
        <Card className="glass-effect border-0 overflow-hidden relative">
          <CardContent className="p-8 relative z-10">
            <div
              {...getRootProps()}
              className={`
                border-4 border-black p-6 text-center transition-all cursor-pointer shadow-brutal
                ${isDragActive 
                  ? 'bg-cyan-200 transform translate-x-2 translate-y-2 shadow-none' 
                  : 'bg-gray-50 hover:bg-cyan-100 hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
                }
              `}
            >
              <input {...getInputProps()} />
              
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 border-3 border-black shadow-brutal flex items-center justify-center transform rotate-12">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                
                <div>
                  <h3 className="text-black font-black text-lg mb-2">
                    {isDragActive ? 'DROP FILES HERE! 🎯' : 'UPLOAD YOUR VIDEOS! 🎬'}
                  </h3>
                  <p className="text-gray-700 font-bold text-sm">
                    {isDragActive 
                      ? 'Release to upload files' 
                      : 'Drag & drop files here, or click to select'
                    }
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2 justify-center">
                  {['MP4', 'AVI', 'MOV', 'MKV'].map(format => (
                    <span key={format} className="px-2 py-1 bg-yellow-300 border-2 border-black shadow-brutal text-black text-xs font-black transform -rotate-3">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {uploadFiles.length > 0 && (
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-4 border-black shadow-brutal">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-black">
                <span className="flex items-center gap-2">
                  📁 Files ({uploadFiles.length})
                  <span className="text-sm bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-1 rounded-full text-white border-2 border-black">
                    {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''}
                  </span>
                </span>
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={clearUploadFiles}
                  disabled={isUploading}
                  className="bg-red-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal text-black"
                >
                  🗑️ Clear All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadFiles.map((uploadFile, index) => (
                <div
                  key={uploadFile.id}
                  className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border-3 border-black shadow-brutal rounded-xl p-4 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-300 animate-bounce-in"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {getStatusIcon(uploadFile.status)}
                      {uploadFile.status === 'completed' && (
                        <div className="absolute -inset-1 bg-green-400 rounded-full blur opacity-75 animate-pulse"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-black flex items-center gap-2">
                        🎬 {uploadFile.file.name}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        📊 {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      
                      {uploadFile.status === 'uploading' && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm text-black mb-2">
                            <span className="font-bold">📤 Uploading to {selectedProviders.length} provider{selectedProviders.length > 1 ? 's' : ''}...</span>
                            <span className="font-bold">{uploadFile.progress}%</span>
                          </div>
                          <Progress value={uploadFile.progress} className="h-3 bg-gray-200 border-2 border-black" />
                          <div className="mt-2 text-xs text-gray-600">
                            <div className="flex flex-wrap gap-2">
                              {selectedProviders.map((provider) => (
                                <span key={provider} className="px-2 py-1 bg-gradient-to-r from-yellow-200 to-orange-200 rounded border-2 border-black font-bold capitalize text-black shadow-brutal">
                                  {provider} ⏳
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {uploadFile.results && (
                        <div className="mt-3">
                          <div className="text-sm font-bold text-black mb-2">📊 Upload Results:</div>
                          <div className="grid grid-cols-1 gap-2">
                            {uploadFile.results.map((result, idx) => (
                              <div key={idx} className="bg-gradient-to-r from-cyan-50 to-teal-50 border-2 border-black rounded p-2 shadow-brutal rotate-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-black capitalize text-sm">
                                    {result.provider}
                                  </span>
                                  {result.success ? (
                                    <span className="text-green-600 flex items-center gap-1 text-sm font-bold">
                                      ✅ SUCCESS
                                    </span>
                                  ) : (
                                    <span className="text-red-600 flex items-center gap-1 text-sm font-bold">
                                      ❌ FAILED
                                    </span>
                                  )}
                                </div>
                                {result.success && result.url && (
                                  <div className="mt-1">
                                    <a 
                                      href={result.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                                    >
                                      🔗 {result.url}
                                    </a>
                                  </div>
                                )}
                                {!result.success && result.error && (
                                  <div className="mt-1 text-xs text-red-600 break-words">
                                    💬 {result.error}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() => removeUploadFile(uploadFile.id)}
                      disabled={isUploading}
                      className="glass-effect hover:scale-110 transition-transform hover:bg-red-500/20"
                    >
                      ❌
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* File Upload Button - Smaller Design */}
        {uploadFiles.length > 0 && (
          <div className="bg-pink-200 border-4 border-black shadow-brutal p-3 transform rotate-1">
            <button
              onClick={handleUpload}
              disabled={isUploading || selectedProviders.length === 0}
              className="w-full py-2 px-4 text-sm font-black bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white border-3 border-black shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-brutal"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  UPLOADING TO {selectedProviders.length} PROVIDER{selectedProviders.length > 1 ? 'S' : ''}...
                </>
              ) : (
                <>
                  <Upload className="mr-1 h-3 w-3" />
                  UPLOAD TO {selectedProviders.length} PROVIDER{selectedProviders.length > 1 ? 'S' : ''} 🚀
                </>
              )}
            </button>
          </div>
        )}

        {/* Remote Upload Section */}
        <div className="bg-green-200 border-4 border-black shadow-brutal p-4 space-y-3 transform -rotate-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 border-2 border-black shadow-brutal rotate-12">
              🌐
            </div>
            <div>
              <h3 className="text-black font-black text-lg">REMOTE UPLOAD</h3>
              <p className="text-gray-700 font-bold text-sm">Upload from URL! 🔗</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input
              type="url"
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="flex-1 px-3 py-2 bg-white border-3 border-black text-black placeholder-gray-500 focus:outline-none font-bold text-sm"
            />
            <button
              onClick={handleRemoteUpload}
              disabled={!remoteUrl.trim() || isRemoteUploading}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-black border-3 border-black shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isRemoteUploading ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  UPLOADING...
                </>
              ) : (
                <>
                  <Globe className="mr-1 h-3 w-3" />
                  UPLOAD
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
