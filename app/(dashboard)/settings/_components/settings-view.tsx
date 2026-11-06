"use client";

import { useActionState, useState } from "react";
import { signOut } from "@/app/(auth)/actions";
import { LineIcon, type LineIconName } from "@/components/line-icons";
import { initialsOf } from "@/lib/hub/workspace";
import { INDUSTRIES } from "@/lib/hub/onboarding";
import { NOTIFICATION_TYPES, SECTIONS, TIME_ZONES, type AccountSettings, type Section, type SettingsField } from "@/lib/hub/settings";
import { changePassword, saveSettings, type PasswordState, type SaveSettingsState } from "../actions";
import { MetaCard } from "./meta-card";

// The Figma Make's "Profile and settings" page: Profile, Workspace, Notifications, and Security,
// with one Save changes button for the first three. Everything is saved for this browser only.

const ICONS: Record<Section, LineIconName> = { Profile: "audience", Workspace: "dashboard", Notifications: "bell", Security: "settings" };

const panel = "min-w-0 rounded-[22px] border border-brand-cream/70 bg-brand-cream/94 p-5 text-brand-navy shadow-[0_7px_0_rgba(0,31,62,0.16),0_18px_35px_rgba(0,31,62,0.12)] backdrop-blur-[18px]";
const input = "w-full rounded-[10px] border border-brand-teal/20 bg-white px-3.5 py-2.5 text-[14px] text-brand-navy outline-none focus:border-brand-teal disabled:bg-[#eef1ea] disabled:text-[#5f6b6d] aria-invalid:border-[#b3261e]";
const label = "text-[12px] font-semibold text-[#3f4b4d]";
const eyebrow = "mb-1 text-[10px] font-bold tracking-[0.11em] text-brand-coral uppercase";

function Heading({ eyebrowText, title, children }: { eyebrowText: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <p className={eyebrow}>{eyebrowText}</p>
        <h2 className="text-[20px] font-semibold text-brand-navy">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ name, title, value, errors, type = "text", hint, disabled }: { name: SettingsField | "email"; title: string; value: string; errors?: Partial<Record<string, string>>; type?: string; hint?: string; disabled?: boolean }) {
  const error = errors?.[name];
  const id = `settings-${name}`;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className={label}>
        {title}
      </label>
      <input id={id} name={disabled ? undefined : name} type={type} defaultValue={value} disabled={disabled} maxLength={200} aria-invalid={error ? true : undefined} aria-describedby={error || hint ? `${id}-note` : undefined} className={input} />
      {(error || hint) && (
        <p id={`${id}-note`} className={`text-[11px] ${error ? "font-semibold text-[#b3261e]" : "text-[#5f6b6d]"}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

function Select({ name, title, value, options, error }: { name: SettingsField; title: string; value: string; options: readonly string[]; error?: string }) {
  const id = `settings-${name}`;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className={label}>
        {title}
      </label>
      <select id={id} name={name} defaultValue={value} aria-invalid={error ? true : undefined} className={input}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      {error && <p className="text-[11px] font-semibold text-[#b3261e]">{error}</p>}
    </div>
  );
}

function PasswordForm({ isDemo }: { isDemo: boolean }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, { status: "idle", errors: {} });
  if (state.status === "changed") {
    return (
      <p role="status" className="mt-3 rounded-[10px] bg-[#edf7f2] px-3 py-2 text-[13px] font-semibold text-brand-teal">
        Password changed. Use it the next time you log in.
      </p>
    );
  }
  return (
    <form action={action} className="mt-3 grid gap-3 rounded-[12px] bg-white/70 p-3.5">
      {isDemo && <p className="text-[12px] text-[#5f6b6d]">The demo account&apos;s password is fixed. Create your own account to change a password.</p>}
      {[
        ["current", "Current password", "current-password"],
        ["password", "New password (at least 8 characters)", "new-password"],
        ["confirmPassword", "Re-type the new password", "new-password"],
      ].map(([name, title, autoComplete]) => {
        const error = state.errors[name as keyof PasswordState["errors"]];
        return (
          <div key={name} className="grid gap-1.5">
            <label htmlFor={`pw-${name}`} className={label}>
              {title}
            </label>
            <input id={`pw-${name}`} name={name} type="password" autoComplete={autoComplete} disabled={isDemo} aria-invalid={error ? true : undefined} className={input} />
            {error && <p className="text-[11px] font-semibold text-[#b3261e]">{error}</p>}
          </div>
        );
      })}
      {state.errors.form && (
        <p role="alert" className="text-[12px] font-semibold text-[#b3261e]">
          {state.errors.form}
        </p>
      )}
      <button type="submit" disabled={isDemo || pending} className="w-fit rounded-[18px] bg-brand-teal px-4 py-2 text-[13px] font-semibold text-brand-cream hover:bg-brand-navy disabled:opacity-50">
        {pending ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}

export function SettingsView({
  initial,
  startSection,
  isDemo,
  connected,
  metaCard,
}: {
  initial: AccountSettings;
  startSection: Section;
  isDemo: boolean;
  connected: string[];
  metaCard?: React.ComponentProps<typeof MetaCard>;
}) {
  const [section, setSection] = useState<Section>(startSection);
  const [state, action, pending] = useActionState<SaveSettingsState, FormData>(saveSettings, { status: "idle", errors: {} });
  const [changed, setChanged] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const values = state.values ?? initial;
  const name = `${values.firstName} ${values.lastName}`.trim();
  const saved = state.status === "saved" && !changed;

  // After a failed save, open the section with the problem (once per save result).
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    if (state.status === "invalid") {
      const fields = Object.keys(state.errors);
      if (fields.some((field) => ["firstName", "lastName", "role", "phone"].includes(field))) setSection("Profile");
      else if (fields.length > 0) setSection("Workspace");
    }
  }

  return (
    <>
      <header className="mb-6 flex flex-col items-start gap-5 min-[621px]:flex-row min-[621px]:items-end min-[621px]:justify-between">
        <div className="text-brand-cream">
          <p className="mb-1 text-[10px] font-bold tracking-[0.11em] uppercase">Account and workspace</p>
          <h1 className="text-[clamp(25px,2.7vw,38px)] leading-[1.08] font-semibold tracking-[-0.045em]">Profile and settings</h1>
          <p className="mt-2.5 max-w-[630px] text-[13px] leading-[1.6] text-brand-cream/90">Manage your personal details, workspace preferences, notifications, and account security.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="submit"
            form="settings-form"
            disabled={pending}
            className={`min-h-11 rounded-[22px] px-6 text-[13px] font-bold shadow-[0_5px_0_rgba(0,31,62,0.17)] ${saved ? "bg-[#4e8067] text-brand-cream" : "bg-brand-lime-bright text-brand-navy hover:bg-brand-lime"}`}
          >
            {pending ? "Saving…" : saved ? "Changes saved" : "Save changes"}
          </button>
        </div>
      </header>
      <p role="status" className="mb-3 min-h-[18px] text-[13px] font-semibold text-brand-cream">
        {state.status === "saved" && !changed ? "Your changes were saved in this browser." : state.status === "invalid" ? "Check the highlighted fields." : state.status === "failed" ? "Those answers are too long to save. Shorten them and try again." : ""}
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3.5 min-[901px]:grid-cols-[280px_minmax(0,1fr)]">
        <aside className={`${panel} self-start`}>
          <div className="grid justify-items-center border-b border-brand-teal/12 px-2 pt-3 pb-5 text-center max-[900px]:hidden">
            <span aria-hidden="true" className="mb-2.5 grid size-16 place-items-center rounded-full bg-brand-lime-bright text-[18px] font-bold text-brand-navy">
              {initialsOf(name)}
            </span>
            <strong className="text-[15px]">{name}</strong>
            <p className="text-[12px] text-brand-teal">{values.role || "Add your role"}</p>
            <span className="text-[11px] text-[#5f6b6d]">{values.company}</span>
          </div>
          <nav aria-label="Settings sections" className="mt-3 grid grid-cols-2 gap-1 min-[621px]:grid-cols-4 min-[901px]:grid-cols-1">
            {SECTIONS.map((item) => (
              <button
                key={item}
                type="button"
                aria-current={section === item ? "page" : undefined}
                onClick={() => setSection(item)}
                className={`grid min-h-10 grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-[9px] px-3 text-left text-[13px] ${section === item ? "bg-brand-lime font-semibold text-brand-navy" : "text-[#4f5d5f] hover:bg-brand-teal/8"}`}
              >
                <LineIcon name={ICONS[item]} size={17} />
                {item}
                <LineIcon name="chevron" size={14} />
              </button>
            ))}
          </nav>
          <form action={signOut} className="mt-4 border-t border-brand-teal/12 pt-4">
            <button type="submit" className="w-full rounded-[18px] border border-brand-teal/20 bg-white/70 py-2 text-[13px] font-semibold text-brand-teal hover:border-brand-teal">
              Sign out
            </button>
          </form>
        </aside>

        <div className={panel}>
          {/* Profile, Workspace, and Notifications are one form: all fields are sent, hidden ones too. */}
          <form id="settings-form" action={action} onChange={() => setChanged(true)} onSubmit={() => setChanged(false)} noValidate>
            <section hidden={section !== "Profile"} aria-label="Profile">
              <Heading eyebrowText="Personal details" title="Your profile">
                <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-brand-lime-bright text-[13px] font-bold text-brand-navy">
                  {initialsOf(name)}
                </span>
              </Heading>
              <div className="grid gap-4 min-[621px]:grid-cols-2">
                <Field name="firstName" title="First name" value={values.firstName} errors={state.errors} />
                <Field name="lastName" title="Last name" value={values.lastName} errors={state.errors} />
                <Field name="role" title="Role at company" value={values.role} errors={state.errors} />
                <Field name="phone" title="Phone number" type="tel" value={values.phone} errors={state.errors} />
                <Field name="email" title="Email address" type="email" value={values.email} disabled hint="Your email is how you log in, so it can't be changed here." />
              </div>
            </section>

            <section hidden={section !== "Workspace"} aria-label="Workspace">
              <Heading eyebrowText="Company details" title="Workspace profile" />
              <div className="grid gap-4 min-[621px]:grid-cols-2">
                <Field name="company" title="Company name" value={values.company} errors={state.errors} />
                <Field name="website" title="Website" value={values.website} errors={state.errors} />
                <Select name="industry" title="Default industry" value={values.industry} options={INDUSTRIES} error={state.errors.industry} />
                <Select name="timeZone" title="Default time zone" value={values.timeZone} options={TIME_ZONES} error={state.errors.timeZone} />
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-[12px] bg-brand-lime/40 p-3.5">
                <LineIcon name="link" size={18} className="mt-0.5 text-brand-teal" />
                <p className="grid gap-0.5 text-[13px]">
                  <strong>
                    {connected.length} {connected.length === 1 ? "channel" : "channels"} listed at sign-up
                  </strong>
                  {connected.length > 0
                    ? `${connected.join(", ")} ${connected.length === 1 ? "was" : "were"} entered during sign-up (not a real connection). Use the card below to connect Instagram for real.`
                    : "No social accounts were entered at sign-up."}
                </p>
              </div>
              {metaCard && <MetaCard {...metaCard} />}
            </section>

            <section hidden={section !== "Notifications"} aria-label="Notifications">
              <Heading eyebrowText="Alert preferences" title="Choose what reaches you" />
              <ul className="grid gap-2.5">
                {NOTIFICATION_TYPES.map((type) => (
                  <li key={type.id} className="flex items-center justify-between gap-4 rounded-[12px] bg-white/70 p-3.5">
                    <label htmlFor={`notify-${type.id}`} className="grid gap-0.5">
                      <strong className="text-[14px]">{type.title}</strong>
                      <span className="text-[12px] text-[#5f6b6d]">{type.detail}</span>
                    </label>
                    <input
                      id={`notify-${type.id}`}
                      name={`notify-${type.id}`}
                      type="checkbox"
                      role="switch"
                      defaultChecked={values.notifications[type.id]}
                      className="relative h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-[#c9d3cf] transition-colors before:absolute before:top-0.5 before:left-0.5 before:size-5 before:rounded-full before:bg-white before:shadow before:transition-[left] before:content-[''] checked:bg-brand-teal checked:before:left-[22px] focus-visible:ring-2 focus-visible:ring-brand-teal/40 focus-visible:outline-none"
                    />
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12px] text-[#5f6b6d]">Alerts appear under the bell in the top bar; nothing is emailed in the prototype.</p>
            </section>
          </form>

          <section hidden={section !== "Security"} aria-label="Security">
            <Heading eyebrowText="Account security" title="Password and sessions" />
            <div className="grid gap-3">
              <div className="rounded-[12px] bg-white/70 p-3.5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid size-[30px] place-items-center rounded-[7px] bg-[#dbe8e8] text-brand-teal">
                    <LineIcon name="settings" size={17} />
                  </span>
                  <div className="flex-1">
                    <strong className="text-[14px]">Password</strong>
                    <p className="text-[12px] text-[#5f6b6d]">{isDemo ? "The demo account uses a shared password." : "Change it any time; you'll use the new one next time you log in."}</p>
                  </div>
                  <button type="button" aria-expanded={showPassword} onClick={() => setShowPassword((value) => !value)} className="rounded-[18px] border border-brand-teal/20 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-brand-teal hover:border-brand-teal">
                    Change password
                  </button>
                </div>
                {showPassword && <PasswordForm isDemo={isDemo} />}
              </div>
              <div className="rounded-[12px] bg-white/70 p-3.5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid size-[30px] place-items-center rounded-[7px] bg-[#ecffb6] text-[#00804c]">
                    <LineIcon name="activity" size={17} />
                  </span>
                  <div className="flex-1">
                    <strong className="text-[14px]">Active sessions</strong>
                    <p className="text-[12px] text-[#5f6b6d]">1 session: this browser</p>
                  </div>
                  <button type="button" aria-expanded={showSessions} onClick={() => setShowSessions((value) => !value)} className="rounded-[18px] border border-brand-teal/20 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-brand-teal hover:border-brand-teal">
                    Review sessions
                  </button>
                </div>
                {showSessions && (
                  <div className="mt-3 grid gap-2 rounded-[12px] bg-white/80 p-3.5 text-[13px]">
                    <p>
                      <strong>This browser</strong> · signed in as {values.email}
                    </p>
                    <p className="text-[12px] text-[#5f6b6d]">Sign-in is kept in this browser only, so there are no other sessions to review.</p>
                    <form action={signOut}>
                      <button type="submit" className="rounded-[18px] bg-brand-teal px-4 py-1.5 text-[12px] font-semibold text-brand-cream hover:bg-brand-navy">
                        Sign out of this browser
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
