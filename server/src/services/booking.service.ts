import { prisma } from "../config/database";

export async function createBooking(data: {
  userId?: string;
  role: string;
  apartmentName: string;
  address: string;
  contactName: string;
  mobile: string;
  date: Date;
  timeSlot: string;
}) {
  return prisma.booking.create({ data });
}

export async function getBookingsByMobile(mobile: string) {
  return prisma.booking.findMany({
    where: { mobile },
    orderBy: { createdAt: "desc" },
  });
}
