"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import type { ContentKind } from "@/types/party";

type PublishContentKind = Extract<
  ContentKind,
  "announcement" | "blog" | "leadership_profile" | "news"
>;

const CONTENT_KIND_OPTIONS: {
  label: string;
  value: PublishContentKind;
}[] = [
  { label: "News", value: "news" },
  { label: "Blogs", value: "blog" },
  { label: "Announcements", value: "announcement" },
  { label: "Leadership Profiles", value: "leadership_profile" },
];

const FIELD_COPY: Record<
  PublishContentKind,
  {
    summaryPlaceholder: string;
    titleLabel: string;
    titlePlaceholder: string;
  }
> = {
  announcement: {
    summaryPlaceholder: "Short announcement text for the public popup and archive",
    titleLabel: "Announcement title",
    titlePlaceholder: "Public consultation schedule coming soon",
  },
  blog: {
    summaryPlaceholder: "Short excerpt shown on the blogs page",
    titleLabel: "Blog title",
    titlePlaceholder: "Why pragmatic politics needs measurable promises",
  },
  leadership_profile: {
    summaryPlaceholder: "Short public profile summary",
    titleLabel: "Leader name",
    titlePlaceholder: "Gohar Nawaz Sandhu",
  },
  news: {
    summaryPlaceholder: "Short public news summary",
    titleLabel: "News title",
    titlePlaceholder: "District cells preparing coordination desks",
  },
};

export default function AdminPublishForm() {
  const [kind, setKind] = useState<PublishContentKind>("news");
  const copy = FIELD_COPY[kind];
  const requiresBody = kind === "blog";
  const requiresRole = kind === "leadership_profile";

  return (
    <form
      action="/api/admin/content"
      method="post"
      encType="multipart/form-data"
      className="admin-form"
    >
      <label>
        <span>Content type</span>
        <select
          name="kind"
          onChange={(event) => setKind(event.target.value as PublishContentKind)}
          required
          value={kind}
        >
          {CONTENT_KIND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{copy.titleLabel}</span>
        <input name="title" required placeholder={copy.titlePlaceholder} />
      </label>
      {requiresRole && (
        <>
          <label>
            <span>Leadership role</span>
            <input
              name="personRole"
              required
              placeholder="Chairman / District Coordinator"
            />
          </label>
          <label>
            <span>Profile image</span>
            <input
              name="profileImage"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
            />
          </label>
        </>
      )}
      <label>
        <span>Summary</span>
        <textarea
          name="summary"
          required
          placeholder={copy.summaryPlaceholder}
          rows={3}
        />
      </label>
      {requiresBody && (
        <label>
          <span>Blog body</span>
          <textarea
            name="body"
            required
            placeholder="Write the full blog post or policy note"
            rows={6}
          />
        </label>
      )}
      <button className="primary-button" type="submit">
        <ShieldCheck aria-hidden="true" size={17} />
        Save content
      </button>
    </form>
  );
}
