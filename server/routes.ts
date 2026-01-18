import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, requireAuth } from "./auth";
import { sendExpertRequestConfirmation, sendExpertResponseReady, sendAdminNotification, sendBasicThankYou, sendAIAnalystThankYou } from "./email";
import { generateAIConsultingResponse } from "./ai";
import { createEmbeddedCheckoutSession, getSessionStatus } from "./stripe";
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

  // Stripe config endpoint (publishable key is safe to expose)
  app.get("/api/stripe-config", (req, res) => {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      return res.status(500).json({ error: "Stripe not configured" });
    }
    return res.json({ publishableKey });
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

        // Generate real AI response
        (async () => {
          try {
            const aiResponse = await generateAIConsultingResponse(
              request.customerName,
              request.description
            );
            
            await storage.updateRequest(request.id, {
              status: 'completed',
              response: aiResponse,
            });

            // Send thank you email with AI response to customer
            sendAIAnalystThankYou(request.customerEmail, request.customerName, aiResponse)
              .catch(err => console.error('AI Analyst thank you email error:', err));
          } catch (error) {
            console.error('AI response generation error:', error);
          }
        })();
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

  // Payment Routes
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { tier, customerEmail, customerName, description } = req.body;

      if (!tier || !customerEmail || !customerName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const tierPrices: Record<string, number> = {
        basic: 29,
        middle: 99,
        custom: 499,
      };

      const amount = tierPrices[tier];
      if (!amount) {
        return res.status(400).json({ error: "Invalid tier" });
      }

      // Create a pending request first
      const request = await storage.createRequest({
        customerEmail,
        customerName,
        tier,
        description: description || "",
        amount,
      });

      // Get return URL from request headers
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['host'] || 'localhost:5000';
      const returnUrl = `${protocol}://${host}/payment-complete`;

      // Create embedded Stripe checkout session
      const session = await createEmbeddedCheckoutSession(
        tier,
        customerEmail,
        customerName,
        request.id,
        returnUrl
      );

      return res.json({
        clientSecret: session.clientSecret,
        requestId: request.id,
      });
    } catch (error) {
      console.error("Create checkout session error:", error);
      return res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.get("/api/session-status/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const result = await getSessionStatus(sessionId);

      if (result.status === "complete" && result.requestId) {
        // Payment confirmed, update request status and trigger processing
        const request = await storage.getRequest(result.requestId);

        if (request && request.status === "pending") {
          // Update status to in-progress or process based on tier
          if (request.tier === "basic") {
            const topic = request.description.startsWith("Selected Topic: ")
              ? request.description.substring("Selected Topic: ".length).trim()
              : request.description.trim();

            const questionFromDb = await storage.getBasicQuestionByTopic(topic);
            const response =
              questionFromDb?.answer ||
              "Thank you for your inquiry. Our standard advice is to focus on clear goal setting, metric tracking, and consistent execution.";

            await storage.updateRequest(request.id, {
              status: "completed",
              response,
            });

            sendAdminNotification(request.id, request.customerName, request.tier, request.description).catch((err) =>
              console.error("Admin notification error:", err)
            );

            sendBasicThankYou(request.customerEmail, request.customerName, topic, response).catch((err) =>
              console.error("Basic thank you email error:", err)
            );

            // Return the response immediately for Basic tier
            return res.json({
              ...result,
              topic,
              response,
            });
          } else if (request.tier === "middle") {
            await storage.updateRequest(request.id, { status: "processing" });

            sendAdminNotification(request.id, request.customerName, request.tier, request.description).catch((err) =>
              console.error("Admin notification error:", err)
            );

            (async () => {
              try {
                const aiResponse = await generateAIConsultingResponse(request.customerName, request.description);

                await storage.updateRequest(request.id, {
                  status: "completed",
                  response: aiResponse,
                });

                sendAIAnalystThankYou(request.customerEmail, request.customerName, aiResponse).catch((err) =>
                  console.error("AI Analyst thank you email error:", err)
                );
              } catch (error) {
                console.error("AI response generation error:", error);
              }
            })();
          } else if (request.tier === "custom") {
            await storage.updateRequest(request.id, { status: "processing" });

            sendExpertRequestConfirmation(request.customerEmail, request.customerName, request.id).catch((err) =>
              console.error("Expert email error:", err)
            );

            sendAdminNotification(request.id, request.customerName, request.tier, request.description).catch((err) =>
              console.error("Admin notification error:", err)
            );
          }
        }
      }

      return res.json(result);
    } catch (error) {
      console.error("Verify payment error:", error);
      return res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  return httpServer;
}
