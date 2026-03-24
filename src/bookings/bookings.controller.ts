import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, CancelBookingDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { UserRole } from '@prisma/client';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
    constructor(private bookingsService: BookingsService) { }

    /** POST /api/bookings — Student requests a booking */
    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.STUDENT)
    create(
        @CurrentUser() user: { id: string },
        @Body() dto: CreateBookingDto,
    ) {
        return this.bookingsService.createBooking(user.id, dto);
    }

    /** GET /api/bookings/my — Get own bookings */
    @Get('my')
    getMyBookings(@CurrentUser() user: { id: string; role: string }) {
        return this.bookingsService.getMyBookings(user.id, user.role);
    }

    /** GET /api/bookings/:id — Get single booking (owner only) */
    @Get(':id')
    getBooking(
        @Param('id') id: string,
        @CurrentUser() user: { id: string; role: string },
    ) {
        return this.bookingsService.getBooking(id, user.id, user.role);
    }

    /** PATCH /api/bookings/:id/accept — Instructor accepts */
    @Patch(':id/accept')
    @UseGuards(RolesGuard)
    @Roles(UserRole.INSTRUCTOR)
    accept(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ) {
        return this.bookingsService.acceptBooking(id, user.id);
    }

    /** PATCH /api/bookings/:id/decline — Instructor declines */
    @Patch(':id/decline')
    @UseGuards(RolesGuard)
    @Roles(UserRole.INSTRUCTOR)
    decline(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ) {
        return this.bookingsService.declineBooking(id, user.id);
    }

    /** PATCH /api/bookings/:id/cancel — Either party cancels */
    @Patch(':id/cancel')
    cancel(
        @Param('id') id: string,
        @CurrentUser() user: { id: string; role: string },
        @Body() dto: CancelBookingDto,
    ) {
        return this.bookingsService.cancelBooking(id, user.id, user.role, dto);
    }

    /** PATCH /api/bookings/:id/complete — Instructor marks completed */
    @Patch(':id/complete')
    @UseGuards(RolesGuard)
    @Roles(UserRole.INSTRUCTOR)
    complete(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ) {
        return this.bookingsService.completeBooking(id, user.id);
    }
}
