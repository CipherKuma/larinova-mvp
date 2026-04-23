import { NextResponse } from "next/server";
import { sendConsultationSummary } from "@/lib/resend/email";

export async function GET() {
  try {
    // Sample test data
    const testData = {
      patientEmail: "test@example.com", // Change this to your email for testing
      patientName: "John Doe",
      doctorName: "Dr. Sarah Smith",
      consultationDate: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      summary:
        "Patient presented with symptoms of seasonal allergies including sneezing, runny nose, and itchy eyes. Physical examination showed mild nasal congestion. No signs of infection. Advised on allergen avoidance and prescribed antihistamines.",
      diagnosis: "Seasonal Allergic Rhinitis (Hay Fever)",
      prescriptions: [
        {
          medicine_name: "Cetirizine 10mg",
          dosage: "10mg",
          frequency: "Once daily",
          duration: "14 days",
          instructions: "Take in the evening before bedtime",
        },
        {
          medicine_name: "Fluticasone Nasal Spray",
          dosage: "2 sprays per nostril",
          frequency: "Once daily",
          duration: "14 days",
          instructions: "Use in the morning. Shake well before use.",
        },
      ],
      doctorNotes:
        "Follow up in 2 weeks if symptoms persist. Avoid outdoor activities during high pollen count days. Keep windows closed and use air conditioning.",
    };

    // Send test email
    const result = await sendConsultationSummary(testData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send test email",
          details: result.error,
          apiKeyConfigured: !!process.env.RESEND_API_KEY,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully! Check your inbox.",
      data: result.data,
      testData: {
        to: testData.patientEmail,
        subject: `Larinova - Consultation Summary - ${testData.consultationDate}`,
      },
      apiKeyConfigured: !!process.env.RESEND_API_KEY,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        apiKeyConfigured: !!process.env.RESEND_API_KEY,
      },
      { status: 500 },
    );
  }
}
