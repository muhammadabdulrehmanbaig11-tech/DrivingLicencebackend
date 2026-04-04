import { TransmissionType } from '@prisma/client';
declare class AvailabilitySlotDto {
    startTime: string;
    endTime: string;
}
declare class AvailabilityScheduleDto {
    monday?: AvailabilitySlotDto[];
    tuesday?: AvailabilitySlotDto[];
    wednesday?: AvailabilitySlotDto[];
    thursday?: AvailabilitySlotDto[];
    friday?: AvailabilitySlotDto[];
    saturday?: AvailabilitySlotDto[];
    sunday?: AvailabilitySlotDto[];
}
export declare class BaseInstructorProfileDto {
    bio?: string;
    gender?: string;
    hourlyRate?: number;
    pricing1Hour?: number;
    pricing2Hour?: number;
    pricing10Hour?: number;
    pricingIntensive?: number;
    experienceYears?: number;
    transmission?: TransmissionType;
    languages?: string[];
    licenseNumber?: string;
    areasCovered?: string[];
    postcodes?: string[];
    lessonTypes?: string[];
    badgeDocumentUrl?: string;
    idDocumentUrl?: string;
    insuranceDocumentUrl?: string;
    dbsDocumentUrl?: string;
    vehicleDocumentUrl?: string;
    carMake?: string;
    carModel?: string;
    carYear?: number;
    carTransmission?: TransmissionType;
    dualControl?: boolean;
    carPhotoUrl?: string;
    availability?: AvailabilityScheduleDto;
}
export declare class CreateInstructorProfileDto extends BaseInstructorProfileDto {
}
export declare class UpdateInstructorProfileDto extends BaseInstructorProfileDto {
}
export declare class SetLocationDto {
    address: string;
    city: string;
    state?: string;
    postalCode: string;
    country?: string;
    latitude: number;
    longitude: number;
}
export declare class SearchInstructorsDto {
    city?: string;
    town?: string;
    postcode?: string;
    transmission?: TransmissionType;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    limit?: number;
    offset?: number;
    sortBy?: 'priceAsc' | 'priceDesc' | 'expAsc' | 'expDesc' | 'ratingDesc' | 'newest';
}
export {};
