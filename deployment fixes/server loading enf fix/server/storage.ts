import { db } from "./db";
import { admins, requests, type Admin, type InsertAdmin, type Request, type InsertRequest, type UpdateRequest } from "@shared/schema";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";

export interface IStorage {
  // Admin operations
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  
  // Request operations
  createRequest(request: InsertRequest): Promise<Request>;
  getRequest(id: string): Promise<Request | undefined>;
  getAllRequests(): Promise<Request[]>;
  updateRequest(id: string, updates: UpdateRequest): Promise<Request | undefined>;
  deleteRequest(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Admin operations
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username)).limit(1);
    return admin;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const [admin] = await db.insert(admins).values(insertAdmin).returning();
    return admin;
  }

  // Request operations
  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const [request] = await db.insert(requests).values(insertRequest).returning();
    return request;
  }

  async getRequest(id: string): Promise<Request | undefined> {
    const [request] = await db.select().from(requests).where(eq(requests.id, id)).limit(1);
    return request;
  }

  async getAllRequests(): Promise<Request[]> {
    return await db.select().from(requests).orderBy(desc(requests.createdAt));
  }

  async updateRequest(id: string, updates: UpdateRequest): Promise<Request | undefined> {
    const [updated] = await db
      .update(requests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(requests.id, id))
      .returning();
    return updated;
  }

  async deleteRequest(id: string): Promise<void> {
    await db.delete(requests).where(eq(requests.id, id));
  }
}

export const storage = new DatabaseStorage();
