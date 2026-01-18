import { useEffect, useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

let stripePromise: Promise<any> | null = null;

async function getStripe() {
  if (!stripePromise) {
    const response = await fetch("/api/stripe-config");
    const { publishableKey } = await response.json();
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

export default function Checkout() {
  const { tier } = useParams();
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<any>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const customerName = searchParams.get("name") || "";
  const customerEmail = searchParams.get("email") || "";
  const description = searchParams.get("description") || "";

  const tierNames: Record<string, string> = {
    basic: "Basic Consult",
    middle: "AI Analyst",
    custom: "Expert Review",
  };

  useEffect(() => {
    getStripe().then(setStripeInstance);
  }, []);

  useEffect(() => {
    if (!tier || !customerName || !customerEmail) {
      setLocation("/");
      return;
    }

    fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tier,
        customerName,
        customerEmail,
        description,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setClientSecret(data.clientSecret);
        }
      })
      .catch((err) => {
        console.error("Checkout error:", err);
        setError("Failed to initialize checkout");
      });
  }, [tier, customerName, customerEmail, description, setLocation]);

  if (error) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-24">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-red-500">Checkout Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret || !stripeInstance) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-24">
        <Card className="text-center">
          <CardContent className="pt-12 pb-8">
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary mb-6" />
            <h2 className="text-xl font-semibold">Preparing checkout...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we set up your payment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold font-heading">Complete Your Payment</h1>
        <p className="text-muted-foreground mt-2">
          {tierNames[tier || ""] || "Consulting Service"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure payment powered by Stripe</span>
          </div>
        </CardHeader>
        <CardContent>
          <EmbeddedCheckoutProvider stripe={stripeInstance} options={{ clientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Link href={`/submit/${tier}`}>
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to form
          </Button>
        </Link>
      </div>
    </div>
  );
}
