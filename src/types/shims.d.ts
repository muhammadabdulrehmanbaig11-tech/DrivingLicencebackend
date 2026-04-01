declare module 'express' {
  export interface Request {
    [key: string]: any;
    cookies?: any;
  }
  export interface Response {
    [key: string]: any;
    json(body?: any): any;
    clearCookie(name: string, options?: any): any;
    cookie(name: string, value: any, options?: any): any;
    status(code: number): Response;
  }
}
declare module 'passport-jwt';
declare module 'sanitize-html';
declare module 'cookie-parser';