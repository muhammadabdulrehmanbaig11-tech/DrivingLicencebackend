import { Module } from '@nestjs/common';
import { InstructorsController } from './instructors.controller';
import { UploadController } from './upload.controller';
import { InstructorsService } from './instructors.service';

@Module({
    controllers: [InstructorsController, UploadController],
    providers: [InstructorsService],
    exports: [InstructorsService],
})
export class InstructorsModule { }
