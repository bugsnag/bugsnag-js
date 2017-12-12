// bugsnagClient.metaData = {
//   company: {
//       name: "Xavier's School for Gifted Youngsters"
//     }
//   }

function send_handled() { 
    try {
        console.log(doesntExist);
    } 
    catch (e) {
        bugsnagClient.notify(e, { 
            context: "a handled Reference Error."
          });            
    }
}


function send_unhandled() {
    var num = 1;
    // deliberate Type Error
    num.toUpperCase(); 
}


send_unhandled();
send_handled();