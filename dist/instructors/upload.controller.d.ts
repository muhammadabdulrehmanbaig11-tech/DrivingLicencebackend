import { PrismaService } from '../prisma/prisma.service';
export declare class UploadController {
    private prisma;
    constructor(prisma: PrismaService);
    uploadDocument(user: {
        id: string;
    }, file: Express.Multer.File, documentType: string): Promise<{
        url: string;
        filename: string;
        size: number;
        documentType: string;
    }>;
    removeDocument(user: {
        id: string;
    }, documentType: string): Promise<{
        removed: boolean;
        documentType: string;
    }>;
}
