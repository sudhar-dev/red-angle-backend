import { PoolClient } from "pg";
import bcrypt from "bcrypt";
import { executeQuery, getClient } from "../../helper/db";
import { sendEmail } from "../../helper/mail";

export class employeeRepository {
  public async addEmployeeRepoV1(userData: any, domainCode: any): Promise<any> {
    const client: PoolClient = await getClient();
    try {
      // 1. Generate random password
      const plainPassword = Math.random().toString(36).slice(-8); // e.g., 8-char password
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // 2. Insert into employees table
      const employeeQuery = `
        INSERT INTO public.employees (
          "firstName",
          "lastName",
          email,
          mobile,
          "secondaryMobile",
          "doorNo",
          street,
          city,
          district,
          state,
          country,
          "workLocation",
          "salesType",
          availability,
          experience,
          skills,
          portfolio,
          reason,
          "createdAt",
          "createdBy",
          "isActive",
          "isDelete"
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
        ) RETURNING *;
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

      // 3. Insert into employee_credentials table
      const credQuery = `
        INSERT INTO public.employee_credentials (
          "userId",
          email,
          password,
          "hashedPassword",
          "createdAt",
          "createdBy"
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

      // 4. Send email with credentials
      const mailSent = await sendEmail({
        to: userData.email,
        subject: "Your Employee Account Credentials",
        html: `
          <p>Dear ${userData.firstName},</p>
          <p>Your account has been created successfully. Here are your login credentials:</p>
          <p><strong>Email:</strong> ${userData.email}</p>
          <p><strong>Password:</strong> ${plainPassword}</p>
          <p>Please change your password after logging in.</p>
          <br/>
          <p>Thanks,<br/>HR Team</p>
        `,
      });

      return {
        success: true,
        message: "Employee added successfully",
        emailSent: mailSent,
        data: newEmployee,
      };
    } catch (error: unknown) {
      console.error("Error adding employee:", (error as Error).message);
      return {
        success: false,
        message: "Error in adding employee",
      };
    } finally {
      client.release();
    }
  }
}
