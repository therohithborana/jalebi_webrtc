export const saveFilesToDB = async (files) => {
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

      // Validate files before saving
      const validFiles = files.filter((file) => file && file.name && file.size && file.type);

      if (validFiles.length === 0) {
        reject(new Error('No valid files to save'));
        return;
      }

      // Remove existing files before saving new ones
      store.clear();

      // Save each file with a unique ID
      validFiles.forEach((file, index) => {
        store.put({ id: `file-${index}`, file });
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };

    request.onerror = (event) => reject(event.target.error);
  });
};

export const getFilesFromDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FileStorageDB', 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('files', 'readonly');
      const store = transaction.objectStore('files');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result.map((item) => item.file));
      request.onerror = () => reject(request.error);
    };

    request.onerror = (event) => reject(event.target.error);
  });
}; 