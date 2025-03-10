'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Copy } from 'lucide-react';
import Peer from 'peerjs';
import { getFilesFromDB } from '@/lib/indexedDB';

export default function SharePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [peer, setPeer] = useState(null);
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('initializing');
  const [transferProgress, setTransferProgress] = useState(0);
  const code = params.code;
  const filename = searchParams.get('filename');
  const size = searchParams.get('size');
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/receive/${code}` : '';
  const [isConnectionReady, setIsConnectionReady] = useState(false);

  useEffect(() => {
    const newPeer = new Peer(`jalebi-${code}`, {
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      debug: 3
    });

    newPeer.on('open', (id) => {
      console.log('Share peer opened with ID:', id);
      setConnectionStatus('ready');
    });

    newPeer.on('error', (error) => {
      console.error('Share peer error:', error);
      setConnectionStatus('error');
    });

    newPeer.on('connection', (conn) => {
      console.log('Incoming connection from receiver');
      setConnectionStatus('connected');

      conn.on('open', () => {
        console.log('Connection to receiver opened');
        setIsConnectionReady(true);
        
        conn.on('data', async (data) => {
          console.log('Received data from receiver:', data);
          
          if (data.type === 'request-file') {
            const files = await getFilesFromDB();
            
            if (!files || files.length === 0) {
              console.error('No file found in IndexedDB');
              return;
            }

            // Validate files before sending
            const validFiles = files.filter((file) => file && file.name && file.size && file.type);
            
            if (validFiles.length === 0) {
              console.error('No valid files found');
              return;
            }

            console.log('Sending file list:', validFiles);
            
            // Send the list of files to the receiver
            conn.send({
              type: 'file-list',
              files: validFiles.map((file) => ({
                name: file.name,
                size: file.size,
                type: file.type
              }))
            });
          }

          if (data.type === 'request-file-chunk') {
            const files = await getFilesFromDB();
            const file = files[data.fileIndex];

            if (!file) {
              console.error('File not found');
              return;
            }

            const chunkSize = 1024 * 1024; // 1MB chunks
            let offset = data.offset;
            
            while (offset < file.size) {
              const chunk = file.slice(offset, offset + chunkSize);
              const arrayBuffer = await chunk.arrayBuffer();
              
              // Check if the connection is still open
              if (!conn.open) {
                console.error('Connection closed prematurely');
                return;
              }

              // Send the chunk
              conn.send({
                type: 'file-chunk',
                fileIndex: data.fileIndex,
                data: arrayBuffer,
                offset: offset,
                filename: file.name,
                fileSize: file.size,
                mimeType: file.type
              });
              
              // Update progress
              const progress = Math.min((offset / file.size) * 100, 100);
              conn.send({ type: 'progress', progress: progress });
              
              offset += chunkSize;
            }
            
            // Ensure the connection is still open before sending the completion message
            if (conn.open) {
              console.log('Transfer complete, sending completion message');
              conn.send({ type: 'transfer-complete', fileIndex: data.fileIndex });
            } else {
              console.error('Connection closed before transfer completion');
            }
          }
        });

        conn.on('close', () => {
          console.log('Connection closed');
        });

        conn.on('error', (error) => {
          console.error('Connection error:', error);
        });
      });
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, [code]);

  useEffect(() => {
    if (isConnectionReady) {
      console.log('Connection is fully ready for data transfer');
    }
  }, [isConnectionReady]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-500 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Ready to share!</h1>
        
        <div className="mb-6">
          <p className="text-gray-600">File: {filename}</p>
          <p className="text-gray-600">Size: {(size / 1024 / 1024).toFixed(2)} MB</p>
        </div>

        <div className="flex justify-center mb-6">
          <QRCodeSVG value={shareUrl} size={200} />
        </div>

        <div className="bg-gray-100 p-4 rounded-lg mb-4 flex items-center justify-between">
          <code className="text-sm text-gray-700">{shareUrl}</code>
          <button
            onClick={copyToClipboard}
            className="ml-2 p-2 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Copy size={20} className={copied ? 'text-green-500' : 'text-gray-500'} />
          </button>
        </div>

        <p className="text-center text-gray-600 text-sm">
          Share this link or QR code with the recipient to start the transfer
        </p>
      </div>
    </div>
  );
}

