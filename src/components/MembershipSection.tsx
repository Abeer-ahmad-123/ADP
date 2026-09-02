"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { BadgeCheck, Download, Printer } from "lucide-react";
import {
  PARTY_LOGO_ALT,
  PARTY_LOGO_SRC,
  PARTY_NAME,
  PARTY_SHORT_NAME,
  PROVINCES,
} from "@/data/partyContent";
import type { MemberFormValues, MemberRecord } from "@/types/party";
import {
  createPreviewMembershipNumber,
  createMembershipSvg,
  downloadMembershipSvg,
  getMembershipCardImageDataUri,
  getPartyLogoDataUri,
} from "@/utils/memberCard";

const INITIAL_FORM_VALUES: MemberFormValues = {
  affirmsDeclaration: false,
  city: "",
  cnic: "",
  confirmsEligibility: false,
  email: "",
  fullName: "",
  parentOrSpouseName: "",
  phone: "",
  province: "",
  residentialAddress: "",
};

const CNIC_INPUT_PATTERN = "[0-9]{5}-[0-9]{7}-[0-9]";
const PHONE_INPUT_PATTERN = "(?:\\+923[0-9]{9}|03[0-9]{9})";

function sanitizePhoneNumber(value: string) {
  const onlyPhoneChars = value.replace(/[^\d+]/g, "");
  const hasLeadingPlus = onlyPhoneChars.startsWith("+");
  const digits = onlyPhoneChars.replaceAll("+", "");

  return hasLeadingPlus ? `+${digits}` : digits;
}

function sanitizeCnicNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  const first = digits.slice(0, 5);
  const second = digits.slice(5, 12);
  const third = digits.slice(12, 13);

  return [first, second, third].filter(Boolean).join("-");
}

function createMembershipPrintDocument(cardSvg: string) {
  const printableSvg = cardSvg.replace(
    "<svg ",
    '<svg class="membership-print-svg" role="img" aria-label="Membership card" ',
  );

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Membership card</title>
    <style>
      @page {
        margin: 0;
        size: A4 landscape;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        background: #ffffff;
        height: 100%;
        margin: 0;
        width: 100%;
      }

      body {
        display: grid;
        min-height: 100vh;
        padding: 16px;
        place-items: center;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .membership-print-svg {
        display: block;
        height: auto;
        max-height: calc(100vh - 32px);
        max-width: calc(100vw - 32px);
        width: min(856px, calc(100vw - 32px));
      }

      @media print {
        html,
        body {
          height: 100%;
          overflow: hidden;
          width: 100%;
        }

        body {
          height: 100vh;
          min-height: 0;
          padding: 0;
        }

        .membership-print-svg {
          break-after: avoid;
          break-before: avoid;
          break-inside: avoid;
          max-height: 118mm;
          max-width: 270mm;
          page-break-after: avoid;
          page-break-before: avoid;
          page-break-inside: avoid;
          width: 170mm;
        }
      }
    </style>
  </head>
  <body>${printableSvg}</body>
</html>`;
}

export default function MembershipSection({
  membershipCardImageSrc = PARTY_LOGO_SRC,
}: {
  membershipCardImageSrc?: string;
}) {
  const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
  const [memberRecord, setMemberRecord] = useState<MemberRecord | null>(null);
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resolvedMembershipCardImageSrc =
    membershipCardImageSrc || PARTY_LOGO_SRC;

  const livePreview = useMemo(() => {
    const city = memberRecord?.city.trim() || formValues.city.trim();
    const fullName = memberRecord?.fullName.trim() || formValues.fullName.trim();
    const province = memberRecord?.province || formValues.province;
    const cityRegion =
      [city, province].filter(Boolean).join(", ") || "Not provided";

    return {
      city: cityRegion || "Your city / tehsil",
      fullName: fullName || "Future member",
      joinedOn: memberRecord?.joinedOn || "Ready today",
      membershipNumber:
        memberRecord?.membershipNumber ||
        createPreviewMembershipNumber(formValues.city),
    };
  }, [formValues, memberRecord]);

  function updateField<K extends keyof MemberFormValues>(
    field: K,
    value: MemberFormValues[K],
  ) {
    setMemberRecord(null);
    setFormMessage("");
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");
    setIsSubmitting(true);

    const payload: MemberFormValues = {
      affirmsDeclaration: formValues.affirmsDeclaration,
      city: formValues.city.trim(),
      cnic: formValues.cnic.trim(),
      confirmsEligibility: formValues.confirmsEligibility,
      email: formValues.email.trim(),
      fullName: formValues.fullName.trim(),
      parentOrSpouseName: formValues.parentOrSpouseName.trim(),
      phone: formValues.phone.trim(),
      province: formValues.province,
      residentialAddress: formValues.residentialAddress.trim(),
    };

    try {
      const response = await fetch("/api/memberships", {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as {
        member?: MemberRecord;
        message?: string;
        status?: "created" | "updated";
      };

      if (!response.ok || !result.member) {
        setMemberRecord(null);
        setFormMessage(
          result.message || "Membership could not be saved right now.",
        );
        return;
      }

      setFormValues({
        affirmsDeclaration: result.member.affirmsDeclaration,
        city: result.member.city,
        cnic: result.member.cnic,
        confirmsEligibility: result.member.confirmsEligibility,
        email: result.member.email,
        fullName: result.member.fullName,
        parentOrSpouseName: result.member.parentOrSpouseName,
        phone: result.member.phone,
        province: result.member.province,
        residentialAddress: result.member.residentialAddress,
      });
      setMemberRecord(result.member);
      setFormMessage(
        result.message ||
          (result.status === "updated"
            ? "Your existing membership details were updated and you can save the card."
            : "Membership saved securely. Your digital card is ready to download or print."),
      );
    } catch {
      setMemberRecord(null);
      setFormMessage("Membership could not be saved. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function printCard() {
    if (!memberRecord) {
      return;
    }

    const [logoHref, membershipCardImageHref] = await Promise.all([
      getPartyLogoDataUri().catch(() => undefined),
      getMembershipCardImageDataUri(resolvedMembershipCardImageSrc).catch(
        () => undefined,
      ),
    ]);

    document.getElementById("membership-print-frame")?.remove();

    const printFrame = document.createElement("iframe");
    printFrame.id = "membership-print-frame";
    printFrame.setAttribute("aria-hidden", "true");
    printFrame.setAttribute("title", "Membership card print frame");
    printFrame.style.border = "0";
    printFrame.style.height = "0";
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.top = "0";
    printFrame.style.visibility = "hidden";
    printFrame.style.width = "0";
    document.body.appendChild(printFrame);

    const frameDocument = printFrame.contentDocument;
    const frameWindow = printFrame.contentWindow;

    if (!frameDocument || !frameWindow) {
      printFrame.remove();
      return;
    }

    let cleanupTimer = 0;
    const cleanupPrintFrame = () => {
      window.clearTimeout(cleanupTimer);
      frameWindow.removeEventListener("afterprint", cleanupPrintFrame);
      printFrame.remove();
    };

    frameWindow.addEventListener("afterprint", cleanupPrintFrame, {
      once: true,
    });

    frameDocument.open();
    frameDocument.write(
      createMembershipPrintDocument(
        createMembershipSvg(memberRecord, logoHref, membershipCardImageHref),
      ),
    );
    frameDocument.close();

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        cleanupTimer = window.setTimeout(cleanupPrintFrame, 120000);
        frameWindow.focus();
        frameWindow.print();
      });
    });
  }

  return (
    <section id="register" className="section-band registration-band">
      <div className="section-inner registration-layout">
        <div className="registration-copy reveal-up">
          <p className="eyebrow">درخواست — Membership</p>
          <h2>Join Awam Dost Party</h2>
          <p>
            Fill in your details below to apply for party membership. Applicants
            must confirm the declaration (affidavit) at the bottom of the form.
          </p>

          <ol className="application-steps">
            <li>
              <span>01</span>
              Submit your details and CNIC number
            </li>
            <li>
              <span>02</span>
              Confirm the membership affidavit
            </li>
            <li>
              <span>03</span>
              Your local chapter will verify and contact you
            </li>
          </ol>
        </div>

        <form className="registration-form reveal-up delay-1" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Full name</span>
            <input
              required
              autoComplete="name"
              minLength={3}
              value={formValues.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder="Ayesha Khan"
            />
          </label>

          <label className="form-field">
            <span>Son / Daughter / Wife of (Walid/Zauj ka naam)</span>
            <input
              required
              minLength={3}
              value={formValues.parentOrSpouseName}
              onChange={(event) =>
                updateField("parentOrSpouseName", event.target.value)
              }
              placeholder="Parent or spouse name"
            />
          </label>

          <label className="form-field">
            <span>CNIC number</span>
            <input
              required
              inputMode="numeric"
              maxLength={15}
              pattern={CNIC_INPUT_PATTERN}
              title="Enter CNIC in 12345-1234567-1 format."
              value={formValues.cnic}
              onChange={(event) =>
                updateField("cnic", sanitizeCnicNumber(event.target.value))
              }
              placeholder="12345-1234567-1"
            />
            <small>Format: 12345-1234567-1</small>
          </label>

          <label className="form-field">
            <span>Residential address</span>
            <textarea
              required
              minLength={8}
              rows={3}
              value={formValues.residentialAddress}
              onChange={(event) =>
                updateField("residentialAddress", event.target.value)
              }
              placeholder="House, street, area"
            />
          </label>

          <label className="form-field">
            <span>City / Tehsil (optional)</span>
            <input
              value={formValues.city}
              onChange={(event) => updateField("city", event.target.value)}
              placeholder="Lahore"
            />
          </label>

          <label className="form-field">
            <span>Province (optional)</span>
            <select
              value={formValues.province}
              onChange={(event) => updateField("province", event.target.value)}
            >
              <option value="">
                No province selected
              </option>
              {PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Mobile number</span>
            <input
              required
              autoComplete="tel"
              inputMode="tel"
              pattern={PHONE_INPUT_PATTERN}
              title="Enter a Pakistani mobile number like +923439500000 or 03439500000."
              type="tel"
              value={formValues.phone}
              onChange={(event) =>
                updateField("phone", sanitizePhoneNumber(event.target.value))
              }
              placeholder="0343-9500000"
            />
          </label>

          <label className="form-field">
            <span>Email (optional)</span>
            <input
              type="email"
              value={formValues.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="member@example.com"
            />
          </label>

          <fieldset className="affidavit-box">
            <legend>Affidavit / حلف نامہ</legend>
            <p>
              I hereby affirm that the information provided above is true, that
              I will abide by the constitution and discipline of Awam Dost
              Party, and that I am not currently a member of any other political
              party.
            </p>

            <label className="checkbox-field">
              <input
                required
                type="checkbox"
                checked={formValues.affirmsDeclaration}
                onChange={(event) =>
                  updateField("affirmsDeclaration", event.target.checked)
                }
              />
              <span>I affirm the above declaration.</span>
            </label>

            <label className="checkbox-field">
              <input
                required
                type="checkbox"
                checked={formValues.confirmsEligibility}
                onChange={(event) =>
                  updateField("confirmsEligibility", event.target.checked)
                }
              />
              <span>
                I confirm I am 18 years or older and a citizen of Pakistan
                eligible for party membership.
              </span>
            </label>
          </fieldset>

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            <BadgeCheck aria-hidden="true" size={18} />
            {isSubmitting ? "Saving membership..." : "Generate membership card"}
          </button>

          {formMessage && (
            <p className={`form-status ${memberRecord ? "is-success" : "is-error"}`}>
              {formMessage}
            </p>
          )}
        </form>

        <div className="membership-card-panel reveal-up delay-2">
          <div className="membership-print-card membership-card">
            <div className="card-topline">
              <div className="card-identity">
                <span className="card-party-name">{PARTY_NAME}</span>
                <span className="card-card-type">Digital membership card</span>
              </div>
              <span className="card-top-logo">
                <Image
                  alt="Membership card top image"
                  fill
                  sizes="(max-width: 700px) 64px, 108px"
                  src={resolvedMembershipCardImageSrc}
                />
              </span>
            </div>
            <div className="card-number-block">
              <span className="card-number-logo">
                <Image
                  alt={PARTY_LOGO_ALT}
                  fill
                  sizes="(max-width: 700px) 52px, 76px"
                  src={PARTY_LOGO_SRC}
                />
                <span className="sr-only">{PARTY_SHORT_NAME}</span>
              </span>
              <p className="card-label">Membership no.</p>
              <strong>{livePreview.membershipNumber}</strong>
            </div>
            <div className="card-grid">
              <div>
                <p className="card-label">Member name</p>
                <h3>{livePreview.fullName}</h3>
              </div>
              <div>
                <p className="card-label">Joined</p>
                <strong>{livePreview.joinedOn}</strong>
              </div>
              <div>
                <p className="card-label">City / Tehsil</p>
                <strong>{livePreview.city}</strong>
              </div>
            </div>
          </div>

          <div className="card-actions no-print">
            <button
              type="button"
              disabled={!memberRecord}
              onClick={() => {
                if (memberRecord) {
                  void downloadMembershipSvg(
                    memberRecord,
                    resolvedMembershipCardImageSrc,
                  );
                }
              }}
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
