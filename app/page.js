'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Convert file to ArrayBuffer for proper storage
      const arrayBuffer = await file.arrayBuffer();
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: Array.from(new Uint8Array(arrayBuffer)) // Convert to standard array
      };
      
      sessionStorage.setItem('fileToShare', JSON.stringify(fileData));
      console.log('File stored in sessionStorage:', fileData);
      router.push(`/share/${code}?filename=${encodeURIComponent(file.name)}&size=${file.size}`);
    }
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
            Drop a file here, or click to select
          </p>
          <p className="mt-2 opacity-75">
            Your file will be encrypted and shared securely
          </p>
        </div>
      </div>
    </div>
  );
}