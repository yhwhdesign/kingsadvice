import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, requireAuth } from "./auth";
import { sendExpertRequestConfirmation, sendExpertResponseReady, sendAdminNotification, sendBasicThankYou, sendAIAnalystThankYou } from "./email";
import { insertRequestSchema, updateRequestSchema, insertBasicQuestionSchema, updateBasicQuestionSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth Routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }

      // Get the default admin (in production, you'd have proper username/password)
      const admin = await storage.getAdminByUsername("admin");
      
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await verifyPassword(password, admin.password);
      
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.adminId = admin.id;
      req.session.isAdmin = true;
      
      // Explicitly save session before responding
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        return res.json({ success: true, message: "Logged in successfully" });
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/admin/check", (req, res) => {
    if (req.session?.isAdmin) {
      return res.json({ isAdmin: true });
    }
    return res.json({ isAdmin: false });
  });

  // Request Routes
  app.post("/api/requests", async (req, res) => {
    try {
      const validationResult = insertRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ error: validationError.message });
      }

      const request = await storage.createRequest(validationResult.data);
      
      // Handle auto-response for basic tier
      if (request.tier === 'basic') {
        // Strip the "Selected Topic: " prefix to get the actual topic name
        const topic = request.description.startsWith('Selected Topic: ') 
          ? request.description.substring('Selected Topic: '.length).trim()
          : request.description.trim();
        
        // Look up answer from database
        const questionFromDb = await storage.getBasicQuestionByTopic(topic);
        const response = questionFromDb?.answer || 'Thank you for your inquiry. Our standard advice is to focus on clear goal setting, metric tracking, and consistent execution.';
        
        await storage.updateRequest(request.id, {
          status: 'completed',
          response,
        });

        // Notify admin of new basic request
        sendAdminNotification(request.id, request.customerName, request.tier, request.description)
          .catch(err => console.error('Admin notification error:', err));

        // Send thank you email with response to customer
        sendBasicThankYou(request.customerEmail, request.customerName, topic, response)
          .catch(err => console.error('Basic thank you email error:', err));

      } else if (request.tier === 'custom') {
        // Send confirmation email for custom/expert tier
        sendExpertRequestConfirmation(request.customerEmail, request.customerName, request.id)
          .catch(err => console.error('Expert email error:', err));

        // Notify admin of new custom/expert request
        sendAdminNotification(request.id, request.customerName, request.tier, request.description)
          .catch(err => console.error('Admin notification error:', err));

      } else if (request.tier === 'middle') {
        // Notify admin of new AI Analyst request
        sendAdminNotification(request.id, request.customerName, request.tier, request.description)
          .catch(err => console.error('Admin notification error:', err));

        // Simulate AI processing
        setTimeout(async () => {
          let aiResponse = "AI Consultant Analysis:\n\n";
          const desc = request.description.toLowerCase();
          
          if (desc.includes("market") || desc.includes("sell") || desc.includes("customer")) {
            aiResponse += "Based on your query about market/sales:\n1. Analyze your current customer acquisition cost (CAC).\n2. Segment your audience for personalized messaging.\n3. Consider a referral program to leverage existing happy customers.";
          } else if (desc.includes("employee") || desc.includes("team") || desc.includes("culture")) {
            aiResponse += "Regarding your team/culture query:\n1. Foster psychological safety to encourage innovation.\n2. Review your compensation packages against market rates.\n3. Invest in professional development opportunities.";
          } else if (desc.includes("money") || desc.includes("profit") || desc.includes("cost")) {
            aiResponse += "Financial Analysis:\n1. Audit your recurring subscriptions and cut unused tools.\n2. Negotiate better terms with key suppliers.\n3. Focus on increasing the Lifetime Value (LTV) of existing clients.";
          } else {
            aiResponse += "Based on your input, we recommend a SWOT analysis to identify internal strengths and external opportunities. Ensure your strategic goals are SMART (Specific, Measurable, Achievable, Relevant, Time-bound).";
          }
          
          await storage.updateRequest(request.id, {
            status: 'completed',
            response: aiResponse,
          });

          // Send thank you email with AI response to customer
          sendAIAnalystThankYou(request.customerEmail, request.customerName, aiResponse)
            .catch(err => console.error('AI Analyst thank you email error:', err));

        }, 4000);
      }
      
      return res.status(201).json(request);
    } catch (error: any) {
      console.error("Create request error:", error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      return res.status(500).json({ 
        error: "Failed to create request",
        details: error?.message || "Unknown error"
      });
    }
  });

  app.get("/api/requests/:id", async (req, res) => {
    try {
      const request = await storage.getRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      return res.json(request);
    } catch (error) {
      console.error("Get request error:", error);
      return res.status(500).json({ error: "Failed to fetch request" });
    }
  });

  app.get("/api/requests", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getAllRequests();
      return res.json(requests);
    } catch (error) {
      console.error("Get all requests error:", error);
      return res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  app.patch("/api/requests/:id", requireAuth, async (req, res) => {
    try {
      const validationResult = updateRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ error: validationError.message });
      }

      // Get original request to check for response changes
      const originalRequest = await storage.getRequest(req.params.id);
      
      // Check if admin is sending/updating a response (only for custom/expert tier)
      const isSendingExpertResponse = originalRequest && 
        originalRequest.tier === 'custom' &&
        validationResult.data.response && 
        validationResult.data.status === 'completed' &&
        originalRequest.response !== validationResult.data.response;

      const updated = await storage.updateRequest(req.params.id, validationResult.data);
      
      if (!updated) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Send email notification when admin sends expert response
      if (isSendingExpertResponse && updated.response) {
        console.log('Sending expert response notification to:', updated.customerEmail);
        sendExpertResponseReady(updated.customerEmail, updated.customerName, updated.response)
          .catch(err => console.error('Response notification error:', err));
      }
      
      return res.json(updated);
    } catch (error) {
      console.error("Update request error:", error);
      return res.status(500).json({ error: "Failed to update request" });
    }
  });

  app.delete("/api/requests/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteRequest(req.params.id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Delete request error:", error);
      return res.status(500).json({ error: "Failed to delete request" });
    }
  });

  // Basic Questions Routes (public GET, admin-only for mutations)
  app.get("/api/basic-questions", async (req, res) => {
    try {
      const questions = await storage.getAllBasicQuestions();
      return res.json(questions);
    } catch (error) {
      console.error("Get basic questions error:", error);
      return res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.post("/api/basic-questions", requireAuth, async (req, res) => {
    try {
      const validationResult = insertBasicQuestionSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ error: validationError.message });
      }

      const question = await storage.createBasicQuestion(validationResult.data);
      return res.status(201).json(question);
    } catch (error) {
      console.error("Create basic question error:", error);
      return res.status(500).json({ error: "Failed to create question" });
    }
  });

  app.patch("/api/basic-questions/:id", requireAuth, async (req, res) => {
    try {
      const validationResult = updateBasicQuestionSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ error: validationError.message });
      }

      const updated = await storage.updateBasicQuestion(req.params.id, validationResult.data);
      
      if (!updated) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      return res.json(updated);
    } catch (error) {
      console.error("Update basic question error:", error);
      return res.status(500).json({ error: "Failed to update question" });
    }
  });

  app.delete("/api/basic-questions/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteBasicQuestion(req.params.id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Delete basic question error:", error);
      return res.status(500).json({ error: "Failed to delete question" });
    }
  });

  return httpServer;
}
