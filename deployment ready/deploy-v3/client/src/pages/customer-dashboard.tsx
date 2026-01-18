import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { jsPDF } from "jspdf";

export default function CustomerDashboard() {
  const { id } = useParams();
  
  const { data: request, isLoading, error } = useQuery({
    queryKey: ["request", id],
    queryFn: () => getRequest(id || ""),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 2 seconds if processing
      if (data?.status === 'processing' || data?.status === 'pending') {
        return 2000;
      }
      return false;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading request...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Request Not Found</h1>
        <p className="text-muted-foreground">The request ID you are looking for does not exist.</p>
      </div>
    );
  }

  const statusColors = {
    pending: "bg-yellow-900/30 text-yellow-400",
    processing: "bg-blue-900/30 text-blue-400",
    completed: "bg-green-900/30 text-green-400",
    rejected: "bg-red-900/30 text-red-400",
  };

  const handleDownloadPDF = () => {
    if (!request) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = 0;

    // Header Banner - Dark background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Draw crown icon (simplified geometric crown)
    const crownX = margin;
    const crownY = 18;
    doc.setFillColor(255, 255, 255);
    // Crown base
    doc.rect(crownX, crownY + 8, 16, 4, 'F');
    // Crown points
    doc.triangle(crownX, crownY + 8, crownX + 4, crownY, crownX + 4, crownY + 8, 'F');
    doc.triangle(crownX + 6, crownY + 8, crownX + 8, crownY - 2, crownX + 10, crownY + 8, 'F');
    doc.triangle(crownX + 12, crownY + 8, crownX + 12, crownY, crownX + 16, crownY + 8, 'F');

    // Company name in header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Kings Advice", crownX + 22, 28);

    // Tagline
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Expert Consulting On Demand", crownX + 22, 38);

    // Document title bar
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 50, pageWidth, 20, 'F');
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("CONSULTING REPORT", margin, 63);
    
    // Request ID and date on right side
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const dateText = format(new Date(request.createdAt), "PPP");
    doc.text(`ID: ${request.id}  |  ${dateText}`, pageWidth - margin, 63, { align: 'right' });

    // Reset text color for body
    doc.setTextColor(30, 41, 59);
    yPosition = 85;

    // Service Tier Badge
    const tierNames: Record<string, string> = {
      basic: "Basic Consult - $29",
      middle: "AI Analyst - $99", 
      expert: "Expert Review - $499"
    };
    doc.setFillColor(226, 232, 240); // slate-200
    doc.roundedRect(margin, yPosition - 6, 80, 10, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(tierNames[request.tier] || request.tier, margin + 4, yPosition + 1);

    yPosition += 20;

    // Customer Details Section
    doc.setTextColor(30, 41, 59);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(margin, yPosition - 5, maxWidth, 30, 3, 3, 'F');
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(margin, yPosition - 5, maxWidth, 30, 3, 3, 'S');

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("CLIENT INFORMATION", margin + 5, yPosition + 3);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.text(`${request.customerName}`, margin + 5, yPosition + 14);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`${request.customerEmail}`, margin + 5, yPosition + 21);

    yPosition += 40;

    // Request Section
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("YOUR REQUEST", margin, yPosition);
    yPosition += 8;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    const requestLines = doc.splitTextToSize(request.description, maxWidth - 10);
    const requestBoxHeight = Math.max(requestLines.length * 6 + 10, 25);
    doc.roundedRect(margin, yPosition - 3, maxWidth, requestBoxHeight, 3, 3, 'FD');

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(requestLines, margin + 5, yPosition + 5);
    yPosition += requestBoxHeight + 15;

    // Response Section (if available)
    if (request.response) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("OUR RESPONSE", margin, yPosition);
      yPosition += 8;

      // Green accent border for response
      doc.setFillColor(240, 253, 244); // green-50
      doc.setDrawColor(34, 197, 94); // green-500
      const responseLines = doc.splitTextToSize(request.response, maxWidth - 10);
      const responseBoxHeight = Math.max(responseLines.length * 5 + 12, 30);
      
      // Check if we need a new page
      if (yPosition + responseBoxHeight > pageHeight - 40) {
        doc.addPage();
        yPosition = 30;
      }

      doc.roundedRect(margin, yPosition - 3, maxWidth, responseBoxHeight, 3, 3, 'FD');

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 64, 46); // green-900
      doc.text(responseLines, margin + 5, yPosition + 5);
      yPosition += responseBoxHeight + 10;
    }

    // Footer
    const footerY = pageHeight - 15;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Kings Advice - Expert Consulting On Demand", margin, footerY);
    doc.text("Copyright 2026 Kings Advice. All rights reserved.", pageWidth - margin, footerY, { align: 'right' });

    doc.save(`kings-advice-${request.id}.pdf`);
  };

  const statusIcons = {
    pending: Clock,
    processing: Clock,
    completed: CheckCircle2,
    rejected: AlertCircle,
  };

  const StatusIcon = statusIcons[request.status];

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-heading">Request Status</h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-request-id">ID: {request.id}</p>
        </div>
        <Badge variant="secondary" className={`px-4 py-2 text-sm font-medium ${statusColors[request.status]}`} data-testid={`badge-status-${request.status}`}>
          <StatusIcon className="w-4 h-4 mr-2" />
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </Badge>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                  <p className="text-lg" data-testid="text-customer-name">{request.customerName}</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-customer-email">{request.customerEmail}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Service Tier</h3>
                  <p className="text-lg font-medium capitalize" data-testid="text-tier">{request.tier}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Date Submitted</h3>
                  <p data-testid="text-created-at">{format(new Date(request.createdAt), "PPP p")}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Amount Paid</h3>
                  <p data-testid="text-amount">${request.amount}</p>
                </div>
             </div>
             
             <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Original Request</h3>
                <p className="bg-muted/30 p-4 rounded-md text-sm" data-testid="text-description">{request.description}</p>
             </div>
          </CardContent>
        </Card>

        {request.status === 'completed' && request.response && (
          <Card className="border-green-900/50 bg-green-950/20">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Your Result is Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 shadow-sm mb-4">
                <p className="whitespace-pre-wrap leading-relaxed" data-testid="text-response">{request.response}</p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="gap-2" data-testid="button-download-pdf" onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {request.status === 'processing' && (
          <Card className="border-blue-900/50 bg-blue-950/20">
            <CardHeader>
              <CardTitle className="text-blue-400 flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Your Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {request.tier === 'middle' 
                  ? "Our AI agents are analyzing your request. This usually takes less than a minute." 
                  : "Our team is reviewing your request. We will notify you via email when your custom solution is ready."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
