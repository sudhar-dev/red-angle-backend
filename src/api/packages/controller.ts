import * as Hapi from "@hapi/hapi";
import { packageRepository } from "./repository";
import logger from "../../helper/logger";

export class packageController {
  public repo = new packageRepository();

  public addPackageControllerV1 = async (
    request: any,
    h: Hapi.ResponseToolkit
  ) => {
    try {
      const result = await this.repo.addPackageRepoV1(request.payload);
      return h.response(result).code(result.success ? 201 : 400);
    } catch (error) {
      logger.error("Controller Error: Add Package", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };

  public getPackagesControllerV1 = async (_: any, h: Hapi.ResponseToolkit) => {
    try {
      const result = await this.repo.getPackagesRepoV1();
      return h.response(result).code(result.success ? 200 : 400);
    } catch (error) {
      logger.error("Controller Error: Get Packages", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };

  public updatePackageControllerV1 = async (
    request: any,
    h: Hapi.ResponseToolkit
  ) => {
    try {
      const id = Number(request.params.id);
      const result = await this.repo.updatePackageRepoV1(id, request.payload);
      return h.response(result).code(result.success ? 200 : 400);
    } catch (error) {
      logger.error("Controller Error: Update Package", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };

  public deletePackageControllerV1 = async (
    request: any,
    h: Hapi.ResponseToolkit
  ) => {
    try {
      const id = Number(request.params.id);
      const result = await this.repo.deletePackageRepoV1(id);
      return h.response(result).code(result.success ? 200 : 400);
    } catch (error) {
      logger.error("Controller Error: Delete Package", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };
}
