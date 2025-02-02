export const saveFileToDB = async (file) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FileStorageDB', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('files', 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.put({ id: 'fileToShare', file });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    };

    request.onerror = (event) => reject(event.target.error);
  });
};

export const getFileFromDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FileStorageDB', 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('files', 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get('fileToShare');

      request.onsuccess = () => resolve(request.result?.file);
      request.onerror = () => reject(request.error);
    };

    request.onerror = (event) => reject(event.target.error);
  });
}; 