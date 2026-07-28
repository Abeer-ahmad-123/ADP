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
  BookSpread,
  ManifestoPoint,
  RecommendedSection,
  SocialLink,
  Stat,
} from "@/types/party";

export const PARTY_NAME = "Nayi Subah Party";
export const PARTY_SHORT_NAME = "NSP";
export const PARTY_TAGLINE = "Insaf, Taleem, Rozgar, and transparent public service.";

export const STATS: Stat[] = [
  {
    label: "District cells",
    value: "128",
    detail: "organizing committees ready for pilot launch",
  },
  {
    label: "Manifesto pillars",
    value: "07",
    detail: "clear priorities for the first 100 days",
  },
  {
    label: "Member wings",
    value: "05",
    detail: "youth, women, labour, overseas, and volunteers",
  },
];

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
  {
    title: "Transparent Funding",
    area: "Trust",
    copy: "Monthly public donation summaries, audited campaign spending, and conflict-of-interest disclosures.",
    Icon: ShieldCheck,
  },
];

export const RECOMMENDED_SECTIONS: RecommendedSection[] = [
  {
    title: "Leadership & Candidates",
    copy: "Profiles, city work, financial disclosures, and contact links for every public representative.",
    tag: "Trust",
  },
  {
    title: "Events & Rallies",
    copy: "A calendar with city filters, RSVP, volunteer check-in, accessibility notes, and livestream links.",
    tag: "Mobilize",
  },
  {
    title: "Newsroom",
    copy: "Press releases, policy explainers, speech transcripts, downloadable media kits, and fact checks.",
    tag: "Media",
  },
  {
    title: "Volunteer Portal",
    copy: "Shift signup, door-to-door scripts, training materials, phone bank dashboards, and local team chat.",
    tag: "Organize",
  },
  {
    title: "Policy Lab",
    copy: "Long-form policy drafts, citizen feedback, expert reviews, cost estimates, and implementation plans.",
    tag: "Ideas",
  },
  {
    title: "Transparency Report",
    copy: "Donation summaries, spending categories, procurement policies, audit letters, and compliance updates.",
    tag: "Finance",
  },
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

export const MEMBER_WINGS = [
  "General Member",
  "Youth Wing",
  "Women Wing",
  "Labour Wing",
  "Overseas Supporter",
  "Volunteer Organizer",
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
    title: "Movement",
    links: [
      { label: "Manifesto", href: "#manifesto" },
      { label: "Agenda", href: "#agenda" },
      { label: "Book", href: "/book" },
      { label: "Membership", href: "#register" },
    ],
  },
];

export const FOOTER_CONTACTS = [
  { label: "info@nsp.example", href: "mailto:info@nsp.example" },
  { label: "+92 300 0000000", href: "tel:+923000000000" },
  { label: "Islamabad campaign secretariat", href: "#funding" },
];

export const FOOTER_BANK_DETAILS = [
  { label: "Account title", value: "NSP Public Campaign Fund (Demo)" },
  { label: "Bank", value: "Aitbaar Civic Bank (Sample)" },
  { label: "IBAN", value: "PK00 DEMO 0000 0000 0000 0000" },
  { label: "Reference", value: "Member number or city name" },
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

export const BOOK_SPREADS: BookSpread[] = [
  {
    pageNumber: 1,
    kicker: "Foreword",
    title: "The Morning We Choose",
    body: "A nation does not change because one person speaks louder. It changes when ordinary people are invited into the work with dignity, evidence, and a plan they can inspect.",
  },
  {
    pageNumber: 2,
    kicker: "Chapter 01",
    title: "A Contract With Citizens",
    body: "The first promise is simple: every claim must be measurable. If a road is announced, the timeline, cost, contractor, and inspection notes should be public before applause begins.",
  },
  {
    pageNumber: 3,
    kicker: "Chapter 02",
    title: "Schools As Engines",
    body: "Our classrooms should prepare a young person for livelihood and leadership. That means trained teachers, technology that is useful, and skills linked to the economy around them.",
  },
  {
    pageNumber: 4,
    kicker: "Chapter 03",
    title: "Cities That Listen",
    body: "A mohalla knows its problems before a ministry does. Local councils need clean budgets, fast complaint handling, and public meetings where outcomes are recorded, not forgotten.",
  },
  {
    pageNumber: 5,
    kicker: "Chapter 04",
    title: "The Economy Of Trust",
    body: "Small businesses need fewer closed doors. A fair permit system, digital tax guidance, and access to responsible finance can turn family ambition into national production.",
  },
  {
    pageNumber: 6,
    kicker: "Chapter 05",
    title: "Healthcare Close To Home",
    body: "A clinic with medicine, trained staff, and a referral connection can save families from panic. The state must be felt first where people actually stand in line.",
  },
  {
    pageNumber: 7,
    kicker: "Chapter 06",
    title: "Clean Politics",
    body: "Funding should be visible, conflict should be declared, and decisions should survive scrutiny. Public service is not a mystery room. It is a ledger and a duty.",
  },
  {
    pageNumber: 8,
    kicker: "Closing",
    title: "A Party That Reports Back",
    body: "The measure of a movement is not the size of its stage. It is whether citizens can see what changed, who did the work, and what remains unfinished.",
  },
];
