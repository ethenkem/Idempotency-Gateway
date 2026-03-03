export class ProcessRaymentResponseDto {
  success: boolean;
  message: string;
  isReplay?: boolean = false;
  // use if isReplay is true, to indicate the status code of the previous response,
  previousResponseStatusCode?: number;
  // use if isReplay is true, to indicate the X-Cache-Hit header 
  headers?: any
}
