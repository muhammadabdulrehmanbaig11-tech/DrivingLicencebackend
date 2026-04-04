import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto';
export declare class ReviewsService {
    private prisma;
    constructor(prisma: PrismaService);
    createReview(studentId: string, dto: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        instructorId: string;
        studentId: string;
        bookingId: string;
        rating: number;
        comment: string | null;
    }>;
    getInstructorReviews(instructorId: string): Promise<({
        student: {
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        instructorId: string;
        studentId: string;
        bookingId: string;
        rating: number;
        comment: string | null;
    })[]>;
}
