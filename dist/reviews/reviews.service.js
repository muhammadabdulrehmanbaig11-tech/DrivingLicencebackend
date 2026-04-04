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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createReview(studentId, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: dto.bookingId },
            include: { review: true },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.studentId !== studentId)
            throw new common_1.ForbiddenException('Not your booking');
        if (booking.status !== 'COMPLETED') {
            throw new common_1.BadRequestException('Can only review COMPLETED bookings');
        }
        if (booking.review) {
            throw new common_1.BadRequestException('Already reviewed this booking');
        }
        const review = await this.prisma.review.create({
            data: {
                bookingId: dto.bookingId,
                studentId,
                instructorId: booking.instructorId,
                rating: dto.rating,
                comment: dto.comment
                    ? (0, sanitize_html_1.default)(dto.comment, { allowedTags: [], allowedAttributes: {} })
                    : null,
            },
        });
        const stats = await this.prisma.review.aggregate({
            where: { instructorId: booking.instructorId },
            _avg: { rating: true },
            _count: { rating: true },
        });
        await this.prisma.instructorProfile.update({
            where: { id: booking.instructorId },
            data: {
                avgRating: stats._avg.rating || 0,
                totalReviews: stats._count.rating || 0,
            },
        });
        return review;
    }
    async getInstructorReviews(instructorId) {
        return this.prisma.review.findMany({
            where: { instructorId },
            include: {
                student: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map