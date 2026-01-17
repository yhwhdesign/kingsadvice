import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, CreditCard, Lock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters."),
  customerEmail: z.string().email("Invalid email address."),
  description: z.string().optional(),
  selectedTopic: z.string().optional(),
  cardNumber: z.string().min(16, "Invalid card number").max(19),
  expiry: z.string().min(5, "MM/YY"),
  cvc: z.string().min(3, "CVC required"),
}).refine((data) => {
  if (data.selectedTopic) return true;
  if (data.description && data.description.length >= 10) return true;
  return false;
}, {
  message: "Please provide either a topic or a detailed description.",
  path: ["description"], 
});

export default function SubmitRequest() {
  const { tier } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validTiers = {
    basic: { name: "Basic Consult", price: 29 },
    middle: { name: "AI Analyst", price: 99 },
    custom: { name: "Expert Review", price: 499 },
  };

  const currentTier = validTiers[tier as keyof typeof validTiers];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      description: "",
      selectedTopic: "",
      cardNumber: "",
      expiry: "",
      cvc: "",
    },
  });

  if (!currentTier) {
    setLocation("/");
    return null;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      let finalDescription = values.description || "";
      if (tier === 'basic' && values.selectedTopic) {
        finalDescription = `Selected Topic: ${values.selectedTopic}`;
      }

      const request = await createRequest({
        tier: tier as any,
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        description: finalDescription,
        amount: currentTier.price,
      });

      toast({
        title: "Request Submitted!",
        description: "We have received your payment and request.",
      });

      setLocation(`/request/${request.id}`);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading">Submit Your Request</h1>
        <p className="text-muted-foreground mt-2">Complete the form below to get started with the {currentTier.name}.</p>
      </div>

      <Alert className="mb-6 bg-yellow-950/30 border-yellow-800">
        <AlertCircle className="h-4 w-4 text-yellow-400" />
        <AlertDescription className="text-yellow-200">
          <strong>Demo Mode:</strong> This is a demonstration. No real charges will be made. Do not enter real payment information.
        </AlertDescription>
      </Alert>

      <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Consultation Details</CardTitle>
              <CardDescription>
                {tier === 'basic' 
                  ? "Select a topic to receive instant best-practice advice." 
                  : "Describe your business challenge in detail."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form id="request-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} data-testid="input-customer-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" {...field} data-testid="input-customer-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {tier === 'basic' ? (
                    <FormField
                      control={form.control}
                      name="selectedTopic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Consulting Topic</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-topic">
                                <SelectValue placeholder="Select a topic..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Marketing Strategy">Marketing Strategy</SelectItem>
                              <SelectItem value="Operational Efficiency">Operational Efficiency</SelectItem>
                              <SelectItem value="Financial Planning">Financial Planning</SelectItem>
                              <SelectItem value="HR & Hiring">HR & Hiring</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            You will receive an instant, pre-determined best practice guide for this topic.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {tier === 'middle' ? 'Your Question' : 'Business Context & Data'}
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={tier === 'middle' 
                                ? "How can I improve my sales conversion rate?..." 
                                : "Please paste your quarterly performance summary here or describe your operational bottlenecks..."
                              }
                              className="min-h-[120px]"
                              {...field}
                              data-testid="textarea-description" 
                            />
                          </FormControl>
                          <FormDescription>
                            {tier === 'middle' 
                              ? "Our AI will analyze your question and provide a strategic response." 
                              : "Provide as much detail as possible for our human experts to review."}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Payment Details (Demo)
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                      <div className="grid gap-4">
                        <FormField
                          control={form.control}
                          name="cardNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Card Number</FormLabel>
                              <FormControl>
                                <Input placeholder="0000 0000 0000 0000" {...field} data-testid="input-card-number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="expiry"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expiry</FormLabel>
                                <FormControl>
                                  <Input placeholder="MM/YY" {...field} data-testid="input-expiry" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="cvc"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CVC</FormLabel>
                                <FormControl>
                                  <Input placeholder="123" {...field} data-testid="input-cvc" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" /> Demo mode - no real charges will be made
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900/50 sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{currentTier.name}</span>
                <span>${currentTier.price}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground text-sm">
                <span>Processing Fee</span>
                <span>$0.00</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span>${currentTier.price}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg" 
                type="submit" 
                form="request-form"
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay $${currentTier.price} (Demo)`
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
