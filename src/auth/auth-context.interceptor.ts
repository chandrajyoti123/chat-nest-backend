import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsService } from 'nestjs-cls';
import { Request } from 'express';

@Injectable()
export class AuthContextInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const jwtUser = (request as any).user;

    if (jwtUser) {
      const mappedUser = {
        id: jwtUser.userId, 
        email: jwtUser.email,
        role: jwtUser.role ?? 'USER', 
      };

      this.cls.set('user', mappedUser);
    } else {
      this.cls.set('user', undefined);
    }

    return next.handle();
  }
}
