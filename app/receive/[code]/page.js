'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Peer from 'peerjs';
import Image from 'next/image';

export default function ReceivePage() {
  const params = useParams();
  const [status, setStatus] = useState('connecting');
  const [progress, setProgress] = useState(0);
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);

  const peerRef = useRef(null);
  const chunks = useRef([]);
  const fileMetadata = useRef(null);
  const connRef = useRef(null);

  useEffect(() => {
    if (!params?.code) return;

    console.log('Initializing receiver with code:', params.code);

    const peer = new Peer({
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      debug: 3
    });

    peerRef.current = peer;

    peer.on('open', (id) => {
      console.log('Receiver peer opened with ID:', id);
      const conn = peer.connect(`jalebi-${params.code}`);
      connRef.current = conn;

      conn.on('data', (data) => {
        console.log('Received data from sender:', data);

        if (data.type === 'file-list') {
          setFiles(data.files);
          setStatus('file-list-received');
        }

        if (data.type === 'file-chunk') {
          if (data.fileIndex !== selectedFileIndex) return;

          console.log('Received chunk:', data.offset, data.data.byteLength);
          chunks.current.push(data.data);
          setProgress((data.offset / data.fileSize) * 100);
        }

        if (data.type === 'transfer-complete') {
          if (data.fileIndex !== selectedFileIndex) return;

          console.log('All chunks received, reconstructing file...');
          const blob = new Blob(chunks.current, { type: fileMetadata.current.type });
          const url = URL.createObjectURL(blob);

          console.log('File URL:', url);
          setFileData({
            filename: fileMetadata.current.name,
            url: url
          });

          setStatus('complete');
          chunks.current = [];

          const link = document.createElement('a');
          link.href = url;
          link.download = fileMetadata.current.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });

      conn.on('open', () => {
        console.log('Connection to sender established');
        setStatus('connected');
        conn.send({ type: 'request-file' });
      });

      conn.on('close', () => {
        console.log('Connection closed');
      });

      conn.on('error', (error) => {
        console.error('Connection error:', error);
        setStatus('error');
        setError(error.message);
      });
    });

    peer.on('error', (error) => {
      console.error('Peer error:', error);
      setStatus('error');
      setError(error.message);
    });

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (connRef.current) {
        connRef.current.close();
      }
    };
  }, [params.code, selectedFileIndex]);

  useEffect(() => {
    if (fileData) {
      console.log('File data updated:', fileData);
    }
  }, [fileData]);

  const handleFileSelect = (index) => {
    setSelectedFileIndex(index);
    setStatus('downloading');
    chunks.current = [];
    fileMetadata.current = files[index];

    if (connRef.current && connRef.current.open) {
      console.log('Connection is open, requesting file chunks...');
      connRef.current.send({
        type: 'request-file-chunk',
        fileIndex: index,
        offset: 0
      });
    } else {
      console.error('Connection is not open');
      setStatus('error');
      setError('Connection is not open. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
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

      <div className="w-full max-w-xl bg-white/10 p-8 rounded-2xl border-2 border-dashed border-white/20">
        {status === 'file-list-received' && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              Select a file to download:
            </h2>
            <p className="text-sm text-white/60 mb-4">
              If the file doesn&apos;t start downloading, click it again.
            </p>
            <ul className="space-y-3">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="bg-white/10 p-4 rounded-lg cursor-pointer hover:bg-white/20 transition-all duration-200"
                  onClick={() => handleFileSelect(index)}
                >
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-sm text-white/80">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {status === 'downloading' && (
          <div className="mb-8">
            <div className="w-full bg-white/20 rounded-full h-3 mb-4">
              <div
                className="bg-yellow-500 h-3 rounded-full transition-all duration-300 relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-yellow-400 animate-pulse"></div>
              </div>
            </div>
            <p className="text-center text-white">
              Downloading: {fileMetadata.current?.name} ({progress.toFixed(1)}%)
            </p>
          </div>
        )}

        {status === 'complete' && fileData && (
          <div className="text-center">
            <p className="text-white mb-4">
              Download complete: {fileData.filename}
            </p>
            <button
              onClick={() => {
                setStatus('file-list-received');
                setFileData(null);
              }}
              className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Select Another File
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>

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