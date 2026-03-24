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
import { UserRole } from '@prisma/client';

@Controller('instructors')
export class InstructorsController {
    constructor(private instructorsService: InstructorsService) { }

    // ─── PUBLIC ENDPOINTS ───

    /** GET /api/instructors — Browse approved instructors */
    @Get()
    search(@Query() dto: SearchInstructorsDto) {
        return this.instructorsService.search(dto);
    }

    /** GET /api/instructors/:id — View single instructor profile */
    @Get(':id')
    getPublicProfile(@Param('id') id: string) {
        return this.instructorsService.getPublicProfile(id);
    }

    // ─── INSTRUCTOR-ONLY ENDPOINTS ───

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

    /** GET /api/instructors/me/profile — Get own profile */
    @Get('me/profile')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.INSTRUCTOR)
    getMyProfile(@CurrentUser() user: { id: string }) {
        return this.instructorsService.getMyProfile(user.id);
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
}
