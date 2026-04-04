import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminGuard } from '../common/guards/admin.guard';

@Module({
    imports: [PrismaModule],
    controllers: [AdminController],
    providers: [AdminService, AdminGuard],
    exports: [AdminGuard],
})
export class AdminModule { }
