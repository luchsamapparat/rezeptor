declare module 'mime' {
  const mime: {
    getType: (path: string) => string | null;
  };
  export default mime;
}
