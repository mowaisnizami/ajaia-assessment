import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getServiceInfo() {
    return {
      name: 'DocFlow API',
      version: '0.1.0',
      documentation: '/api/health',
    };
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'docflow-api',
      timestamp: new Date().toISOString(),
    };
  }
}
