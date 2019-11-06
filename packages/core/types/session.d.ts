import Event from "./event";

declare class Session {
  public startedAt: string;
  public id: string;
  public events: {
    _handled: number;
    _unhandled: number;
  };
  public track: (event: Event) => void;
}

export default Session;
