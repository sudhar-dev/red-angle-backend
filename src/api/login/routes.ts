import IRoute from "../../helper/iroute";
import { loginController } from "./controller";

export class loginRoutes implements IRoute {
  public async register(server: any): Promise<any> {
    const controller = new loginController();
    server.route([
      {
        method: "POST",
        path: "/api/v1/routes/login", 
        handler: controller.loginDataV1,
        config: { auth: false },
      },
    ]);
  }
}
