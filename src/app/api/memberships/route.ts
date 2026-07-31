import {
  createStoredMembership,
  isCnicUniqueViolation,
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
    const member = await createStoredMembership(validation.values);

    return Response.json({ member }, { status: 201 });
  } catch (error) {
    const isMissingDatabase =
      error instanceof Error && error.message.includes("DATABASE_URL");
    const isDuplicateRecord = isCnicUniqueViolation(error);

    return Response.json(
      {
        message: isDuplicateRecord
          ? "A membership record already exists for this CNIC."
          : isMissingDatabase
            ? "Membership database is not configured yet."
            : "Membership could not be saved right now.",
      },
      { status: isDuplicateRecord ? 409 : isMissingDatabase ? 503 : 500 },
    );
  }
}
