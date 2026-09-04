"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Video } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLegend,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { completeOnboarding } from "@/lib/store/authSlice";
import { ONBOARDING_OPTIONS, PLATFORM_NAME } from "@/constants";

const onboardingSchema = z.object({
  currentRole: z.string().min(1, "Select your current role"),
  experienceLevel: z.string().min(1, "Select your experience level"),
  targetCompany: z.string().min(1, "Enter your target company"),
  targetRole: z.string().min(1, "Enter your target role"),
  interviewTypes: z
    .array(z.string())
    .min(1, "Pick at least one interview type"),
  weeklyGoal: z.string().min(1, "Select a practice goal"),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized, user } = useAppSelector(
    (state) => state.auth,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      currentRole: "",
      experienceLevel: "",
      targetCompany: "",
      targetRole: "",
      interviewTypes: [],
      weeklyGoal: "",
    },
  });

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace("/login");
    } else if (user?.isOnboarded) {
      router.replace("/dashboard");
    }
  }, [isInitialized, isAuthenticated, user, router]);

  if (!isInitialized || !isAuthenticated || user?.isOnboarded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  const onSubmit = async (values: OnboardingValues) => {
    setError("");
    setSubmitting(true);
    try {
      await dispatch(completeOnboarding(values)).unwrap();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper font-sans">
      <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold tracking-tight text-center">
            Let's personalize your practice
          </CardTitle>
          <CardDescription className="text-neutral-400 text-center">
            Tell us what you're doing today and what interview you're practicing
            for — we'll tailor every simulation to you.
          </CardDescription>
        </CardHeader>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FieldGroup className="mt-10">
              <h1 className="text-2xl font-bold tracking-tight">
                What are you currently doing?
              </h1>
              <FormField
                control={form.control}
                name="currentRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current role</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select your current role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ONBOARDING_OPTIONS.currentRoles.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      We use this to calibrate question difficulty and tone.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience level</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select your experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          {ONBOARDING_OPTIONS.experienceLevels.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLegend>What interview are you practicing for?</FieldLegend>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="targetCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target company</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="e.g. Stripe, Google, Meta"
                          disabled={submitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target role</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="e.g. Senior Payments Engineer"
                          disabled={submitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="interviewTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview types to practice</FormLabel>
                    <FormControl>
                      <Field className="mt-2">
                        <div className="grid gap-2 sm:grid-cols-2">
                          {ONBOARDING_OPTIONS.interviewTypes.map((opt) => {
                            const checked = field.value.includes(opt.value);
                            return (
                              <FieldLabel
                                key={opt.value}
                                className="w-full flex-row items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-sm font-medium hover:bg-white/[0.06] cursor-pointer"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(next) => {
                                    const nextValue = next
                                      ? [...field.value, opt.value]
                                      : field.value.filter(
                                          (v) => v !== opt.value,
                                        );
                                    field.onChange(nextValue);
                                  }}
                                />
                                <span>{opt.label}</span>
                              </FieldLabel>
                            );
                          })}
                        </div>
                      </Field>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLegend>Your practice rhythm</FieldLegend>

              <FormField
                control={form.control}
                name="weeklyGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How often do you plan to practice?</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a practice goal" />
                        </SelectTrigger>
                        <SelectContent>
                          {ONBOARDING_OPTIONS.weeklyGoals.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FieldDescription>
                      We'll build a recommendation queue around this.
                    </FieldDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FieldGroup>

            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="w-full bg-white text-black hover:bg-neutral-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Setting up your profile...
                </>
              ) : (
                "Save & Go to Dashboard"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
