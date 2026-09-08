import { getPostLoginRedirectPath } from "@/lib/auth/redirects";
import { redirect } from "next/navigation";

export default function LoginPage() {
  redirect(getPostLoginRedirectPath(null));
}
