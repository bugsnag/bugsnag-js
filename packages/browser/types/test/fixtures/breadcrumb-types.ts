import Bugsnag from "../../..";
Bugsnag.init({
  apiKey: 'api_key',
  onError: (event) => {
    event.breadcrumbs.map(breadcrumb => {
      console.log(breadcrumb.type)
      console.log(breadcrumb.message)
      console.log(breadcrumb.metadata)
      console.log(breadcrumb.timestamp)
    })
  }
});
