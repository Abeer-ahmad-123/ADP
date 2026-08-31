import type { LucideIcon } from "lucide-react";

export type Stat = {
  label: string;
  value: string;
  detail: string;
};

export type ManifestoPoint = {
  title: string;
  copy: string;
};

export type ElectionPlatformItem = {
  title: string;
  area: string;
  copy: string;
};

export type ApproachPoint = {
  number: string;
  title: string;
  copy: string;
};

export type AgendaItem = ElectionPlatformItem & {
  Icon: LucideIcon;
};

export type SocialLink = {
  label: string;
  href: string;
};

export type MemberFormValues = {
  affirmsDeclaration: boolean;
  cnic: string;
  fullName: string;
  parentOrSpouseName: string;
  residentialAddress: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  confirmsEligibility: boolean;
};

export type MemberRecord = MemberFormValues & {
  membershipNumber: string;
  joinedOn: string;
};

export type PublicFeedbackKind = "complaint" | "suggestion";

export type PublicFeedbackValues = {
  kind: PublicFeedbackKind;
  fullName: string;
  city: string;
  phone: string;
  email: string;
  message: string;
};

export type PublicFeedbackRecord = PublicFeedbackValues & {
  id: number;
  createdAt: string;
};

export type BookSpread = {
  pageNumber: number;
  kicker: string;
  title: string;
  body: string;
  imageAlt?: string;
  imageSrc?: string;
};

export type PublicContentItem = {
  title: string;
  summary: string;
  meta: string;
  href: string;
};

export type ContentKind =
  | "news"
  | "blog"
  | "announcement"
  | "leadership_profile"
  | "audio"
  | "video_reel"
  | "gallery_photo"
  | "party_activity";

export type ContentEntry = {
  id: number;
  kind: ContentKind;
  title: string;
  summary: string;
  body: string;
  personRole: string;
  mediaUrl: string;
  thumbnailUrl: string;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicBookContent = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  pdfHref: string;
  createdAt: string;
  pages: BookSpread[];
};

export type PublicBookSummary = Omit<PublicBookContent, "pages"> & {
  isPublished: boolean;
  pageCount: number;
};

export type LeadershipProfile = {
  imageUrl?: string;
  name: string;
  role: string;
  summary: string;
};

export type MediaItem = {
  title: string;
  kind: "Audio" | "Video Reel";
  summary: string;
  duration?: string;
  mediaUrl?: string;
  speaker?: string;
  thumbnailUrl?: string;
};

export type GalleryPhoto = {
  groupKey?: string;
  groupOrder?: number;
  id: number;
  imageUrl: string;
  publishedAt: string;
  summary: string;
  title: string;
};
