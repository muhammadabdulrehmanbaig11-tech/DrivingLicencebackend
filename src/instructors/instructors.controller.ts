import {
    Controller,
    Get,
    Post,
    Patch,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { InstructorsService } from './instructors.service';
import {
    CreateInstructorProfileDto,
    UpdateInstructorProfileDto,
    SetLocationDto,
    SearchInstructorsDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { UserRole, ApprovalStatus } from '@prisma/client';

@Controller('instructors')
export class InstructorsController {
    constructor(private instructorsService: InstructorsService) { }

    // ─── PUBLIC ENDPOINTS ───

    /** GET /api/instructors — Browse approved instructors */
    @Get()
    search(@Query() dto: SearchInstructorsDto) {
        return this.instructorsService.search(dto);
    }

    // ─── INSTRUCTOR-ONLY ENDPOINTS ───
    // IMPORTANT: These "me" routes MUST be defined BEFORE the ":id" route
    // so NestJS doesn't match "me" as an :id parameter.

    /** GET /api/instructors/me/profile — Get own profile */
    @Get('me/profile')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR)
    getMyProfile(@CurrentUser() user: { id: string }) {
        return this.instructorsService.getMyProfile(user.id);
    }

    /** POST /api/instructors/me — Create profile */
    @Post('me')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR)
    createProfile(
        @CurrentUser() user: { id: string },
        @Body() dto: CreateInstructorProfileDto,
    ) {
        return this.instructorsService.createProfile(user.id, dto);
    }

    /** PATCH /api/instructors/me — Update own profile */
    @Patch('me')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR)
    updateProfile(
        @CurrentUser() user: { id: string },
        @Body() dto: UpdateInstructorProfileDto,
    ) {
        return this.instructorsService.updateProfile(user.id, dto);
    }

    /** PUT /api/instructors/me/location — Set location */
    @Put('me/location')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR)
    setLocation(
        @CurrentUser() user: { id: string },
        @Body() dto: SetLocationDto,
    ) {
        return this.instructorsService.setLocation(user.id, dto);
    }

    // ─── PUBLIC PARAMETERISED ENDPOINTS ───
    // This MUST be after all "me" routes to avoid matching "me" as an :id

    /** POST /api/instructors/me/submit — Submit application */
    @Post('me/submit')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR)
    submitApplication(@CurrentUser() user: { id: string }) {
        return this.instructorsService.submitApplication(user.id);
    }

    /** PATCH /api/instructors/:id/status — Admin application review */
    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    updateStatus(
        @Param('id') id: string,
        @Body('status') status: ApprovalStatus,
    ) {
        return this.instructorsService.updateStatus(id, status);
    }

    /** GET /api/instructors/:id — View single instructor profile */
    @Get(':id')
    getPublicProfile(@Param('id') id: string) {
        return this.instructorsService.getPublicProfile(id);
    }

    /** GET /api/instructors/:id/availability?date=YYYY-MM-DD */
    @Get(':id/availability')
    getAvailability(
        @Param('id') id: string,
        @Query('date') date: string
    ) {
        return this.instructorsService.getAvailability(id, date);
    }
}
