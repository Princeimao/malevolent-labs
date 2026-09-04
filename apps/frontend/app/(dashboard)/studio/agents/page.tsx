"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Plus, Loader2, Trash2, Globe, User } from "lucide-react";

import RequireContributor from "@/components/app/RequireContributor";
import { createAgent, deleteAgent, fetchAgents, Agent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const agentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  role: z.string().min(2, "Role/title is required"),
  avatarUrl: z.string().optional(),
  personality: z.string().min(2, "Describe the personality"),
  systemPrompt: z
    .string()
    .min(10, "System prompt should be at least 10 characters"),
  behavior: z.string().optional(),
  style: z.string().optional(),
  focusAreas: z.string().optional(),
  voice: z.string().optional(),
  isCommunity: z.boolean().optional(),
});

type AgentValues = z.infer<typeof agentSchema>;

function AgentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (agent: Agent) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<AgentValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: "",
      role: "",
      avatarUrl: "",
      personality: "",
      systemPrompt: "",
      behavior: "",
      style: "",
      focusAreas: "",
      voice: "",
      isCommunity: false,
    },
  });

  const onSubmit = async (values: AgentValues) => {
    setError("");
    setCreating(true);
    try {
      const agent = await createAgent({
        name: values.name,
        role: values.role,
        avatarUrl: values.avatarUrl || undefined,
        personality: values.personality,
        systemPrompt: values.systemPrompt,
        behavior: values.behavior || undefined,
        style: values.style || undefined,
        focusAreas: values.focusAreas
          ? values.focusAreas
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        voice: values.voice || undefined,
        isCommunity: values.isCommunity,
      });
      onCreated(agent);
      form.reset();
      onOpenChange(false);
    } catch (err) {
      setError("Could not create the agent. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create an interviewer agent</DialogTitle>
          <DialogDescription>
            Define who this agent is — name, personality, system prompt, and
            behavior. This is the interviewer candidates will face.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Maya Chen"
                        disabled={creating}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title / role *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Staff Engineer"
                        disabled={creating}
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
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://… (optional)"
                      disabled={creating}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personality *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Analytical, precise, probes trade-offs"
                      disabled={creating}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System prompt *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="You are a senior staff engineer at a leading payments company. Probe for scale, fault tolerance, and trade-offs..."
                      disabled={creating}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    The core instructions that shape how this agent interviews.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="behavior"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Behavior</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Follows up on scaling claims"
                        disabled={creating}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="style"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interviewing style</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Challenging & architectural"
                        disabled={creating}
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
              name="focusAreas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Focus areas</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Comma separated — e.g. Scalability, Deadlocks, Trade-offs"
                      disabled={creating}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="voice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voice (Agora agent voice)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. default, expressive-01"
                      disabled={creating}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isCommunity"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel>Share with the community</FormLabel>
                    <FormDescription className="text-xs">
                      Allow other contributors to use this agent in their
                      interviews.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Creating agent...
                  </>
                ) : (
                  <>
                    <Bot className="size-4" />
                    Create Agent
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function StudioAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);

  useEffect(() => {
    fetchAgents(onlyMine).then((a) => {
      setAgents(a);
      setLoading(false);
    });
  }, [onlyMine]);

  const handleDelete = async (id: string) => {
    await deleteAgent(id);
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <RequireContributor>
      <div className="min-h-screen bg-paper text-ink font-sans pb-24">
        <main className="max-w-6xl mx-auto px-4 md:px-6 pt-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 pb-6">
            <div>
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Contributor Studio
              </span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink mt-1">
                Interviewer Agents
              </h1>
              <p className="text-neutral-500 text-sm mt-1">
                Create AI interviewers with their own personality, system
                prompts, and behavior.
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="bg-ink text-paper hover:bg-neutral-800">
              <Plus className="size-4" />
              Create Agent
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={!onlyMine ? "default" : "outline"}
              onClick={() => setOnlyMine(false)}
              className={onlyMine ? "border-neutral-300" : "bg-ink text-paper"}
            >
              <Globe className="size-3.5" />
              All agents
            </Button>
            <Button
              size="sm"
              variant={onlyMine ? "default" : "outline"}
              onClick={() => setOnlyMine(true)}
              className={!onlyMine ? "border-neutral-300" : "bg-ink text-paper"}
            >
              <User className="size-3.5" />
              Mine
            </Button>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="size-6 animate-spin text-neutral-500" />
            </div>
          ) : agents.length === 0 ? (
            <Card className="bg-white border-dashed border-neutral-300">
              <CardContent className="p-10 text-center space-y-3">
                <Bot className="size-10 text-neutral-400 mx-auto" />
                <h3 className="text-sm font-semibold text-ink">
                  No agents yet
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Create your first interviewer agent — then use it to build
                  interview rounds in the Interview Studio.
                </p>
                <Button onClick={() => setDialogOpen(true)} className="mx-auto bg-ink text-paper hover:bg-neutral-800">
                  <Plus className="size-4" />
                  Create your first agent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <Card
                  key={agent.id}
                  className="bg-white border-neutral-200 shadow-sm"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className="size-12 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 overflow-hidden shrink-0">
                        {agent.avatarUrl ? (
                          <img
                            src={agent.avatarUrl}
                            alt={agent.name}
                            className="size-12 object-cover"
                          />
                        ) : (
                          <div className="size-12 flex items-center justify-center">
                            <Bot className="size-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-ink text-sm flex items-center gap-1.5">
                          {agent.name}
                          {agent.isCommunity && (
                            <Globe className="size-3 text-emerald-600" />
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs text-neutral-500">
                          {agent.role}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                      {agent.personality}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {agent.focusAreas.slice(0, 4).map((f) => (
                        <Badge
                          key={f}
                          variant="outline"
                          className="border-neutral-200 text-neutral-600 bg-neutral-50"
                        >
                          {f}
                        </Badge>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 font-mono truncate pr-2">
                        {agent.systemPrompt.slice(0, 40)}…
                      </span>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="text-neutral-400 hover:text-rose-500 transition-colors shrink-0"
                        title="Delete agent"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        <AgentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreated={(agent) => setAgents((prev) => [agent, ...prev])}
        />
      </div>
    </RequireContributor>
  );
}
