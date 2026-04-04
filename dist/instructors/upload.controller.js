"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const fs_1 = require("fs");
const guards_1 = require("../common/guards");
const decorators_1 = require("../common/decorators");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
const DOCUMENT_TYPES = [
    'badgeDocumentUrl',
    'idDocumentUrl',
    'insuranceDocumentUrl',
    'dbsDocumentUrl',
    'vehicleDocumentUrl',
];
const UPLOAD_DIR = (0, path_1.join)(process.cwd(), 'uploads', 'documents');
if (!(0, fs_1.existsSync)(UPLOAD_DIR)) {
    (0, fs_1.mkdirSync)(UPLOAD_DIR, { recursive: true });
}
const storage = (0, multer_1.diskStorage)({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const uniqueName = `${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(file.originalname).toLowerCase()}`;
        cb(null, uniqueName);
    },
});
let UploadController = class UploadController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async uploadDocument(user, file, documentType) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        if (!DOCUMENT_TYPES.includes(documentType)) {
            throw new common_1.BadRequestException(`Invalid documentType. Must be one of: ${DOCUMENT_TYPES.join(', ')}`);
        }
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { userId: user.id },
        });
        if (!profile) {
            throw new common_1.BadRequestException('Instructor profile not found. Create a profile first.');
        }
        const oldUrl = profile[documentType];
        if (oldUrl) {
            try {
                const oldFilename = oldUrl.split('/').pop();
                if (oldFilename) {
                    const oldPath = (0, path_1.join)(UPLOAD_DIR, oldFilename);
                    if ((0, fs_1.existsSync)(oldPath)) {
                        (0, fs_1.unlinkSync)(oldPath);
                    }
                }
            }
            catch {
            }
        }
        const fileUrl = `/uploads/documents/${file.filename}`;
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
    async removeDocument(user, documentType) {
        if (!DOCUMENT_TYPES.includes(documentType)) {
            throw new common_1.BadRequestException(`Invalid documentType. Must be one of: ${DOCUMENT_TYPES.join(', ')}`);
        }
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { userId: user.id },
        });
        if (!profile) {
            throw new common_1.BadRequestException('Profile not found');
        }
        const currentUrl = profile[documentType];
        if (currentUrl) {
            try {
                const filename = currentUrl.split('/').pop();
                if (filename) {
                    const filePath = (0, path_1.join)(UPLOAD_DIR, filename);
                    if ((0, fs_1.existsSync)(filePath)) {
                        (0, fs_1.unlinkSync)(filePath);
                    }
                }
            }
            catch {
            }
        }
        await this.prisma.instructorProfile.update({
            where: { userId: user.id },
            data: { [documentType]: null },
        });
        return { removed: true, documentType };
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const allowed = /\.(pdf|jpg|jpeg|png)$/i;
            if (!allowed.test((0, path_1.extname)(file.originalname))) {
                return cb(new common_1.BadRequestException('Only PDF, JPG, and PNG files are accepted'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('documentType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Delete)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('documentType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "removeDocument", null);
exports.UploadController = UploadController = __decorate([
    (0, common_1.Controller)('instructors/me/documents'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.UserRole.INSTRUCTOR),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map