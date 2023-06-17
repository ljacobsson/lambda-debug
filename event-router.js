export async function routeEvent(event, context, stack, functionSources) {
  try {
    const logicalId = stack.StackResourceSummaries.find(resource => resource.PhysicalResourceId === context.functionName).LogicalResourceId;
    return await (await import(functionSources[logicalId])).handler(event, context);
  } catch (error) {
    console.log(error);
    return { error: error.message };
  }
}