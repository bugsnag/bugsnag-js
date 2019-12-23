import Event from "./event";
import { App, Device, User } from "./common";

declare class Session {
  public startedAt: string;
  public id: string;
  public events: {
    _handled: number;
    _unhandled: number;
  };
  device?: Device;
  user?: User;
  app?: App;
}

export default Session;
