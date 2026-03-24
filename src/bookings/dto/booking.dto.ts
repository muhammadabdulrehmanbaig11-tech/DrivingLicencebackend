import {
    IsString,
    IsNotEmpty,
    IsDateString,
    MaxLength,
    IsOptional,
    Matches,
} from 'class-validator';

export class CreateBookingDto {
    @IsString()
    @IsNotEmpty()
    instructorId: string;

    @IsDateString()
    date: string;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'startTime must be HH:MM format' })
    startTime: string;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'endTime must be HH:MM format' })
    endTime: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    studentNotes?: string;
}

export class CancelBookingDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;
}

export class InstructorNotesDto {
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    notes?: string;
}
