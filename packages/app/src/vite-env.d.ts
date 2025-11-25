/// <reference types="vite/client" />

// File Handling API types
interface LaunchParams {
  readonly files: FileSystemHandle[];
}

interface LaunchQueue {
  setConsumer(consumer: (params: LaunchParams) => void): void;
}

interface FileSystemHandle {
  readonly kind: "file" | "directory";
  readonly name: string;
  getFile(): Promise<File>;
}

interface Window {
  launchQueue?: LaunchQueue;
}
