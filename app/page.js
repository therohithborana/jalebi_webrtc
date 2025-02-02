'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, Send } from 'lucide-react';
import { saveFilesToDB } from '@/lib/indexedDB';

export default function Home() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);

  const onDrop = (acceptedFiles) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  };

  const handleSend = async () => {
    if (files.length === 0) return;
    
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Filter out duplicate files
    const uniqueFiles = files.filter((file, index, self) =>
      index === self.findIndex((f) => f.name === file.name && f.size === file.size)
    );
    
    await saveFilesToDB(uniqueFiles);
    
    const filenames = uniqueFiles.map((file) => encodeURIComponent(file.name)).join(',');
    const totalSize = uniqueFiles.reduce((sum, file) => sum + file.size, 0);
    
    router.push(`/share/${code}?filenames=${filenames}&size=${totalSize}`);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-500 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Jalebi-Fafda
        </h1>
        <p className="text-xl text-white opacity-90">
          Peer-to-peer file sharing, no server required
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`w-full max-w-xl p-12 rounded-xl bg-white/10 backdrop-blur-md border-4 border-dashed 
          ${isDragging ? 'border-white' : 'border-white/50'}
          transition-all duration-200 cursor-pointer hover:bg-white/20`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-white">
          <Upload size={64} className="mb-4" />
          <p className="text-xl font-medium text-center">
            Drop files here, or click to select
          </p>
          <p className="mt-2 opacity-75">
            Your files will be encrypted and shared securely
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-8 w-full max-w-xl">
          <h2 className="text-xl font-bold text-white mb-4">Selected Files:</h2>
          <ul className="bg-white/10 p-4 rounded-lg">
            {files.map((file, index) => (
              <li key={index} className="text-white">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
          <button
            onClick={handleSend}
            className="mt-4 w-full bg-white text-orange-500 py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <Send size={20} />
            Send Files
          </button>
        </div>
      )}
    </div>
  );
}