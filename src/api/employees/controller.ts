import * as Hapi from "@hapi/hapi";
import { employeeRepository } from "./repository";
import logger from "../../helper/logger";

export class employeeController {
  public repo = new employeeRepository();

  public addEmployeeControllerV1 = async (request: any, h: Hapi.ResponseToolkit) => {
    logger.info("Controller: Add Employee");
    try {
      const result = await this.repo.addEmployeeRepoV1(request.payload, null);
      return h.response(result).code(result.success ? 201 : 400);
    } catch (error) {
      logger.error("Controller Error: Add Employee", error);
      return h.response({ success: false, message: "Internal Server Error" }).code(500);
    }
  };

  public getAllEmployeesController = async (_req: any, h: Hapi.ResponseToolkit) => {
    logger.info("Controller: Get All Employees");
    const result = await this.repo.getAllEmployees();
    return h.response(result).code(result.success ? 200 : 500);
  };

  public getEmployeeByIdController = async (req: any, h: Hapi.ResponseToolkit) => {
    const id = Number(req.params.id);
    logger.info(`Controller: Get Employee by ID ${id}`);
    const result = await this.repo.getEmployeeById(id);
    return h.response(result).code(result.success ? 200 : 404);
  };

  public updateEmployeeController = async (req: any, h: Hapi.ResponseToolkit) => {
    const id = Number(req.params.id);
    logger.info(`Controller: Update Employee ID ${id}`);
    const result = await this.repo.updateEmployee(id, req.payload);
    return h.response(result).code(result.success ? 200 : 400);
  };

  public deleteEmployeeController = async (req: any, h: Hapi.ResponseToolkit) => {
    const id = Number(req.params.id);
    logger.info(`Controller: Delete Employee ID ${id}`);
    const result = await this.repo.deleteEmployee(id);
    return h.response(result).code(result.success ? 200 : 400);
  };
}
