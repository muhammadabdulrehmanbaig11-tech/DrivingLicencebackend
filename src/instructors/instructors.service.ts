import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstructorProfileDto, UpdateInstructorProfileDto, SetLocationDto, SearchInstructorsDto } from './dto';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class InstructorsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create a new instructor profile for the current user.
     * Bio is sanitized to prevent XSS.
     */
    async createProfile(userId: string, dto: CreateInstructorProfileDto) {
        const existing = await this.prisma.instructorProfile.findUnique({
            where: { userId },
        });

        const data: Record<string, any> = { ...dto };
        if (dto.bio) {
            data.bio = sanitizeHtml(dto.bio, { allowedTags: [], allowedAttributes: {} });
        }

        if (existing) {
            // Update existing profile instead of erroring
            return this.prisma.instructorProfile.update({
                where: { userId },
                data,
            });
        }

        return this.prisma.instructorProfile.create({
            data: {
                userId,
                ...data,
            } as any,
        });
    }

    /**
     * Update the instructor's own profile. Ownership is enforced.
     */
    async updateProfile(userId: string, dto: UpdateInstructorProfileDto) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        const data: Record<string, any> = { ...dto };
        if (dto.bio !== undefined) {
            data.bio = sanitizeHtml(dto.bio, { allowedTags: [], allowedAttributes: {} });
        }

        return this.prisma.instructorProfile.update({
            where: { userId },
            data,
        });
    }

    /**
     * Submit an application for review. Moves from DRAFT to SUBMITTED.
     */
    async submitApplication(userId: string) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        // Basic sanity check before allowing submission
        if (!profile.licenseNumber || !profile.transmission) {
            throw new Error('Please complete the professional business details step first.');
        }

        return this.prisma.instructorProfile.update({
            where: { userId },
            data: { approvalStatus: ApprovalStatus.SUBMITTED },
        });
    }

    /**
     * Set/update instructor location.
     */
    async setLocation(userId: string, dto: SetLocationDto) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new NotFoundException('Create a profile first');
        }

        return this.prisma.instructorLocation.upsert({
            where: { instructorId: profile.id },
            create: {
                instructorId: profile.id,
                address: dto.address,
                city: dto.city,
                state: dto.state,
                postalCode: dto.postalCode,
                country: dto.country || 'United Kingdom',
                latitude: dto.latitude,
                longitude: dto.longitude,
            },
            update: {
                address: dto.address,
                city: dto.city,
                state: dto.state,
                postalCode: dto.postalCode,
                country: dto.country || 'United Kingdom',
                latitude: dto.latitude,
                longitude: dto.longitude,
            },
        });
    }

    /**
     * Get own profile (for instructor dashboard).
     */
    async getMyProfile(userId: string) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { userId },
            include: {
                location: true,
                user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
            },
        });
        if (!profile) throw new NotFoundException('Profile not found');
        return profile;
    }

    /**
     * Search APPROVED instructors. Public endpoint.
     * Uses parameterized Prisma queries. Pagination enforced.
     */
    async search(dto: SearchInstructorsDto) {
        const where: Record<string, unknown> = {
            approvalStatus: ApprovalStatus.APPROVED,
        };

        if (dto.transmission) {
            where.transmission = dto.transmission;
        }
        if (dto.minRating) {
            where.avgRating = { gte: dto.minRating };
        }
        if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
            const hourlyRate: Record<string, number> = {};
            if (dto.minPrice !== undefined) hourlyRate.gte = dto.minPrice;
            if (dto.maxPrice !== undefined) hourlyRate.lte = dto.maxPrice;
            where.hourlyRate = hourlyRate;
        }

        // Location filters
        const locationConditions: any[] = [];
        if (dto.city) {
            locationConditions.push({ city: { contains: dto.city, mode: 'insensitive' as const } });
        }
        if (dto.town) {
            locationConditions.push({ city: { contains: dto.town, mode: 'insensitive' as const } }); // Map town to city query
        }
        if (dto.postcode) {
            locationConditions.push({ postalCode: { startsWith: dto.postcode, mode: 'insensitive' as const } });
        }

        const locationFilter = locationConditions.length > 0
            ? { location: { AND: locationConditions } }
            : {};

        const limit = Math.min(dto.limit || 12, 50); // Cap at 50 to prevent scraping
        const offset = dto.offset || 0;

        let orderByClause: any = { avgRating: 'desc' }; // default
        if (dto.sortBy) {
            switch (dto.sortBy) {
                case 'priceAsc':
                    orderByClause = { hourlyRate: 'asc' };
                    break;
                case 'priceDesc':
                    orderByClause = { hourlyRate: 'desc' };
                    break;
                case 'expAsc':
                    orderByClause = { experienceYears: 'asc' };
                    break;
                case 'expDesc':
                    orderByClause = { experienceYears: 'desc' };
                    break;
                case 'ratingDesc':
                    orderByClause = { avgRating: 'desc' };
                    break;
                case 'newest':
                    orderByClause = { createdAt: 'desc' };
                    break;
            }
        }

        const [instructors, total] = await Promise.all([
            this.prisma.instructorProfile.findMany({
                where: { ...where, ...locationFilter },
                include: {
                    location: true,
                    user: { select: { firstName: true, lastName: true, avatarUrl: true } },
                },
                orderBy: orderByClause,
                take: limit,
                skip: offset,
            }),
            this.prisma.instructorProfile.count({
                where: { ...where, ...locationFilter },
            }),
        ]);

        return { instructors, total, limit, offset };
    }

    /**
     * Get a single approved instructor's public profile.
     */
    async getPublicProfile(id: string) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { id },
            include: {
                user: { select: { firstName: true, lastName: true, avatarUrl: true } },
                location: true,
                reviewsReceived: {
                    include: { student: { select: { firstName: true, avatarUrl: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!profile || profile.approvalStatus !== 'APPROVED') {
            throw new NotFoundException('Instructor profile not found or not public');
        }

        return profile;
    }

    /**
     * Get available slots for an instructor on a specific date.
     * Subtracts booked slots from the base schedule.
     */
    async getAvailability(instructorId: string, dateStr: string) {
        if (!dateStr || isNaN(Date.parse(dateStr))) {
            throw new BadRequestException('Invalid date format');
        }

        const targetDate = new Date(dateStr);
        const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // e.g., 'monday'

        const profile = await this.prisma.instructorProfile.findUnique({
            where: { id: instructorId },
            select: { availability: true }
        });

        if (!profile) {
            throw new NotFoundException('Instructor not found');
        }

        const availabilityObj = profile.availability as Record<string, { startTime: string; endTime: string }[]> | null;
        let daySlots = availabilityObj ? availabilityObj[dayOfWeek] : [];
        if (!daySlots) daySlots = [];

        // Fetch bookings for this instructor on this specific date
        // Bookings that are not cancelled or declined occupy the slot
        const bookingsOnDate = await this.prisma.booking.findMany({
            where: {
                instructorId,
                date: targetDate, // Prisma will match Date exactly if time is 00:00:00. Make sure date parsing is aligned.
                status: {
                    in: ['REQUESTED', 'ACCEPTED', 'COMPLETED', 'DISPUTED']
                }
            },
            select: { startTime: true, endTime: true }
        });

        // Compute available slots
        // Time logic: for simplicity, we assume we want strictly the base available blocks that aren't booked.
        // A smarter way: split blocks. However, standard booking usually books EXACT matching slot from availability.
        // Let's filter out any base slot that overlaps with a booking.
        const availableSlots = daySlots.filter(baseSlot => {
            const baseStart = this.timeToMinutes(baseSlot.startTime);
            const baseEnd = this.timeToMinutes(baseSlot.endTime);
            
            // Check if any booking overlaps with this base slot
            const hasOverlap = bookingsOnDate.some(b => {
                const bStart = this.timeToMinutes(b.startTime);
                const bEnd = this.timeToMinutes(b.endTime);
                // Overlap occurs if max(start1, start2) < min(end1, end2)
                return Math.max(baseStart, bStart) < Math.min(baseEnd, bEnd);
            });

            return !hasOverlap;
        });

        return {
            date: targetDate.toISOString().split('T')[0],
            dayOfWeek,
            availableSlots
        };
    }

    private timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Update Approval Status (Admin)
     */
    async updateStatus(instructorId: string, status: ApprovalStatus) {
        return this.prisma.instructorProfile.update({
            where: { id: instructorId },
            data: { approvalStatus: status },
        });
    }
}
