import { BookingsService } from './bookings.service';
import { CreateBookingDto, CancelBookingDto } from './dto';
export declare class BookingsController {
    private bookingsService;
    constructor(bookingsService: BookingsService);
    create(user: {
        id: string;
    }, dto: CreateBookingDto): Promise<{
        instructor: {
            user: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string;
            gender: string | null;
            hourlyRate: import("@prisma/client-runtime-utils").Decimal;
            pricing1Hour: import("@prisma/client-runtime-utils").Decimal | null;
            pricing2Hour: import("@prisma/client-runtime-utils").Decimal | null;
            pricing10Hour: import("@prisma/client-runtime-utils").Decimal | null;
            pricingIntensive: import("@prisma/client-runtime-utils").Decimal | null;
            experienceYears: number;
            transmission: import("@prisma/client").$Enums.TransmissionType;
            languages: string[];
            licenseNumber: string;
            areasCovered: string[];
            postcodes: string[];
            lessonTypes: string[];
            badgeDocumentUrl: string | null;
            idDocumentUrl: string | null;
            insuranceDocumentUrl: string | null;
            dbsDocumentUrl: string | null;
            vehicleDocumentUrl: string | null;
            carMake: string | null;
            carModel: string | null;
            carYear: number | null;
            carTransmission: import("@prisma/client").$Enums.TransmissionType | null;
            dualControl: boolean | null;
            carPhotoUrl: string | null;
            availability: import("@prisma/client/runtime/client").JsonValue | null;
            userId: string;
            profileComplete: boolean;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            approvedAt: Date | null;
            approvedBy: string | null;
            avgRating: number;
            totalReviews: number;
        };
    } & {
        date: Date;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startTime: string;
        endTime: string;
        instructorId: string;
        studentId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        totalPrice: import("@prisma/client-runtime-utils").Decimal;
        studentNotes: string | null;
        instructorNotes: string | null;
        cancelledBy: import("@prisma/client").$Enums.UserRole | null;
        cancelReason: string | null;
    }>;
    getMyBookings(user: {
        id: string;
        role: string;
    }): Promise<({
        instructor: {
            user: {
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
            location: {
                city: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string;
            gender: string | null;
            hourlyRate: import("@prisma/client-runtime-utils").Decimal;
            pricing1Hour: import("@prisma/client-runtime-utils").Decimal | null;
            pricing2Hour: import("@prisma/client-runtime-utils").Decimal | null;
            pricing10Hour: import("@prisma/client-runtime-utils").Decimal | null;
            pricingIntensive: import("@prisma/client-runtime-utils").Decimal | null;
            experienceYears: number;
            transmission: import("@prisma/client").$Enums.TransmissionType;
            languages: string[];
            licenseNumber: string;
            areasCovered: string[];
            postcodes: string[];
            lessonTypes: string[];
            badgeDocumentUrl: string | null;
            idDocumentUrl: string | null;
            insuranceDocumentUrl: string | null;
            dbsDocumentUrl: string | null;
            vehicleDocumentUrl: string | null;
            carMake: string | null;
            carModel: string | null;
            carYear: number | null;
            carTransmission: import("@prisma/client").$Enums.TransmissionType | null;
            dualControl: boolean | null;
            carPhotoUrl: string | null;
            availability: import("@prisma/client/runtime/client").JsonValue | null;
            userId: string;
            profileComplete: boolean;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            approvedAt: Date | null;
            approvedBy: string | null;
            avgRating: number;
            totalReviews: number;
        };
    } & {
        date: Date;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startTime: string;
        endTime: string;
        instructorId: string;
        studentId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        totalPrice: import("@prisma/client-runtime-utils").Decimal;
        studentNotes: string | null;
        instructorNotes: string | null;
        cancelledBy: import("@prisma/client").$Enums.UserRole | null;
        cancelReason: string | null;
    })[] | ({
        student: {
            firstName: string;
            lastName: string;
            email: string;
            id: string;
            avatarUrl: string | null;
        };
    } & {
        date: Date;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startTime: string;
        endTime: string;
        instructorId: string;
        studentId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        totalPrice: import("@prisma/client-runtime-utils").Decimal;
        studentNotes: string | null;
        instructorNotes: string | null;
        cancelledBy: import("@prisma/client").$Enums.UserRole | null;
        cancelReason: string | null;
    })[]>;
    getBooking(id: string, user: {
        id: string;
        role: string;
    }): Promise<{
        payment: {
            id: string;
            createdAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.PaymentStatus;
            bookingId: string;
            stripePaymentIntentId: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            currency: string;
            paidAt: Date | null;
            refundedAt: Date | null;
        } | null;
        review: {
            id: string;
            createdAt: Date;
            instructorId: string;
            studentId: string;
            bookingId: string;
            rating: number;
            comment: string | null;
        } | null;
        instructor: {
            user: {
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
            location: {
                city: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string;
            gender: string | null;
            hourlyRate: import("@prisma/client-runtime-utils").Decimal;
            pricing1Hour: import("@prisma/client-runtime-utils").Decimal | null;
            pricing2Hour: import("@prisma/client-runtime-utils").Decimal | null;
            pricing10Hour: import("@prisma/client-runtime-utils").Decimal | null;
            pricingIntensive: import("@prisma/client-runtime-utils").Decimal | null;
            experienceYears: number;
            transmission: import("@prisma/client").$Enums.TransmissionType;
            languages: string[];
            licenseNumber: string;
            areasCovered: string[];
            postcodes: string[];
            lessonTypes: string[];
            badgeDocumentUrl: string | null;
            idDocumentUrl: string | null;
            insuranceDocumentUrl: string | null;
            dbsDocumentUrl: string | null;
            vehicleDocumentUrl: string | null;
            carMake: string | null;
            carModel: string | null;
            carYear: number | null;
            carTransmission: import("@prisma/client").$Enums.TransmissionType | null;
            dualControl: boolean | null;
            carPhotoUrl: string | null;
            availability: import("@prisma/client/runtime/client").JsonValue | null;
            userId: string;
            profileComplete: boolean;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            approvedAt: Date | null;
            approvedBy: string | null;
            avgRating: number;
            totalReviews: number;
        };
        student: {
            firstName: string;
            lastName: string;
            id: string;
            avatarUrl: string | null;
        };
    } & {
        date: Date;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startTime: string;
        endTime: string;
        instructorId: string;
        studentId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        totalPrice: import("@prisma/client-runtime-utils").Decimal;
        studentNotes: string | null;
        instructorNotes: string | null;
        cancelledBy: import("@prisma/client").$Enums.UserRole | null;
        cancelReason: string | null;
    }>;
    accept(id: string, user: {
        id: string;
    }): Promise<{
        date: Date;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startTime: string;
        endTime: string;
        instructorId: string;
        studentId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        totalPrice: import("@prisma/client-runtime-utils").Decimal;
        studentNotes: string | null;
        instructorNotes: string | null;
        cancelledBy: import("@prisma/client").$Enums.UserRole | null;
        cancelReason: string | null;
    }>;
    decline(id: string, user: {
        id: string;
    }): Promise<{
        date: Date;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startTime: string;
        endTime: string;
        instructorId: string;
        studentId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        totalPrice: import("@prisma/client-runtime-utils").Decimal;
        studentNotes: string | null;
        instructorNotes: string | null;
        cancelledBy: import("@prisma/client").$Enums.UserRole | null;
        cancelReason: string | null;
    }>;
    cancel(id: string, user: {
        id: string;
        role: string;
    }, dto: CancelBookingDto): Promise<{
        date: Date;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startTime: string;
        endTime: string;
        instructorId: string;
        studentId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        totalPrice: import("@prisma/client-runtime-utils").Decimal;
        studentNotes: string | null;
        instructorNotes: string | null;
        cancelledBy: import("@prisma/client").$Enums.UserRole | null;
        cancelReason: string | null;
    }>;
    complete(id: string, user: {
        id: string;
    }): Promise<{
        date: Date;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startTime: string;
        endTime: string;
        instructorId: string;
        studentId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        totalPrice: import("@prisma/client-runtime-utils").Decimal;
        studentNotes: string | null;
        instructorNotes: string | null;
        cancelledBy: import("@prisma/client").$Enums.UserRole | null;
        cancelReason: string | null;
    }>;
}
