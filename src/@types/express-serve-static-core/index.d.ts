export {};

declare global {
  namespace Express {
    export interface Response {
      jsonc: (reply: any) => any;
    }
    export interface Request {
      id: string;
    }
  }
}
