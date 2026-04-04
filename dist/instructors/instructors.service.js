"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstructorsService = void 0;
const common_1 = require("@nestjs/common");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let InstructorsService = class InstructorsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createProfile(userId, dto) {
        const existing = await this.prisma.instructorProfile.findUnique({
            where: { userId },
        });
        const data = { ...dto };
        if (dto.bio) {
            data.bio = (0, sanitize_html_1.default)(dto.bio, { allowedTags: [], allowedAttributes: {} });
        }
        if (existing) {
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
    async updateProfile(userId, dto) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const data = { ...dto };
        if (dto.bio !== undefined) {
            data.bio = (0, sanitize_html_1.default)(dto.bio, { allowedTags: [], allowedAttributes: {} });
        }
        return this.prisma.instructorProfile.update({
            where: { userId },
            data,
        });
    }
    async submitApplication(userId) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        if (!profile.licenseNumber || !profile.transmission) {
            throw new Error('Please complete the professional business details step first.');
        }
        return this.prisma.instructorProfile.update({
            where: { userId },
            data: { approvalStatus: client_1.ApprovalStatus.SUBMITTED },
        });
    }
    async setLocation(userId, dto) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Create a profile first');
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
    async getMyProfile(userId) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { userId },
            include: {
                location: true,
                user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
            },
        });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        return profile;
    }
    async search(dto) {
        const where = {
            approvalStatus: client_1.ApprovalStatus.APPROVED,
        };
        if (dto.transmission) {
            where.transmission = dto.transmission;
        }
        if (dto.minRating) {
            where.avgRating = { gte: dto.minRating };
        }
        if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
            const hourlyRate = {};
            if (dto.minPrice !== undefined)
                hourlyRate.gte = dto.minPrice;
            if (dto.maxPrice !== undefined)
                hourlyRate.lte = dto.maxPrice;
            where.hourlyRate = hourlyRate;
        }
        const locationConditions = [];
        if (dto.city) {
            locationConditions.push({ city: { contains: dto.city, mode: 'insensitive' } });
        }
        if (dto.town) {
            locationConditions.push({ city: { contains: dto.town, mode: 'insensitive' } });
        }
        if (dto.postcode) {
            locationConditions.push({ postalCode: { startsWith: dto.postcode, mode: 'insensitive' } });
        }
        const locationFilter = locationConditions.length > 0
            ? { location: { AND: locationConditions } }
            : {};
        const limit = Math.min(dto.limit || 12, 50);
        const offset = dto.offset || 0;
        let orderByClause = { avgRating: 'desc' };
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
    async getPublicProfile(id) {
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
            throw new common_1.NotFoundException('Instructor profile not found or not public');
        }
        return profile;
    }
    async getAvailability(instructorId, dateStr) {
        if (!dateStr || isNaN(Date.parse(dateStr))) {
            throw new common_1.BadRequestException('Invalid date format');
        }
        const targetDate = new Date(dateStr);
        const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { id: instructorId },
            select: { availability: true }
        });
        if (!profile) {
            throw new common_1.NotFoundException('Instructor not found');
        }
        const availabilityObj = profile.availability;
        let daySlots = availabilityObj ? availabilityObj[dayOfWeek] : [];
        if (!daySlots)
            daySlots = [];
        const bookingsOnDate = await this.prisma.booking.findMany({
            where: {
                instructorId,
                date: targetDate,
                status: {
                    in: ['REQUESTED', 'ACCEPTED', 'COMPLETED', 'DISPUTED']
                }
            },
            select: { startTime: true, endTime: true }
        });
        const availableSlots = daySlots.filter(baseSlot => {
            const baseStart = this.timeToMinutes(baseSlot.startTime);
            const baseEnd = this.timeToMinutes(baseSlot.endTime);
            const hasOverlap = bookingsOnDate.some(b => {
                const bStart = this.timeToMinutes(b.startTime);
                const bEnd = this.timeToMinutes(b.endTime);
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
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
    async updateStatus(instructorId, status) {
        return this.prisma.instructorProfile.update({
            where: { id: instructorId },
            data: { approvalStatus: status },
        });
    }
};
exports.InstructorsService = InstructorsService;
exports.InstructorsService = InstructorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InstructorsService);
//# sourceMappingURL=instructors.service.js.map