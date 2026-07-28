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

export type AgendaItem = {
  title: string;
  area: string;
  copy: string;
  Icon: LucideIcon;
};

export type RecommendedSection = {
  title: string;
  copy: string;
  tag: string;
};

export type SocialLink = {
  label: string;
  href: string;
};

export type MemberFormValues = {
  fullName: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  wing: string;
};

export type MemberRecord = MemberFormValues & {
  membershipNumber: string;
  joinedOn: string;
};

export type BookSpread = {
  pageNumber: number;
  kicker: string;
  title: string;
  body: string;
};
