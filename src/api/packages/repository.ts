import { PoolClient } from "pg";
import { getClient } from "../../helper/db";
import logger from "../../helper/logger";

export class packageRepository {
  // Add Package
  public async addPackageRepoV1(data: { type: string; ref: string }) {
    const client: PoolClient = await getClient();
    try {
      const query = `INSERT INTO public.wedding_packages(type, ref) VALUES($1, $2) RETURNING *`;
      const result = await client.query(query, [data.type, data.ref]);
      return {
        success: true,
        message: "Package added successfully",
        data: result.rows[0],
      };
    } catch (error) {
      logger.error("Repository Error: Package add", error);
      return { success: false, message: "Error adding package" };
    } finally {
      client.release();
    }
  }

  // Get all packages
  public async getPackagesRepoV1() {
    const client: PoolClient = await getClient();
    try {
      const result = await client.query(
        `SELECT * FROM public.wedding_packages ORDER BY id ASC`
      );
      return { success: true, data: result.rows };
    } catch (error) {
      logger.error("Repository Error: Get Packages", error);
      return { success: false, message: "Error fetching packages" };
    } finally {
      client.release();
    }
  }

  // Update package
  public async updatePackageRepoV1(
    id: number,
    data: { type: string; ref: string }
  ) {
    const client: PoolClient = await getClient();
    try {
      const query = `UPDATE public.wedding_packages SET type=$1, ref=$2 WHERE id=$3 RETURNING *`;
      const result = await client.query(query, [data.type, data.ref, id]);
      return {
        success: true,
        message: "Package updated",
        data: result.rows[0],
      };
    } catch (error) {
      logger.error("Repository Error: Update Package", error);
      return { success: false, message: "Error updating package" };
    } finally {
      client.release();
    }
  }

  // Delete package
  public async deletePackageRepoV1(id: number) {
    const client: PoolClient = await getClient();
    try {
      await client.query(`DELETE FROM public.wedding_packages WHERE id=$1`, [
        id,
      ]);
      return { success: true, message: "Package deleted" };
    } catch (error) {
      logger.error("Repository Error: Delete Package", error);
      return { success: false, message: "Error deleting package" };
    } finally {
      client.release();
    }
  }
}
