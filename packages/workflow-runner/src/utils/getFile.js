import fs from 'fs';

export function readFileAsBase64(blobOrBuffer) {
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(blobOrBuffer)) {
    return Promise.resolve(`data:application/octet-stream;base64,${blobOrBuffer.toString('base64')}`);
  }
  return new Promise((resolve, reject) => {
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blobOrBuffer);
    } else {
      resolve(String(blobOrBuffer || ''));
    }
  });
}

export default async function getFile(path, options = {}) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(res.statusText);
    const type = options.responseType || 'text';
    if (type === 'json') return await res.json();
    if (type === 'text') return await res.text();
    return await res.arrayBuffer();
  }
  const filePath = path.startsWith('file://') ? path.replace('file://', '') : path;
  const content = await fs.promises.readFile(filePath, 'utf-8');
  if (options.responseType === 'json') {
    return JSON.parse(content);
  }
  return content;
}
