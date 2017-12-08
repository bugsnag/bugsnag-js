import Report from "./report";

declare class Session {
  public startedAt: string;
  public id: string;
  public events: {
    _handled: number;
    _unhandled: number;
  };
  public trackError: (report: Report) => void;
}

export default Session;
