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

        const availabilityRaw = profile.availability;
        let daySlots: { startTime: string; endTime: string }[] = [];

        if (availabilityRaw) {
            // Handle both formats the data might be stored in:
            // Format A (dict):  { monday: [{startTime, endTime}], ... }
            // Format B (array): [{ day: "Monday", slots: [{ start, end }] }, ...]
            if (Array.isArray(availabilityRaw)) {
                // Format B: array of { day, slots }
                for (const item of availabilityRaw as any[]) {
                    if (item && typeof item.day === 'string' && item.day.toLowerCase() === dayOfWeek) {
                        const rawSlots = Array.isArray(item.slots) ? item.slots : [];
                        daySlots = rawSlots.map((s: any) => ({
                            startTime: s.startTime || s.start || '',
                            endTime: s.endTime || s.end || '',
                        })).filter((s: any) => s.startTime && s.endTime);
                        break;
                    }
                }
            } else if (typeof availabilityRaw === 'object') {
                // Format A: dict keyed by day name
                const dict = availabilityRaw as Record<string, any>;
                const raw = dict[dayOfWeek] || [];
                if (Array.isArray(raw)) {
                    daySlots = raw.map((s: any) => ({
                        startTime: s.startTime || s.start || '',
                        endTime: s.endTime || s.end || '',
                    })).filter((s: any) => s.startTime && s.endTime);
                }
            }
        }

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

        // 1. Generate all possible 1-hour slots from basic availability ranges
        const allPossibleSlots: { startTime: string; endTime: string }[] = [];
        for (const range of daySlots) {
            let start = this.timeToMinutes(range.startTime);
            const end = this.timeToMinutes(range.endTime);

            // Split ranges into 1-hour intervals
            while (start + 60 <= end) {
                allPossibleSlots.push({
                    startTime: this.minutesToTime(start),
                    endTime: this.minutesToTime(start + 60),
                });
                start += 60;
            }
        }

        // 2. Filter out slots that overlap with existing bookings
        // Also handle "today" past-time filtering
        const now = new Date();
        const isToday = targetDate.toDateString() === now.toDateString();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const availableSlots = allPossibleSlots.filter(slot => {
            const sStart = this.timeToMinutes(slot.startTime);
            const sEnd = this.timeToMinutes(slot.endTime);

            // Filter if it's in the past for today
            if (isToday && sStart <= currentMinutes) {
                return false;
            }

            // Check overlap with any existing booking
            const hasOverlap = bookingsOnDate.some(b => {
                const bStart = this.timeToMinutes(b.startTime);
                const bEnd = this.timeToMinutes(b.endTime);
                // Overlap: max(start1, start2) < min(end1, end2)
                return Math.max(sStart, bStart) < Math.min(sEnd, bEnd);
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

    private minutesToTime(minutes: number): string {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
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
