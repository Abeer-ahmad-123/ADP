import {
  createPublicFeedback,
  validateFeedbackPayload,
} from "@/lib/feedbackRepository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { message: "Please submit the form again." },
      { status: 400 },
    );
  }

  const validation = validateFeedbackPayload(payload);

  if (!validation.ok) {
    return Response.json({ message: validation.message }, { status: 400 });
  }

  try {
    const feedback = await createPublicFeedback(validation.values);

    return Response.json({ feedback }, { status: 201 });
  } catch (error) {
    const isMissingDatabase =
      error instanceof Error && error.message.includes("DATABASE_URL");

    return Response.json(
      {
        message: isMissingDatabase
          ? "Feedback database is not configured yet."
          : "Message could not be saved right now.",
      },
      { status: isMissingDatabase ? 503 : 500 },
    );
  }
}
