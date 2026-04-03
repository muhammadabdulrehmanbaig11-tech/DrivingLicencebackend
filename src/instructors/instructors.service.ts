import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateInstructorProfileDto,
    UpdateInstructorProfileDto,
    SetLocationDto,
    SearchInstructorsDto,
} from './dto';

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

        const data = {
            bio: sanitizeHtml(dto.bio, { allowedTags: [], allowedAttributes: {} }),
            hourlyRate: dto.hourlyRate,
            experienceYears: dto.experienceYears,
            transmission: dto.transmission,
            languages: dto.languages,
            licenseNumber: dto.licenseNumber,
        };

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
            },
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

        const data: Record<string, unknown> = {};
        if (dto.bio !== undefined) {
            data.bio = sanitizeHtml(dto.bio, { allowedTags: [], allowedAttributes: {} });
        }
        if (dto.hourlyRate !== undefined) data.hourlyRate = dto.hourlyRate;
        if (dto.experienceYears !== undefined) data.experienceYears = dto.experienceYears;
        if (dto.transmission !== undefined) data.transmission = dto.transmission;
        if (dto.languages !== undefined) data.languages = dto.languages;
        if (dto.licenseNumber !== undefined) data.licenseNumber = dto.licenseNumber;

        return this.prisma.instructorProfile.update({
            where: { userId },
            data,
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
            approvalStatus: 'APPROVED',
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

        const limit = Math.min(dto.limit || 12, 20); // Cap at 20 to prevent scraping
        const offset = dto.offset || 0;

        const [instructors, total] = await Promise.all([
            this.prisma.instructorProfile.findMany({
                where: { ...where, ...locationFilter },
                include: {
                    location: true,
                    user: { select: { firstName: true, lastName: true, avatarUrl: true } },
                },
                orderBy: { avgRating: 'desc' },
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
    async getPublicProfile(instructorId: string) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { id: instructorId, approvalStatus: 'APPROVED' },
            include: {
                location: true,
                user: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
        });
        if (!profile) throw new NotFoundException('Instructor not found');
        return profile;
    }
}
