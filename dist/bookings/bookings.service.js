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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const prisma_service_1 = require("../prisma/prisma.service");
let BookingsService = class BookingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createBooking(studentId, dto) {
        const instructor = await this.prisma.instructorProfile.findUnique({
            where: { id: dto.instructorId, approvalStatus: 'APPROVED' },
        });
        if (!instructor) {
            throw new common_1.NotFoundException('Instructor not found or not approved');
        }
        const bookingDate = new Date(dto.date);
        if (bookingDate < new Date()) {
            throw new common_1.BadRequestException('Cannot book a date in the past');
        }
        const totalPrice = instructor.hourlyRate;
        const reqStart = dto.startTime;
        const reqEnd = dto.endTime;
        const existingBookings = await this.prisma.booking.findMany({
            where: {
                instructorId: dto.instructorId,
                date: bookingDate,
                status: { in: ['REQUESTED', 'ACCEPTED', 'COMPLETED', 'DISPUTED'] }
            },
            select: { startTime: true, endTime: true }
        });
        const t2m = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        const rStart = t2m(reqStart);
        const rEnd = t2m(reqEnd);
        const hasOverlap = existingBookings.some(b => {
            const bStart = t2m(b.startTime);
            const bEnd = t2m(b.endTime);
            return Math.max(rStart, bStart) < Math.min(rEnd, bEnd);
        });
        if (hasOverlap) {
            throw new common_1.BadRequestException('This time slot is no longer available');
        }
        return this.prisma.booking.create({
            data: {
                studentId,
                instructorId: dto.instructorId,
                date: bookingDate,
                startTime: dto.startTime,
                endTime: dto.endTime,
                totalPrice,
                studentNotes: dto.studentNotes
                    ? (0, sanitize_html_1.default)(dto.studentNotes, { allowedTags: [], allowedAttributes: {} })
                    : null,
            },
            include: {
                instructor: {
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                    },
                },
            },
        });
    }
    async getMyBookings(userId, role) {
        if (role === 'STUDENT') {
            return this.prisma.booking.findMany({
                where: { studentId: userId },
                include: {
                    instructor: {
                        include: {
                            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
                            location: { select: { city: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        if (role === 'INSTRUCTOR') {
            const profile = await this.prisma.instructorProfile.findUnique({
                where: { userId },
            });
            if (!profile)
                throw new common_1.NotFoundException('Instructor profile not found');
            return this.prisma.booking.findMany({
                where: { instructorId: profile.id },
                include: {
                    student: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        throw new common_1.ForbiddenException();
    }
    async getBooking(bookingId, userId, role) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                student: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                instructor: {
                    include: {
                        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
                        location: { select: { city: true } },
                    },
                },
                payment: true,
                review: true,
            },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        const isStudent = booking.studentId === userId;
        const isInstructor = booking.instructor.userId === userId;
        if (!isStudent && !isInstructor && role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Not your booking');
        }
        return booking;
    }
    async acceptBooking(bookingId, userId) {
        const booking = await this.getBookingForInstructor(bookingId, userId);
        if (booking.status !== 'REQUESTED') {
            throw new common_1.BadRequestException('Can only accept REQUESTED bookings');
        }
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'ACCEPTED' },
        });
    }
    async declineBooking(bookingId, userId) {
        const booking = await this.getBookingForInstructor(bookingId, userId);
        if (booking.status !== 'REQUESTED') {
            throw new common_1.BadRequestException('Can only decline REQUESTED bookings');
        }
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'DECLINED' },
        });
    }
    async cancelBooking(bookingId, userId, role, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { instructor: true },
        });
        if (!booking)
            throw new common_1.NotFoundException();
        const isStudent = booking.studentId === userId;
        const isInstructor = booking.instructor.userId === userId;
        if (!isStudent && !isInstructor) {
            throw new common_1.ForbiddenException('Not your booking');
        }
        if (['COMPLETED', 'CANCELLED', 'DECLINED'].includes(booking.status)) {
            throw new common_1.BadRequestException('Cannot cancel this booking');
        }
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'CANCELLED',
                cancelledBy: role,
                cancelReason: dto.reason
                    ? (0, sanitize_html_1.default)(dto.reason, { allowedTags: [], allowedAttributes: {} })
                    : null,
            },
        });
    }
    async completeBooking(bookingId, userId) {
        const booking = await this.getBookingForInstructor(bookingId, userId);
        if (booking.status !== 'ACCEPTED') {
            throw new common_1.BadRequestException('Can only complete ACCEPTED bookings');
        }
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'COMPLETED' },
        });
    }
    async getBookingForInstructor(bookingId, userId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { instructor: true },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.instructor.userId !== userId) {
            throw new common_1.ForbiddenException('Not your booking');
        }
        return booking;
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map