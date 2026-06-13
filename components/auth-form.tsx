"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/domain/auth";
import { Button } from "./button";

type Field = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  suggestion?: "cooperative";
};

type AuthFormProps = {
  title: string;
  description: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  fields: Field[];
  roleSelect?: boolean;
  autofillPresets?: Array<Record<string, string>>;
  autofillShortcuts?: Record<string, Record<string, string>>;
  autofillMemoryMode?: "register" | "login";
};

type CooperativeSuggestion = {
  id: string;
  name: string;
  city: string | null;
  province: string | null;
  verificationStatus: string;
};

const initialState: ActionState = {};

export function AuthForm({
  title,
  description,
  action,
  submitLabel,
  fields,
  roleSelect,
  autofillPresets,
  autofillShortcuts,
  autofillMemoryMode,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [shortcutMode, setShortcutMode] = useState(false);
  const [cooperativeQuery, setCooperativeQuery] = useState("");
  const [cooperativeSuggestions, setCooperativeSuggestions] = useState<
    CooperativeSuggestion[]
  >([]);
  const fieldLabels = new Map(fields.map((field) => [field.name, field.label]));

  if (roleSelect) {
    fieldLabels.set("role", "Role");
  }

  useEffect(() => {
    if (state.message) {
      toast.error(state.message);
      return;
    }

    const errors = Object.entries(state.errors ?? {});
    const firstError = errors.find(([, messages]) => messages.length > 0);

    if (firstError) {
      const [fieldName, messages] = firstError;
      toast.warning(messages[0], {
        description: `Periksa kembali field ${fieldName}.`,
      });
    }
  }, [state]);

  useEffect(() => {
    if (cooperativeQuery.trim().length < 2) {
      setCooperativeSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/cooperatives/suggestions?q=${encodeURIComponent(
            cooperativeQuery,
          )}`,
          { signal: controller.signal },
        );

        if (response.ok) {
          const data = await response.json();
          setCooperativeSuggestions(data.cooperatives ?? []);
        }
      } catch {
        setCooperativeSuggestions([]);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [cooperativeQuery]);

  function fillForm(
    form: HTMLFormElement,
    preset: Record<string, string>,
    description: string,
    shortcutKey?: string,
  ) {
    const emailSuffix = Math.floor(1000 + Math.random() * 9000);
    const resolvedPreset: Record<string, string> = {};

    Object.entries(preset).forEach(([name, value]) => {
      const field = form.elements.namedItem(name);
      const resolvedValue = value.replace("{rand}", String(emailSuffix));
      resolvedPreset[name] = resolvedValue;

      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement
      ) {
        field.value = resolvedValue;

        if (name === "cooperativeName") {
          setCooperativeQuery(resolvedValue);
        }
      }
    });

    if (shortcutKey && autofillMemoryMode === "register") {
      window.localStorage.setItem(
        `scresh:auth-shortcut:${shortcutKey}`,
        JSON.stringify(resolvedPreset),
      );
    }

    toast.info("Form terisi.", { description });
  }

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-8 bg-white"
      noValidate
      onKeyDown={(event) => {
        const key = event.key.toLowerCase();

        if (shortcutMode && autofillShortcuts?.[key]) {
          event.preventDefault();
          const storedPreset =
            autofillMemoryMode === "login"
              ? window.localStorage.getItem(`scresh:auth-shortcut:${key}`)
              : null;
          const rememberedPreset = storedPreset
            ? (JSON.parse(storedPreset) as Record<string, string>)
            : null;

          fillForm(
            event.currentTarget,
            rememberedPreset ?? autofillShortcuts[key],
            rememberedPreset
              ? `Data registrasi ${key.toUpperCase()} dipakai.`
              : `Preset ${key.toUpperCase()} dipakai.`,
            key,
          );
          setShortcutMode(false);
          return;
        }

        if (shortcutMode && key !== "tab") {
          setShortcutMode(false);
        }

        if (
          event.key !== "Tab" ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          !autofillPresets?.length
        ) {
          return;
        }

        event.preventDefault();

        if (autofillShortcuts) {
          setShortcutMode(true);
          toast.info("Pilih preset demo.", {
            description: "Tekan P=Petugas, M=Manager, S=Supervisor, B=Bank.",
          });
          return;
        }

        const preset =
          autofillPresets[Math.floor(Math.random() * autofillPresets.length)];
        fillForm(event.currentTarget, preset, "Tekan submit untuk melanjutkan.");
      }}
      onSubmit={(event) => {
        const form = event.currentTarget;
        const invalidField = Array.from(form.elements).find((element) => {
          return (
            (element instanceof HTMLInputElement ||
              element instanceof HTMLSelectElement) &&
            !element.validity.valid
          );
        }) as HTMLInputElement | HTMLSelectElement | undefined;

        if (!invalidField) {
          return;
        }

        event.preventDefault();

        const label = fieldLabels.get(invalidField.name) ?? "Field";
        const message = invalidField.validity.valueMissing
          ? `${label} wajib diisi.`
          : invalidField.validationMessage;

        toast.warning(message, {
          description: "Periksa kembali data pada form.",
        });
        invalidField.focus();
      }}
    >
      <div className="space-y-1">
        <p className="text-2xl font-semibold leading-8 text-forest">{title}</p>
        <p className="text-sm leading-6 text-[#646464]">{description}</p>
      </div>

      {state.message ? (
        <p className="rounded-[10px] bg-orange/10 px-3 py-2 text-sm text-foreground">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-7">
        {fields.map((field) => (
          <label
            key={field.name}
            className="grid gap-3 text-base font-semibold text-forest"
          >
            {field.label}
            <input
              autoComplete={field.autoComplete}
              className="h-11 border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition placeholder:text-[#646464] focus:border-forest focus:ring-0"
              name={field.name}
              onChange={
                field.suggestion === "cooperative"
                  ? (event) => setCooperativeQuery(event.currentTarget.value)
                  : undefined
              }
              placeholder={field.placeholder}
              required={field.required ?? true}
              type={field.type ?? "text"}
            />
            {field.suggestion === "cooperative" &&
            cooperativeSuggestions.length > 0 ? (
              <div className="grid gap-2 rounded-[16px] bg-surface p-3">
                <p className="text-xs font-semibold text-[#646464]">
                  Rekomendasi koperasi terdaftar
                </p>
                {cooperativeSuggestions.map((cooperative) => (
                  <button
                    className="rounded-[10px] px-2 py-2 text-left text-sm font-semibold text-forest transition hover:bg-white"
                    key={cooperative.id}
                    onClick={(event) => {
                      const input = event.currentTarget
                        .closest("label")
                        ?.querySelector("input");

                      if (input) {
                        input.value = cooperative.name;
                        setCooperativeQuery(cooperative.name);
                      }
                    }}
                    type="button"
                  >
                    {cooperative.name}
                    <span className="block text-xs font-medium text-[#646464]">
                      {[cooperative.city, cooperative.province]
                        .filter(Boolean)
                        .join(", ") || "Lokasi belum lengkap"}{" "}
                      · {cooperative.verificationStatus}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            {state.errors?.[field.name]?.map((error) => (
              <span key={error} className="text-xs font-medium text-orange">
                {error}
              </span>
            ))}
          </label>
        ))}

        {roleSelect ? (
          <label className="grid gap-3 text-base font-semibold text-forest">
            Role
            <select
              className="h-11 border-0 border-b border-forest/15 bg-transparent px-0 text-base font-medium text-forest outline-none transition focus:border-forest focus:ring-0"
              name="role"
              defaultValue="staff"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="supervisor">Supervisor</option>
              <option value="partner">Partner</option>
            </select>
          </label>
        ) : null}
      </div>

      <Button
        className="h-14 w-full rounded-[10px] hover:bg-forest/95"
        disabled={pending}
        size="lg"
        type="submit"
        variant="forest"
      >
        {pending ? "Please wait..." : submitLabel}
      </Button>
    </form>
  );
}
