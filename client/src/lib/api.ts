import { Request, InsertRequest, UpdateRequest, BasicQuestion, InsertBasicQuestion, UpdateBasicQuestion } from "@shared/schema";

// Admin API
export async function adminLogin(password: string): Promise<{ success: boolean }> {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
    credentials: "include",
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Login failed");
  }
  
  return res.json();
}

export async function adminLogout(): Promise<void> {
  await fetch("/api/admin/logout", {
    method: "POST",
    credentials: "include",
  });
}

export async function checkAdminStatus(): Promise<{ isAdmin: boolean }> {
  const res = await fetch("/api/admin/check", {
    credentials: "include",
  });
  return res.json();
}

// Request API
export async function createRequest(data: InsertRequest): Promise<Request> {
  console.log("API createRequest called with:", data);
  
  const res = await fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  console.log("API response status:", res.status);
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("API error response:", errorData);
    throw new Error(errorData.error || errorData.message || `Server error: ${res.status}`);
  }
  
  return res.json();
}

export async function getRequest(id: string): Promise<Request> {
  const res = await fetch(`/api/requests/${id}`);
  
  if (!res.ok) {
    throw new Error("Request not found");
  }
  
  return res.json();
}

export async function getAllRequests(): Promise<Request[]> {
  const res = await fetch("/api/requests", {
    credentials: "include",
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch requests");
  }
  
  return res.json();
}

export async function updateRequest(id: string, data: UpdateRequest): Promise<Request> {
  const res = await fetch(`/api/requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  
  if (!res.ok) {
    throw new Error("Failed to update request");
  }
  
  return res.json();
}

export async function deleteRequest(id: string): Promise<void> {
  const res = await fetch(`/api/requests/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  
  if (!res.ok) {
    throw new Error("Failed to delete request");
  }
}

// Basic Questions API
export async function getAllBasicQuestions(): Promise<BasicQuestion[]> {
  const res = await fetch("/api/basic-questions");
  
  if (!res.ok) {
    throw new Error("Failed to fetch questions");
  }
  
  return res.json();
}

export async function createBasicQuestion(data: InsertBasicQuestion): Promise<BasicQuestion> {
  const res = await fetch("/api/basic-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to create question");
  }
  
  return res.json();
}

export async function updateBasicQuestion(id: string, data: UpdateBasicQuestion): Promise<BasicQuestion> {
  const res = await fetch(`/api/basic-questions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  
  if (!res.ok) {
    throw new Error("Failed to update question");
  }
  
  return res.json();
}

export async function deleteBasicQuestion(id: string): Promise<void> {
  const res = await fetch(`/api/basic-questions/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  
  if (!res.ok) {
    throw new Error("Failed to delete question");
  }
}
