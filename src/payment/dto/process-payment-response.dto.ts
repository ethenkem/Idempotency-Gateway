export class DuplicateRequestResponseDataDto {
  // previous response status code
  previousResponseStatusCode?: number;
  // previous response body
  previousResponseBody?: any;
}

export class ProcessRaymentResponseDto {
  success: boolean;
  message: string;

  // use if isReplay is true, to indicate the status code of the previous response,
  isReplay?: boolean = false;

  // use if isReplay is true, to indicate the previous response body
  previousResponseData?: DuplicateRequestResponseDataDto;
}
