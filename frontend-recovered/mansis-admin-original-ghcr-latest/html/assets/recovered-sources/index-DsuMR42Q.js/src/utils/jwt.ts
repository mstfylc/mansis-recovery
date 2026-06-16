export const tokenDecoder = (token: string) => {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    console.log('Error decoding token:', error);
    return null;
  }
};
