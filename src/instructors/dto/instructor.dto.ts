import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsEnum,
    IsArray,
    MaxLength,
    Min,
    Max,
    IsOptional,
    ValidateNested,
    Matches,
    IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransmissionType } from '@prisma/client';

class AvailabilitySlotDto {
    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'StartTime must be in HH:mm format',
    })
    startTime: string;

    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'EndTime must be in HH:mm format',
    })
    endTime: string;
}

class AvailabilityScheduleDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AvailabilitySlotDto)
    monday?: AvailabilitySlotDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AvailabilitySlotDto)
    tuesday?: AvailabilitySlotDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AvailabilitySlotDto)
    wednesday?: AvailabilitySlotDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AvailabilitySlotDto)
    thursday?: AvailabilitySlotDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AvailabilitySlotDto)
    friday?: AvailabilitySlotDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AvailabilitySlotDto)
    saturday?: AvailabilitySlotDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AvailabilitySlotDto)
    sunday?: AvailabilitySlotDto[];
}


export class BaseInstructorProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    bio?: string;

    @IsOptional()
    @IsString()
    gender?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(500)
    hourlyRate?: number;

    @IsOptional()
    @IsNumber()
    pricing1Hour?: number;

    @IsOptional()
    @IsNumber()
    pricing2Hour?: number;

    @IsOptional()
    @IsNumber()
    pricing10Hour?: number;

    @IsOptional()
    @IsNumber()
    pricingIntensive?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(50)
    experienceYears?: number;

    @IsOptional()
    @IsEnum(TransmissionType)
    transmission?: TransmissionType;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    languages?: string[];

    @IsOptional()
    @IsString()
    @MaxLength(50)
    licenseNumber?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    areasCovered?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    postcodes?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    lessonTypes?: string[];

    // Document URLs
    @IsOptional()
    @IsString()
    badgeDocumentUrl?: string;

    @IsOptional()
    @IsString()
    idDocumentUrl?: string;

    @IsOptional()
    @IsString()
    insuranceDocumentUrl?: string;

    @IsOptional()
    @IsString()
    dbsDocumentUrl?: string;

    @IsOptional()
    @IsString()
    vehicleDocumentUrl?: string;

    // Vehicle fields
    @IsOptional()
    @IsString()
    carMake?: string;

    @IsOptional()
    @IsString()
    carModel?: string;

    @IsOptional()
    @IsNumber()
    carYear?: number;

    @IsOptional()
    @IsEnum(TransmissionType)
    carTransmission?: TransmissionType;

    @IsOptional()
    dualControl?: boolean;

    @IsOptional()
    @IsString()
    carPhotoUrl?: string;

    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => AvailabilityScheduleDto)
    availability?: AvailabilityScheduleDto;
}

export class CreateInstructorProfileDto extends BaseInstructorProfileDto {}

export class UpdateInstructorProfileDto extends BaseInstructorProfileDto {}

export class SetLocationDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    address: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    city: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    state?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    postalCode: string;

    @IsOptional()
    @IsString()
    @MaxLength(56)
    country?: string;

    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude: number;

    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude: number;
}

export class SearchInstructorsDto {
    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    town?: string;

    @IsOptional()
    @IsString()
    postcode?: string;

    @IsOptional()
    @IsEnum(TransmissionType)
    transmission?: TransmissionType;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Max(500)
    maxPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(5)
    minRating?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(20)
    limit?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    offset?: number;

    @IsOptional()
    @IsString()
    sortBy?: 'priceAsc' | 'priceDesc' | 'expAsc' | 'expDesc' | 'ratingDesc' | 'newest';
}

