import {
  Banknote,
  BookOpenText,
  CalendarDays,
  GraduationCap,
  Handshake,
  Landmark,
  MapPinned,
  Megaphone,
  Newspaper,
  ShieldCheck,
  Sprout,
  UsersRound,
} from "lucide-react";
import type {
  AgendaItem,
  ApproachPoint,
  ManifestoPoint,
  SocialLink,
} from "@/types/party";

export const PARTY_NAME = "Awam Dost Party";
export const PARTY_SHORT_NAME = "ADP";
export const PARTY_TAGLINE = "Sab se pehle awam.";
export const PARTY_CHAIRMAN_NAME = "Gohar Nawaz Sandhu";
export const PARTY_LOGO_SRC = "/brand/awam-dost-party-logo.png";
export const PARTY_LOGO_ALT =
  "Awam Dost Party flag logo with people, stars, wheat branches, Urdu party name, and slogan.";

export const MANIFESTO_POINTS: ManifestoPoint[] = [
  {
    title: "Education that works",
    copy: "Every tehsil deserves digital classrooms, teacher training, and skill programs tied to local jobs.",
  },
  {
    title: "Local power, visible budgets",
    copy: "Publish city spending, contract awards, and performance scorecards in plain language for citizens.",
  },
  {
    title: "Clinics before slogans",
    copy: "Upgrade basic health units with medicine availability, telehealth rooms, and emergency referral networks.",
  },
  {
    title: "Jobs near home",
    copy: "Back small businesses, apprenticeships, and export-ready makers with simpler permits and fair financing.",
  },
];

export const APPROACH_POINTS: ApproachPoint[] = [
  {
    number: "01",
    title: "Pragmatism over rhetoric",
    copy: "Policies judged by what works in Pakistan's actual circumstances, not slogans.",
  },
  {
    number: "02",
    title: "Party discipline",
    copy: "Members and representatives act within the party's constitution and collective decisions.",
  },
  {
    number: "03",
    title: "National, not regional",
    copy: "Organized to represent all provinces and communities of Pakistan.",
  },
  {
    number: "04",
    title: "Service to Awam",
    copy: "Every chapter accountable to the members and citizens it represents.",
  },
];

export const AGENDA_ITEMS: AgendaItem[] = [
  {
    title: "Public Service Dashboard",
    area: "Governance",
    copy: "A citizen-facing tracker for promises, budgets, timelines, and responsible officials.",
    Icon: Landmark,
  },
  {
    title: "Youth Skill Mission",
    area: "Employment",
    copy: "District skill labs for AI literacy, trades, freelancing, agriculture tech, and small business operations.",
    Icon: GraduationCap,
  },
  {
    title: "Green Mohalla Program",
    area: "Climate",
    copy: "Clean water points, shaded streets, recycling pilots, and flood-readiness teams at union council level.",
    Icon: Sprout,
  },
  // {
  //   title: "Transparent Funding",
  //   area: "Trust",
  //   copy: "Monthly public donation summaries, audited campaign spending, and conflict-of-interest disclosures.",
  //   Icon: ShieldCheck,
  // },
];

export const TIMELINE_ITEMS = [
  "100-day public service scorecard",
  "District manifesto town halls",
  "Women and youth candidate incubator",
  "Small business licensing desk",
  "Overseas Pakistani listening forum",
];

export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
  "Islamabad Capital Territory",
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: "Twitter", href: "https://example.com/x" },
  { label: "Facebook", href: "https://example.com/facebook" },
  { label: "Instagram", href: "https://example.com/instagram" },
  { label: "YouTube", href: "https://example.com/youtube" },
  { label: "WhatsApp Channel", href: "https://example.com/whatsapp" },
];

export const FOOTER_NAV_GROUPS = [
  {
    title: "Public",
    links: [
      { label: "Manifesto", href: "/manifesto" },
      { label: "News", href: "/news" },
      { label: "Blogs", href: "/blogs" },
      { label: "Announcements", href: "/announcements" },
    ],
  },
  {
    title: "Movement",
    links: [
      { label: "Agenda", href: "/#agenda" },
      { label: "Book", href: "/book" },
      { label: "Membership", href: "/#register" },
      // { label: "Funding", href: "/#funding" },
    ],
  },
  {
    title: "People",
    links: [
      { label: "Leadership", href: "/leadership" },
      { label: "Audio", href: "/media#audio" },
      { label: "Video Reels", href: "/media#video-reels" },
      { label: "Photo Gallery", href: "/gallery" },
    ],
  },
];

export const FOOTER_CONTACTS = [
  { label: "info@adp.example", href: "mailto:info@adp.example" },
  { label: "0343-9500000", href: "tel:+923439500000" },
  { label: "Islamabad campaign secretariat", href: "" },
];

export const FOOTER_BANK_DETAILS = [
  { label: "Status", value: "Bank account will be added later" },
  { label: "Timeline", value: "After approval and audit setup" },
  { label: "Current note", value: "No online donations are collected here" },
  // { label: "Reference", value: "Official funding details will be published publicly" },
];

export const FOOTER_ACTIONS = [
  { label: "Membership help desk", Icon: UsersRound },
  { label: "Donate by bank transfer", Icon: Banknote },
  { label: "Book launch updates", Icon: BookOpenText },
  { label: "District offices", Icon: MapPinned },
  { label: "Press invitations", Icon: Megaphone },
  { label: "Event schedule", Icon: CalendarDays },
  { label: "Policy briefings", Icon: Newspaper },
  { label: "Coalition partners", Icon: Handshake },
];
