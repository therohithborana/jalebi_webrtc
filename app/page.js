'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, Send, Trash2 } from 'lucide-react';
import { saveFilesToDB } from '@/lib/indexedDB';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);

  const onDrop = (acceptedFiles) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  };

  const handleDeleteFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
    <div 
      className="min-h-screen bg-black flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
      }}
    >
      <div className="text-center mb-12">
        <Image 
          src="/jalebijheta-removebg-preview.png" 
          alt="Jalebi" 
          width={256}
          height={256}
          className="mb-4 mx-auto" 
        />
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4">
          Jalebi-Fafda
        </h1>
        <p className="text-xl text-white opacity-90">
          Peer-to-peer file sharing, no server required
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`w-full max-w-sm p-6 rounded-2xl bg-white/10 border-2 border-dashed border-white/20 
          ${isDragging ? 'border-white/50' : 'border-white/20'}
          transition-all duration-200 cursor-pointer hover:bg-white/20`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-white">
          <Upload size={64} className="mb-4" />
          <p className="text-xl font-medium text-center">
            Drop it like it&apos;s Hot
          </p>
          {/* <p className="mt-2 opacity-75 text-center">
            Your files will be encrypted and shared securely. <br />
            <span className="text-sm italic">No Jalebis were harmed in the making of this app.</span>
          </p> */}
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-8 w-full max-w-xl">
          <h2 className="text-xl font-bold text-white mb-4">Selected Files:</h2>
          <ul className="bg-white/10 p-4 rounded-lg">
            {files.map((file, index) => (
              <li key={index} className="text-white flex items-center justify-between p-3 hover:bg-white/20 transition-all duration-200">
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-white/80">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteFile(index)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Trash2 size={20} className="text-red-500" />
                </button>
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

      <div className="mt-12 text-center text-white/60 text-sm">
        <p>
          Made with Jalebi&apos;s sweetness by{' '}
          <a
            href="https://www.linkedin.com/in/rohith-borana-b10778266/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline text-yellow-500"
          >
            Rohith Borana
          </a>
        </p>
      </div>
    </div>
  );
}