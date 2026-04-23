import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Larinova - AI Medical Platform",
  description:
    "Create your Larinova account. Join the zero-knowledge AI medical platform for cryptographically provable consultations, automated workflows, and complete patient data sovereignty.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Sign Up | Larinova",
    description:
      "Create your account on the secure AI-powered medical platform",
    type: "website",
  },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
