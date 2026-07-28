"use client";

import { FormEvent, useMemo, useState } from "react";
import { BadgeCheck, Download, Printer } from "lucide-react";
import {
  MEMBER_WINGS,
  PARTY_NAME,
  PARTY_SHORT_NAME,
  PROVINCES,
} from "@/data/partyContent";
import type { MemberFormValues, MemberRecord } from "@/types/party";
import {
  createMemberRecord,
  createPreviewMembershipNumber,
  downloadMembershipSvg,
} from "@/utils/memberCard";

const INITIAL_FORM_VALUES: MemberFormValues = {
  fullName: "",
  city: "",
  province: "Punjab",
  phone: "",
  email: "",
  wing: "General Member",
};

function sanitizePhoneNumber(value: string) {
  const onlyPhoneChars = value.replace(/[^\d+]/g, "");
  const hasLeadingPlus = onlyPhoneChars.startsWith("+");
  const digits = onlyPhoneChars.replaceAll("+", "");

  return hasLeadingPlus ? `+${digits}` : digits;
}

export default function MembershipSection() {
  const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
  const [memberRecord, setMemberRecord] = useState<MemberRecord | null>(null);

  const livePreview = useMemo(() => {
    const city = formValues.city.trim();
    const fullName = formValues.fullName.trim();

    return {
      city: city ? `${city}, ${formValues.province}` : "Your city",
      fullName: fullName || "Future member",
      joinedOn: memberRecord?.joinedOn || "Ready today",
      membershipNumber:
        memberRecord?.membershipNumber ||
        createPreviewMembershipNumber(formValues.city),
      wing: formValues.wing,
    };
  }, [formValues, memberRecord?.joinedOn, memberRecord?.membershipNumber]);

  function updateField(field: keyof MemberFormValues, value: string) {
    setMemberRecord(null);
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const record = createMemberRecord({
      fullName: formValues.fullName.trim(),
      city: formValues.city.trim(),
      province: formValues.province,
      phone: formValues.phone.trim(),
      email: formValues.email.trim(),
      wing: formValues.wing,
    });

    setMemberRecord(record);
  }

  function printCard() {
    const cleanupPrintMode = () => {
      document.body.classList.remove("print-membership-card");
      window.removeEventListener("afterprint", cleanupPrintMode);
    };

    document.body.classList.add("print-membership-card");
    window.addEventListener("afterprint", cleanupPrintMode);
    window.print();
    window.setTimeout(cleanupPrintMode, 500);
  }

  return (
    <section id="register" className="section-band registration-band">
      <div className="section-inner registration-layout">
        <div className="registration-copy reveal-up">
          <p className="eyebrow">Join the movement</p>
          <h2>Register, generate your card, keep it digital.</h2>
          <p>
            A modern party site should make membership feel immediate, clear,
            and accountable. This prototype creates a printable digital card
            right after a successful local submission.
          </p>
        </div>

        <form className="registration-form reveal-up delay-1" onSubmit={handleSubmit}>
          <label>
            <span>Full name</span>
            <input
              required
              minLength={3}
              value={formValues.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder="Ayesha Khan"
            />
          </label>

          <label>
            <span>City / district</span>
            <input
              required
              value={formValues.city}
              onChange={(event) => updateField("city", event.target.value)}
              placeholder="Lahore"
            />
          </label>

          <label>
            <span>Province / region</span>
            <select
              value={formValues.province}
              onChange={(event) => updateField("province", event.target.value)}
            >
              {PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Mobile number</span>
            <input
              required
              autoComplete="tel"
              inputMode="tel"
              pattern={"(?:\\+92|0)[0-9]*"}
              title="Enter a Pakistani mobile number starting with +92 or 0."
              type="tel"
              value={formValues.phone}
              onChange={(event) =>
                updateField("phone", sanitizePhoneNumber(event.target.value))
              }
              placeholder="+92 300 0000000"
            />
          </label>

          <label>
            <span>Email</span>
            <input
              required
              type="email"
              value={formValues.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="member@example.com"
            />
          </label>

          <label>
            <span>Membership wing</span>
            <select
              value={formValues.wing}
              onChange={(event) => updateField("wing", event.target.value)}
            >
              {MEMBER_WINGS.map((wing) => (
                <option key={wing} value={wing}>
                  {wing}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="primary-button">
            <BadgeCheck aria-hidden="true" size={18} />
            Generate membership card
          </button>
        </form>

        <div className="membership-card-panel reveal-up delay-2">
          <div className="membership-print-card membership-card">
            <div className="card-topline">
              <span>{PARTY_NAME}</span>
              <strong>{PARTY_SHORT_NAME}</strong>
            </div>
            <div className="card-mark">{PARTY_SHORT_NAME}</div>
            <div>
              <p className="card-label">Member name</p>
              <h3>{livePreview.fullName}</h3>
            </div>
            <div className="card-grid">
              <div>
                <p className="card-label">Membership no.</p>
                <strong>{livePreview.membershipNumber}</strong>
              </div>
              <div>
                <p className="card-label">Joined</p>
                <strong>{livePreview.joinedOn}</strong>
              </div>
              <div>
                <p className="card-label">City / Region</p>
                <strong>{livePreview.city}</strong>
              </div>
              <div>
                <p className="card-label">Wing</p>
                <strong>{livePreview.wing}</strong>
              </div>
            </div>
          </div>

          <div className="card-actions no-print">
            <button
              type="button"
              disabled={!memberRecord}
              onClick={() => memberRecord && downloadMembershipSvg(memberRecord)}
            >
              <Download aria-hidden="true" size={17} />
              Download SVG
            </button>
            <button type="button" disabled={!memberRecord} onClick={printCard}>
              <Printer aria-hidden="true" size={17} />
              Print card
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
