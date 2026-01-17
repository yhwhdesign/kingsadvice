import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllRequests, updateRequest, deleteRequest as deleteRequestApi, getAllBasicQuestions, createBasicQuestion, updateBasicQuestion, deleteBasicQuestion } from "@/lib/api";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Eye, Send, Loader2, Plus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Request, BasicQuestion } from "@shared/schema";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  
  // Questions management state
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BasicQuestion | null>(null);
  const [questionTopic, setQuestionTopic] = useState("");
  const [questionAnswer, setQuestionAnswer] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-requests"],
    queryFn: getAllRequests,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["basic-questions"],
    queryFn: getAllBasicQuestions,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { response: string; status: 'completed' } }) =>
      updateRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      toast({ title: "Response sent to customer" });
      setIsResponseOpen(false);
      setResponseText("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRequestApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      toast({ title: "Record deleted" });
    },
  });

  // Question mutations
  const createQuestionMutation = useMutation({
    mutationFn: createBasicQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["basic-questions"] });
      toast({ title: "Question added" });
      resetQuestionForm();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed to add question", description: error.message });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { topic?: string; answer?: string } }) =>
      updateBasicQuestion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["basic-questions"] });
      toast({ title: "Question updated" });
      resetQuestionForm();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed to update question", description: error.message });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: deleteBasicQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["basic-questions"] });
      toast({ title: "Question deleted" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed to delete question", description: error.message });
    },
  });

  const resetQuestionForm = () => {
    setIsQuestionDialogOpen(false);
    setEditingQuestion(null);
    setQuestionTopic("");
    setQuestionAnswer("");
  };

  const handleSaveQuestion = () => {
    const trimmedTopic = questionTopic.trim();
    const trimmedAnswer = questionAnswer.trim();
    
    if (!trimmedTopic || !trimmedAnswer) {
      toast({ variant: "destructive", title: "Validation Error", description: "Both topic and answer are required." });
      return;
    }
    
    if (editingQuestion) {
      updateQuestionMutation.mutate({
        id: editingQuestion.id,
        data: { topic: trimmedTopic, answer: trimmedAnswer },
      });
    } else {
      createQuestionMutation.mutate({ topic: trimmedTopic, answer: trimmedAnswer });
    }
  };

  const handleEditQuestion = (question: BasicQuestion) => {
    setEditingQuestion(question);
    setQuestionTopic(question.topic);
    setQuestionAnswer(question.answer);
    setIsQuestionDialogOpen(true);
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteQuestionMutation.mutate(id);
    }
  };

  const filteredRequests = requests.filter(req => 
    req.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this record?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSendResponse = () => {
    if (!selectedRequest || !responseText) return;
    
    updateMutation.mutate({
      id: selectedRequest.id,
      data: {
        response: responseText,
        status: 'completed',
      },
    });
  };

  const totalRevenue = requests.reduce((acc, curr) => acc + curr.amount, 0);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold font-heading mb-8">Admin Portal</h1>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-requests">{requests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-actions">{requests.filter(r => r.status === 'pending').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
        <Input 
          placeholder="Search by name or ID..." 
          className="max-w-sm bg-slate-900 border-slate-700" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border border-slate-700 bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-800">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No requests found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((req) => (
                <TableRow key={req.id} data-testid={`row-request-${req.id}`}>
                  <TableCell className="font-mono text-xs">{req.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{req.customerName}</div>
                    <div className="text-xs text-muted-foreground">{req.customerEmail}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase text-xs">{req.tier}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        req.status === 'completed' ? 'bg-green-900/50 text-green-400 hover:bg-green-900/70' :
                        req.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900/70' :
                        'bg-blue-900/50 text-blue-400 hover:bg-blue-900/70'
                      }
                    >
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog open={isResponseOpen && selectedRequest?.id === req.id} onOpenChange={(open) => {
                          setIsResponseOpen(open);
                          if (open) {
                              setSelectedRequest(req);
                              setResponseText(req.response || "");
                          } else {
                              setSelectedRequest(null);
                          }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="View/Respond" data-testid={`button-view-${req.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Request Details</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold">Customer:</span> {req.customerName}
                                </div>
                                <div>
                                    <span className="font-semibold">Email:</span> {req.customerEmail}
                                </div>
                                <div>
                                    <span className="font-semibold">Tier:</span> {req.tier}
                                </div>
                                <div>
                                    <span className="font-semibold">Amount:</span> ${req.amount}
                                </div>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-md text-sm">
                                <h4 className="font-semibold mb-2">Description:</h4>
                                {req.description}
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="font-semibold">Response:</h4>
                                <Textarea 
                                    placeholder="Type your response here..." 
                                    className="min-h-[150px]"
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    data-testid="textarea-admin-response"
                                />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={handleSendResponse} 
                              disabled={!responseText || updateMutation.isPending}
                              data-testid="button-send-response"
                            >
                                {updateMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-4 h-4 mr-2" /> Send Response
                                  </>
                                )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(req.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${req.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Basic Questions Management */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-heading">Basic Tier Questions</h2>
          <Dialog open={isQuestionDialogOpen} onOpenChange={(open) => {
            if (!open) resetQuestionForm();
            else setIsQuestionDialogOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Topic Name</label>
                  <Input
                    placeholder="e.g., Marketing Strategy"
                    value={questionTopic}
                    onChange={(e) => setQuestionTopic(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Answer</label>
                  <Textarea
                    placeholder="Enter the pre-written answer for this topic..."
                    className="min-h-[150px]"
                    value={questionAnswer}
                    onChange={(e) => setQuestionAnswer(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetQuestionForm}>Cancel</Button>
                <Button 
                  onClick={handleSaveQuestion}
                  disabled={!questionTopic || !questionAnswer || createQuestionMutation.isPending || updateQuestionMutation.isPending}
                >
                  {(createQuestionMutation.isPending || updateQuestionMutation.isPending) ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    editingQuestion ? "Update Question" : "Add Question"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border border-slate-700 bg-slate-900 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-800">
              <TableRow>
                <TableHead>Topic</TableHead>
                <TableHead>Answer Preview</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    No questions yet. Add your first basic tier question.
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.topic}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                      {q.answer.substring(0, 100)}...
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditQuestion(q)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteQuestion(q.id)}
                          disabled={deleteQuestionMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
