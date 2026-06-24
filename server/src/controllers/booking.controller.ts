import { Request, Response } from "express";
import { createBooking, getBookingsByMobile } from "../services/booking.service";
import { ok, created, badRequest } from "../utils/response";

export async function createBookingHandler(req: Request, res: Response) {
  const { role, apartmentName, address, contactName, mobile, date, timeSlot } = req.body;

  if (!role || !apartmentName || !address || !contactName || !mobile || !date || !timeSlot) {
    return badRequest(res, "All fields are required");
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return badRequest(res, "Enter a valid 10-digit mobile number");
  }

  const userId: string | undefined = (req as Request & { user?: { id: string } }).user?.id;

  const booking = await createBooking({
    userId,
    role,
    apartmentName,
    address,
    contactName,
    mobile,
    date: new Date(date),
    timeSlot,
  });

  return created(res, booking, "Appointment booked successfully");
}

export async function getBookingsHandler(req: Request, res: Response) {
  const { mobile } = req.query as { mobile?: string };

  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    return badRequest(res, "A valid 10-digit mobile number is required");
  }

  const bookings = await getBookingsByMobile(mobile);
  return ok(res, bookings);
}
