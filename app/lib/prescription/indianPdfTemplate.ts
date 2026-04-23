export interface PrescriptionData {
  doctor: {
    full_name: string;
    degrees: string | null;
    registration_number: string | null;
    registration_council: string | null;
    clinic_name: string | null;
    clinic_address: string | null;
    phone_number: string | null;
  };
  patient: {
    full_name: string;
    date_of_birth: string | null;
    gender: string | null;
    phone_number: string | null;
    weight?: string | null;
  };
  diagnosis: string;
  allergy_warnings: string | null;
  medicines: {
    name: string;
    generic_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    route: string;
    quantity: string;
    food_timing: string;
    instructions: string;
  }[];
  follow_up_date: string | null;
  doctor_notes: string | null;
  date: string;
}

function calculateAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} yrs`;
}

function formatGender(gender: string | null): string {
  if (!gender) return "";
  const map: Record<string, string> = {
    male: "M",
    female: "F",
    other: "Other",
    prefer_not_to_say: "",
  };
  return map[gender] || gender;
}

export function generateIndianPrescriptionHTML(data: PrescriptionData): string {
  const doctorDegrees = data.doctor.degrees ? `, ${data.doctor.degrees}` : "";
  const regInfo =
    data.doctor.registration_number && data.doctor.registration_council
      ? `Reg No: ${data.doctor.registration_number} (${data.doctor.registration_council})`
      : data.doctor.registration_number
        ? `Reg No: ${data.doctor.registration_number}`
        : "";

  const patientAge = data.patient.date_of_birth
    ? calculateAge(data.patient.date_of_birth)
    : "";
  const patientGender = formatGender(data.patient.gender);

  const medicinesHTML = data.medicines
    .map(
      (med, i) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; font-size: 13px; color: #6b7280; width: 30px;">
          ${i + 1}.
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 700; font-size: 15px; letter-spacing: 0.5px; color: #111827; margin-bottom: 4px;">
            ${med.name.toUpperCase()}
          </div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">
            ${med.generic_name}
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            <span style="display: inline-block; background: #f3f4f6; border-radius: 4px; padding: 3px 8px; font-size: 12px; color: #374151;">
              ${med.route || "Oral"} · ${med.dosage}
            </span>
            <span style="display: inline-block; background: #f3f4f6; border-radius: 4px; padding: 3px 8px; font-size: 12px; color: #374151;">
              ${med.frequency}
            </span>
            <span style="display: inline-block; background: #f3f4f6; border-radius: 4px; padding: 3px 8px; font-size: 12px; color: #374151;">
              ${med.duration}
            </span>
            ${
              med.quantity
                ? `<span style="display: inline-block; background: #f3f4f6; border-radius: 4px; padding: 3px 8px; font-size: 12px; color: #374151;">Qty: ${med.quantity}</span>`
                : ""
            }
          </div>
          ${
            med.food_timing
              ? `<div style="font-size: 12px; color: #059669; margin-top: 4px; font-weight: 500;">${med.food_timing}</div>`
              : ""
          }
          ${
            med.instructions
              ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px; font-style: italic;">${med.instructions}</div>`
              : ""
          }
        </td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #111827; background: #fff;">
  <div style="max-width: 700px; margin: 0 auto; padding: 24px;">

    <!-- HEADER -->
    <div style="border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 0;">
      <div style="font-size: 22px; font-weight: 700; color: #111827;">
        Dr. ${data.doctor.full_name}${doctorDegrees}
      </div>
      ${regInfo ? `<div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${regInfo}</div>` : ""}
      ${data.doctor.clinic_name ? `<div style="font-size: 13px; color: #374151; margin-top: 6px; font-weight: 500;">${data.doctor.clinic_name}</div>` : ""}
      ${data.doctor.clinic_address ? `<div style="font-size: 12px; color: #6b7280;">${data.doctor.clinic_address}</div>` : ""}
      ${data.doctor.phone_number ? `<div style="font-size: 12px; color: #6b7280;">Ph: ${data.doctor.phone_number}</div>` : ""}
    </div>

    <!-- PATIENT INFO -->
    <div style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; display: flex; flex-wrap: wrap; gap: 24px;">
      <div>
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af;">Patient</span>
        <div style="font-size: 14px; font-weight: 600; color: #111827;">${data.patient.full_name}</div>
      </div>
      ${
        patientAge
          ? `<div>
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af;">Age</span>
        <div style="font-size: 14px; font-weight: 600; color: #111827;">${patientAge}</div>
      </div>`
          : ""
      }
      ${
        patientGender
          ? `<div>
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af;">Sex</span>
        <div style="font-size: 14px; font-weight: 600; color: #111827;">${patientGender}</div>
      </div>`
          : ""
      }
      <div>
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af;">Date</span>
        <div style="font-size: 14px; font-weight: 600; color: #111827;">${data.date}</div>
      </div>
      ${
        data.patient.weight
          ? `<div>
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af;">Weight</span>
        <div style="font-size: 14px; font-weight: 600; color: #111827;">${data.patient.weight}</div>
      </div>`
          : ""
      }
    </div>

    <!-- DIAGNOSIS -->
    ${
      data.diagnosis
        ? `<div style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
      <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af;">Diagnosis</span>
      <div style="font-size: 14px; color: #111827; margin-top: 2px;">${data.diagnosis}</div>
    </div>`
        : ""
    }

    <!-- Rx SYMBOL -->
    <div style="padding: 16px 0 8px 0;">
      <span style="font-size: 28px; font-weight: 700; font-family: serif; color: #111827;">&#8478;</span>
    </div>

    <!-- MEDICINES -->
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>
        ${medicinesHTML}
      </tbody>
    </table>

    <!-- ALLERGY WARNING -->
    ${
      data.allergy_warnings
        ? `<div style="margin-top: 16px; padding: 10px 14px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
      <span style="font-size: 13px; font-weight: 700; color: #dc2626;">&#9888; ALLERGY WARNING:</span>
      <span style="font-size: 13px; color: #991b1b; margin-left: 4px;">${data.allergy_warnings}</span>
    </div>`
        : ""
    }

    <!-- FOLLOW-UP -->
    ${
      data.follow_up_date
        ? `<div style="margin-top: 12px; font-size: 13px; color: #374151;">
      <span style="font-weight: 600;">Follow-up:</span> ${data.follow_up_date}
    </div>`
        : ""
    }

    <!-- DOCTOR NOTES -->
    ${
      data.doctor_notes
        ? `<div style="margin-top: 12px; padding: 10px 14px; background: #f9fafb; border-left: 3px solid #9ca3af; border-radius: 0 6px 6px 0;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 4px;">Notes</div>
      <div style="font-size: 13px; color: #374151;">${data.doctor_notes}</div>
    </div>`
        : ""
    }

    <!-- FOOTER / SIGNATURE -->
    <div style="margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
      <div style="display: flex; justify-content: flex-end;">
        <div style="text-align: center;">
          <div style="width: 200px; border-bottom: 1px solid #111827; margin-bottom: 8px; height: 40px;"></div>
          <div style="font-size: 14px; font-weight: 600; color: #111827;">
            Dr. ${data.doctor.full_name}${doctorDegrees}
          </div>
          ${regInfo ? `<div style="font-size: 12px; color: #6b7280;">${regInfo}</div>` : ""}
        </div>
      </div>
    </div>

  </div>
</body>
</html>`;
}
