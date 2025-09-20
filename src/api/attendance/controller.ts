import * as Hapi from "@hapi/hapi";
import { attendanceRepository } from "./repository";
import logger from "../../helper/logger";

export class attendanceController {
  public repo = new attendanceRepository();

  // 🟢 Punch In
  public punchInControllerV1 = async (
    request: any,
    h: Hapi.ResponseToolkit
  ) => {
    logger.info("Controller: Punch In");
    try {
      const result = await this.repo.punchInV1(request.payload);
      return h.response(result).code(result.success ? 201 : 400);
    } catch (error) {
      logger.error("Controller Error: Punch In", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };

  // 🔴 Punch Out
  public punchOutControllerV1 = async (
    request: any,
    h: Hapi.ResponseToolkit
  ) => {
    logger.info("Controller: Punch Out");
    try {
      const result = await this.repo.punchOutV1(request.payload);
      return h.response(result).code(result.success ? 200 : 400);
    } catch (error) {
      logger.error("Controller Error: Punch Out", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };

  // 📖 Get Attendance
  public getAttendanceControllerV1 = async (
    request: any,
    h: Hapi.ResponseToolkit
  ) => {
    logger.info("Controller: Get Attendance");
    try {
      const employeeId = request.query.employeeId
        ? Number(request.query.employeeId)
        : undefined;
      const result = await this.repo.getAttendanceV1(employeeId);
      return h.response(result).code(result.success ? 200 : 400);
    } catch (error) {
      logger.error("Controller Error: Get Attendance", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };

  // ❌ Delete Attendance
  public deleteAttendanceControllerV1 = async (
    request: any,
    h: Hapi.ResponseToolkit
  ) => {
    logger.info("Controller: Delete Attendance");
    try {
      const result = await this.repo.deleteAttendanceV1(
        Number(request.params.id)
      );
      return h.response(result).code(result.success ? 200 : 400);
    } catch (error) {
      logger.error("Controller Error: Delete Attendance", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };
}
