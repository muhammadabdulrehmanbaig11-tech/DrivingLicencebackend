import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { UserRole } from '@prisma/client';

@Controller('reviews')
export class ReviewsController {
    constructor(private reviewsService: ReviewsService) { }

    /** POST /api/reviews — Student submits a review (after COMPLETED booking) */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.STUDENT)
    create(
        @CurrentUser() user: { id: string },
        @Body() dto: CreateReviewDto,
    ) {
        return this.reviewsService.createReview(user.id, dto);
    }

    /** GET /api/reviews/instructor/:id — Public: list reviews for an instructor */
    @Get('instructor/:id')
    getInstructorReviews(@Param('id') id: string) {
        return this.reviewsService.getInstructorReviews(id);
    }
}
