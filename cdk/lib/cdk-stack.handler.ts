exports.handler = async (event: any) => {
  console.log(JSON.stringify(event));

  const isAuthorized = event.authorizationToken == "ABC";

  const response = {
    isAuthorized,
  };

  console.log(JSON.stringify(response));
  return response;
};
