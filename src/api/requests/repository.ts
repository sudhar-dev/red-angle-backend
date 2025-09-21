// repository.ts
import { PoolClient } from "pg";
import { getClient } from "../../helper/db";
import logger from "../../helper/logger";

export class requestRepository {
  public async createRequest(data: any) {
    const client: PoolClient = await getClient();
    try {
      const query = `
        INSERT INTO employee_leave_requests
        ("employeeId", type, reason, description, date, duration, "fromTime", "toTime", "leaveType", "fromDate", "toDate", status, "createdAt", "createdBy")
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *;
      `;
      const values = [
        data.employeeId || 1,
        data.type,
        data.reason || null,
        data.description || null,
        data.date || null,
        data.duration || null,
        data.fromTime || null,
        data.toTime || null,
        data.leaveType || null,
        data.fromDate || null,
        data.toDate || null,
        "pending",
        new Date().toISOString(),
        data.createdBy || "system",
      ];
      const res = await client.query(query, values);
      return { success: true, data: res.rows[0] };
    } catch (error) {
      logger.error("Repository Error: createRequest", error);
      return { success: false, message: "Error creating request" };
    } finally {
      client.release();
    }
  }

  public async getAllRequests() {
    const client: PoolClient = await getClient();
    try {
      const res = await client.query(
        "SELECT * FROM employee_leave_requests ORDER BY id DESC;"
      );
      return { success: true, data: res.rows };
    } catch (error) {
      logger.error("Repository Error: getAllRequests", error);
      return { success: false, message: "Error fetching requests" };
    } finally {
      client.release();
    }
  }

  public async getRequestById(id: number) {
    const client: PoolClient = await getClient();
    try {
      const res = await client.query(
        "SELECT * FROM employee_leave_requests WHERE id=$1;",
        [id]
      );
      return res.rows[0] || null;
    } catch (error) {
      logger.error("Repository Error: getRequestById", error);
      return null;
    } finally {
      client.release();
    }
  }

  public async updateRequest(id: number, data: any) {
    const client: PoolClient = await getClient();
    try {
      const res = await client.query(
        `UPDATE employee_leave_requests SET status=$1, "updatedAt"=$2 WHERE id=$3 RETURNING *;`,
        [data.status, new Date().toISOString(), id]
      );
      return { success: true, data: res.rows[0] };
    } catch (error) {
      logger.error("Repository Error: updateRequest", error);
      return { success: false, message: "Error updating request" };
    } finally {
      client.release();
    }
  }

  public async deleteRequest(id: number) {
    const client: PoolClient = await getClient();
    try {
      await client.query("DELETE FROM employee_leave_requests WHERE id=$1;", [
        id,
      ]);
      return { success: true, message: "Request deleted" };
    } catch (error) {
      logger.error("Repository Error: deleteRequest", error);
      return { success: false, message: "Error deleting request" };
    } finally {
      client.release();
    }
  }
}
