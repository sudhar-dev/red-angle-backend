import { PoolClient } from "pg";
import { getClient } from "../../helper/db";
import logger from "../../helper/logger";

export class attendanceRepository {
  /**
   * Punch In → Create entry
   * Frontend sends: { employee_id, punch_in: true }
   */
  public async punchInV1(userData: any) {
    const client: PoolClient = await getClient();
    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0]; // yyyy-mm-dd
      const punchInTime = now.toLocaleString("en-IN", { hour12: false });

      const query = `
        INSERT INTO public.employee_attendance 
          (employee_id, date, punch_in_time, status, created_at, created_by)
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;
      `;
      const values = [
        userData.employee_id,
        today,
        punchInTime,
        "Present", // default once punched in
        now.toISOString(),
        userData.created_by || "system",
      ];

      const result = await client.query(query, values);
      logger.info("Repository: Punch In recorded", {
        id: result.rows[0].id,
        emp: userData.employee_id,
      });

      return {
        success: true,
        message: "Punch In recorded successfully",
        data: result.rows[0],
      };
    } catch (error) {
      logger.error("Repository Error: Punch In", error);
      return { success: false, message: "Error recording Punch In" };
    } finally {
      client.release();
    }
  }

  /**
   * Punch Out → Update entry
   * Frontend sends: { employee_id, punch_out: true }
   * Backend: fetch Punch In, calculate hours, update
   */
  public async punchOutV1(userData: any) {
    const client: PoolClient = await getClient();
    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0]; // yyyy-mm-dd
      const punchOutTime = now.toLocaleString("en-IN", { hour12: false });

      // Get today's punch in record
      const fetchQuery = `
        SELECT * FROM public.employee_attendance 
        WHERE employee_id = $1 AND date = $2
        ORDER BY id DESC LIMIT 1;
      `;
      const fetchResult = await client.query(fetchQuery, [
        userData.employee_id,
        today,
      ]);

      if (fetchResult.rowCount === 0) {
        logger.warn("Punch Out attempted without Punch In", {
          emp: userData.employee_id,
        });
        return { success: false, message: "No Punch In found for today" };
      }

      const punchInTime = new Date(fetchResult.rows[0].punch_in_time);
      const diffMs = now.getTime() - punchInTime.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const totalHours = `${hours}h ${minutes}m`;

      // Update punch out + total hours + status
      const updateQuery = `
        UPDATE public.employee_attendance
        SET punch_out_time = $1, total_hours = $2, status = $3
        WHERE id = $4 RETURNING *;
      `;
      const values = [
        punchOutTime,
        totalHours,
        hours >= 4 ? "Present" : "Absent", // ✅ business logic
        fetchResult.rows[0].id,
      ];

      const result = await client.query(updateQuery, values);
      logger.info("Repository: Punch Out recorded", {
        id: result.rows[0].id,
        emp: userData.employee_id,
      });

      return {
        success: true,
        message: "Punch Out recorded successfully",
        data: result.rows[0],
      };
    } catch (error) {
      logger.error("Repository Error: Punch Out", error);
      return { success: false, message: "Error recording Punch Out" };
    } finally {
      client.release();
    }
  }

  /**
   * Get Attendance
   */
  public async getAttendanceV1(employeeId?: number) {
    const client: PoolClient = await getClient();
    try {
      let query = `SELECT * FROM public.employee_attendance ORDER BY date DESC;`;
      let values: any[] = [];
      if (employeeId) {
        query = `SELECT * FROM public.employee_attendance WHERE employee_id = $1 ORDER BY date DESC;`;
        values = [employeeId];
      }
      const result = await client.query(query, values);
      logger.info("Repository: Attendance fetched", { count: result.rowCount });
      return { success: true, data: result.rows };
    } catch (error) {
      logger.error("Repository Error: Get Attendance", error);
      return { success: false, message: "Error fetching attendance" };
    } finally {
      client.release();
    }
  }

  /**
   * Delete Attendance (admin use only)
   */
  public async deleteAttendanceV1(id: number) {
    const client: PoolClient = await getClient();
    try {
      const query = `DELETE FROM public.employee_attendance WHERE id = $1 RETURNING *;`;
      const result = await client.query(query, [id]);
      if (result.rowCount === 0) {
        logger.warn("Repository: No attendance found to delete", { id });
        return { success: false, message: "Attendance record not found" };
      }
      logger.info("Repository: Attendance deleted", { id });
      return { success: true, message: "Attendance deleted successfully" };
    } catch (error) {
      logger.error("Repository Error: Delete Attendance", error);
      return { success: false, message: "Error deleting attendance" };
    } finally {
      client.release();
    }
  }
}
