import Bugsnag from "../../..";
Bugsnag.start({
  onError: (event) => {
    event.breadcrumbs.map(breadcrumb => {
      console.log(breadcrumb.type)
      console.log(breadcrumb.message)
      console.log(breadcrumb.metadata)
      console.log(breadcrumb.timestamp)
    })
  }
});
