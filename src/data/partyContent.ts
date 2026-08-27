import {
  Banknote,
  BookOpenText,
  CalendarDays,
  Handshake,
  Landmark,
  MapPinned,
  Megaphone,
  Newspaper,
  ShieldCheck,
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
    title: "Reform state institutions",
    area: "Pillar 1 - State reform",
    copy: "Depoliticize civil-military coordination, judicial appointments, policing, bureaucracy, and public institutions so service comes before patronage.",
    Icon: Landmark,
  },
  {
    title: "Zero tolerance for corruption",
    area: "Pillar 2 - Accountability",
    copy: "Investigate, prosecute, and recover public money across all offices with transparent rules and no political exceptions.",
    Icon: ShieldCheck,
  },
  {
    title: "Self-reliant economy",
    area: "Pillar 3 - Economy",
    copy: "Boost local production, exports, small industry, agriculture, and investment while discouraging luxury import dependence.",
    Icon: Banknote,
  },
  {
    title: "Empowered local government",
    area: "Pillar 4 - Local delivery",
    copy: "Move health units, schools, dispute resolution, municipal services, and small-cause justice closer to citizens.",
    Icon: MapPinned,
  },
];

export const TIMELINE_ITEMS = [
  "Institutional reform scorecard",
  "Anti-corruption recovery tracker",
  "Local production and export plan",
  "Union Council service map",
  "Candidate and manifesto town halls",
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
  { label: "Twitter", href: "https://x.com/AwamDostParty_" },
  { label: "YouTube", href: "https://www.youtube.com/@awamdostparty-k2h" },
  { label: "Facebook", href: "https://www.facebook.com/share/14qR2Khf8JR/" },
  { label: "WhatsApp Channel", href: "https://whatsapp.com/channel/0029VbCiHei1HspussyA9o0y" },
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
  { label: "awamdostparty.org@gmail.com", href: "mailto:awamdostparty.org@gmail.com" },
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
