import * as Hapi from "@hapi/hapi";
import { loginRepository } from "./repository";
import logger from "../../helper/logger";

export class loginController {
  public repo = new loginRepository();

  public loginDataV1 = async (request: any, h: Hapi.ResponseToolkit) => {
    logger.info("Controller: Login Cont");
    try {
      const result = await this.repo.loginRepoV1(request.payload);
      return h.response(result).code(result.success ? 201 : 400);
    } catch (error) {
      logger.error("Controller Error: Add Employee", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };
}
