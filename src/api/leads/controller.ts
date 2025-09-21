import * as Hapi from "@hapi/hapi";
import { leadsRepository } from "./repository";
import logger from "../../helper/logger";

export class leadsController {
  public repo = new leadsRepository();

  public updateLeadsV1 = async (request: any, h: Hapi.ResponseToolkit) => {
    logger.info("Controller: Update Leads");
    try {
      const leadsData = request.payload; // Expecting array of leads
      const result = await this.repo.updateLeadsRepoV1(leadsData);
      return h.response(result).code(result.success ? 200 : 400);
    } catch (error) {
      logger.error("Controller Error: Update Leads", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };
}
