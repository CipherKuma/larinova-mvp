import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Larinova - AI Medical Platform",
  description:
    "Sign in to Larinova, the zero-knowledge AI medical platform. Access your consultations, patient records, and AI-powered healthcare tools securely.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Sign In | Larinova",
    description: "Access your secure AI-powered medical platform",
    type: "website",
  },
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
