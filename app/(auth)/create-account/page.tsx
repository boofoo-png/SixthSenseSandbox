import type { Metadata } from "next";
import { cookies } from "next/headers";
import { decodeStoredAccount } from "@/lib/hub/account";
import { SIGNUP_COOKIE } from "@/lib/hub/constants";
import { CreateAccountForm } from "./create-account-form";

export const metadata: Metadata = {
  title: "Create an Account",
  description: "Create a Sixth Sense account for your business.",
};

export default async function CreateAccountPage() {
  // Coming back from step 2: fill step 1 in with the details held so far.
  const pending = decodeStoredAccount((await cookies()).get(SIGNUP_COOKIE)?.value);
  return (
    <CreateAccountForm
      initialValues={pending ? { ...pending.account } : {}}
      keepingPassword={pending !== null}
      showDevTools={process.env.NODE_ENV === "development"}
    />
  );
}
