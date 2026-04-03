import {
    Controller,
    Post,
    Delete,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Body,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, StorageEngine } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { Request } from 'express';

const DOCUMENT_TYPES = [
    'badgeDocumentUrl',
    'idDocumentUrl',
    'insuranceDocumentUrl',
    'dbsDocumentUrl',
    'vehicleDocumentUrl',
] as const;

type DocumentType = (typeof DOCUMENT_TYPES)[number];

// Ensure upload directory exists
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'documents');
if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage with explicit types
const storage: StorageEngine = diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: (error: Error | null, destination: string) => void,
    ) => cb(null, UPLOAD_DIR),
    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, filename: string) => void,
    ) => {
        const uniqueName = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
        cb(null, uniqueName);
    },
});

@Controller('instructors/me/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INSTRUCTOR)
export class UploadController {
    constructor(private prisma: PrismaService) {}

    /**
     * POST /api/instructors/me/documents
     * Upload a document file for the instructor application.
     *
     * Body: multipart/form-data
     *   - file: the uploaded file (PDF, JPG, PNG — max 5MB)
     *   - documentType: one of badgeDocumentUrl | idDocumentUrl | insuranceDocumentUrl | dbsDocumentUrl | vehicleDocumentUrl
     */
    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage,
            limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
            fileFilter: (
                _req: Request,
                file: Express.Multer.File,
                cb: (error: Error | null, acceptFile: boolean) => void,
            ) => {
                const allowed = /\.(pdf|jpg|jpeg|png)$/i;
                if (!allowed.test(extname(file.originalname))) {
                    return cb(
                        new BadRequestException(
                            'Only PDF, JPG, and PNG files are accepted',
                        ),
                        false,
                    );
                }
                cb(null, true);
            },
        }),
    )
    async uploadDocument(
        @CurrentUser() user: { id: string },
        @UploadedFile() file: Express.Multer.File,
        @Body('documentType') documentType: string,
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        if (!DOCUMENT_TYPES.includes(documentType as DocumentType)) {
            throw new BadRequestException(
                `Invalid documentType. Must be one of: ${DOCUMENT_TYPES.join(', ')}`,
            );
        }

        const profile = await this.prisma.instructorProfile.findUnique({
            where: { userId: user.id },
        });

        if (!profile) {
            throw new BadRequestException('Instructor profile not found. Create a profile first.');
        }

        // Delete old file if one exists for this document type
        const oldUrl = profile[documentType as DocumentType];
        if (oldUrl) {
            try {
                const oldFilename = oldUrl.split('/').pop();
                if (oldFilename) {
                    const oldPath = join(UPLOAD_DIR, oldFilename);
                    if (existsSync(oldPath)) {
                        unlinkSync(oldPath);
                    }
                }
            } catch {
                // Ignore cleanup errors
            }
        }

        // Construct the URL path for the uploaded file
        const fileUrl = `/uploads/documents/${file.filename}`;

        // Update the instructor profile with the new document URL
        await this.prisma.instructorProfile.update({
            where: { userId: user.id },
            data: { [documentType]: fileUrl },
        });

        return {
            url: fileUrl,
            filename: file.originalname,
            size: file.size,
            documentType,
        };
    }

    /**
     * DELETE /api/instructors/me/documents
     * Remove a previously uploaded document.
     */
    @Delete()
    async removeDocument(
        @CurrentUser() user: { id: string },
        @Body('documentType') documentType: string,
    ) {
        if (!DOCUMENT_TYPES.includes(documentType as DocumentType)) {
            throw new BadRequestException(
                `Invalid documentType. Must be one of: ${DOCUMENT_TYPES.join(', ')}`,
            );
        }

        const profile = await this.prisma.instructorProfile.findUnique({
            where: { userId: user.id },
        });

        if (!profile) {
            throw new BadRequestException('Profile not found');
        }

        // Delete the physical file
        const currentUrl = profile[documentType as DocumentType];
        if (currentUrl) {
            try {
                const filename = currentUrl.split('/').pop();
                if (filename) {
                    const filePath = join(UPLOAD_DIR, filename);
                    if (existsSync(filePath)) {
                        unlinkSync(filePath);
                    }
                }
            } catch {
                // Ignore cleanup errors
            }
        }

        // Clear the URL in the database
        await this.prisma.instructorProfile.update({
            where: { userId: user.id },
            data: { [documentType]: null },
        });

        return { removed: true, documentType };
    }
}
