import fs from 'fs';
import { GetTemplateCommand, CloudFormationClient, ListStackResourcesCommand } from "@aws-sdk/client-cloudformation"
import { LambdaClient, UpdateFunctionCodeCommand, UpdateFunctionConfigurationCommand } from "@aws-sdk/client-lambda"
import ini from 'ini';
import { fromSSO } from '@aws-sdk/credential-provider-sso';

console.log("Cleaning up...");
let configEnv = 'default';
let functions = undefined;
const cachePath = process.cwd() + "/.lambda-debug";

if (fs.existsSync(cachePath)) {
  const conf = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  configEnv = conf.configEnv || 'default';
  if (conf.functions) {
    functions = conf.functions;
  }
  fs.unlinkSync(process.cwd() + "/.lambda-debug");
}

if (fs.existsSync(process.cwd() + "/.samp-out")) {
  console.log("Removing .samp-out directory");
  fs.rmSync(process.cwd() + "/.samp-out", { recursive: true, force: true });
}

const config = ini.parse(fs.readFileSync(process.cwd() + "/samconfig.toml", 'utf-8'));
const samConfig = config[configEnv].deploy.parameters;
const stackName = samConfig.stack_name || config[configEnv].global.parameters.stack_name;
const region = samConfig.region || config[configEnv].global.parameters.region;
const profile = samConfig.profile || "default";

const cfnClient = new CloudFormationClient({ region, credentials: fromSSO({ profile }) });
const lambdaClient = new LambdaClient({ region, credentials: fromSSO({ profile }) });
const templateResponse = await cfnClient.send(new GetTemplateCommand({ StackName: stackName, TemplateStage: "Processed" }));
const stack = await cfnClient.send(new ListStackResourcesCommand({ StackName: stackName }));

const template = JSON.parse(templateResponse.TemplateBody);

functions = functions || Object.keys(template.Resources).filter(key => template.Resources[key].Type === "AWS::Lambda::Function");;

const updatePromises = functions.map(async functionName => {
  let updated = false;
  do {
    try {
      const func = template.Resources[functionName];
      const physicalId = stack.StackResourceSummaries.find(resource => resource.LogicalResourceId === functionName).PhysicalResourceId;
      console.log(`Restoring function: ${functionName}`);

      await lambdaClient.send(new UpdateFunctionConfigurationCommand({
        FunctionName: physicalId,
        Timeout: func.Properties.Timeout,
        MemorySize: func.Properties.MemorySize,
        Handler: func.Properties.Handler,
      }));

      // Sleep 1 second to avoid throttling
      await new Promise(resolve => setTimeout(resolve, 1000));

      await lambdaClient.send(new UpdateFunctionCodeCommand({
        FunctionName: physicalId,
        Publish: true,
        S3Bucket: func.Properties.Code.S3Bucket,
        S3Key: func.Properties.Code.S3Key,
      }));

      console.log("Restored function:", functionName);
      updated = true;
    } catch (error) {
      if (error.name === "TooManyRequestsException") {
        console.log("Too many requests, sleeping for 1 second");
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else if (error.name === "ResourceConflictException") {
        console.log("Resource conflict, retrying");
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        throw error;
      }
    }
  } while (!updated);

});

// Wait for all promises to resolve
await Promise.all(updatePromises);


