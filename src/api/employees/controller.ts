import * as Hapi from "@hapi/hapi";
import * as Boom from "@hapi/boom";

import { Resolver } from "./resolver";
import logger from "../../helper/logger";

export class employeeController {
  public resolver: any;
  constructor() {
    this.resolver = new Resolver();
  }

  // ADD EMPLOYEE CONTROLLER
  public addEmployeeControllerV1 = async (
    request: any,
    response: Hapi.ResponseToolkit
  ): Promise<any> => {
    logger.info("Add Employee Controller =======> ");
    try {
      let entity;
      entity = await this.resolver.addEmployeeResolverV1(request.payload);
      if (entity.success) {
        return response.response(entity).code(201);
      }
      return response.response(entity).code(200);
    } catch (error) {
      logger.error("Error in Add Employee:", error);
      return response
        .response({
          success: false,
          message: "An Unknown Error Occured In Controller",
        })
        .code(500);
    }
  };
}
