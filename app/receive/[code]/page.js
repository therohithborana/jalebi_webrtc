'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Download } from 'lucide-react';
import Peer from 'peerjs';

export default function ReceivePage() {
  const params = useParams();
  const [status, setStatus] = useState('connecting');
  const [progress, setProgress] = useState(0);
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState(null);

  // Add a ref to track chunks
  const chunks = useRef([]);
  // Add a ref for file metadata
  const fileMetadata = useRef(null);

  useEffect(() => {
    if (!params?.code) return;

    console.log('Initializing receiver with code:', params.code);

    const peer = new Peer({
      host: 'localhost',
      port: 9000,
      path: '/myapp',
      debug: 3
    });

    peer.on('open', (id) => {
      console.log('Receiver peer opened with ID:', id);
      const conn = peer.connect(`jalebi-${params.code}`);

      // Add this message listener before opening connection
      conn.on('data', (data) => {
        console.log('Received initial handshake:', data);
      });

      conn.on('open', () => {
        console.log('Connection to sender established');
        setStatus('connected');
        
        // Add connection state logging
        console.log('Connection readyState:', conn.peerConnection.connectionState);
        console.log('Data channel readyState:', conn.dataChannel.readyState);
        
        // Add slight delay to ensure channel is ready
        setTimeout(() => {
          console.log('Requesting file transfer');
          conn.send({ type: 'request-file' });
        }, 500);
      });

      conn.on('error', (error) => {
        console.error('Connection error:', error);
        setStatus('error');
        setError(error.message);
      });

      conn.on('data', (data) => {
        console.log('Received data of type:', data.type);

        if (data.type === 'file-chunk') {
          // Store metadata in ref if not already set
          if (!fileMetadata.current) {
            fileMetadata.current = {
              filename: data.filename,
              fileSize: data.fileSize,
              mimeType: data.mimeType
            };
            // Update state for UI
            setFileData(fileMetadata.current);
          }
          
          chunks.current.push(data.data);
          const progress = (data.offset / data.fileSize) * 100;
          setProgress(progress);
        }
        else if (data.type === 'transfer-complete') {
          console.log('Transfer complete, processing file');
          try {
            if (!fileMetadata.current) {
              throw new Error('File metadata not received');
            }
            
            // Combine all chunks from ref
            const blob = new Blob(chunks.current, { type: fileMetadata.current.mimeType });
            chunks.current = []; // Reset chunks
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileMetadata.current.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setStatus('complete');
          } catch (error) {
            console.error('Error processing file:', error);
            setStatus('error');
            setError(error.message);
          }
        }

        console.log('First chunk received:', data);
        console.log('Current fileMetadata:', fileMetadata.current);
        console.log('Chunks received:', chunks.current.length);
      });
    });

    peer.on('error', (error) => {
      console.error('Peer error:', error);
      setStatus('error');
      setError(error.message);
    });

    return () => {
      peer.destroy();
    };
  }, [params?.code]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-500 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl">
        <div className="flex flex-col items-center">
          <Download size={64} className="text-orange-500 mb-4" />
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {status === 'connecting' ? 'Connecting...' : 
             status === 'connected' ? 'Receiving File' :
             status === 'complete' ? 'Download Complete' :
             status === 'error' ? 'Error' : 'Waiting...'}
          </h1>

          {status === 'error' && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              Error: {error || 'Failed to transfer file'}
            </div>
          )}

          {(status === 'connected' || status === 'transferring') && (
            <div className="w-full">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {fileData && (
                <p className="text-center text-gray-600 mb-2">
                  Receiving: {fileData.filename}
                </p>
              )}
              <p className="text-center text-gray-600">
                {progress.toFixed(1)}% complete
              </p>
            </div>
          )}

          {status === 'complete' && (
            <p className="text-center text-green-600">
              File download should begin automatically
            </p>
          )}
        </div>
      </div>
    </div>
  );
}