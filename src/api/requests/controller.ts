// controller.ts
import * as Hapi from "@hapi/hapi";
import { requestRepository } from "./repository";
import logger from "../../helper/logger";

export class requestController {
  public repo = new requestRepository();

  public createRequest = async (
    request: Hapi.Request,
    h: Hapi.ResponseToolkit
  ) => {
    try {
      const result = await this.repo.createRequest(request.payload);
      return h.response(result).code(result.success ? 201 : 400);
    } catch (error) {
      logger.error("Controller Error: createRequest", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };

  public getAllRequests = async (_: Hapi.Request, h: Hapi.ResponseToolkit) => {
    try {
      const result = await this.repo.getAllRequests();
      return h.response(result).code(200);
    } catch (error) {
      logger.error("Controller Error: getAllRequests", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };

  public getRequestById = async (
    request: Hapi.Request,
    h: Hapi.ResponseToolkit
  ) => {
    try {
      const result = await this.repo.getRequestById(Number(request.params.id));
      return h.response(result).code(result ? 200 : 404);
    } catch (error) {
      logger.error("Controller Error: getRequestById", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };

  public updateRequest = async (
    request: Hapi.Request,
    h: Hapi.ResponseToolkit
  ) => {
    try {
      const result = await this.repo.updateRequest(
        Number(request.params.id),
        request.payload
      );
      return h.response(result).code(result.success ? 200 : 400);
    } catch (error) {
      logger.error("Controller Error: updateRequest", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };

  public deleteRequest = async (
    request: Hapi.Request,
    h: Hapi.ResponseToolkit
  ) => {
    try {
      const result = await this.repo.deleteRequest(Number(request.params.id));
      return h.response(result).code(result.success ? 200 : 400);
    } catch (error) {
      logger.error("Controller Error: deleteRequest", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };
}
