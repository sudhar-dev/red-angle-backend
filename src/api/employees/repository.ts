import { PoolClient } from "pg";
import bcrypt from "bcrypt";
import { executeQuery, getClient } from "../../helper/db";
import { sendEmail } from "../../helper/mail";
import logger from "../../helper/logger";

export class employeeRepository {
  // CREATE employee
  public async addEmployeeRepoV1(userData: any, domainCode: any): Promise<any> {
    const client: PoolClient = await getClient();
    try {
      // Check if email already exists
      const checkQuery = `SELECT * FROM public.employees WHERE email = $1 AND "isDelete" = 'N'`;
      const existing = await executeQuery(checkQuery, [userData.email]);
      if (existing.length > 0) {
        logger.warn(
          `Attempt to create employee with existing email: ${userData.email}`
        );
        return { success: false, message: "Email already exists" };
      }

      // Generate password and hash
      const plainPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Insert into employees
      const employeeQuery = `
        INSERT INTO public.employees (
          "firstName","lastName",email,mobile,"secondaryMobile","doorNo",street,
          city,district,state,country,"workLocation","salesType",availability,
          experience,skills,portfolio,reason,"createdAt","createdBy","isActive","isDelete"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
        RETURNING *;
      `;
      const employeeValues = [
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.mobile,
        userData.secondaryMobile,
        userData.doorNo,
        userData.street,
        userData.city,
        userData.district,
        userData.state,
        userData.country,
        userData.workLocation,
        userData.salesType,
        userData.availability,
        userData.experience,
        JSON.stringify(userData.skills || []),
        userData.portfolio,
        userData.reason,
        new Date().toISOString(),
        userData.createdBy || "system",
        "Y",
        "N",
      ];
      const employeeResult = await executeQuery(employeeQuery, employeeValues);
      const newEmployee = employeeResult[0];
      logger.info(`Employee created: ${newEmployee.email}`);

      // Insert into employee_credentials
      const credQuery = `
        INSERT INTO public.employee_credentials (
          "userId", email, password, "hashedPassword", "createdAt", "createdBy"
        ) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;
      `;
      const credValues = [
        newEmployee.id,
        userData.email,
        plainPassword,
        hashedPassword,
        new Date().toISOString(),
        userData.createdBy || "system",
      ];
      await executeQuery(credQuery, credValues);
      logger.info(`Credentials created for employee: ${newEmployee.email}`);

      // Send email
      const mailSent = await sendEmail({
        to: userData.email,
        subject: "Your Employee Account Credentials",
        html: `
          <p>Dear ${userData.firstName},</p>
          <p>Your account has been created successfully. Here are your login credentials:</p>
          <p><strong>Email:</strong> ${userData.email}</p>
          <p><strong>Password:</strong> ${plainPassword}</p>
          <p>Please change your password after logging in.</p>
          <br/><p>Thanks,<br/>HR Team</p>
        `,
      });
      logger.info(`Email sent to ${userData.email}: ${mailSent}`);

      return {
        success: true,
        message: "Employee added successfully",
        emailSent: mailSent,
        data: newEmployee,
      };
    } catch (error) {
      logger.error("Error adding employee:", error);
      return { success: false, message: "Error in adding employee" };
    } finally {
      client.release();
    }
  }

  // READ all employees
  public async getAllEmployees(): Promise<any> {
    try {
      const query = `SELECT * FROM public.employees WHERE "isDelete" = 'N' ORDER BY "createdAt" DESC`;
      const result = await executeQuery(query);
      logger.info(`Fetched all employees: ${result.length}`);
      return { success: true, data: result };
    } catch (error) {
      logger.error("Error fetching employees:", error);
      return { success: false, message: "Error fetching employees" };
    }
  }

  // READ single employee by ID
  public async getEmployeeById(id: number): Promise<any> {
    try {
      const query = `SELECT * FROM public.employees WHERE id = $1 AND "isDelete" = 'N'`;
      const result = await executeQuery(query, [id]);
      if (result.length === 0) {
        logger.warn(`Employee not found: ID ${id}`);
        return { success: false, message: "Employee not found" };
      }
      logger.info(`Fetched employee: ID ${id}`);
      return { success: true, data: result[0] };
    } catch (error) {
      logger.error("Error fetching employee by ID:", error);
      return { success: false, message: "Error fetching employee" };
    }
  }

  // UPDATE employee
  public async updateEmployee(id: number, updateData: any): Promise<any> {
    try {
      // Special handling for JSON fields
      if (updateData.skills) {
        updateData.skills = JSON.stringify(updateData.skills);
      }

      // Build dynamic SET clause
      const fields = Object.keys(updateData)
        .map((key, idx) => `"${key}"=$${idx + 2}`)
        .join(", ");
      const values = [id, ...Object.values(updateData)];

      const query = `UPDATE public.employees SET ${fields} WHERE id=$1 RETURNING *`;
      const result = await executeQuery(query, values);

      if (result.length === 0) {
        logger.warn(`Employee update failed, not found: ID ${id}`);
        return { success: false, message: "Employee not found" };
      }

      logger.info(`Employee updated: ID ${id}`);
      return { success: true, data: result[0] };
    } catch (error) {
      logger.error("Error updating employee:", error);
      return { success: false, message: "Error updating employee" };
    }
  }

  // DELETE employee (soft delete)
  public async deleteEmployee(id: number): Promise<any> {
    try {
      const query = `UPDATE public.employees SET "isDelete"='Y', "isActive"='N' WHERE id=$1 RETURNING *`;
      const result = await executeQuery(query, [id]);
      if (result.length === 0) {
        logger.warn(`Employee delete failed, not found: ID ${id}`);
        return { success: false, message: "Employee not found" };
      }
      logger.info(`Employee soft-deleted: ID ${id}`);
      return { success: true, message: "Employee deleted successfully" };
    } catch (error) {
      logger.error("Error deleting employee:", error);
      return { success: false, message: "Error deleting employee" };
    }
  }
}
