import Event from "./event";
import * as common from "./common";

declare class Session {
  public startedAt: string;
  public id: string;
  public events: {
    _handled: number;
    _unhandled: number;
  };
  device?: common.Device;
  user?: common.User;
  app?: common.App;
}

export default Session;
