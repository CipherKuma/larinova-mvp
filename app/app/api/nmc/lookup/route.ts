import { NextRequest, NextResponse } from "next/server";

const NMC_SEARCH_URL =
  "https://www.nmc.org.in/MCIRest/open/getPaginatedData?service=getPaginatedDoctor";
const NMC_DETAIL_URL =
  "https://www.nmc.org.in/MCIRest/open/getDataFromService?service=getDoctorDetailsByIdImrExt";

// Helper to fetch with SSL bypass
async function nmcFetch(url: string, options?: RequestInit) {
  // Use node's native http module approach
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    // Set env temporarily for this request
    const origTLS = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = origTLS;
    clearTimeout(timeout);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

interface NMCDoctor {
  doctorId: string;
  name: string;
  fatherName: string | null;
  registrationNo: string;
  council: string;
  yearOfInfo: number;
  degree: string | null;
  university: string | null;
  yearOfPassing: string | null;
  address: string | null;
  additionalQualifications: {
    degree: string;
    year: string;
    university: string;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const regNo = searchParams.get("regNo");
    const council = searchParams.get("council");

    if (!regNo) {
      return NextResponse.json(
        { error: "Registration number is required" },
        { status: 400 },
      );
    }

    // Step 1: Search by registration number
    const searchUrl = `${NMC_SEARCH_URL}&start=0&length=50&registrationNo=${encodeURIComponent(regNo)}&smcId=&name=&year=`;

    const searchRes = await nmcFetch(searchUrl, {
      headers: { Accept: "application/json" },
    });

    if (!searchRes.ok) {
      return NextResponse.json(
        { error: "NMC service unavailable" },
        { status: 502 },
      );
    }

    const searchData = await searchRes.json();

    if (!searchData.data || searchData.data.length === 0) {
      return NextResponse.json({ found: false, doctors: [] });
    }

    // Parse search results: [index, yearOfInfo, regNo, council, name, fatherName, viewLink]
    const doctors = searchData.data.map((row: any[]) => {
      // Extract doctorId from the View link HTML
      const viewHtml = row[6] || "";
      const match = viewHtml.match(/openDoctorDetailsnew\('(\d+)'/);
      const doctorId = match ? match[1] : null;

      return {
        doctorId,
        yearOfInfo: row[1],
        registrationNo: row[2],
        council: row[3],
        name: row[4],
        fatherName: row[5],
      };
    });

    // If council filter is provided, filter results
    const filtered = council
      ? doctors.filter((d: any) =>
          d.council?.toLowerCase().includes(council.toLowerCase()),
        )
      : doctors;

    // If exactly one result (or filtered to one), fetch full details
    if (filtered.length === 1 && filtered[0].doctorId) {
      const detail = await fetchDoctorDetails(
        filtered[0].doctorId,
        filtered[0].registrationNo,
      );
      if (detail) {
        return NextResponse.json({
          found: true,
          doctor: detail,
          doctors: filtered,
        });
      }
    }

    // Multiple results — return list for user to pick
    return NextResponse.json({
      found: true,
      doctor: null,
      doctors: filtered,
      total: searchData.recordsFiltered,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to lookup doctor" },
      { status: 500 },
    );
  }
}

// Fetch full doctor details by ID
export async function POST(request: NextRequest) {
  try {
    const { doctorId, regNo } = await request.json();

    if (!doctorId || !regNo) {
      return NextResponse.json(
        { error: "doctorId and regNo are required" },
        { status: 400 },
      );
    }

    const detail = await fetchDoctorDetails(doctorId, regNo);
    if (!detail) {
      return NextResponse.json(
        { error: "Doctor details not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ found: true, doctor: detail });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch doctor details" },
      { status: 500 },
    );
  }
}

async function fetchDoctorDetails(
  doctorId: string,
  regNo: string,
): Promise<NMCDoctor | null> {
  try {
    const res = await nmcFetch(NMC_DETAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: doctorId.toString(),
        regdNoValue: regNo.toString(),
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();

    // Parse additional qualifications
    const additionalQualifications: {
      degree: string;
      year: string;
      university: string;
    }[] = [];
    if (data.qualification1) {
      additionalQualifications.push({
        degree: data.qualification1,
        year: data.qualificationYear1 || "",
        university: data.universityName1 || "",
      });
    }
    if (data.qualification2) {
      additionalQualifications.push({
        degree: data.qualification2,
        year: data.qualificationYear2 || "",
        university: data.universityName2 || "",
      });
    }
    if (data.qualification3) {
      additionalQualifications.push({
        degree: data.qualification3,
        year: data.qualificationYear3 || "",
        university: data.universityName3 || "",
      });
    }

    // Combine all degrees
    const allDegrees = [
      data.doctorDegree,
      ...additionalQualifications.map((q) => q.degree),
    ]
      .filter(Boolean)
      .join(", ");

    return {
      doctorId: data.doctorId?.toString(),
      name: [data.firstName, data.middleName, data.lastName]
        .filter(Boolean)
        .join(" ")
        .trim(),
      fatherName: data.parentName || null,
      registrationNo: data.registrationNo || regNo,
      council: data.smcName || "",
      yearOfInfo: data.yearInfo,
      degree: allDegrees || data.doctorDegree || null,
      university: data.university?.trim() || null,
      yearOfPassing: data.yearOfPassing || null,
      address: data.address?.trim() || data.addressLine1?.trim() || null,
      additionalQualifications,
    };
  } catch {
    return null;
  }
}
