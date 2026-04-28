import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DiscoveryForm,
  type DiscoveryFormContent,
} from "@/components/DiscoveryForm";
import { SITE_URL } from "@/lib/metadata";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return [{ locale: "in" }, { locale: "id" }];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  if (locale === "id") {
    const title = "Survei Diskoveri — Gratis 1 Bulan Larinova";
    const description =
      "Bantu kami kenali tantangan harian praktek Anda dan dapatkan akses gratis 1 bulan ke seluruh platform OPD Larinova: booking, intake AI, Prep Brief, catatan SOAP real-time, dan tindak lanjut otomatis.";
    return {
      title,
      description,
      alternates: {
        canonical: `${SITE_URL}/id/discovery-survey`,
        languages: {
          "en-IN": `${SITE_URL}/in/discovery-survey`,
          id: `${SITE_URL}/id/discovery-survey`,
          "x-default": `${SITE_URL}/in/discovery-survey`,
        },
      },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/id/discovery-survey`,
        locale: "id_ID",
        type: "website",
      },
      robots: { index: false, follow: true },
    };
  }

  const title = "Discovery Survey — 1 Month Free Larinova";
  const description =
    "Tell us about your day-to-day clinic workflow and get 1 month of free access to the full Larinova OPD platform: patient booking, AI-guided intake, pre-consult Prep Briefs, real-time SOAP notes, ICD-10 coding, prescriptions, and automated follow-up.";
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/in/discovery-survey`,
      languages: {
        "en-IN": `${SITE_URL}/in/discovery-survey`,
        id: `${SITE_URL}/id/discovery-survey`,
        "x-default": `${SITE_URL}/in/discovery-survey`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/in/discovery-survey`,
      locale: "en_IN",
      type: "website",
    },
    robots: { index: false, follow: true },
  };
}

const inContent: DiscoveryFormContent = {
  locale: "in",
  meta: {
    backHome: "← Back to Home",
    badge: "1 Month Free",
    heading: "Tell us about your",
    headingAccent: "day-to-day",
    subtitle:
      "Help us understand your challenges — just 2 minutes. Your answers help us improve Larinova.",
    sideImage: "/images/doctor-phone.jpg",
    sideQuote: "2 hours every day on paperwork. Larinova gave it back to me.",
    sideAttribution: "Dr. Rajan Kumar, Cardiologist, Chennai",
  },
  sections: {
    personal: {
      title: "Personal Information",
      fields: {
        name: "Doctor's Name",
        specialization: "Specialization",
        clinic: "Clinic / Hospital Name",
        city: "City",
        whatsapp: "WhatsApp Number",
        email: "Email (optional)",
      },
    },
    practice: {
      title: "Current Practice Setup",
      patientsQ: "How many patients do you see on average per day?",
      patientsOptions: [
        "1–5 patients",
        "6–15 patients",
        "16–30 patients",
        "30+ patients",
      ],
      storageQ: "Where do you currently store your patient data?",
      storageOptions: [
        "Paper / notebook",
        "Excel / Google Sheets",
        "Clinic software",
        "Other",
      ],
      otherPlaceholder: "Please specify...",
    },
    challenges: {
      title: "Daily Challenges",
      paperworkQ: "How much time do you spend on paperwork in a day?",
      paperworkOptions: [
        "< 30 minutes",
        "30 min – 1 hour",
        "1–2 hours",
        "> 2 hours",
      ],
      shiftQ:
        "When you finish your shift, are there still patient notes you haven't completed?",
      shiftOptions: ["Rarely", "Sometimes", "Often", "Almost every day"],
      referralQ:
        "How long does it take to write a referral letter or medical certificate per patient?",
      referralOptions: [
        "< 2 minutes",
        "2–5 minutes",
        "5–10 minutes",
        "> 10 minutes",
      ],
      problemsQ:
        "Which problems do you face most often? (select all that apply)",
      problemsOptions: [
        "Writing consultation notes manually is time-consuming",
        "Hard to find old patient records / history",
        "Forgetting details when writing up notes later",
        "Writing referrals / prescriptions takes too long",
        "Patient data is scattered across multiple places",
        "No system for follow-up reminders",
      ],
    },
    priority: {
      title: "Where Do You Need the Most Help?",
      question: "Which area would help you work fastest if improved?",
      helper: "Select up to 2",
      options: [
        "Writing consultation notes",
        "Generating medical documents",
        "Finding & managing patient data",
        "Scheduling & appointments",
        "Patient follow-up reminders",
        "Daily reports & summaries",
      ],
    },
    more: {
      title: "Tell Us More (Optional)",
      question:
        "If you could change one thing about how you handle clinic admin, what would it be?",
      placeholder: "Share your thoughts...",
    },
  },
  submit: {
    button: "Submit & Get 1 Month Free",
    submitting: "Submitting...",
    required: "This field is required",
    error: "Something went wrong. Please try again.",
  },
  success: {
    title: "Thank you, Doctor!",
    body: "Your responses have been received. When Larinova launches, use the WhatsApp number or email you entered above to sign up — your free 1-month Pro access will be applied automatically.",
    cta: "Back to Home",
  },
};

const idContent: DiscoveryFormContent = {
  locale: "id",
  meta: {
    backHome: "← Kembali ke Beranda",
    badge: "Gratis 1 Bulan",
    heading: "Ceritakan kondisi",
    headingAccent: "praktek harian Anda",
    subtitle:
      "Bantu kami kenali tantangan sehari-hari Anda — cuma 2 menit. Jawaban Anda membantu kami meningkatkan Larinova.",
    sideImage: "/images/doctor-phone-id.jpg",
    sideQuote:
      "2 jam setiap hari untuk administrasi. Larinova mengembalikannya untuk saya.",
    sideAttribution: "Dr. Budi Santoso, Kardiolog, Jakarta",
  },
  sections: {
    personal: {
      title: "Data Diri",
      fields: {
        name: "Nama Dokter",
        specialization: "Spesialisasi",
        clinic: "Nama Klinik / RS",
        city: "Kota",
        whatsapp: "No. WhatsApp",
        email: "Email (opsional)",
      },
    },
    practice: {
      title: "Kondisi Praktek Saat Ini",
      patientsQ: "Berapa pasien yang Anda tangani rata-rata per hari?",
      patientsOptions: [
        "1–5 pasien",
        "6–15 pasien",
        "16–30 pasien",
        "30+ pasien",
      ],
      storageQ: "Data pasien Anda sekarang disimpan di mana?",
      storageOptions: [
        "Kertas / buku tulis",
        "Excel / Google Sheets",
        "Aplikasi klinik",
        "Lainnya",
      ],
      otherPlaceholder: "Sebutkan...",
    },
    challenges: {
      title: "Tantangan Sehari-hari",
      paperworkQ:
        "Berapa lama Anda menghabiskan waktu untuk pekerjaan administratif dalam sehari?",
      paperworkOptions: [
        "< 30 menit",
        "30 menit – 1 jam",
        "1–2 jam",
        "> 2 jam",
      ],
      shiftQ:
        "Kalau selesai kerja, masih ada catatan pasien yang belum selesai ditulis?",
      shiftOptions: [
        "Hampir tidak pernah",
        "Kadang-kadang",
        "Sering",
        "Hampir setiap hari",
      ],
      referralQ:
        "Membuat surat rujukan atau surat keterangan dokter, biasanya berapa menit per pasien?",
      referralOptions: ["< 2 menit", "2–5 menit", "5–10 menit", "> 10 menit"],
      problemsQ:
        "Masalah apa yang paling sering Anda alami? (boleh lebih dari satu)",
      problemsOptions: [
        "Menulis catatan konsultasi manual memakan waktu",
        "Data / riwayat pasien lama susah ditemukan",
        "Sering lupa detail konsultasi saat menulis ulang",
        "Membuat surat rujukan / resep butuh waktu lama",
        "Data pasien terpencar di banyak tempat",
        "Tidak ada reminder follow-up pasien",
      ],
    },
    priority: {
      title: "Prioritas Bantuan",
      question:
        "Bagian mana yang paling butuh bantuan supaya kerja lebih cepat?",
      helper: "Pilih maksimal 2",
      options: [
        "Menulis catatan konsultasi",
        "Membuat surat & dokumen medis",
        "Mencari & mengelola data pasien",
        "Mengatur jadwal & appointment",
        "Reminder follow-up pasien",
        "Laporan & rekap harian",
      ],
    },
    more: {
      title: "Cerita Lebih Lanjut (Opsional)",
      question:
        "Kalau bisa ubah 1 hal dari cara kerja administrasi klinik Anda, apa itu?",
      placeholder: "Ceritakan...",
    },
  },
  submit: {
    button: "Kirim & Dapatkan Gratis 1 Bulan",
    submitting: "Mengirim...",
    required: "Wajib diisi",
    error: "Terjadi kesalahan. Silakan coba lagi.",
  },
  success: {
    title: "Terima kasih, Dokter!",
    body: "Jawaban Anda sudah kami terima. Saat Larinova diluncurkan, gunakan nomor WhatsApp atau email yang Anda masukkan di atas untuk mendaftar — akses Pro gratis 1 bulan akan otomatis aktif.",
    cta: "Kembali ke Beranda",
  },
};

export default async function DiscoverySurveyPage({ params }: PageProps) {
  const { locale } = await params;

  if (locale !== "in" && locale !== "id") {
    notFound();
  }

  const formContent = locale === "id" ? idContent : inContent;

  return <DiscoveryForm content={formContent} />;
}
