export declare class CreateBookingDto {
    instructorId: string;
    date: string;
    startTime: string;
    endTime: string;
    studentNotes?: string;
}
export declare class CancelBookingDto {
    reason?: string;
}
export declare class InstructorNotesDto {
    notes?: string;
}
