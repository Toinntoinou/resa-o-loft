import { NextResponse } from "next/server";
import { isAuthenticated } from "./auth";

/** Renvoie une réponse 401 si l'admin n'est pas connecté, sinon null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  return null;
}
