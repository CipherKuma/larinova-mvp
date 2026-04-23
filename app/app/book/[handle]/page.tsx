import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingClient } from "./BookingClient";

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/booking/${handle}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return { title: "Book an Appointment | Larinova" };
    const { doctor } = await res.json();
    return { title: `Book with ${doctor.full_name} | Larinova` };
  } catch {
    return { title: "Book an Appointment | Larinova" };
  }
}

export default async function BookingPage({ params }: Props) {
  const { handle } = await params;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/booking/${handle}`,
    { next: { revalidate: 30 } },
  );
  if (!res.ok) notFound();
  const { doctor, availability } = await res.json();
  return (
    <BookingClient
      handle={handle}
      doctor={doctor}
      availability={availability}
    />
  );
}
