import {
    Injectable,
    ForbiddenException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto';

@Injectable()
export class ReviewsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create a review for a COMPLETED booking.
     * - Only the student from that booking can review.
     * - One review per booking (unique constraint).
     * - Recalculates instructor avgRating and totalReviews.
     */
    async createReview(studentId: string, dto: CreateReviewDto) {
        // Verify booking exists, is COMPLETED, and belongs to this student
        const booking = await this.prisma.booking.findUnique({
            where: { id: dto.bookingId },
            include: { review: true },
        });

        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.studentId !== studentId) throw new ForbiddenException('Not your booking');
        if (booking.status !== 'COMPLETED') {
            throw new BadRequestException('Can only review COMPLETED bookings');
        }
        if (booking.review) {
            throw new BadRequestException('Already reviewed this booking');
        }

        // Create review
        const review = await this.prisma.review.create({
            data: {
                bookingId: dto.bookingId,
                studentId,
                instructorId: booking.instructorId,
                rating: dto.rating,
                comment: dto.comment
                    ? sanitizeHtml(dto.comment, { allowedTags: [], allowedAttributes: {} })
                    : null,
            },
        });

        // Recalculate instructor's average rating
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

    /**
     * Get reviews for a specific instructor (public).
     */
    async getInstructorReviews(instructorId: string) {
        return this.prisma.review.findMany({
            where: { instructorId },
            include: {
                student: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
}
