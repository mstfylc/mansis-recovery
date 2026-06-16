// Simple, invisible chunk loading error handler

const isChunkLoadError = (error: any): boolean => {
  if (!error) return false;
  const message = error.message || error.toString();
  return (
    message.includes('Loading chunk') ||
    message.includes('dynamically imported module') ||
    message.includes('Failed to fetch')
  );
};

let isReloading = false;

const handleChunkError = (error: any): boolean => {
  if (!isChunkLoadError(error) || isReloading) return false;

  console.warn('Chunk loading error detected, reloading page...');
  isReloading = true;

  // Simple, immediate reload
  setTimeout(() => {
    window.location.reload();
  }, 100);

  return true;
};

// Global error handlers
window.addEventListener('error', (event) => {
  handleChunkError(event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  if (handleChunkError(event.reason)) {
    event.preventDefault();
  }
});

export { isChunkLoadError, handleChunkError };
