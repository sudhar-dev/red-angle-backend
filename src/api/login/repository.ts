import { PoolClient } from "pg";
import bcrypt from "bcrypt";
import { executeQuery, getClient } from "../../helper/db";
import logger from "../../helper/logger";

export class loginRepository {
  public async loginRepoV1(userData: { email: string; password: string }) {
    const client: PoolClient = await getClient();

    try {
      const { email, password } = userData;

      // Fetch user credentials and employee details
      const query = `
        SELECT
          *
        FROM public.employee_credentials ec
        JOIN public.employees e ON e.id = ec."userId"
        WHERE ec.email = $1
      `;

      const result = await executeQuery(query, [email]);

      if (!result.length) {
        return { success: false, message: "Invalid email or password" };
      }

      const user = result[0];

      if (user.isDelete === "Y") {
        return { success: false, message: "User has been deleted" };
      }

      if (user.isActive !== "Y") {
        return { success: false, message: "User is inactive" };
      }

      // Compare password with hashed password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.hashedPassword
      );
      if (!isPasswordValid) {
        return { success: false, message: "Invalid email or password" };
      }

      // Return employee details
      return {
        success: true,
        message: "Login successful",
        data: result,
      };
    } catch (error) {
      logger.error("Login repository error:", error);
      return { success: false, message: "Internal server error" };
    } finally {
      client.release();
    }
  }
}
