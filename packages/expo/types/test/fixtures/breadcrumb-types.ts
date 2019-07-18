import bugsnag from "../../..";
import { Bugsnag } from "../../..";
const bugsnagClient = bugsnag({
  apiKey: 'api_key',
  beforeSend: (report) => {
    (report.get('breadcrumbs') as Bugsnag.Breadcrumb[]).map(breadcrumb => {
      console.log(breadcrumb.type)
      console.log(breadcrumb.name)
      console.log(breadcrumb.metaData)
      console.log(breadcrumb.timestamp)
    })
  }
});
