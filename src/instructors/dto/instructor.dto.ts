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
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransmissionType } from '@prisma/client';

export class CreateInstructorProfileDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    bio: string;

    @IsNumber()
    @Min(1)
    @Max(500)
    hourlyRate: number;

    @IsNumber()
    @Min(0)
    @Max(50)
    experienceYears: number;

    @IsEnum(TransmissionType)
    transmission: TransmissionType;

    @IsArray()
    @IsString({ each: true })
    languages: string[];

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    licenseNumber: string;
}

export class UpdateInstructorProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    bio?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(500)
    hourlyRate?: number;

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
}

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
    @MaxLength(5)
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
}

