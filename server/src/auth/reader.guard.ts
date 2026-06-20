import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { isObservable, lastValueFrom } from 'rxjs';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class ReaderGuard extends JwtAuthGuard {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const result = super.canActivate(ctx);
    if (isObservable(result)) await lastValueFrom(result);
    else await result;
    const req = ctx.switchToHttp().getRequest();
    if (req.user?.role !== 'reader') throw new ForbiddenException();
    return true;
  }
}
