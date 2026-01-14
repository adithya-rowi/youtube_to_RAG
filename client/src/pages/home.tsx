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

// Form Schema
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setStatus("processing");
    setResult(null);

    try {
      // Mock processing steps
      setStatusMessage("Downloading audio stream...");
      await new Promise(r => setTimeout(r, 1500));
      
      setStatusMessage("Transcribing content...");
      await new Promise(r => setTimeout(r, 2000));
      
      setStatusMessage("Syncing to Ragie knowledge base...");
      await new Promise(r => setTimeout(r, 1500));

      setStatus("success");
      setResult(`transcript_${Math.random().toString(36).substring(7)}.txt`);
      form.reset();
    } catch (error) {
      setStatus("error");
      setStatusMessage("Failed to process video. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 font-sans text-foreground">
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-12 space-y-4"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge variant="secondary" className="px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            Internal Tool
          </Badge>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Gus Transcript Pipeline
        </h1>
        <div className="flex items-center justify-center gap-3 text-lg text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1.5"><Youtube className="w-5 h-5 text-red-500" /> YouTube</span>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">Ragie AI</span>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-lg"
      >
        <Card className="border-none shadow-2xl shadow-blue-900/5 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden">
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
                            className="h-14 pl-4 text-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all rounded-xl shadow-inner"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 ml-1" />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={status === "processing"}
                  className="w-full h-14 text-lg font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
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
          
          {/* Status Bar */}
          <div className="bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 p-6 min-h-[100px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {status === "idle" && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-slate-400 text-sm font-medium"
                >
                  Ready to process transcripts
                </motion.p>
              )}

              {status === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-2"
                >
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  <p className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
                    {statusMessage}
                  </p>
                </motion.div>
              )}

              {status === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center gap-2 text-green-600 dark:text-green-500"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-1">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="font-bold">Successfully Synced!</p>
                  <p className="text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                    {result}
                  </p>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center gap-1 text-red-500"
                >
                  <AlertCircle className="w-6 h-6 mb-1" />
                  <p className="font-bold">Error Processing Video</p>
                  <p className="text-sm text-red-400">Please check the URL and try again.</p>
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
        <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          Syncs to Ragie automatically
        </p>
      </motion.footer>
    </div>
  );
}
