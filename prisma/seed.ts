/**
 * Prisma Seed Script — Teach Me Drive
 *
 * Creates:
 *  - 1 Admin user
 *  - 2 Student users
 *  - 10 Instructor users with full profiles, locations, and sample reviews
 *
 * Run: npx prisma db seed
 */

import "dotenv/config";
import { PrismaClient, UserRole, TransmissionType, ApprovalStatus, BookingStatus, AdminRole } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ──────────────── Seed Data ────────────────

const instructorSeedData = [
    {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@example.com",
        bio: "Certified driving instructor with over 8 years of experience. Specialising in nervous beginners and test preparation. High first-time pass rate.",
        hourlyRate: 45,
        experienceYears: 8,
        transmission: TransmissionType.AUTOMATIC,
        languages: ["English"],
        licenseNumber: "ADI-2018-4521",
        city: "London",
        state: "England",
        postalCode: "SW1A 1AA",
        country: "UK",
        latitude: 51.5074,
        longitude: -0.1278,
        avgRating: 4.9,
        totalReviews: 128,
    },
    {
        firstName: "James",
        lastName: "Williams",
        email: "james.williams@example.com",
        bio: "Patient and calm instructor who specialises in helping anxious drivers gain confidence. Flexible schedule with weekend availability.",
        hourlyRate: 40,
        experienceYears: 6,
        transmission: TransmissionType.MANUAL,
        languages: ["English", "Welsh"],
        licenseNumber: "ADI-2019-7834",
        city: "Manchester",
        state: "England",
        postalCode: "M1 1AD",
        country: "UK",
        latitude: 53.4808,
        longitude: -2.2426,
        avgRating: 4.8,
        totalReviews: 95,
    },
    {
        firstName: "Emma",
        lastName: "Thompson",
        email: "emma.thompson@example.com",
        bio: "Friendly and professional instructor based in Birmingham. I make learning to drive fun and stress-free. Pass Plus registered.",
        hourlyRate: 38,
        experienceYears: 5,
        transmission: TransmissionType.BOTH,
        languages: ["English"],
        licenseNumber: "ADI-2020-3256",
        city: "Birmingham",
        state: "England",
        postalCode: "B1 1BB",
        country: "UK",
        latitude: 52.4862,
        longitude: -1.8904,
        avgRating: 4.7,
        totalReviews: 73,
    },
    {
        firstName: "Mohammed",
        lastName: "Khan",
        email: "mohammed.khan@example.com",
        bio: "10 years teaching experience with an excellent first-time pass rate. I speak English, Urdu and Punjabi so I can help non-native speakers feel comfortable.",
        hourlyRate: 42,
        experienceYears: 10,
        transmission: TransmissionType.AUTOMATIC,
        languages: ["English", "Urdu", "Punjabi"],
        licenseNumber: "ADI-2015-9012",
        city: "Leeds",
        state: "England",
        postalCode: "LS1 1UR",
        country: "UK",
        latitude: 53.8008,
        longitude: -1.5491,
        avgRating: 4.9,
        totalReviews: 156,
    },
    {
        firstName: "Rachel",
        lastName: "Murphy",
        email: "rachel.murphy@example.com",
        bio: "Female instructor offering a relaxed and supportive learning environment. Ideal for female students who prefer a woman instructor. Intensive courses available.",
        hourlyRate: 44,
        experienceYears: 7,
        transmission: TransmissionType.MANUAL,
        languages: ["English"],
        licenseNumber: "ADI-2018-6543",
        city: "Liverpool",
        state: "England",
        postalCode: "L1 1JD",
        country: "UK",
        latitude: 53.4084,
        longitude: -2.9916,
        avgRating: 4.8,
        totalReviews: 88,
    },
    {
        firstName: "David",
        lastName: "Chen",
        email: "david.chen@example.com",
        bio: "Mandarin and Cantonese speaking instructor in London. Dual-control car, dashcam fitted. Very patient with all skill levels.",
        hourlyRate: 48,
        experienceYears: 9,
        transmission: TransmissionType.AUTOMATIC,
        languages: ["English", "Mandarin", "Cantonese"],
        licenseNumber: "ADI-2016-1178",
        city: "London",
        state: "England",
        postalCode: "E1 6AN",
        country: "UK",
        latitude: 51.5155,
        longitude: -0.0722,
        avgRating: 4.7,
        totalReviews: 62,
    },
    {
        firstName: "Sophie",
        lastName: "Patel",
        email: "sophie.patel@example.com",
        bio: "Qualified Grade A instructor offering both manual and automatic lessons. Block booking discounts available. Coverage across South Manchester.",
        hourlyRate: 36,
        experienceYears: 4,
        transmission: TransmissionType.BOTH,
        languages: ["English", "Hindi"],
        licenseNumber: "ADI-2021-4490",
        city: "Manchester",
        state: "England",
        postalCode: "M20 3HE",
        country: "UK",
        latitude: 53.4284,
        longitude: -2.2352,
        avgRating: 4.6,
        totalReviews: 41,
    },
    {
        firstName: "Oliver",
        lastName: "Brown",
        email: "oliver.brown@example.com",
        bio: "Experienced instructor specialising in motorway lessons and advanced driving courses. DVSA approved. Perfect for building post-test confidence.",
        hourlyRate: 50,
        experienceYears: 12,
        transmission: TransmissionType.MANUAL,
        languages: ["English"],
        licenseNumber: "ADI-2013-2205",
        city: "Birmingham",
        state: "England",
        postalCode: "B15 2TT",
        country: "UK",
        latitude: 52.4729,
        longitude: -1.8983,
        avgRating: 4.9,
        totalReviews: 201,
    },
    {
        firstName: "Aisha",
        lastName: "Begum",
        email: "aisha.begum@example.com",
        bio: "Female instructor covering Leeds and surrounding areas. I specialise in intensive courses and crash courses for those in a hurry. Bengali and English spoken.",
        hourlyRate: 35,
        experienceYears: 3,
        transmission: TransmissionType.AUTOMATIC,
        languages: ["English", "Bengali"],
        licenseNumber: "ADI-2022-5567",
        city: "Leeds",
        state: "England",
        postalCode: "LS6 1PQ",
        country: "UK",
        latitude: 53.8188,
        longitude: -1.5684,
        avgRating: 4.5,
        totalReviews: 28,
    },
    {
        firstName: "Tom",
        lastName: "O'Brien",
        email: "tom.obrien@example.com",
        bio: "Laid-back and encouraging instructor in Liverpool. I've taught over 500 students to drive. Great test route knowledge for all local centres.",
        hourlyRate: 39,
        experienceYears: 11,
        transmission: TransmissionType.BOTH,
        languages: ["English"],
        licenseNumber: "ADI-2014-8834",
        city: "Liverpool",
        state: "England",
        postalCode: "L18 1HM",
        country: "UK",
        latitude: 53.3890,
        longitude: -2.9197,
        avgRating: 4.8,
        totalReviews: 112,
    },
];

async function main() {
    console.log("🌱 Seeding database...\n");

    // Hash a shared dev password
    const passwordHash = await argon2.hash("Password123!");

    // ──────── Admin ────────
    const admin = await prisma.user.upsert({
        where: { email: "admin@teachmedrive.co.uk" },
        update: {},
        create: {
            email: "admin@teachmedrive.co.uk",
            passwordHash,
            firstName: "Admin",
            lastName: "User",
            role: UserRole.ADMIN,
            isActive: true,
            emailVerified: true,
        },
    });
    console.log(`  ✅ Admin:     ${admin.email}`);

    // Create Admin Profile for the seeded admin
    await prisma.adminProfile.upsert({
        where: { userId: admin.id },
        update: {},
        create: {
            userId: admin.id,
            role: AdminRole.SUPER_ADMIN,
            permissions: [
                "manage_instructors",
                "approve_instructors",
                "reject_instructors",
                "suspend_users",
                "manage_students",
                "manage_bookings",
                "view_reports",
                "view_audit_logs",
                "manage_refunds",
                "view_payments",
                "manage_admins",
                "impersonate_users"
            ],
            mfaEnabled: false, // User will be prompted to setup on first login
        }
    });

    console.log(`  ✅ Admin:     Terminal Profile initialized`);

    // ──────── Students ────────
    const student1 = await prisma.user.upsert({
        where: { email: "student@example.com" },
        update: {},
        create: {
            email: "student@example.com",
            passwordHash,
            firstName: "Alex",
            lastName: "Rivera",
            role: UserRole.STUDENT,
            isActive: true,
            emailVerified: true,
        },
    });
    console.log(`  ✅ Student:   ${student1.email}`);

    const student2 = await prisma.user.upsert({
        where: { email: "student2@example.com" },
        update: {},
        create: {
            email: "student2@example.com",
            passwordHash,
            firstName: "Priya",
            lastName: "Sharma",
            role: UserRole.STUDENT,
            isActive: true,
            emailVerified: true,
        },
    });
    console.log(`  ✅ Student:   ${student2.email}`);

    // ──────── Instructors ────────
    for (const data of instructorSeedData) {
        const user = await prisma.user.upsert({
            where: { email: data.email },
            update: {},
            create: {
                email: data.email,
                passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                role: UserRole.INSTRUCTOR,
                isActive: true,
                emailVerified: true,
            },
        });

        // Upsert profile
        const profile = await prisma.instructorProfile.upsert({
            where: { userId: user.id },
            update: {
                avgRating: data.avgRating,
                totalReviews: data.totalReviews,
            },
            create: {
                userId: user.id,
                bio: data.bio,
                hourlyRate: data.hourlyRate,
                experienceYears: data.experienceYears,
                transmission: data.transmission,
                languages: data.languages,
                licenseNumber: data.licenseNumber,
                profileComplete: true,
                approvalStatus: ApprovalStatus.APPROVED,
                approvedAt: new Date(),
                avgRating: data.avgRating,
                totalReviews: data.totalReviews,
            },
        });

        // Upsert location
        await prisma.instructorLocation.upsert({
            where: { instructorId: profile.id },
            update: {},
            create: {
                instructorId: profile.id,
                address: `${data.firstName}'s Teaching Area`,
                city: data.city,
                state: data.state,
                postalCode: data.postalCode,
                country: data.country,
                latitude: data.latitude,
                longitude: data.longitude,
            },
        });

        console.log(`  ✅ Instructor: ${data.firstName} ${data.lastName} (${data.city}) — $${data.hourlyRate}/hr`);
    }

    // ──────── Sample Bookings (2 completed) ────────
    const firstInstructor = await prisma.instructorProfile.findFirst({
        where: { user: { email: "sarah.johnson@example.com" } },
    });

    if (firstInstructor) {
        const booking = await prisma.booking.create({
            data: {
                studentId: student1.id,
                instructorId: firstInstructor.id,
                date: new Date("2026-02-15"),
                startTime: "10:00",
                endTime: "11:00",
                status: BookingStatus.COMPLETED,
                totalPrice: 45,
            },
        });

        // Create a review for this booking
        await prisma.review.create({
            data: {
                bookingId: booking.id,
                studentId: student1.id,
                instructorId: firstInstructor.id,
                rating: 5,
                comment: "Sarah was amazing! Very patient and clear in her instructions. I passed my test on the first attempt thanks to her teaching.",
            },
        });
    }

    console.log("\n🎉 Seeding complete!\n");
    console.log("  Login credentials for all seeded accounts:");
    console.log("    Email:    <any email above>");
    console.log("    Password: Password123!");
    console.log("");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
