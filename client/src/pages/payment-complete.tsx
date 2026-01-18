import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Home, XCircle, FileText } from "lucide-react";
import { Link } from "wouter";

export default function PaymentComplete() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [tierName, setTierName] = useState("");
  const [basicResponse, setBasicResponse] = useState<{ topic: string; response: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setLocation("/");
      return;
    }

    async function checkStatus() {
      try {
        const response = await fetch(`/api/session-status/${sessionId}`);
        const data = await response.json();

        if (data.status === "complete") {
          setStatus("success");
          const tierNames: Record<string, string> = {
            basic: "Basic Consult",
            middle: "AI Analyst",
            custom: "Expert Review",
          };
          setTierName(tierNames[data.tier] || "Consulting Service");
          
          // For Basic tier, capture the response to display immediately
          if (data.tier === "basic" && data.topic && data.response) {
            setBasicResponse({ topic: data.topic, response: data.response });
          }
        } else if (data.status === "open") {
          setStatus("error");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Status check error:", error);
        setStatus("error");
      }
    }

    checkStatus();
  }, [setLocation]);

  if (status === "loading") {
    return (
      <div className="container max-w-lg mx-auto px-4 py-24">
        <Card className="text-center">
          <CardContent className="pt-12 pb-8">
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary mb-6" />
            <h2 className="text-xl font-semibold">Confirming your payment...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we verify your transaction.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="container max-w-lg mx-auto px-4 py-24">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <CardTitle className="text-2xl">Payment Issue</CardTitle>
            <CardDescription>
              There was a problem with your payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your payment was not completed. Please try again or contact support if the issue persists.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Return Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-24">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your purchase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your <span className="font-semibold text-foreground">{tierName}</span> request has been received{tierName !== "Basic Consult" ? " and is being processed" : ""}.
          </p>
          
          {/* Basic tier shows the answer immediately */}
          {basicResponse && (
            <div className="mt-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Your Consulting Response</h3>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-5">
                <p className="text-sm text-muted-foreground mb-2">Topic: <span className="text-foreground font-medium">{basicResponse.topic}</span></p>
                <div className="prose prose-sm prose-invert max-w-none">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">{basicResponse.response}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">A copy has also been sent to your email.</p>
            </div>
          )}
          
          {/* Other tiers show waiting message */}
          {!basicResponse && (
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              {tierName === "AI Analyst" && (
                <p>Our AI is analyzing your question. You will receive your response via email within a few minutes.</p>
              )}
              {tierName === "Expert Review" && (
                <p>Our expert team has received your request. You will receive a detailed response via email within 24-48 hours.</p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
