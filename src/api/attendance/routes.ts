import { Server } from "@hapi/hapi";
import IRoute from "../../helper/iroute";
import { attendanceController } from "./controller";

export class attendanceRoutes implements IRoute {
  public async register(server: any): Promise<any> {
    const controller = new attendanceController();

    server.route([
      {
        method: "POST",
        path: "/api/v1/attendance/punchIn",
        handler: controller.punchInControllerV1,
        config: { auth: false },
      },
      {
        method: "POST",
        path: "/api/v1/attendance/punchOut",
        handler: controller.punchOutControllerV1,
        config: { auth: false },
      },
      {
        method: "GET",
        path: "/api/v1/attendance/get",
        handler: controller.getAttendanceControllerV1,
        config: { auth: false },
      },
      {
        method: "DELETE",
        path: "/api/v1/attendance/{id}",
        handler: controller.deleteAttendanceControllerV1,
        config: { auth: false },
      },
    ]);
  }
}
