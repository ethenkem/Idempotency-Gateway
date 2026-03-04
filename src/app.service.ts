import { ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    throw new ForbiddenException('This endpoint is not accessible.');
  }
}
