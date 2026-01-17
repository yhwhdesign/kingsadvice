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
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = 20;

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Kings Advice", margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Request ID: ${request.id}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Date: ${format(new Date(request.createdAt), "PPP")}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Service: ${request.tier.charAt(0).toUpperCase() + request.tier.slice(1)}`, margin, yPosition);
    yPosition += 15;

    doc.setDrawColor(200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Details", margin, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${request.customerName}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Email: ${request.customerEmail}`, margin, yPosition);
    yPosition += 15;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Your Request", margin, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const requestLines = doc.splitTextToSize(request.description, maxWidth);
    doc.text(requestLines, margin, yPosition);
    yPosition += requestLines.length * 5 + 15;

    if (request.response) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Our Response", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const responseLines = doc.splitTextToSize(request.response, maxWidth);
      doc.text(responseLines, margin, yPosition);
    }

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
