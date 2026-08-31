import {
  createOrUpdateStoredMembership,
  validateMembershipPayload,
} from "@/lib/membershipRepository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { message: "Please submit the membership form again." },
      { status: 400 },
    );
  }

  const validation = validateMembershipPayload(payload);

  if (!validation.ok) {
    return Response.json({ message: validation.message }, { status: 400 });
  }

  try {
    const result = await createOrUpdateStoredMembership(validation.values);
    const isUpdated = result.status === "updated";

    return Response.json(
      {
        member: result.member,
        message: isUpdated
          ? "A membership record already existed for this CNIC. Your details were updated and you can save the card."
          : "Membership saved securely. Your digital card is ready to download or print.",
        status: result.status,
      },
      { status: isUpdated ? 200 : 201 },
    );
  } catch (error) {
    const isMissingDatabase =
      error instanceof Error && error.message.includes("DATABASE_URL");

    return Response.json(
      {
        message: isMissingDatabase
          ? "Membership database is not configured yet."
          : "Membership could not be saved right now.",
      },
      { status: isMissingDatabase ? 503 : 500 },
    );
  }
}
