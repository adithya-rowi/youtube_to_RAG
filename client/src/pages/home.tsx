import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, Youtube, ArrowRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  url: z.string().url({ message: "Please enter a valid YouTube URL" }).refine((val) => val.includes("youtube.com") || val.includes("youtu.be"), {
    message: "Must be a YouTube link",
  }),
});

type ProcessState = "idle" | "processing" | "success" | "error";

export default function Home() {
  const [status, setStatus] = useState<ProcessState>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setStatus("processing");
    setResult(null);
    setErrorMessage("");

    try {
      setStatusMessage("Fetching YouTube transcript...");
      
      const response = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: values.url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to process video");
      }

      setStatusMessage("Syncing to Ragie knowledge base...");
      await new Promise(r => setTimeout(r, 800));

      setStatus("success");
      setResult(data.filename);
      form.reset();
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Failed to process video. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 font-sans text-foreground">
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-12 space-y-4 max-w-2xl mx-auto"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge variant="outline" className="px-3 py-1 rounded border-accent text-accent bg-accent/5 text-xs font-medium tracking-wide uppercase" data-testid="badge-internal-tool">
            Internal Tool
          </Badge>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground" data-testid="heading-title">
          Gus Transcript Pipeline
        </h1>
        <div className="flex items-center justify-center gap-3 text-lg text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5"><Youtube className="w-5 h-5 text-red-600" /> YouTube</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
          <span className="flex items-center gap-1.5 text-accent">Ragie AI</span>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-lg"
      >
        <Card className="border border-border shadow-sm rounded-md overflow-hidden bg-card">
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative group">
                          <Input 
                            placeholder="Paste YouTube URL here..." 
                            {...field} 
                            disabled={status === "processing"}
                            data-testid="input-youtube-url"
                            className="h-12 pl-4 text-base bg-background border-input focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all rounded shadow-sm"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-destructive text-sm ml-1" />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={status === "processing"}
                  data-testid="button-process"
                  className="w-full h-12 text-base font-medium rounded bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all active:scale-[0.99]"
                >
                  {status === "processing" ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Process Video"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          
          <div className="bg-muted/50 border-t border-border p-6 min-h-[100px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {status === "idle" && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-muted-foreground text-sm"
                  data-testid="status-idle"
                >
                  Ready to process transcripts
                </motion.p>
              )}

              {status === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex flex-col items-center gap-2"
                  data-testid="status-processing"
                >
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <p className="text-foreground font-medium text-sm animate-pulse">
                    {statusMessage}
                  </p>
                </motion.div>
              )}

              {status === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center gap-2 text-green-600 dark:text-green-500"
                  data-testid="status-success"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold text-sm">Successfully Synced!</span>
                  </div>
                  <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded border border-border" data-testid="text-filename">
                    {result}
                  </code>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center gap-1 text-destructive"
                  data-testid="status-error"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold text-sm">Error</span>
                  </div>
                  <p className="text-xs text-destructive/80 text-center">{errorMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-center"
      >
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          Syncs to Ragie automatically
        </p>
      </motion.footer>
    </div>
  );
}
