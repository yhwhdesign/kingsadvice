import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Zap, User, Crown } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function Home() {
  const [, setLocation] = useLocation();

  const tiers = [
    {
      id: "basic",
      name: "Basic Consult",
      price: "$29",
      description: "Instant access to our expert knowledge base.",
      icon: Zap,
      features: ["Select a Consulting Topic", "Instant Best-Practice Answers", "Standard Support", "Actionable Checklists"],
      color: "bg-slate-800",
      buttonVariant: "outline" as const,
    },
    {
      id: "middle",
      name: "AI Analyst",
      price: "$99",
      description: "Smart analysis of your specific business problem.",
      icon: User,
      features: ["Submit Your Specific Question", "AI-Generated Strategy", "Detailed Analysis", "PDF Report Export"],
      popular: true,
      color: "bg-slate-900",
      buttonVariant: "default" as const,
    },
    {
      id: "custom",
      name: "Expert Review",
      price: "$499",
      description: "Full manual audit by a senior consultant.",
      icon: Crown,
      features: ["Submit Data for Review", "Custom Human Strategy", "Dedicated Account Manager", "Video Consultation"],
      color: "bg-slate-800",
      buttonVariant: "outline" as const,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-8 gap-8 p-8 opacity-5">
            {Array.from({ length: 64 }).map((_, i) => (
              <Crown key={i} className="w-12 h-12 text-white" />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-slate-950" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tight text-balance mb-6 text-white">
              Expert Consulting <br/> On Demand
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10 text-balance">
              Get the business answers you need, when you need them. From instant best practices to deep-dive human analysis.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 pb-24 -mt-20 relative z-20">
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`h-full flex flex-col border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-slate-900 ${tier.popular ? 'border-white shadow-lg scale-105 z-10' : 'border-slate-700 shadow-md'}`}>
                <CardHeader className={`${tier.color} rounded-t-xl pb-8`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg bg-slate-950 shadow-sm">
                      <tier.icon className="w-6 h-6 text-white" />
                    </div>
                    {tier.popular && (
                      <span className="bg-white text-slate-950 text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">{tier.name}</CardTitle>
                  <CardDescription className="text-base mt-2 text-white/70">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pt-8 bg-slate-900">
                  <div className="mb-8">
                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                    <span className="text-white/60">/request</span>
                  </div>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-white/80">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pb-8 bg-slate-900">
                  <Button 
                    className={`w-full ${tier.popular ? 'bg-white text-slate-950 hover:bg-slate-200' : 'bg-slate-800 text-white border-slate-600 hover:bg-slate-700'}`}
                    size="lg" 
                    variant={tier.buttonVariant}
                    onClick={() => setLocation(`/submit/${tier.id}`)}
                  >
                    Select {tier.name} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
