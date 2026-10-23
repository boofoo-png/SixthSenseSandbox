"use client";

import { useActionState, useId, useRef, useState, type ComponentProps, type DragEvent, type ReactNode } from "react";
import { flushSync, useFormStatus } from "react-dom";
import { Alert } from "@/components/alert";
import { Button, buttonClassName } from "@/components/button";
import { SelectField, TextField } from "@/components/text-field";
import {
  AUDIENCES,
  DOCUMENT_TYPES,
  GOALS,
  INDUSTRIES,
  MAX_CONVERSION_TARGET,
  MAX_DOCUMENT_BYTES,
  MAX_ROWS,
  PLATFORMS,
  SUB_INDUSTRIES,
  emptyOnboardingDraft,
  type OnboardingDraft,
} from "@/lib/hub/onboarding";
import { COUNTRIES, REGIONS, isCountryCode, type CountryCode } from "@/lib/hub/regions";
import { goBackToStepOne, saveOnboarding, type OnboardingState } from "../actions";

// Second Create an Account page from the mid-fi ("Tell us about your industry").

const INITIAL: OnboardingState = { errors: {}, values: null };
const h2Class = "text-[24px] leading-[1.334] font-normal text-ink";
const h3Class = "text-[20px] leading-[1.6] tracking-[0.15px] font-medium text-ink";
const groupLabelClass = "text-[12px] leading-[1.66] tracking-[0.4px] text-ink-muted";
const errorTextClass = "text-[12px] leading-[1.66] tracking-[0.4px] text-error";
const addButtonClass = buttonClassName({ variant: "contained", size: "small", className: "rounded-full px-4" });
const removeButtonClass = buttonClassName({ variant: "text", size: "small", className: "self-center" });

let rowId = 0;
const withIds = <T,>(rows: T[]) => rows.map((row) => ({ ...row, id: ++rowId }));

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className={h2Class}>{title}</h2>
      {children}
    </section>
  );
}

/** A checkbox drawn as an MUI filter Chip. */
function ChipCheckbox({ name, value, label, defaultChecked }: { name: string; value: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="inline-flex h-8 items-center rounded-full bg-selected px-3 text-[13px] leading-[18px] tracking-[0.16px] text-ink transition-colors peer-checked:bg-primary peer-checked:text-primary-contrast peer-focus-visible:ring-4 peer-focus-visible:ring-primary/30 hover:brightness-95">
        {label}
      </span>
    </label>
  );
}

/** Continue and Back. Both are locked while either is being processed, so they cannot both run. */
function StepButtons() {
  const { pending, action } = useFormStatus();
  const goingBack = pending && action === goBackToStepOne;
  return (
    <div className="flex justify-end gap-4 border-t border-divider pt-6">
      <Button type="submit" variant="contained" size="large" loading={pending && !goingBack} disabled={pending}>
        Continue
      </Button>
      <button
        type="submit"
        formAction={goBackToStepOne}
        disabled={pending}
        className={buttonClassName({ variant: "outlined", size: "large" })}
      >
        Back
      </button>
    </div>
  );
}

function CheckboxLabel({ children, ...input }: { children: ReactNode } & ComponentProps<"input">) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-[14px] leading-[1.43] tracking-[0.17px] text-ink">
      <input type="checkbox" className="mt-[2px] size-[18px] shrink-0 cursor-pointer accent-primary" {...input} />
      <span>{children}</span>
    </label>
  );
}

type OnboardingFormProps = {
  /** Answers typed before going Back to step 1. */
  initialDraft?: OnboardingDraft | null;
  /** Show the "Fill with sample data" button (local development only). */
  showDevTools?: boolean;
};

/** Step 2 of Create an Account. Continue creates the account; Back returns to step 1 keeping the answers. */
export function OnboardingForm({ initialDraft = null, showDevTools = false }: OnboardingFormProps) {
  const [state, formAction] = useActionState(saveOnboarding, INITIAL);
  const { errors } = state;
  const submitted = state.values ?? initialDraft ?? emptyOnboardingDraft();
  const hasErrors = Object.keys(errors).length > 0;
  const uploadHelpId = useId();

  const [regions, setRegions] = useState(() => withIds(submitted.regions));
  const [socials, setSocials] = useState(() => withIds(submitted.socials));
  const [competitors, setCompetitors] = useState(() => withIds(submitted.competitors));
  const [reportLinks, setReportLinks] = useState(() => withIds(submitted.reportLinks.map((link) => ({ link }))));
  const [wantsConversions, setWantsConversions] = useState(submitted.goals.includes("conversions"));
  const [conversionTarget, setConversionTarget] = useState(Number(submitted.conversionTarget) || 10);
  const [documents, setDocuments] = useState<string[]>(submitted.documents);

  // After the server answers, rebuild the rows from what was submitted, with new keys, so each
  // row's fields start from its own values (not from whatever row used to be at that position).
  const [seenValues, setSeenValues] = useState(state.values);
  if (state.values !== seenValues) {
    setSeenValues(state.values);
    if (state.values) {
      setRegions(withIds(state.values.regions));
      setSocials(withIds(state.values.socials));
      setCompetitors(withIds(state.values.competitors));
      setReportLinks(withIds(state.values.reportLinks.map((link) => ({ link }))));
      setDocuments(state.values.documents);
    }
  }
  const [rejected, setRejected] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  /** Valid made-up answers for testing (a fictional hotel supplier in Richmond, BC). */
  function fillWithSample() {
    const form = formRef.current;
    if (!form) return;
    flushSync(() => {
      setRegions((current) => [{ ...current[0], country: "CA" }, ...current.slice(1)]);
      setWantsConversions(true);
      setConversionTarget(10);
    });
    const first = (name: string) => form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`);
    const set = (name: string, value: string) => {
      const field = first(name);
      if (field) field.value = value;
    };
    const tick = (name: string, values: string[]) =>
      form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`).forEach((box) => {
        box.checked = values.includes(box.value);
      });
    tick("industry", ["Wholesale", "Hospitality"]);
    set("subIndustry", "Hotel and accommodation supplies");
    set("regionProvince", "BC");
    set("regionArea", "Lower Mainland");
    set("audience", "Commercial");
    tick("goal", ["traffic", "awareness", "conversions"]);
    set("website", "harbourlinesupply.example");
    set("socialPlatform", "Instagram");
    set("socialHandle", "@harbourline.supply");
    const consent = first("analyticsConsent");
    if (consent instanceof HTMLInputElement) consent.checked = true;
    set("competitorName", "Coastal Linen Co.");
    set("competitorWebsite", "coastal-linen.example");
    set("invites", "sam@example.com");
  }

  function addFiles(files: FileList | File[]) {
    const accepted: string[] = [];
    const turnedAway: string[] = [];
    for (const file of Array.from(files)) {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!(DOCUMENT_TYPES as readonly string[]).includes(extension)) {
        turnedAway.push(`${file.name} isn't a PDF, PNG, JPG, DOCX, or XLSX file`);
      } else if (file.size > MAX_DOCUMENT_BYTES) {
        turnedAway.push(`${file.name} is larger than 3MB`);
      } else {
        accepted.push(file.name);
      }
    }
    setDocuments((current) => [...new Set([...current, ...accepted])].slice(0, 10));
    setRejected(turnedAway);
    if (fileInput.current) fileInput.current.value = "";
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  }

  return (
    <section className="w-full max-w-[900px]">
      <p className="text-[12px] leading-[2.66] tracking-[1px] uppercase text-ink-muted">Step 2 of 2</p>
      <h1 className="text-[34px] leading-[1.235] tracking-[0.25px] font-normal text-ink">Tell us about your industry</h1>
      <p className="mt-2 text-[16px] leading-[1.5] tracking-[0.15px] text-ink-muted">
        Sixth Sense uses your answers to tailor research, content, and campaigns to your business. You can change them
        later in Settings.
      </p>

      {hasErrors && (
        <Alert severity="error" className="mt-6">
          {errors.form ?? "Check the highlighted answers and try again."}
        </Alert>
      )}

      {showDevTools && (
        <button type="button" onClick={fillWithSample} className={buttonClassName({ variant: "outlined", size: "small", className: "mt-4" })}>
          Fill with sample data (local testing only)
        </button>
      )}

      <form ref={formRef} action={formAction} noValidate className="mt-8 flex flex-col gap-10">
        <Section title="Industry">
          <fieldset aria-describedby={errors.industries ? "industries-error" : undefined}>
            <legend className={groupLabelClass}>Industries</legend>
            <p className={`mb-2 ${groupLabelClass}`}>Choose all that apply</p>
            <div className="flex flex-wrap gap-2" role="presentation">
              {INDUSTRIES.map((industry) => (
                <ChipCheckbox
                  key={`${industry}-${submitted.industries.includes(industry)}`}
                  name="industry"
                  value={industry}
                  label={industry}
                  defaultChecked={submitted.industries.includes(industry)}
                />
              ))}
            </div>
            {errors.industries && (
              <p id="industries-error" className={`mt-2 ${errorTextClass}`}>
                {errors.industries}
              </p>
            )}
          </fieldset>
          <SelectField
            className="sm:max-w-[420px]"
            label="Sub-industry"
            name="subIndustry"
            placeholder="Choose a sub-industry (optional)"
            options={SUB_INDUSTRIES.map((value) => ({ value, label: value }))}
            defaultValue={submitted.subIndustry}
          />
        </Section>

        <Section title="Who are you trying to reach?">
          <h3 className={h3Class}>Target Region</h3>
          {regions.map((row, index) => {
            const country: CountryCode = isCountryCode(row.country) ? row.country : "CA";
            const regionLabel = COUNTRIES.find((entry) => entry.code === country)?.regionLabel ?? "Province";
            return (
              <div key={row.id} className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <SelectField
                  label="Country"
                  name="regionCountry"
                  options={COUNTRIES.map((entry) => ({ value: entry.code, label: entry.name }))}
                  value={country}
                  onChange={(event) =>
                    setRegions((current) => current.map((item) => (item.id === row.id ? { ...item, country: event.target.value, province: "" } : item)))
                  }
                  error={errors[`regions.${index}.country`]}
                />
                <SelectField
                  key={country}
                  label={regionLabel}
                  name="regionProvince"
                  placeholder={`Choose a ${regionLabel.toLowerCase()}`}
                  options={REGIONS[country].map((region) => ({ value: region.code, label: region.name }))}
                  defaultValue={row.province}
                  error={errors[`regions.${index}.province`]}
                />
                <TextField
                  label="Region or city (optional)"
                  name="regionArea"
                  placeholder="e.g. Lower Mainland"
                  maxLength={100}
                  defaultValue={row.area}
                />
                {index > 0 ? (
                  <button
                    type="button"
                    className={removeButtonClass}
                    aria-label={`Remove region ${index + 1}`}
                    onClick={() => setRegions((current) => current.filter((item) => item.id !== row.id))}
                  >
                    Remove
                  </button>
                ) : (
                  <span className="hidden sm:block sm:w-[76px]" />
                )}
              </div>
            );
          })}
          {regions.length < MAX_ROWS && (
            <button
              type="button"
              className={`${addButtonClass} self-start`}
              aria-label="Add another region"
              onClick={() => setRegions((current) => [...current, ...withIds([{ country: "CA", province: "", area: "" }])])}
            >
              Add another
            </button>
          )}
          <SelectField
            className="mt-4 sm:max-w-[420px]"
            label="Which general audience do you want to reach?"
            name="audience"
            placeholder="Choose a category"
            options={AUDIENCES.map((value) => ({ value, label: value }))}
            defaultValue={submitted.audience}
            error={errors.audience}
          />
        </Section>

        <section className="flex flex-col gap-4">
          <h2 id="goals-heading" className={h2Class}>
            Goals
          </h2>
          <fieldset aria-labelledby="goals-heading">
            <p className={`mb-3 ${groupLabelClass}`}>Check all that apply</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {GOALS.map((goal) => (
                <CheckboxLabel
                  key={`${goal.id}-${submitted.goals.includes(goal.id)}`}
                  name="goal"
                  value={goal.id}
                  defaultChecked={submitted.goals.includes(goal.id)}
                  onChange={goal.id === "conversions" ? (event) => setWantsConversions(event.target.checked) : undefined}
                >
                  {goal.label}
                </CheckboxLabel>
              ))}
            </div>
            {errors.goals && <p className={`mt-2 ${errorTextClass}`}>{errors.goals}</p>}
          </fieldset>
          {wantsConversions && (
            <div className="flex max-w-[420px] flex-col gap-1">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  name="conversionTarget"
                  min={1}
                  max={MAX_CONVERSION_TARGET}
                  step={1}
                  value={conversionTarget}
                  onChange={(event) => setConversionTarget(Number(event.target.value))}
                  aria-label="Target increase in conversions"
                  className="h-1 flex-1 cursor-pointer accent-primary"
                />
                <output className="w-12 rounded bg-ink-muted px-2 py-1 text-center text-[12px] text-paper">{`${conversionTarget}%`}</output>
              </div>
              <p className={groupLabelClass}>Target increase in conversions</p>
              {errors.conversionTarget && <p className={errorTextClass}>{errors.conversionTarget}</p>}
            </div>
          )}
        </section>

        <Section title="Link your accounts">
          <TextField
            className="sm:max-w-[420px]"
            label="Website"
            name="website"
            required
            placeholder="example.com"
            autoComplete="url"
            defaultValue={submitted.website}
            error={errors.website}
          />
          <Alert severity="info">
            Connecting to the platforms isn&apos;t available in the prototype yet. Sixth Sense saves your handles so it
            can connect them later.
          </Alert>
          {socials.map((row, index) => (
            <div key={row.id} className="grid gap-4 sm:grid-cols-[200px_1fr_auto]">
              <SelectField
                label="Platform"
                name="socialPlatform"
                options={PLATFORMS.map((value) => ({ value, label: value }))}
                defaultValue={row.platform}
                error={errors[`socials.${index}.platform`]}
              />
              <TextField
                label="Handle"
                name="socialHandle"
                placeholder="@yourbrand"
                maxLength={31}
                defaultValue={row.handle}
                error={errors[`socials.${index}.handle`]}
              />
              {index > 0 ? (
                <button
                  type="button"
                  className={removeButtonClass}
                  aria-label={`Remove account ${index + 1}`}
                  onClick={() => setSocials((current) => current.filter((item) => item.id !== row.id))}
                >
                  Remove
                </button>
              ) : (
                <span className="hidden sm:block sm:w-[76px]" />
              )}
            </div>
          ))}
          {socials.length < MAX_ROWS && (
            <button
              type="button"
              className={`${addButtonClass} self-start`}
              aria-label="Add another account"
              onClick={() => setSocials((current) => [...current, ...withIds([{ platform: "Instagram", handle: "" }])])}
            >
              Add another
            </button>
          )}
          <div>
            <CheckboxLabel
              key={`consent-${submitted.analyticsConsent}`}
              name="analyticsConsent"
              defaultChecked={submitted.analyticsConsent}
              aria-invalid={errors.analyticsConsent ? true : undefined}
            >
              I authorize Sixth Sense to access my connected social media accounts&apos; analytics (such as reach,
              engagement, clicks, and follower data) so the platform can generate insights and reports for my business.
              <span className="mt-1 block text-ink-muted">
                We only read analytics data. We never post, message, or change anything without your permission. You
                can disconnect at any time in Settings.
              </span>
            </CheckboxLabel>
            {errors.analyticsConsent && <p className={`mt-1 ml-[26px] ${errorTextClass}`}>{errors.analyticsConsent}</p>}
          </div>
        </Section>

        <Section title="Competitors">
          <p className={groupLabelClass}>Optional</p>
          {competitors.map((row, index) => (
            <div key={row.id} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
              <TextField
                label="Company name"
                name="competitorName"
                maxLength={100}
                defaultValue={row.name}
                error={errors[`competitors.${index}.name`]}
              />
              <TextField
                label="Company website"
                name="competitorWebsite"
                placeholder="example.com"
                defaultValue={row.website}
                error={errors[`competitors.${index}.website`]}
              />
              {index > 0 ? (
                <button
                  type="button"
                  className={removeButtonClass}
                  aria-label={`Remove competitor ${index + 1}`}
                  onClick={() => setCompetitors((current) => current.filter((item) => item.id !== row.id))}
                >
                  Remove
                </button>
              ) : (
                <span className="hidden sm:block sm:w-[76px]" />
              )}
            </div>
          ))}
          {competitors.length < MAX_ROWS && (
            <button
              type="button"
              className={`${addButtonClass} self-start`}
              aria-label="Add another competitor"
              onClick={() => setCompetitors((current) => [...current, ...withIds([{ name: "", website: "" }])])}
            >
              Add another
            </button>
          )}
        </Section>

        <Section title="Upload Documents">
          <p className="text-[14px] leading-[1.43] tracking-[0.17px] text-ink-muted">
            Optionally, upload past marketing reports, ad results, or spreadsheets to give your insights more context.
          </p>
          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            className="flex cursor-pointer flex-col items-center gap-2 rounded border-2 border-dashed border-primary/60 bg-primary/4 px-4 py-10 text-center focus-within:ring-4 focus-within:ring-primary/30"
          >
            <span className="text-[20px] leading-[1.6] tracking-[0.15px] text-ink">Click or drag and drop to upload</span>
            <span id={uploadHelpId} className="text-[16px] leading-[1.5] text-ink-muted">
              PDF, PNG, JPG, DOCX, or XLSX (max. 3MB per file)
            </span>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={DOCUMENT_TYPES.map((type) => `.${type}`).join(",")}
              aria-describedby={uploadHelpId}
              className="sr-only"
              onChange={(event) => event.target.files && addFiles(event.target.files)}
            />
          </label>
          <p className={groupLabelClass}>In the prototype only the file names are saved; files are not uploaded.</p>
          {rejected.map((message) => (
            <p key={message} role="alert" className={errorTextClass}>
              {message}
            </p>
          ))}
          {documents.length > 0 && (
            <ul className="flex flex-col gap-1">
              {documents.map((name) => (
                <li key={name} className="flex items-center justify-between gap-2 rounded bg-selected px-3 py-1 text-[14px] text-ink">
                  {name}
                  <input type="hidden" name="documentName" value={name} />
                  <button
                    type="button"
                    className={buttonClassName({ variant: "text", size: "small" })}
                    aria-label={`Remove ${name}`}
                    onClick={() => setDocuments((current) => current.filter((item) => item !== name))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          {errors.documents && <p className={errorTextClass}>{errors.documents}</p>}
          {reportLinks.map((row, index) => (
            <div key={row.id} className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <TextField
                label="Link to a report (optional)"
                name="reportLink"
                type="url"
                placeholder="https://"
                defaultValue={row.link}
                error={errors[`reportLinks.${index}`]}
              />
              {index > 0 ? (
                <button
                  type="button"
                  className={removeButtonClass}
                  aria-label={`Remove link ${index + 1}`}
                  onClick={() => setReportLinks((current) => current.filter((item) => item.id !== row.id))}
                >
                  Remove
                </button>
              ) : (
                <span className="hidden sm:block sm:w-[76px]" />
              )}
            </div>
          ))}
          {reportLinks.length < 3 && (
            <button
              type="button"
              className={`${addButtonClass} self-start`}
              aria-label="Add another link"
              onClick={() => setReportLinks((current) => [...current, ...withIds([{ link: "" }])])}
            >
              Add another
            </button>
          )}
        </Section>

        <Section title="Invite your team">
          <TextField
            label="Email addresses (optional)"
            name="invites"
            placeholder="Enter email addresses, separated with a comma"
            helperText="Invites aren't sent in the prototype; Sixth Sense saves the addresses for later."
            defaultValue={submitted.invites}
            error={errors.invites}
          />
        </Section>

        <StepButtons />
      </form>

    </section>
  );
}
