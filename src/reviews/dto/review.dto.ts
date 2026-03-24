import {
    IsString,
    IsInt,
    Min,
    Max,
    MaxLength,
    IsOptional,
    IsNotEmpty,
} from 'class-validator';

export class CreateReviewDto {
    @IsString()
    @IsNotEmpty()
    bookingId: string;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    comment?: string;
}
