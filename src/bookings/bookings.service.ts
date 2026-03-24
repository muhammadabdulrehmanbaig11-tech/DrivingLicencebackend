import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto, CancelBookingDto } from './dto';

@Injectable()
export class BookingsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Student requests a booking with an approved instructor.
     * Price is calculated server-side (never from client).
     */
    async createBooking(studentId: string, dto: CreateBookingDto) {
        // Verify instructor exists and is approved
        const instructor = await this.prisma.instructorProfile.findUnique({
            where: { id: dto.instructorId, approvalStatus: 'APPROVED' },
        });
        if (!instructor) {
            throw new NotFoundException('Instructor not found or not approved');
        }

        // Prevent booking in the past
        const bookingDate = new Date(dto.date);
        if (bookingDate < new Date()) {
            throw new BadRequestException('Cannot book a date in the past');
        }

        // Calculate total price server-side
        const totalPrice = instructor.hourlyRate;

        return this.prisma.booking.create({
            data: {
                studentId,
                instructorId: dto.instructorId,
                date: bookingDate,
                startTime: dto.startTime,
                endTime: dto.endTime,
                totalPrice,
                studentNotes: dto.studentNotes
                    ? sanitizeHtml(dto.studentNotes, { allowedTags: [], allowedAttributes: {} })
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

    /**
     * Get bookings for the current user (student or instructor).
     * Enforces ownership — users can only see their own.
     */
    async getMyBookings(userId: string, role: string) {
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
            if (!profile) throw new NotFoundException('Instructor profile not found');

            return this.prisma.booking.findMany({
                where: { instructorId: profile.id },
                include: {
                    student: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        }

        throw new ForbiddenException();
    }

    /**
     * Get a single booking (with ownership check).
     */
    async getBooking(bookingId: string, userId: string, role: string) {
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

        if (!booking) throw new NotFoundException('Booking not found');

        // Ownership check
        const isStudent = booking.studentId === userId;
        const isInstructor = booking.instructor.userId === userId;
        if (!isStudent && !isInstructor && role !== 'ADMIN') {
            throw new ForbiddenException('Not your booking');
        }

        return booking;
    }

    /**
     * Instructor accepts a booking request.
     */
    async acceptBooking(bookingId: string, userId: string) {
        const booking = await this.getBookingForInstructor(bookingId, userId);

        if (booking.status !== 'REQUESTED') {
            throw new BadRequestException('Can only accept REQUESTED bookings');
        }

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'ACCEPTED' },
        });
    }

    /**
     * Instructor declines a booking request.
     */
    async declineBooking(bookingId: string, userId: string) {
        const booking = await this.getBookingForInstructor(bookingId, userId);

        if (booking.status !== 'REQUESTED') {
            throw new BadRequestException('Can only decline REQUESTED bookings');
        }

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'DECLINED' },
        });
    }

    /**
     * Either party cancels a booking.
     */
    async cancelBooking(bookingId: string, userId: string, role: string, dto: CancelBookingDto) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { instructor: true },
        });
        if (!booking) throw new NotFoundException();

        // Ownership check
        const isStudent = booking.studentId === userId;
        const isInstructor = booking.instructor.userId === userId;
        if (!isStudent && !isInstructor) {
            throw new ForbiddenException('Not your booking');
        }

        if (['COMPLETED', 'CANCELLED', 'DECLINED'].includes(booking.status)) {
            throw new BadRequestException('Cannot cancel this booking');
        }

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'CANCELLED',
                cancelledBy: role as 'STUDENT' | 'INSTRUCTOR',
                cancelReason: dto.reason
                    ? sanitizeHtml(dto.reason, { allowedTags: [], allowedAttributes: {} })
                    : null,
            },
        });
    }

    /**
     * Instructor marks a booking as completed.
     */
    async completeBooking(bookingId: string, userId: string) {
        const booking = await this.getBookingForInstructor(bookingId, userId);

        if (booking.status !== 'ACCEPTED') {
            throw new BadRequestException('Can only complete ACCEPTED bookings');
        }

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'COMPLETED' },
        });
    }

    /**
     * Helper: get a booking and verify the current user is its instructor.
     */
    private async getBookingForInstructor(bookingId: string, userId: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { instructor: true },
        });
        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.instructor.userId !== userId) {
            throw new ForbiddenException('Not your booking');
        }
        return booking;
    }
}
