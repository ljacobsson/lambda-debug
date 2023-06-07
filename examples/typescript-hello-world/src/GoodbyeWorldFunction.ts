import { APIGatewayEvent, Context } from "aws-lambda";

export async function handler(event: APIGatewayEvent, context: Context) {
  console.log("request:", JSON.stringify(event, undefined, 2));
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello world!!", 
    }),
  };
};
