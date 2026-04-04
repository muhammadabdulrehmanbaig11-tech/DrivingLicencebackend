import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto';
export declare class ReviewsController {
    private reviewsService;
    constructor(reviewsService: ReviewsService);
    create(user: {
        id: string;
    }, dto: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        instructorId: string;
        studentId: string;
        bookingId: string;
        rating: number;
        comment: string | null;
    }>;
    getInstructorReviews(id: string): Promise<({
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
