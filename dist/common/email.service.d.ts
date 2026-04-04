export declare class EmailService {
    private readonly logger;
    private transporter;
    constructor();
    sendPasswordReset(to: string, resetLink: string): Promise<void>;
}
